'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  Zap,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  Gift,
  HelpCircle,
  Building,
  Calendar,
  Layers,
  Check,
  Flame,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BillingSummary {
  school_id: string;
  school_name: string;
  wallet_balance: number;
  cost_per_generation: number;
  generations_remaining: number;
  generations_used: number;
  monthly_generation_quota: number;
  subscription_status: string;
  plan_name: string;
  plan_slug: string;
  price_monthly: number;
  price_yearly: number;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_cycle?: string | null;
  is_trial_expired: boolean;
  can_generate: boolean;
}

interface WalletTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

interface RechargePack {
  amount: number;
  gens: number;
  baseGens: number;
  bonusGens: number;
  bonusPercent: number;
  label: string;
  popular?: boolean;
  bestValue?: boolean;
  megaSaver?: boolean;
}

const RECHARGE_PACKS: RechargePack[] = [
  { amount: 50, gens: 10, baseGens: 10, bonusGens: 0, bonusPercent: 0, label: 'Starter Pack' },
  { amount: 100, gens: 22, baseGens: 20, bonusGens: 2, bonusPercent: 10, label: 'Standard Pack', popular: true },
  { amount: 250, gens: 57, baseGens: 50, bonusGens: 7, bonusPercent: 15, label: 'Classroom Pack' },
  { amount: 500, gens: 120, baseGens: 100, bonusGens: 20, bonusPercent: 20, label: 'Institution Pack', bestValue: true },
  { amount: 1000, gens: 300, baseGens: 200, bonusGens: 100, bonusPercent: 50, label: 'Mega District Pack', megaSaver: true },
];

