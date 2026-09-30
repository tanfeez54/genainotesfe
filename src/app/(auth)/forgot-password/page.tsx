'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Please enter a valid school email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send reset code');

      toast.success(result.message || 'Reset code sent to your email!');
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to send reset code', { description: message });
    } finally {
      setIsLoading(false);
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

        <div className="w-14 h-14 rounded-2xl bg-[#F1A501]/10 text-[#F1A501] mx-auto flex items-center justify-center mb-4">
          <Mail className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
          Account Recovery
        </span>
        <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] mt-1">
          Reset Password
        </h1>
        <p className="text-xs text-[#5E6282] mt-2 leading-relaxed">
          Enter your registered school email address and we'll send you a verification code to reset your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-6 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-[#181E4B]">
              School Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm shadow-xs"
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>
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
                <span>Sending code...</span>
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
