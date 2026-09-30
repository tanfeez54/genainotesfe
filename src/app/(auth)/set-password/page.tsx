'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Loader2,
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Mail,
  GraduationCap,
  Send,
  Sparkles,
} from 'lucide-react';
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

      toast.success('Account activated successfully! Setting up your school...');
      router.push('/onboarding');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#212832] font-body-jadoo flex items-center justify-center p-4 sm:p-8 relative overflow-hidden selection:bg-[#DF6951]/20 selection:text-[#DF6951]">
      {/* Jadoo Ambient Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-bl from-[#FFF1DA] to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-[#DFD7F9]/25 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-[36px] overflow-hidden border border-[#212832]/5 bg-white shadow-2xl relative z-10">
        {/* Left: Jadoo Set Password Form */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-sm animate-fade-in space-y-6">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-1.5 group mb-4">
              <span className="font-heading font-black text-2xl sm:text-3xl text-[#181E4B] tracking-tight">
                NoteGen
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-1.5 animate-pulse" />
            </Link>

            {/* School Invite Banner */}
            {invitedSchool ? (
              <div className="p-4 rounded-2xl bg-[#FFF1DA]/60 border border-[#F1A501]/30 space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-[#181E4B] font-bold text-xs">
                  <Building2 className="w-4 h-4 text-[#DF6951]" />
                  <span>Invited to {invitedSchool}</span>
                </div>
                <p className="text-[11px] text-[#5E6282] leading-relaxed">
                  You have been appointed as School Administrator. Set a secure password to activate your school workspace.
                </p>
                {invitedEmail && (
                  <div className="text-[10px] text-[#5E6282] font-mono pt-1">
                    Account: <span className="font-bold text-[#181E4B]">{invitedEmail}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
                  Account Activation
                </span>
                <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#181E4B] tracking-tight mt-1">
                  Set Your Password
                </h1>
                <p className="text-xs sm:text-sm text-[#5E6282] mt-1.5">
                  Create a secure password to activate your NoteGen school portal.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1 text-left">
              {/* If no setupToken is present in URL, show Email and 6-digit OTP fields */}
              {!setupToken && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-[#181E4B]">
                      Admin Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@school.com"
                        className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm shadow-xs"
                        {...register('email')}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-xs font-bold text-[#181E4B]">
                      6-Digit Activation Code (From Email) *
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="e.g. 839102"
                        maxLength={6}
                        className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm font-mono tracking-widest text-center shadow-xs"
                        {...register('otp')}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-[#181E4B]">
                  New Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm shadow-xs"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-xs font-bold text-[#181E4B]">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm shadow-xs"
                    autoComplete="new-password"
                    {...register('confirm_password')}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#DF6951] hover:bg-[#c9523b] text-white font-bold rounded-2xl shadow-lg shadow-[#DF6951]/30 hover:shadow-xl transition-all duration-300 mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Activate &amp; Proceed to Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#5E6282]">
              Already activated?{' '}
              <Link href="/login" className="text-[#DF6951] font-bold hover:underline">
                Sign in directly
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Jadoo Warm Peach Info Panel */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#FFF1DA] via-[#FDE8D3]/50 to-[#FFFDFB] items-center justify-center p-12 border-l border-[#212832]/5 relative text-left">
          {/* Floating Paper Airplane Icon */}
          <div className="absolute top-8 right-8 w-11 h-11 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[#DF6951] -rotate-12">
            <Send className="w-5 h-5 fill-[#DF6951]/10" />
          </div>

          <div className="relative z-10 max-w-sm space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#00A389] text-white flex items-center justify-center shadow-lg shadow-[#00A389]/30">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DF6951]">
                Official Institutional Portal
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] leading-tight mt-1">
                Complete institutional privacy &amp; bank-grade encryption
              </h2>
              <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-2">
                Your school tests, curriculum blueprints, student notes, and uploaded textbook scans are kept isolated within your tenant.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-semibold text-[#181E4B]">
              {[
                'Direct School Administrator Onboarding',
                'Isolated Textbook Syllabus Storage',
                'Unlimited Question Paper Generation',
                'Full School Logo, Stamp & Watermark Support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#212832]/5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#181E4B]">
                <GraduationCap className="w-4 h-4 text-[#DF6951]" />
                <span>One-Time Lifetime Membership • Zero Subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#FFFDFB]">
          <Loader2 className="w-8 h-8 animate-spin text-[#DF6951]" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}