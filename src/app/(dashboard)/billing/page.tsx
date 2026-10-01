'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface CashfreeCheckoutResult {
  error?: {
    message?: string;
  };
}

interface CashfreeInstance {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: string;
  }) => Promise<CashfreeCheckoutResult>;
}

interface CashfreeWindow extends Window {
  Cashfree?: (config: { mode: string }) => CashfreeInstance;
}

interface PlanItem {
  id: string;
  slug: string;
  name: string;
}

// Formatted row model matching user spec: [datetime, typeCode, description, amount, balanceAfter]
type TxRow = [string, 'g' | 'u' | 'q', string, number, number];

const PACKS_CONFIG: [number, number, number, string, number][] = [
  [50, 10, 0, '', 0],
  [100, 22, 2, '+10%', 0],
  [250, 57, 7, '+15%', 0],
  [500, 120, 20, '+20%', 0],
  [1000, 300, 100, '+50%', 1],
];

const PACK_NAMES = ['Starter', 'Standard', 'Classroom', 'Institution', 'Mega District'];

const TYPE_NAMES: Record<string, string> = {
  g: 'Generation',
  u: 'Top-up',
  q: 'Plan quota',
};

const DEFAULT_DEMO_ROWS: TxRow[] = [
  ['1 Oct 2026, 12:21 pm', 'g', 'AI Question Paper Generation (8 - Mathematics)', -5, 33170],
  ['1 Oct 2026, 12:17 pm', 'g', 'AI Question Paper Generation (8 - Mathematics)', -5, 33175],
  ['1 Oct 2026, 11:40 am', 'g', 'AI Question Paper Generation (8 - Mathematics)', -5, 33180],
  ['1 Oct 2026, 11:08 am', 'g', 'AI Question Paper Generation (8 - English)', -5, 33185],
  ['1 Oct 2026, 9:42 am', 'q', 'Lifetime Membership: Starter Lifetime Membership credit', 500, 33190],
  ['1 Oct 2026, 9:30 am', 'q', 'Lifetime Membership: Starter Lifetime Membership credit', 500, 32690],
  ['1 Oct 2026, 9:21 am', 'u', 'Instant top-up (₹20000 + ₹10000 [50% bonus])', 30000, 32190],
  ['1 Oct 2026, 9:21 am', 'u', 'Instant top-up (₹2000 + ₹1000 [50% bonus])', 3000, 2190],
  ['30 Sep 2026, 4:23 pm', 'g', 'AI Question Paper Generation (8 - Mathematics)', -5, 190],
  ['30 Sep 2026, 4:03 pm', 'g', 'AI Question Paper Generation (8 - Mathematics)', -5, 195],
  ['30 Sep 2026, 3:36 pm', 'u', 'Instant top-up (+₹50.00)', 50, 200],
  ['30 Sep 2026, 3:22 pm', 'u', 'Instant top-up (+₹100.00)', 100, 150],
];

function inr(n: number): string {
  return '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateBonus(amount: number): number {
  if (amount >= 1000) return 0.5;
  if (amount >= 500) return 0.2;
  if (amount >= 250) return 0.15;
  if (amount >= 100) return 0.1;
  return 0;
}

