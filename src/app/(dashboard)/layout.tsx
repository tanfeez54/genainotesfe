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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/classes', label: 'Classes & Subjects', icon: FolderOpen },
  { href: '/scan', label: 'Scan Papers', icon: Sparkles },
  { href: '/question-bank', label: 'Question Bank', icon: FileText },
  { href: '/settings/school', label: 'School Settings', icon: Settings },
  { href: '/dashboard', label: 'Legacy AI Notes', icon: LayoutDashboard },
];

function Sidebar({ pathname, userEmail, handleLogout }: { pathname: string, userEmail: string, handleLogout: () => void }) {
  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold gradient-brand-text">SchoolPapers AI</span>
      </div>

      {/* Generate Paper CTA */}
      <div className="px-4 pt-5 pb-3">
        <Link href="/generate-paper">
          <Button
            className="w-full gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm font-medium h-9"
            size="sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Generate Paper
          </Button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-primary')} />
                {label}
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
      <div className="p-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/60 mb-2">
          <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userEmail?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-xs text-sidebar-foreground/80 truncate flex-1">{userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my-school`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 404) {
          // No school found! Redirect to onboarding
          router.push('/onboarding');
          return; // Keep isVerifyingSchool = true so children do not mount
        }

        if (res.ok) {
          setIsVerifyingSchool(false);
        } else {
          // If other error, still allow viewing or handle gracefully
          setIsVerifyingSchool(false);
        }
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-500 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* Top Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-md z-50">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>Support Session Active — Viewing as School Tenant (Session auto-expires in 15 mins)</span>
          </div>
          <button
            onClick={() => {
              document.cookie = 'notegen_session=; path=/; max-age=0; samesite=lax';
              window.location.href = 'http://localhost:3002/schools';
            }}
            className="px-2.5 py-0.5 rounded bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Exit Support Session
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col flex-shrink-0">
          <Sidebar pathname={pathname} userEmail={userEmail} handleLogout={handleLogout} />
        </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col">
            <Sidebar pathname={pathname} userEmail={userEmail} handleLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm gradient-brand-text">SchoolPapers AI</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}
