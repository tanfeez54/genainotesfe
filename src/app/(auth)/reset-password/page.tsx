'use client';

import { Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Lock, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="w-full max-w-md flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border shadow-xl">
      <div className="w-full animate-fade-in">
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group justify-center w-full">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-heading font-bold text-foreground">ExamPrep AI</span>
        </Link>

        <h1 className="text-2xl font-heading font-bold text-foreground mb-2 text-center">Set New Password</h1>
        <p className="text-muted-foreground mb-8 text-sm text-center">
          We sent a 6-digit code to <span className="font-medium text-foreground">{emailParam}</span>.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium">
              6-Digit Reset Code
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                className="pl-10 h-11 bg-background tracking-widest text-center font-mono"
                maxLength={6}
                {...register('otp')}
              />
            </div>
            {errors.otp && (
              <p className="text-sm text-destructive font-medium">{errors.otp.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-11 bg-background"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-md mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                Save & Login
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-sm text-center text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-8">
      <Suspense fallback={<div className="flex items-center justify-center h-full w-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