export default function BillingPage() {
  const [tab, setTab] = useState<'overview' | 'plans' | 'history'>('overview');
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshText, setRefreshText] = useState('Refresh balance');
  const [customAmount, setCustomAmount] = useState<string>('150');
  const [filter, setFilter] = useState<'all' | 'u' | 'g' | 'q'>('all');

  const token =
    typeof document !== 'undefined'
      ? document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'))?.[2]
      : null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchBillingData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/api/billing/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/billing/transactions?limit=50`, {
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
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    // Load Cashfree Payments JS SDK v3
    const win = typeof window !== 'undefined' ? (window as CashfreeWindow) : undefined;
    if (win && !win.Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.body.appendChild(script);
    }

    let isMounted = true;
    (async () => {
      if (!token) return;
      try {
        const [sumRes, txRes] = await Promise.all([
          fetch(`${apiUrl}/api/billing/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/billing/transactions?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (sumRes.ok && isMounted) {
          const sumData = await sumRes.json();
          setSummary(sumData.data);
        }

        if (txRes.ok && isMounted) {
          const txData = await txRes.json();
          setTransactions(txData.data || []);
        }
      } catch (err) {
        console.error('Failed to load billing data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, token]);

  async function handleRefreshClick() {
    setRefreshText('Updating...');
    await fetchBillingData();
    setRefreshText('Updated ✓');
    setTimeout(() => {
      setRefreshText('Refresh balance');
    }, 1500);
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
    } catch (vErr) {
      const errorMsg = vErr instanceof Error ? vErr.message : 'Payment verification error';
      toast.error(errorMsg);
    }
  }

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
      const win = typeof window !== 'undefined' ? (window as CashfreeWindow) : undefined;

      if (!isMock && win?.Cashfree && paymentSessionId) {
        const cashfree = win.Cashfree({
          mode: mode === 'production' ? 'production' : 'sandbox',
        });
        cashfree
          .checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          })
          .then(async (result) => {
            if (result.error) {
              toast.error(result.error.message || 'Payment was cancelled or failed');
            } else {
              await verifyCashfreePayment(orderId, amount, 'wallet_recharge');
            }
          });
      } else if (isMock) {
        // Direct mock test top-up fallback for development
        await verifyCashfreePayment(orderId, amount, 'wallet_recharge');
      } else {
        toast.info('Payment gateway initializing. Please try again.');
      }
    } catch (err) {
      console.error('Recharge Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Payment initiation failed';
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSubscribe(planSlug: string, oneTimePrice: number) {
    if (!token) return;
    setIsProcessing(true);
    try {
      const plansRes = await fetch(`${apiUrl}/api/billing/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const plansData = await plansRes.json();
      const planList: PlanItem[] = plansData.data || [];
      const planObj = planList.find((p) => p.slug === planSlug);

      if (!planObj) throw new Error('Plan details not found');

      const orderRes = await fetch(`${apiUrl}/api/billing/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: oneTimePrice,
          type: 'subscription',
          planId: planObj.id,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create membership order');

      const { orderId, paymentSessionId, isMock, mode } = orderData.data;
      const win = typeof window !== 'undefined' ? (window as CashfreeWindow) : undefined;

      if (!isMock && win?.Cashfree && paymentSessionId) {
        const cashfree = win.Cashfree({
          mode: mode === 'production' ? 'production' : 'sandbox',
        });
        cashfree
          .checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          })
          .then(async (result) => {
            if (result.error) {
              toast.error(result.error.message || 'Membership payment cancelled');
            } else {
              await verifyCashfreePayment(orderId, oneTimePrice, 'subscription', planObj.id);
            }
          });
      } else if (isMock) {
        await verifyCashfreePayment(orderId, oneTimePrice, 'subscription', planObj.id);
      }
    } catch (err) {
      console.error('Membership Activation Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not activate lifetime membership';
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  }

  // Map real database transactions to rows
  const allRows: TxRow[] = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.map((t) => {
        let code: 'g' | 'u' | 'q' = 'u';
        const numAmt = Number(t.amount);
        if (t.type === 'generation_fee' || numAmt < 0) {
          code = 'g';
        } else if (
          t.type === 'welcome_bonus' ||
          t.type === 'plan_quota' ||
          t.type === 'membership_credit' ||
          t.type === 'subscription' ||
          t.description?.toLowerCase().includes('plan') ||
          t.description?.toLowerCase().includes('membership') ||
          t.description?.toLowerCase().includes('quota')
        ) {
          code = 'q';
        } else {
          code = 'u';
        }

        const dateStr = new Date(t.created_at).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return [dateStr, code, t.description, numAmt, Number(t.balance_after)];
      });
    }
    return DEFAULT_DEMO_ROWS;
  }, [transactions]);

  // Filtered rows for History tab
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => filter === 'all' || r[1] === filter);
  }, [allRows, filter]);

  // History tab summary statistics
  const { totalTopups, totalUsed } = useMemo(() => {
    let up = 0;
    let us = 0;
    filteredRows.forEach((r) => {
      if (r[3] > 0) up += r[3];
      else us += r[3];
    });
    return { totalTopups: up, totalUsed: us };
  }, [filteredRows]);

  // Custom recharge live calculation
  const parsedAmt = Number(customAmount) || 0;
  const bonusMultiplier = calculateBonus(parsedAmt);
  const bonusAmt = Math.round(parsedAmt * bonusMultiplier);
  const totalCred = parsedAmt + bonusAmt;
  const genCount = Math.floor(totalCred / 5);

  const walletBalance = summary?.wallet_balance ?? 33170;
  const costPerGen = summary?.cost_per_generation ?? 5.0;
  const gensLeft = summary?.generations_remaining ?? Math.floor(walletBalance / costPerGen);
  const totalGenerated = summary?.generations_used ?? 8;
  const isLifetimeActive =
    summary?.subscription_status === 'active' ||
    (Boolean(summary?.plan_slug) && summary?.plan_slug !== 'trial');
  const planDisplayName = summary?.plan_name || 'Starter Lifetime';

  return (
    <div className="sw-root">
      <style jsx global>{`
        .sw-root {
          --bg: #f4f6f8;
          --card: #ffffff;
          --ink: #14212b;
          --mut: #6b7a86;
          --line: #e3e8ec;
          --pri: #0f6b5c;
          --pri2: #0b4f44;
          --soft: #e4f3ef;
          --acc: #e9a21b;
          --neg: #c2413b;
          --pos: #12805c;
          --chip: #eef1f4;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          min-height: 100vh;
        }

        :root[data-theme='dark'] .sw-root,
        .dark .sw-root {
          --bg: #0f1519;
          --card: #171f25;
          --ink: #e8eef2;
          --mut: #8b9aa5;
          --line: #26323a;
          --pri: #3fbfa6;
          --pri2: #2a9983;
          --soft: #14302b;
          --acc: #f0b23a;
          --neg: #ef7a73;
          --pos: #4fd1a1;
          --chip: #222d35;
        }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme='light']) .sw-root {
            --bg: #0f1519;
            --card: #171f25;
            --ink: #e8eef2;
            --mut: #8b9aa5;
            --line: #26323a;
            --pri: #3fbfa6;
            --pri2: #2a9983;
            --soft: #14302b;
            --acc: #f0b23a;
            --neg: #ef7a73;
            --pos: #4fd1a1;
            --chip: #222d35;
          }
        }

        .sw-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: 20px 16px 48px;
        }

        .sw-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .sw-title {
          font-size: 24px;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
        }

        .sw-header p {
          margin: 2px 0 0;
          color: var(--mut);
        }

        .sw-btn {
          font: inherit;
          cursor: pointer;
          color: inherit;
          border: 1px solid var(--line);
          background: var(--card);
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .sw-btn:hover {
          opacity: 0.92;
        }

        .sw-btn.p {
          background: var(--pri);
          border-color: var(--pri);
          color: #fff;
        }

        .sw-btn.p:hover {
          background: var(--pri2);
        }

        .sw-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sw-banner {
          background: var(--soft);
          border: 1px solid var(--pri);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
        }

        .sw-banner b {
          color: var(--pri);
        }

        .sw-tabs {
          display: flex;
          gap: 4px;
          background: var(--chip);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow-x: auto;
        }

        .sw-tab {
          flex: 1;
          min-width: max-content;
          border: 0;
          background: transparent;
          padding: 10px 16px;
          border-radius: 9px;
          font-weight: 600;
          color: var(--mut);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .sw-tab[aria-selected='true'] {
          background: var(--card);
          color: var(--ink);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        .sw-hero {
          background: linear-gradient(135deg, #0b4f44, #0f6b5c);
          color: #fff;
          border-radius: 18px;
          padding: 24px;
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          margin-bottom: 16px;
        }

        .sw-hero small {
          opacity: 0.8;
          font-size: 13px;
        }

        .sw-bal {
          font-size: 44px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 4px 0;
        }

        .sw-hero .side {
          border-left: 1px solid rgba(255, 255, 255, 0.25);
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .sw-hero .side div {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sw-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .sw-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
        }

        .sw-card h3 {
          margin: 0 0 6px;
          font-size: 13px;
          color: var(--mut);
          font-weight: 600;
        }

        .sw-card .v {
          font-size: 22px;
          font-weight: 800;
          color: var(--ink);
        }

        .sw-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          background: var(--soft);
          color: var(--pri);
        }

        .sw-sec {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 20px 0 10px;
        }

        .sw-sec h2 {
          font-size: 17px;
          margin: 0;
          font-weight: 700;
          color: var(--ink);
        }

        .sw-sec span {
          color: var(--mut);
          font-size: 13px;
        }

        .sw-packs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }

        .sw-pack {
          position: relative;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .sw-pack:hover {
          border-color: var(--pri);
        }

        .sw-pack.pop {
          border: 2px solid var(--pri);
        }

        .sw-pack .tag {
          position: absolute;
          top: -10px;
          right: 12px;
          background: var(--acc);
          color: #2a1d00;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 99px;
        }

        .sw-pack .amt {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
        }

        .sw-pack .gens {
          font-weight: 700;
          color: var(--ink);
        }

        .sw-pack .free {
          color: var(--pos);
          font-weight: 600;
          font-size: 13px;
        }

        .sw-pack .eff {
          color: var(--mut);
          font-size: 12px;
          margin-bottom: 8px;
        }

        .sw-pack .sw-btn {
          margin-top: auto;
          width: 100%;
        }

        .sw-custom {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }

        .sw-custom input {
          font: inherit;
          width: 120px;
          padding: 9px 12px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--bg);
          color: var(--ink);
          font-weight: 700;
        }

        .sw-custom input:focus {
          outline: 2px solid var(--pri);
          outline-offset: 1px;
        }

        .sw-calc {
          color: var(--mut);
          font-size: 13px;
        }

        .sw-calc b {
          color: var(--ink);
        }

        .sw-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .sw-chip {
          border: 1px solid var(--line);
          background: var(--card);
          padding: 6px 14px;
          border-radius: 99px;
          font-weight: 600;
          color: var(--mut);
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .sw-chip:hover {
          border-color: var(--pri);
        }

        .sw-chip[aria-pressed='true'] {
          background: var(--pri);
          border-color: var(--pri);
          color: #fff;
        }

        .sw-sum {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .sw-tbl {
          overflow-x: auto;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 14px;
        }

        .sw-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 640px;
          font-size: 13px;
        }

        .sw-table th {
          text-align: left;
          font-size: 12px;
          color: var(--mut);
          font-weight: 600;
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
        }

        .sw-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
          color: var(--ink);
        }

        .sw-table tr:last-child td {
          border-bottom: 0;
        }

        .sw-table .r {
          text-align: right;
        }

        .sw-t {
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
          display: inline-block;
        }

        .sw-t.g {
          background: #fdf0d5;
          color: #8a5a00;
        }

        .sw-t.u {
          background: #dcf3ea;
          color: #0c6b49;
        }

        .sw-t.q {
          background: #e2e9fb;
          color: #2c4bb0;
        }

        :root[data-theme='dark'] .sw-t.g,
        .dark .sw-t.g {
          background: #3a2d10;
          color: #f0b23a;
        }

        :root[data-theme='dark'] .sw-t.u,
        .dark .sw-t.u {
          background: #12352b;
          color: #4fd1a1;
        }

        :root[data-theme='dark'] .sw-t.q,
        .dark .sw-t.q {
          background: #1c2744;
          color: #8fa8f5;
        }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme='light']) .sw-t.g {
            background: #3a2d10;
            color: #f0b23a;
          }
          :root:not([data-theme='light']) .sw-t.u {
            background: #12352b;
            color: #4fd1a1;
          }
          :root:not([data-theme='light']) .sw-t.q {
            background: #1c2744;
            color: #8fa8f5;
          }
        }

        .sw-neg {
          color: var(--neg);
          font-weight: 700;
        }

        .sw-pos {
          color: var(--pos);
          font-weight: 700;
        }

        .sw-sub {
          color: var(--mut);
          font-size: 12px;
        }

        @media (max-width: 640px) {
          .sw-hero {
            grid-template-columns: 1fr;
          }
          .sw-hero .side {
            border-left: 0;
            padding-left: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.25);
            padding-top: 14px;
          }
          .sw-bal {
            font-size: 36px;
          }
        }
      `}</style>

      <div className="sw-wrap">
        {/* Header */}
        <header className="sw-header">
          <div>
            <h1 className="sw-title">Subscription &amp; Wallet</h1>
            <p className="sw-subtitle">
              School ki credits, pay-as-you-go generations aur balance yahan manage karein.{' '}
              <span className="sw-badge">₹5 per generation</span>
            </p>
          </div>
          <button
            className="sw-btn"
            id="refresh"
            onClick={handleRefreshClick}
            disabled={isLoading || isProcessing}
          >
            {refreshText}
          </button>
        </header>

        {/* Membership Banner */}
        <div className="sw-banner">
          <span className="sw-badge">{isLifetimeActive ? 'Active' : 'Trial'}</span>
          <div>
            <b>{isLifetimeActive ? 'Lifetime Membership active.' : 'Free Trial active.'}</b>{' '}
            {isLifetimeActive
              ? `Aapka school ${planDisplayName} par hai, koi renewal payment nahi lagega. Credits kabhi bhi top-up karein.`
              : 'Aapka school Starter Free Trial par hai. Lifetime membership unlock karke unlimited teachers aur permanent access paayein!'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sw-tabs" role="tablist">
          <button
            className="sw-tab"
            role="tab"
            id="t-overview"
            aria-selected={tab === 'overview'}
            aria-controls="p-overview"
            onClick={() => {
              setTab('overview');
              window.scrollTo(0, 0);
            }}
          >
            Overview
          </button>
          <button
            className="sw-tab"
            role="tab"
            id="t-plans"
            aria-selected={tab === 'plans'}
            aria-controls="p-plans"
            onClick={() => {
              setTab('plans');
              window.scrollTo(0, 0);
            }}
          >
            Recharge plans
          </button>
          <button
            className="sw-tab"
            role="tab"
            id="t-history"
            aria-selected={tab === 'history'}
            aria-controls="p-history"
            onClick={() => {
              setTab('history');
              window.scrollTo(0, 0);
            }}
          >
            History
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <section className="sw-panel" id="p-overview" role="tabpanel">
            {/* Hero Wallet Card */}
            <div className="sw-hero">
              <div>
                <small>Available balance</small>
                <div className="sw-bal" id="bal">
                  {inr(walletBalance)}
                </div>
                <small>Isse AI question paper generate hote hain</small>
              </div>
              <div className="side">
                <div>
                  <small>Generations left</small>
                  <b id="gl">~{gensLeft} papers</b>
                </div>
                <div>
                  <small>Rate</small>
                  <b>₹{costPerGen.toFixed(2)} / generation</b>
                </div>
                <div>
                  <small>Total generated</small>
                  <b>{totalGenerated} papers</b>
                </div>
              </div>
            </div>

            {/* 3 Grid Summary Cards */}
            <div className="sw-grid">
              <div className="sw-card">
                <h3>Institutional plan</h3>
                <div className="v">{planDisplayName}</div>
                <p className="sw-sub" style={{ margin: '4px 0 8px' }}>
                  {isLifetimeActive
                    ? 'One-time payment, recharge & use at ₹5/gen'
                    : '14-Day Free Trial included'}
                </p>
                <span className="sw-badge">
                  {isLifetimeActive ? 'Lifetime member' : 'Trial Member'}
                </span>
              </div>
              <div className="sw-card">
                <h3>Plan validity</h3>
                <div className="v">{isLifetimeActive ? 'Never expires' : '14 Days Access'}</div>
                <p className="sw-sub" style={{ margin: '4px 0 0' }}>
                  {isLifetimeActive
                    ? 'Lifetime access, kisi renewal ki zarurat nahi'
                    : 'Upgrade to Lifetime plan anytime'}
                </p>
              </div>
              <div className="sw-card">
                <h3>Usage pricing</h3>
                <div className="v">
                  ₹{costPerGen.toFixed(2)} <span className="sw-sub">/ generation</span>
                </div>
                <p className="sw-sub" style={{ margin: '4px 0 0' }}>
                  Sirf successful generation par automatically deduct hota hai
                </p>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="sw-sec">
              <h2>Recent activity</h2>
              <button
                className="sw-btn"
                data-go="history"
                onClick={() => {
                  setTab('history');
                  window.scrollTo(0, 0);
                }}
              >
                Poori history dekhein
              </button>
            </div>

            <div className="sw-tbl">
              <table className="sw-table">
                <tbody id="recent">
                  {allRows.slice(0, 4).map((r, i) => {
                    const isCredit = r[3] > 0;
                    return (
                      <tr key={i}>
                        <td>{r[0]}</td>
                        <td>
                          <span className={`sw-t ${r[1]}`}>{TYPE_NAMES[r[1]] || 'Other'}</span>
                        </td>
                        <td>{r[2]}</td>
                        <td className="r">
                          {isCredit ? (
                            <span className="sw-pos">+{inr(r[3])}</span>
                          ) : (
                            <span className="sw-neg">−{inr(r[3])}</span>
                          )}
                        </td>
                        <td className="r">{inr(r[4])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: RECHARGE PLANS */}
        {tab === 'plans' && (
          <section className="sw-panel" id="p-plans" role="tabpanel">
            {/* Non-Lifetime Banner & Purchase Offer (if on trial) */}
            {!isLifetimeActive && (
              <div style={{ marginBottom: 24 }}>
                <div className="sw-sec" style={{ marginTop: 0 }}>
                  <h2>One-Time Lifetime Membership</h2>
                  <span>Pay once, get perpetual school license with included paper credits</span>
                </div>
                <div className="sw-grid" style={{ marginBottom: 16 }}>
                  <div className="sw-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="sw-sub" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                        Starter Lifetime
                      </span>
                      <span className="sw-badge">₹500 One-time</span>
                    </div>
                    <div className="v">₹500</div>
                    <p className="sw-sub" style={{ margin: 0 }}>
                      Includes <strong>₹600 generation credits</strong> (120 papers included + 20% bonus free). Single branch & coaching centers.
                    </p>
                    <button
                      className="sw-btn p"
                      style={{ marginTop: 'auto' }}
                      disabled={isProcessing}
                      onClick={() => handleSubscribe('lifetime_starter', 500)}
                    >
                      Get Starter Lifetime (₹500)
                    </button>
                  </div>

                  <div
                    className="sw-card"
                    style={{
                      border: '2px solid var(--pri)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: 12,
                        background: 'var(--acc)',
                        color: '#2a1d00',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 99,
                      }}
                    >
                      Recommended
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="sw-sub" style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--pri)' }}>
                        Institutional Lifetime
                      </span>
                      <span className="sw-badge">₹1,000 One-time</span>
                    </div>
                    <div className="v">₹1,000</div>
                    <p className="sw-sub" style={{ margin: 0 }}>
                      Includes <strong>₹1,500 generation credits</strong> (300 papers included + 50% bonus free). Unlimited teachers, priority AI queue.
                    </p>
                    <button
                      className="sw-btn p"
                      style={{ marginTop: 'auto' }}
                      disabled={isProcessing}
                      onClick={() => handleSubscribe('lifetime_pro', 1000)}
                    >
                      Get Institutional Lifetime (₹1,000)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Recharge Packs Grid */}
            <div className="sw-sec" style={{ marginTop: 0 }}>
              <h2>Recharge school wallet</h2>
              <span>Bade recharge par +50% tak free bonus. Funds kabhi expire nahi hote.</span>
            </div>

            <div className="sw-packs" id="packs">
              {PACKS_CONFIG.map((p, i) => {
                const amt = p[0];
                const gens = p[1];
                const freeGens = p[2];
                const bonusPercentStr = p[3];
                const hasTag = i === 1 || i === 4;
                const tagLabel = i === 1 ? 'Popular' : '+50% free';
                const effectiveRate = (amt / gens).toFixed(2);

                return (
                  <div key={amt} className={`sw-pack ${i === 1 ? 'pop' : ''}`}>
                    {hasTag && <span className="tag">{tagLabel}</span>}
                    <div className="sw-sub">{PACK_NAMES[i]} pack</div>
                    <div className="amt">₹{amt}</div>
                    <div className="gens">{gens} generations</div>
                    <div className="free">
                      {freeGens > 0 ? `+${freeGens} free gens ${bonusPercentStr}` : 'Standard rate'}
                    </div>
                    <div className="eff">Effective ₹{effectiveRate}/gen</div>
                    <button
                      className="sw-btn p"
                      data-amt={amt}
                      disabled={isProcessing}
                      onClick={() => handleRecharge(amt)}
                    >
                      Top up ₹{amt}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Recharge Card */}
            <div className="sw-sec">
              <h2>Custom recharge</h2>
              <span>Apni amount likhein</span>
            </div>

            <div className="sw-card sw-custom">
              <div className="sw-calc" id="calc">
                Pay <b>₹{parsedAmt}</b> → Credit <b>₹{totalCred}</b> ={' '}
                <b>{genCount} generations</b>
                {bonusAmt > 0 ? ` (₹${bonusAmt} free bonus)` : ''}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label htmlFor="amt" className="sw-sub">
                  Amount ₹
                </label>
                <input
                  id="amt"
                  type="number"
                  min="10"
                  step="10"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="150"
                />
                <button
                  className="sw-btn p"
                  id="rc"
                  disabled={isProcessing || parsedAmt < 5}
                  onClick={() => handleRecharge(parsedAmt)}
                >
                  Recharge now
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: HISTORY */}
        {tab === 'history' && (
          <section className="sw-panel" id="p-history" role="tabpanel">
            {/* Top Summaries */}
            <div className="sw-sum">
              <div className="sw-card">
                <h3>Total top-ups</h3>
                <div className="v sw-pos" id="s1">
                  +{inr(totalTopups)}
                </div>
              </div>
              <div className="sw-card">
                <h3>Total used</h3>
                <div className="v sw-neg" id="s2">
                  −{inr(totalUsed)}
                </div>
              </div>
              <div className="sw-card">
                <h3>Entries</h3>
                <div className="v" id="s3">
                  {filteredRows.length}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="sw-filters" id="filters">
              {(
                [
                  ['all', 'Sab'],
                  ['u', 'Top-ups'],
                  ['g', 'Generations'],
                  ['q', 'Plan quota'],
                ] as const
              ).map(([fKey, fLabel]) => (
                <button
                  key={fKey}
                  className="sw-chip"
                  data-f={fKey}
                  aria-pressed={filter === fKey}
                  onClick={() => setFilter(fKey)}
                >
                  {fLabel}
                </button>
              ))}
            </div>

            {/* Full Transactions Ledger */}
            <div className="sw-tbl">
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Date &amp; time</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="r">Amount</th>
                    <th className="r">Balance after</th>
                  </tr>
                </thead>
                <tbody id="rows">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="sw-sub" style={{ textAlign: 'center', padding: '24px' }}>
                        Is filter me koi entry nahi hai.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, i) => {
                      const isCredit = r[3] > 0;
                      return (
                        <tr key={i}>
                          <td>{r[0]}</td>
                          <td>
                            <span className={`sw-t ${r[1]}`}>{TYPE_NAMES[r[1]] || 'Other'}</span>
                          </td>
                          <td>{r[2]}</td>
                          <td className="r">
                            {isCredit ? (
                              <span className="sw-pos">+{inr(r[3])}</span>
                            ) : (
                              <span className="sw-neg">−{inr(r[3])}</span>
                            )}
                          </td>
                          <td className="r">{inr(r[4])}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
