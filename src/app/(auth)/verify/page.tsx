'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OTP_LENGTH = 6;

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('otpEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
    inputRefs.current[0]?.focus();
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = useCallback((index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Invalid code');

      // Store the setup token in sessionStorage to pass to the next page
      sessionStorage.setItem('setupToken', result.setup_token);

      toast.success('Email verified!');
      router.push('/set-password');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      if (message.includes('expired')) {
        setError('Code has expired. Please request a new one.');
      } else {
        setError('Invalid code. Please try again.');
      }
      // Clear OTP inputs
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, router]);

  // Auto-verify when all digits are entered
  useEffect(() => {
    if (otp.every(Boolean) && otp.join('').length === OTP_LENGTH) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      // NOTE: Resend logic for signup could be different, but for now we'll assume they just go through signup again or we can have a generic resend.
      // Since this is just for signup, hitting signup again might fail if user already exists but we'll try hitting a resend or just show error.
      // We will skip actual resend endpoint for this scope or rely on hitting /api/auth/signup again.
      // For now, let's hit /api/auth/signup again to resend OTP. This requires full name which we don't have here.
      // I'll just show a toast to ask them to signup again.
      toast.error('Resend not supported yet. Please go back and signup again.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 group">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-brand-text">NoteGen AI</span>
        </Link>

        <Link href="/login">
          <Button variant="ghost" size="sm" className="mb-6 -ml-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-8">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{email}</span>.
          Enter it below to sign in.
        </p>

        {/* OTP Input boxes */}
        <div className="flex gap-2.5 mb-6" role="group" aria-label="OTP input">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => {
                e.preventDefault();
                handleChange(i, e.clipboardData.getData('text'));
              }}
              aria-label={`Digit ${i + 1}`}
              className={`
                w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-card
                text-foreground outline-none transition-all
                ${error
                  ? 'border-destructive bg-destructive/5'
                  : otp[i]
                  ? 'border-primary bg-primary/5 animate-pulse-glow'
                  : 'border-border hover:border-primary/50 focus:border-primary focus:bg-primary/5'
                }
              `}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive mb-4 animate-fade-in">{error}</p>
        )}

        <Button
          id="verify-btn"
          onClick={handleVerify}
          className="w-full h-11 gradient-brand text-white hover:opacity-90 transition-opacity font-semibold shadow-md mb-4"
          disabled={isVerifying || otp.join('').length !== OTP_LENGTH}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Sign in'
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Didn&apos;t receive a code?</p>
          <Button
            id="resend-btn"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="text-primary hover:text-primary/80"
          >
            {isResending ? (
              <Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 w-3.5 h-3.5" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Button>
        </div>

        <p className="mt-8 text-xs text-center text-muted-foreground">
          Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    </div>
  );
}
