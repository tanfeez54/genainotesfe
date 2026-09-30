'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RefreshCw, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
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

      sessionStorage.setItem('setupToken', result.setup_token);

      toast.success('Email verified successfully!');
      router.push('/set-password');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      if (message.includes('expired')) {
        setError('Code has expired. Please request a new one.');
      } else {
        setError('Invalid code. Please try again.');
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, router]);

  useEffect(() => {
    if (otp.every(Boolean) && otp.join('').length === OTP_LENGTH) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      toast.error('Resend not supported yet. Please go back and signup again.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#212832] font-body-jadoo flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#DF6951]/20 selection:text-[#DF6951]">
      {/* Jadoo Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-to-bl from-[#FFF1DA] to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-[#DFD7F9]/25 rounded-full blur-3xl opacity-70" />
      </div>

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
          <Mail className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
          Verification
        </span>
        <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] mt-1">
          Check your email
        </h1>
        <p className="text-xs text-[#5E6282] mt-2 leading-relaxed">
          We sent a 6-digit code to <span className="font-bold text-[#181E4B]">{email}</span>. Enter it below to proceed.
        </p>

        {/* OTP Input boxes */}
        <div className="flex gap-2.5 my-8 justify-between" role="group" aria-label="OTP input">
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
                w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-bold rounded-2xl border bg-[#FFFDFB]
                text-[#181E4B] outline-none transition-all focus:ring-2 focus:ring-[#DF6951]/20
                ${error
                  ? 'border-rose-400 bg-rose-50/50'
                  : otp[i]
                  ? 'border-[#DF6951] shadow-xs'
                  : 'border-[#212832]/10 hover:border-[#DF6951]/50 focus:border-[#DF6951]'
                }
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-semibold mb-4 animate-fade-in">{error}</p>
        )}

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || otp.join('').length !== OTP_LENGTH}
          className="w-full h-12 bg-[#DF6951] hover:bg-[#c9523b] text-white font-bold rounded-2xl shadow-lg shadow-[#DF6951]/30 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50 mb-6"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            <span>Verify &amp; Continue</span>
          )}
        </button>

        <div className="text-center text-xs text-[#5E6282] space-y-2">
          <p>Didn&apos;t receive a code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="text-[#DF6951] font-bold hover:underline cursor-pointer disabled:opacity-50"
          >
            {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        <p className="mt-8 text-[11px] text-[#5E6282]/80">
          Code expires in 10 minutes. Check your spam folder if not received.
        </p>
      </div>
    </div>
  );
}
