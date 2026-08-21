'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Lock,
  Loader2,
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z
  .object({
    email: z.string().email('Valid email is required').optional().or(z.literal('')),
    otp: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });
type FormData = z.infer<typeof schema>;

function SetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [invitedSchool, setInvitedSchool] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // 1. Check URL query params first (for email invitation link)
    const tokenFromUrl = searchParams.get('token');
    const schoolFromUrl = searchParams.get('school');
    const emailFromUrl = searchParams.get('email');

    if (tokenFromUrl) {
      setSetupToken(tokenFromUrl);
      if (schoolFromUrl) setInvitedSchool(decodeURIComponent(schoolFromUrl));
      if (emailFromUrl) {
        const decodedEmail = decodeURIComponent(emailFromUrl);
        setInvitedEmail(decodedEmail);
        setValue('email', decodedEmail);
      }
      return;
    }

    // 2. Check if email only was provided
    if (emailFromUrl) {
      const decodedEmail = decodeURIComponent(emailFromUrl);
      setInvitedEmail(decodedEmail);
      setValue('email', decodedEmail);
      if (schoolFromUrl) setInvitedSchool(decodeURIComponent(schoolFromUrl));
      return;
    }

    // 3. Fallback to sessionStorage (from direct signup OTP verification flow)
    const tokenFromSession = sessionStorage.getItem('setupToken');
    if (tokenFromSession) {
      setSetupToken(tokenFromSession);
      const email = sessionStorage.getItem('otpEmail');
      if (email) {
        setInvitedEmail(email);
        setValue('email', email);
      }
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload: any = { password: data.password };

      if (setupToken) {
        payload.setup_token = setupToken;
      } else {
        if (!data.email || !data.otp) {
          toast.error('Please provide your Email and 6-digit Activation Code');
          setIsLoading(false);
          return;
        }
        payload.email = data.email;
        payload.otp = data.otp.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to set password');

      // Set session cookie for 7 days
      document.cookie = `notegen_session=${result.session.access_token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }; samesite=lax`;

      sessionStorage.removeItem('setupToken');
      sessionStorage.removeItem('otpEmail');

      toast.success('Account activated successfully! Redirecting...');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-brand-text">SchoolPapers AI</span>
          </Link>

          {/* School Invite Banner */}
          {invitedSchool ? (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                <Building2 className="w-4 h-4" />
                <span>Invited to {invitedSchool}</span>
              </div>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                You have been appointed as School Administrator. Set a secure password to activate your school workspace.
              </p>
              {invitedEmail && (
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Account: <span className="font-semibold text-slate-700">{invitedEmail}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Set your password</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your activation details and create a secure password to access your school portal.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* If no setupToken is present in URL, show Email and 6-digit OTP fields */}
            {!setupToken && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Admin Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@school.com"
                      className="pl-10 text-xs rounded-xl bg-white border-slate-200"
                      {...register('email')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs font-semibold text-slate-700">
                    6-Digit Activation Code (From Email) *
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="e.g. 839102"
                      maxLength={6}
                      className="pl-10 text-xs font-mono tracking-widest rounded-xl bg-white border-slate-200"
                      {...register('otp')}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                New Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 text-xs rounded-xl bg-white border-slate-200"
                  autoComplete="new-password"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-xs font-semibold text-slate-700">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 text-xs rounded-xl bg-white border-slate-200"
                  autoComplete="new-password"
                  {...register('confirm_password')}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-[11px] text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md transition-opacity mt-4 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                <>
                  Activate & Log In
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already activated?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Log In directly
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Brand panel */}
      <div className="hidden lg:flex flex-1 gradient-brand items-center justify-center p-12 relative overflow-hidden">
        <div className="relative text-white text-center max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto backdrop-blur-sm shadow-xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Direct School Activation</h2>
          <p className="text-xs text-white/80 leading-relaxed">
            Generate AI question papers, scan exam sheets with OCR, and create printable papers customized with your school branding.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}