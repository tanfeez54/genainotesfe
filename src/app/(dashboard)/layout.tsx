'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  FileCheck2,
  CreditCard,
  Wallet,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Teacher Lesson Suite', icon: GraduationCap },
  { href: '/papers', label: 'Saved Papers', icon: FileCheck2 },
  { href: '/classes', label: 'Classes & Subjects', icon: FolderOpen },
  { href: '/scan', label: 'Scan Papers', icon: Sparkles },
  { href: '/question-bank', label: 'Question Bank', icon: FileText },
  { href: '/billing', label: 'Subscription & Wallet', icon: CreditCard },
  { href: '/settings/school', label: 'School Settings', icon: Settings },
];

function SidebarContent({
  pathname,
  userEmail,
  schoolName,
  schoolLogo,
  walletBalance,
  generationsRemaining,
  handleLogout,
  onNavClick,
}: {
  pathname: string;
  userEmail: string;
  schoolName: string;
  schoolLogo: string | null;
  walletBalance: number;
  generationsRemaining: number;
  handleLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-[#212832]/5 w-68 select-none shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#212832]/5">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="font-heading font-black text-2xl text-[#181E4B] tracking-tight">
            NoteGen
          </span>
          <span className="w-2 h-2 rounded-full bg-[#DF6951] mt-1" />
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6282] px-2 py-0.5 rounded-full bg-[#FFF1DA] ml-auto">
          PRO
        </span>
      </div>

      {/* School Info Header */}
      <div className="px-5 py-3 border-b border-[#212832]/5 flex items-center gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} alt="School Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs bg-[#FFFDFB] border border-[#212832]/5" />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-[#DF6951]/10 text-[#DF6951] flex items-center justify-center shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          <span className="text-xs font-bold text-[#181E4B] truncate block" title={schoolName}>
            {schoolName}
          </span>
          <span className="text-[10px] text-[#5E6282] block">Verified School</span>
        </div>
      </div>

      {/* Generate Paper CTA */}
      <div className="px-5 pt-4 pb-2">
        <Link href="/generate-paper" onClick={onNavClick}>
          <button
            type="button"
            className="w-full bg-[#F1A501] hover:bg-[#e09900] text-white font-bold text-xs h-11 rounded-2xl shadow-md shadow-[#F1A501]/25 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New Paper</span>
          </button>
        </Link>
      </div>

      {/* Wallet Balance Widget */}
      <div className="px-5 py-2">
        <Link href="/billing" onClick={onNavClick}>
          <div className="p-3.5 rounded-2xl bg-[#FFF1DA]/50 border border-[#F1A501]/30 hover:border-[#DF6951]/40 transition-all group cursor-pointer text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#5E6282] uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#DF6951]" /> School Wallet
              </span>
              <span className="text-[10px] font-bold text-[#DF6951] group-hover:underline">
                + Top-up
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-serif-display text-xl font-bold text-[#181E4B]">
                ₹{walletBalance.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00A389]/10 text-[#00A389]">
                {generationsRemaining} Papers Free
              </span>
            </div>
            <p className="text-[10px] text-[#5E6282] mt-1">₹5.00 per generation</p>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto text-left">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href} onClick={onNavClick}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group cursor-pointer',
                  isActive
                    ? 'bg-[#FFF1DA] text-[#DF6951] font-bold shadow-xs'
                    : 'text-[#5E6282] hover:bg-[#FFF1DA]/40 hover:text-[#181E4B]'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-[#DF6951]' : 'text-[#5E6282] group-hover:text-[#181E4B]')} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto w-3.5 h-3.5 text-[#DF6951]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-[#212832]/5 bg-[#FFFDFB]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white border border-[#212832]/5 shadow-xs mb-2 text-left">
          <div className="w-8 h-8 rounded-xl bg-[#DF6951] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
            {userEmail?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#181E4B] truncate block">{userEmail}</span>
            <span className="text-[10px] text-[#00A389] font-semibold">Online</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-2 text-xs font-semibold text-[#5E6282] hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [schoolName, setSchoolName] = useState('NoteGen Academic');
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(50.0);
  const [generationsRemaining, setGenerationsRemaining] = useState<number>(10);
  const [isVerifyingSchool, setIsVerifyingSchool] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function checkAuthAndSchool() {
      // Check if arriving via Impersonation support token in URL
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const supportToken = urlParams.get('support_token');
        if (supportToken) {
          document.cookie = `notegen_session=${supportToken}; path=/; max-age=900; samesite=lax`; // 15 mins
          setIsImpersonating(true);
          // Remove param from URL cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) setUserEmail(payload.email);
        if (payload.is_support_session) setIsImpersonating(true);
      } catch (e) {
        console.error('Failed to parse session token', e);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Check if user has a school
      try {
        const res = await fetch(`${apiUrl}/api/schools/my-school`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          // No school found! Redirect to onboarding
          router.push('/onboarding');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.school?.name) setSchoolName(data.school.name);
          if (data.school?.logo_url) setSchoolLogo(data.school.logo_url);
        }

        // Fetch billing summary
        try {
          const billRes = await fetch(`${apiUrl}/api/billing/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (billRes.ok) {
            const billData = await billRes.json();
            if (billData.data) {
              setWalletBalance(Number(billData.data.wallet_balance ?? 50.0));
              setGenerationsRemaining(Number(billData.data.generations_remaining ?? 10));
            }
          }
        } catch (bErr) {
          console.warn('Billing summary fetch error:', bErr);
        }

        setIsVerifyingSchool(false);
      } catch (error) {
        console.error('Failed to verify school status', error);
        setIsVerifyingSchool(false);
      }
    }

    checkAuthAndSchool();

    // Listen to billing updates triggered after payment / generation
    const handleBillingUpdate = () => {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/billing/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((d) => {
          if (d.data) {
            setWalletBalance(Number(d.data.wallet_balance ?? 50.0));
            setGenerationsRemaining(Number(d.data.generations_remaining ?? 10));
          }
        })
        .catch(console.error);
    };

    window.addEventListener('billing-updated', handleBillingUpdate);
    return () => window.removeEventListener('billing-updated', handleBillingUpdate);
  }, [router]);

  const handleLogout = async () => {
    document.cookie = 'notegen_session=; path=/; max-age=0; samesite=lax';
    toast.success('Signed out');
    router.push('/login');
  };

  if (isVerifyingSchool) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600 font-semibold text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* Top Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md z-50">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>🛡️</span>
            <span>Support Session Active — Viewing as School Tenant (Auto-expires in 15m)</span>
          </div>
          <button
            onClick={() => {
              document.cookie = 'notegen_session=; path=/; max-age=0; samesite=lax';
              window.location.href = 'http://localhost:3002/schools';
            }}
            className="px-2.5 py-1 rounded bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors cursor-pointer w-full sm:w-auto"
          >
            Exit Support Session
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (Permanent) */}
        <div className="hidden lg:flex flex-col flex-shrink-0">
          <SidebarContent
            pathname={pathname}
            userEmail={userEmail}
            schoolName={schoolName}
            schoolLogo={schoolLogo}
            walletBalance={walletBalance}
            generationsRemaining={generationsRemaining}
            handleLogout={handleLogout}
          />
        </div>

        {/* Mobile Sidebar Overlay & Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
              <SidebarContent
                pathname={pathname}
                userEmail={userEmail}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
                walletBalance={walletBalance}
                generationsRemaining={generationsRemaining}
                handleLogout={handleLogout}
                onNavClick={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile & Tablet Header */}
          <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-700 hover:bg-muted"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-2 max-w-[160px]">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="School Logo" className="w-6 h-6 rounded-md object-contain bg-white shadow-xs" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="font-bold text-sm text-foreground truncate" title={schoolName}>{schoolName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/billing" className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 text-xs font-semibold">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span>₹{walletBalance.toFixed(0)}</span>
              </Link>

              <Link href="/generate-paper">
                <Button size="sm" className="bg-primary text-primary-foreground text-xs h-8 px-2.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Gen
                </Button>
              </Link>
            </div>
          </header>

          {/* Desktop Top Header Bar for Balance & Quick Status */}
          <div className="hidden lg:flex items-center justify-between px-8 py-2.5 border-b border-border bg-card/60 backdrop-blur-xs">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground">{schoolName}</span>
              <span>•</span>
              <span className="text-primary font-medium">₹5 / AI Generation</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/billing"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 shadow-xs transition-all text-xs"
              >
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold text-foreground">₹{walletBalance.toFixed(2)}</span>
                <span className="text-muted-foreground">({generationsRemaining} gens)</span>
                <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded ml-1">
                  + Add Funds
                </span>
              </Link>
            </div>
          </div>

          {/* Page Content Viewport */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
