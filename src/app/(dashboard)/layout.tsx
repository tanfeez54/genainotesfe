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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/papers', label: 'Saved Papers', icon: FileCheck2 },
  { href: '/classes', label: 'Classes & Subjects', icon: FolderOpen },
  { href: '/scan', label: 'Scan Papers', icon: Sparkles },
  { href: '/question-bank', label: 'Question Bank', icon: FileText },
  { href: '/settings/school', label: 'School Settings', icon: Settings },
  { href: '/dashboard', label: 'Legacy AI Papers', icon: LayoutDashboard },
];

function SidebarContent({
  pathname,
  userEmail,
  handleLogout,
  onNavClick,
}: {
  pathname: string;
  userEmail: string;
  handleLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-heading font-bold tracking-tight text-foreground">ExamPrep AI</span>
      </div>

      {/* Generate Paper CTA */}
      <div className="px-4 pt-5 pb-4">
        <Link href="/generate-paper" onClick={onNavClick}>
          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 font-medium h-10 rounded-md shadow-sm"
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Paper
          </Button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href} onClick={onNavClick}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group cursor-pointer border border-transparent',
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto w-3.5 h-3.5 text-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User area */}
      <div className="p-4 bg-muted/30 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-card border border-border shadow-sm mb-3">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {userEmail?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm font-medium text-foreground truncate flex-1">{userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 rounded-md cursor-pointer transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
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

      // Check if user has a school
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://genainotesbe.onrender.com';
        const res = await fetch(`${apiUrl}/api/schools/my-school`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          // No school found! Redirect to onboarding
          router.push('/onboarding');
          return;
        }

        setIsVerifyingSchool(false);
      } catch (error) {
        console.error('Failed to verify school status', error);
        setIsVerifyingSchool(false);
      }
    }

    checkAuthAndSchool();
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
          <SidebarContent pathname={pathname} userEmail={userEmail} handleLogout={handleLogout} />
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
                handleLogout={handleLogout}
                onNavClick={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile & Tablet Header */}
          <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-700 hover:bg-slate-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm gradient-brand-text">ExamPrep AI</span>
              </div>
            </div>

            <Link href="/generate-paper">
              <Button size="sm" className="gradient-brand text-white text-xs h-8 px-3">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Generate
              </Button>
            </Link>
          </header>

          {/* Page Content Viewport */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