function getCustomBonus(amount: number) {
  let percent = 0;
  if (amount >= 1000) percent = 50;
  else if (amount >= 500) percent = 20;
  else if (amount >= 250) percent = 15;
  else if (amount >= 100) percent = 10;

  const bonusAmount = Math.round((amount * percent) / 100);
  const total = amount + bonusAmount;
  const gens = Math.floor(total / 5);
  const bonusGens = Math.floor(bonusAmount / 5);

  return { percent, bonusAmount, total, gens, bonusGens };
}

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('150');

  const token = typeof document !== 'undefined'
    ? document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'))?.[2]
    : null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Load Cashfree Payments JS SDK v3
    if (typeof window !== 'undefined' && !(window as any).Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.body.appendChild(script);
    }

    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    if (!token) return;
    setIsLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/api/billing/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/billing/transactions?limit=25`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.data);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || []);
      }
    } catch (err) {
      console.error('Failed to load billing data', err);
      toast.error('Unable to fetch billing details');
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCashfreePayment(
    orderId: string,
    amount: number,
    type: 'wallet_recharge' | 'subscription',
    planId?: string
  ) {
    try {
      const verifyRes = await fetch(`${apiUrl}/api/billing/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          amount,
          type,
          planId,
          billingCycle: 'lifetime',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

      toast.success(verifyData.message || 'Payment completed successfully!');
      window.dispatchEvent(new Event('billing-updated'));
      fetchBillingData();
    } catch (vErr: any) {
      toast.error(vErr.message || 'Payment verification error');
    }
  }

  // Handle Cashfree Payment / Test Top-up
  async function handleRecharge(amount: number) {
    if (!token) {
      toast.error('Please log in again');
      return;
    }

    if (amount < 5) {
      toast.error('Minimum recharge amount is ₹5');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order
      const orderRes = await fetch(`${apiUrl}/api/billing/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          type: 'wallet_recharge',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      const { orderId, paymentSessionId, isMock, mode } = orderData.data;

      // 2. If running with real/sandbox Cashfree keys
      if (!isMock && (window as any).Cashfree && paymentSessionId) {
        const cashfree = (window as any).Cashfree({
          mode: mode === 'production' ? 'production' : 'sandbox',
        });
        cashfree
          .checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          })
          .then(async (result: any) => {
            if (result.error) {
              toast.error(result.error.message || 'Payment was cancelled or failed');
            } else {
              await verifyCashfreePayment(orderId, amount, 'wallet_recharge');
            }
          });
      } else if (isMock) {
        toast.error('Payment gateway not configured. Please configure CASHFREE_APP_ID & CASHFREE_SECRET_KEY in backend .env');
      } else {
        toast.error('Payment gateway SDK is loading. Please try again in a moment.');
      }
    } catch (err: any) {
      console.error('Recharge Error:', err);
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle One-Time Lifetime Membership Plan Purchase / Activation
  async function handleSubscribe(planSlug: string, oneTimePrice: number) {
    if (!token) return;
    if (planSlug === 'trial') {
      toast.info('Your school is already on the Free Trial tier');
      return;
    }

    const amount = oneTimePrice;
    setIsProcessing(true);

    try {
      // Fetch plan id
      const plansRes = await fetch(`${apiUrl}/api/billing/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const plansData = await plansRes.json();
      const planObj = (plansData.data || []).find((p: any) => p.slug === planSlug);

      if (!planObj) throw new Error('Plan details not found');

      // Create order
      const orderRes = await fetch(`${apiUrl}/api/billing/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          type: 'subscription',
          planId: planObj.id,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create membership order');

      const { orderId, paymentSessionId, isMock, mode } = orderData.data;

      if (!isMock && (window as any).Cashfree && paymentSessionId) {
        const cashfree = (window as any).Cashfree({
          mode: mode === 'production' ? 'production' : 'sandbox',
        });
        cashfree
          .checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          })
          .then(async (result: any) => {
            if (result.error) {
              toast.error(result.error.message || 'Membership payment cancelled');
            } else {
              await verifyCashfreePayment(orderId, amount, 'subscription', planObj.id);
            }
          });
      } else if (isMock) {
        toast.error('Payment gateway not configured. Please configure CASHFREE_APP_ID & CASHFREE_SECRET_KEY in backend .env');
      } else {
        toast.error('Payment gateway SDK is loading. Please try again in a moment.');
      }
    } catch (err: any) {
      console.error('Membership Activation Error:', err);
      toast.error(err.message || 'Could not activate lifetime membership');
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading && !summary) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const walletBalance = summary?.wallet_balance ?? 50.0;
  const costPerGen = summary?.cost_per_generation ?? 5.0;
  const gensLeft = summary?.generations_remaining ?? Math.floor(walletBalance / costPerGen);
  const isLifetimeActive =
    summary?.subscription_status === 'active' ||
    (Boolean(summary?.plan_slug) && summary?.plan_slug !== 'trial');

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
              Subscription & Wallet
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 font-semibold">
              ₹5 per Generation
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your school tenant credits, transparent pay-as-you-go generations, and wallet balance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBillingData}
          disabled={isLoading || isProcessing}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Balance
        </Button>
      </div>

      {/* Trial / Subscription Alert Banner if balance low */}
      {walletBalance < 10 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Low Wallet Balance:</span> You only have{' '}
            <span className="font-bold">₹{walletBalance.toFixed(2)}</span> ({gensLeft} generations left). Recharge now to prevent interruption during paper generation.
          </div>
        </div>
      )}

      {/* Active Member Celebration Banner */}
      {isLifetimeActive && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Lifetime Membership Active:
              </span>{' '}
              <span className="text-emerald-700 dark:text-emerald-400">
                Your school is permanently enrolled under <strong>{summary?.plan_name}</strong> with lifetime validity. No further renewal payments will ever be charged. Top up generation credits anytime below!
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white shrink-0 font-bold text-xs px-3 py-1 self-start sm:self-auto">
            Active Member
          </Badge>
        </div>
      )}

      {/* SECTION 1: ONE-TIME LIFETIME MEMBERSHIP (Shown only if NOT already a lifetime member) */}
      {!isLifetimeActive && (
        <div className="space-y-6 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-heading font-black text-foreground tracking-tight">
                  One-Time Lifetime Membership
                </h2>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
                  Pay Once • Use Forever
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-3xl">
                Zero monthly or annual subscriptions. Pay a single one-time institutional fee to unlock your school tenant forever, with free starter generations included! Afterwards, generate papers on a flexible <strong>Recharge &amp; Use</strong> model @ ₹5/paper.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/60 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground font-semibold shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Perpetual School License • No Renewals Ever</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Starter Lifetime Plan Card */}
            <div className={`rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all ${
              summary?.plan_slug === 'lifetime_starter' ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.01]' : 'border-border'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starter Tier</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">Single Branch / Coaching</span>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-black font-heading text-foreground">
                    ₹500
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">one-time payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay once for lifetime school access. Ideal for coaching centers and single-branch schools.
                  </p>
                </div>

                {/* Free included credit highlight */}
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    Includes ₹600 Generation Credit (120 Papers Free • +20% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly or annual renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>120 AI Question Papers Included</strong> (₹600 balance added instantly with +20% bonus)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Custom School Logo, Stamp, Signatures & Watermark</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Up to <strong>5 Teacher Accounts</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Full PDF Export with Solutions & Answer Keys</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Recharge & Use @ ₹5/extra generation (Tiered bonuses up to +50%)</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-primary text-primary-foreground hover:opacity-90 font-medium"
                disabled={isProcessing || summary?.plan_slug === 'lifetime_starter'}
                onClick={() => handleSubscribe('lifetime_starter', 500)}
              >
                {summary?.plan_slug === 'lifetime_starter' ? '✓ Active Lifetime Plan' : 'Get Starter Lifetime (₹500)'}
              </Button>
            </div>

            {/* Institutional Lifetime Plan Card */}
            <div className="rounded-2xl border-2 border-primary bg-primary/[0.02] p-6 flex flex-col justify-between shadow-lg relative">
              <span className="absolute -top-3 right-6 text-xs uppercase font-bold tracking-wider px-3 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> Recommended • Best Value
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Institutional Tier</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 font-semibold text-primary">Full Campus</span>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-black font-heading text-foreground">
                    ₹1,000
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">one-time payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete institutional lifetime suite for growing schools, junior colleges, and academy chains.
                  </p>
                </div>

                {/* Free included credit highlight */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    Includes ₹1,500 Generation Credit (300 Papers Free • +50% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly or annual renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>300 AI Question Papers Included</strong> (₹1,500 balance added instantly with +50% bonus)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Unlimited Teachers</strong>, Exam Coordinators & Principals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>OCR Textbook, Notes & Past Paper Question Extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Priority AI Queue (Instant Paper & Blueprint Generation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Custom Multi-Section Layouts & Bilingual Question Paper Settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Dedicated WhatsApp & Technical Support</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-primary text-primary-foreground hover:opacity-90 font-bold shadow-md"
                disabled={isProcessing || summary?.plan_slug === 'lifetime_pro'}
                onClick={() => handleSubscribe('lifetime_pro', 1000)}
              >
                {summary?.plan_slug === 'lifetime_pro' ? '✓ Active Lifetime Plan' : 'Get Institutional Lifetime (₹1,000)'}
              </Button>
            </div>
          </div>

          {/* Trust Badges Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Activation
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Bundled Generation Credits Included
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Secure via Cashfree Payments
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Zero Recurring Fees
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: School Overview & Wallet Balance */}
      <div className={`space-y-4 ${!isLifetimeActive ? 'pt-4 border-t border-border' : ''}`}>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            School Tenant &amp; Wallet Status
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Overview of your active institutional membership tier, current balance, and generation usage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subscription / Lifetime Plan Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Institutional Plan
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    summary?.subscription_status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {summary?.subscription_status === 'active' ? 'Lifetime Member' : 'Free Trial'}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold font-heading tracking-tight mt-2 text-foreground truncate">
                {summary?.plan_name || (summary?.subscription_status === 'active' ? 'Lifetime Membership' : '14-Day Free Trial')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {summary?.subscription_status === 'active'
                  ? 'One-Time Payment Active • Recharge & Use at ₹5/gen'
                  : '10 free generations included with ₹50 credit on signup'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60">
                <span className="text-muted-foreground">
                  {summary?.subscription_status === 'active' ? 'Plan Validity:' : 'Trial Expiry:'}
                </span>
                <span className={`font-semibold ${summary?.subscription_status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {summary?.subscription_status === 'active'
                    ? 'Lifetime Access (Never Expires)'
                    : summary?.trial_ends_at
                    ? new Date(summary.trial_ends_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '14 Days Active'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance Card */}
          <Card className="relative overflow-hidden border-primary/30 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" /> School Wallet
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-3xl lg:text-4xl font-black font-heading tracking-tight mt-2 text-foreground">
                ₹{walletBalance.toFixed(2)}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Available balance for AI question paper generation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60">
                <span className="text-muted-foreground">Generations Available:</span>
                <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded text-primary">
                  ~{gensLeft} Papers
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Model Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Usage Pricing
                </span>
                <span className="text-xs text-muted-foreground font-mono">Pay-per-use</span>
              </div>
              <CardTitle className="text-3xl font-black font-heading tracking-tight mt-2 text-foreground flex items-baseline gap-1">
                ₹5.00
                <span className="text-xs font-normal text-muted-foreground">/ generation</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deducted automatically only upon successful AI generation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60">
                <span className="text-muted-foreground">Total Generated So Far:</span>
                <span className="font-bold text-foreground">
                  {summary?.generations_used ?? 0} Papers
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 3: Quick Wallet Top-up Packs (₹5/generation with tiered bonus) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Recharge School Wallet (Tiered Bonus Credits)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get up to <strong>+50% Extra Free Bonus Generations</strong> on larger recharges! Funds never expire. Base cost is ₹5.00/generation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {RECHARGE_PACKS.map((pack) => {
            const effectivePerPaper = (pack.amount / pack.gens).toFixed(2);
            return (
              <div
                key={pack.amount}
                className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between cursor-pointer bg-card hover:border-primary/60 hover:shadow-md ${
                  pack.popular
                    ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]'
                    : pack.bestValue
                    ? 'border-emerald-500/50 bg-emerald-500/[0.02]'
                    : pack.megaSaver
                    ? 'border-indigo-500/50 bg-indigo-500/[0.02]'
                    : 'border-border'
                }`}
                onClick={() => handleRecharge(pack.amount)}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                    Popular
                  </span>
                )}
                {pack.bestValue && (
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                    +20% Free
                  </span>
                )}
                {pack.megaSaver && (
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                    +50% Free
                  </span>
                )}

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block truncate">
                    {pack.label}
                  </span>
                  <div className="text-2xl font-black font-heading text-foreground mt-1">
                    ₹{pack.amount}
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{pack.gens} Generations</span>
                    </div>

                    {pack.bonusPercent > 0 ? (
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center justify-between">
                        <span>+{pack.bonusGens} FREE Gens</span>
                        <span className="font-bold">+{pack.bonusPercent}%</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">Standard ₹5/paper</div>
                    )}

                    <div className="text-[10px] text-muted-foreground pt-0.5">
                      Effective: <strong>₹{effectivePerPaper}</strong>/gen
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full mt-4 bg-primary text-primary-foreground hover:opacity-90 font-medium text-xs h-8"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRecharge(pack.amount);
                  }}
                >
                  Top up ₹{pack.amount}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Custom Recharge Amount Card with Live Bonus Calculator */}
        {(() => {
          const customVal = Number(customAmount) || 0;
          const customBonus = getCustomBonus(customVal);
          return (
            <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Custom Recharge Amount</span>
                  {customBonus.percent > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      +{customBonus.percent}% Free Bonus Applied!
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customVal >= 5 ? (
                    <>
                      Pay <strong>₹{customVal}</strong> → Get{' '}
                      <strong className="text-foreground">₹{customBonus.total} Credit</strong> (~
                      <strong className="text-primary">{customBonus.gens} AI Generations</strong>)
                      {customBonus.bonusAmount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                          (Includes ₹{customBonus.bonusAmount} Free Bonus = +{customBonus.bonusGens} Extra Gens!)
                        </span>
                      )}
                    </>
                  ) : (
                    'Enter minimum ₹5. Recharges of ₹100+ get +10%, ₹250+ get +15%, ₹500+ get +20%, ₹1000+ get +50% bonus!'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="relative w-36">
                  <span className="absolute left-3 top-2 text-muted-foreground text-sm font-semibold">₹</span>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7 h-9 font-semibold text-sm"
                    placeholder="150"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 font-medium border-primary/30 hover:bg-primary/5 hover:text-primary shrink-0"
                  disabled={isProcessing || !customAmount || customVal < 5}
                  onClick={() => handleRecharge(customVal)}
                >
                  Recharge Now
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Section 3: Wallet Transactions Ledger */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Wallet & Deduction Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent audit record of every ₹5 deduction per AI generation and wallet recharge.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No wallet transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              tx.type === 'generation_fee'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : tx.type === 'welcome_bonus'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-amber-500" />
                            )}
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold font-mono whitespace-nowrap ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isCredit ? `+₹${Number(tx.amount).toFixed(2)}` : `-₹${Math.abs(Number(tx.amount)).toFixed(2)}`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                          ₹{Number(tx.balance_after).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
