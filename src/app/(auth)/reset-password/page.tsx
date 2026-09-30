'use client';

import { Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  useEffect(() => {
    if (!emailParam) {
      toast.error('Missing email parameter');
      router.push('/forgot-password');
    }
  }, [emailParam, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, otp: data.otp, password: data.password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to reset password');

      document.cookie = `notegen_session=${result.session.access_token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;

      toast.success('Password reset successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code';
      toast.error('Reset Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!emailParam) return null;

  return (
    <div className="w-full max-w-md animate-fade-in bg-white border border-[#212832]/5 p-8 sm:p-12 shadow-2xl rounded-[36px] relative text-center">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-1.5 group mb-6">
        <span className="font-heading font-black text-2xl text-[#181E4B] tracking-tight">
          NoteGen
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-1.5" />
      </Link>

      <div className="flex justify-start mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5E6282] hover:text-[#181E4B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </Link>
      </div>

      <div className="w-14 h-14 rounded-2xl bg-[#DF6951]/10 text-[#DF6951] mx-auto flex items-center justify-center mb-4">
        <Lock className="w-7 h-7" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
        Security
      </span>
      <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] mt-1">
        Set New Password
      </h1>
      <p className="text-xs text-[#5E6282] mt-2 leading-relaxed">
        We sent a 6-digit reset code to <span className="font-bold text-[#181E4B]">{emailParam}</span>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-6 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="otp" className="text-xs font-bold text-[#181E4B]">
            6-Digit Reset Code
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm font-mono tracking-widest text-center shadow-xs"
              maxLength={6}
              {...register('otp')}
            />
          </div>
          {errors.otp && (
            <p className="text-xs text-rose-500 font-semibold">{errors.otp.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-[#181E4B]">
            New Password
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#DF6951] hover:bg-[#c9523b] text-white font-bold rounded-2xl shadow-lg shadow-[#DF6951]/30 hover:shadow-xl transition-all duration-300 mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Save &amp; Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#212832] font-body-jadoo flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#DF6951]/20 selection:text-[#DF6951]">
      {/* Jadoo Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-to-bl from-[#FFF1DA] to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-[#DFD7F9]/25 rounded-full blur-3xl opacity-70" />
      </div>

      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#DF6951]" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
