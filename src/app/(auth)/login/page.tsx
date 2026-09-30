'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, LogIn, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, GraduationCap, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to login');

      // Set the HTTP-only cookie equivalent
      document.cookie = `notegen_session=${result.session.access_token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;

      toast.success('Welcome back to NoteGen!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      toast.error('Login Failed', { description: message });
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
        {/* Left: Jadoo Form */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-sm animate-fade-in space-y-6">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-1.5 group mb-4">
              <span className="font-heading font-black text-2xl sm:text-3xl text-[#181E4B] tracking-tight">
                NoteGen
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-1.5 animate-pulse" />
            </Link>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
                Welcome Back
              </span>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#181E4B] tracking-tight mt-1">
                Sign in to your school
              </h1>
              <p className="text-xs sm:text-sm text-[#5E6282] mt-1.5">
                Access your teacher lesson suites, textbook scans, and exam papers.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-xs font-bold text-[#181E4B]">
                  School or Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@school.edu"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] focus:ring-[#DF6951]/20 text-xs sm:text-sm shadow-xs"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-[#181E4B]">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-xs text-[#DF6951] font-bold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] focus:ring-[#DF6951]/20 text-xs sm:text-sm shadow-xs"
                    autoComplete="current-password"
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
                className="w-full h-12 bg-[#DF6951] hover:bg-[#c9523b] text-white font-bold rounded-2xl shadow-lg shadow-[#DF6951]/30 hover:shadow-xl hover:shadow-[#DF6951]/40 transition-all duration-300 mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#5E6282]">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="text-[#DF6951] font-bold hover:underline">
                Create School Account
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Jadoo Warm Peach Info Panel */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#FFF1DA] via-[#FDE8D3]/50 to-[#FFFDFB] items-center justify-center p-12 border-l border-[#212832]/5 relative text-left">
          {/* Decorative Floating Plane */}
          <div className="absolute top-8 right-8 w-11 h-11 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[#DF6951] -rotate-12">
            <Send className="w-5 h-5 fill-[#DF6951]/10" />
          </div>

          <div className="relative z-10 max-w-sm space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#DF6951] text-white flex items-center justify-center shadow-lg shadow-[#DF6951]/30">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DF6951]">
                Academic Suite 2.0
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] leading-tight mt-1">
                Standardize curriculum delivery across every classroom
              </h2>
              <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-2">
                Generate consistent teaching plans, compulsory student notes, and board assessment blueprints aligned with NEP 2020.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-semibold text-[#181E4B]">
              {[
                'Physical Textbook Camera OCR',
                '7 Unified Core Lesson Modules',
                'Verified Page Grounding & Citations',
                'CBSE & ICSE Print-Ready Question Papers',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#212832]/5 shadow-sm">
              <p className="text-xs text-[#5E6282] italic">
                "Saving 4 hours per chapter while providing students verified board notes is a complete game changer."
              </p>
              <div className="mt-2 text-[11px] font-bold text-[#181E4B]">
                Dr. Albert Sharma • Senior PGT Faculty
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
