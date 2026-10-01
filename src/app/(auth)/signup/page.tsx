'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, User, Phone, Loader2, ArrowRight, CheckCircle2, Send, GraduationCap, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid school email address'),
  mobile: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
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
      const { deviceId, fingerprint } = await getDeviceFingerprint();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
          'x-device-fingerprint': fingerprint,
        },
        body: JSON.stringify({
          ...data,
          device_id: deviceId,
          device_fingerprint: fingerprint,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to sign up');

      sessionStorage.setItem('otpEmail', data.email);

      toast.success('Check your email inbox!', {
        description: `We sent a 6-digit verification code to ${data.email}`,
      });

      router.push('/verify');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup Failed';
      toast.error('Something went wrong', { description: message });
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
        {/* Left: Jadoo Signup Form */}
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
                Get Started Free
              </span>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#181E4B] tracking-tight mt-1">
                Create School Account
              </h1>
              <p className="text-xs sm:text-sm text-[#5E6282] mt-1.5">
                Join 1,200+ educators generating 7-Core lesson suites and exam papers.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="full_name" className="text-xs font-bold text-[#181E4B]">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Prof. Sharma"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] focus:ring-[#DF6951]/20 text-xs sm:text-sm shadow-xs"
                    autoComplete="name"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-xs font-bold text-[#181E4B]">
                  School or Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="sharma@school.edu"
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
                <Label htmlFor="mobile" className="text-xs font-bold text-[#181E4B]">
                  Phone Number <span className="text-[#5E6282] font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6282]" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-11 h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] focus:ring-[#DF6951]/20 text-xs sm:text-sm shadow-xs"
                    autoComplete="tel"
                    {...register('mobile')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#DF6951] hover:bg-[#c9523b] text-white font-bold rounded-2xl shadow-lg shadow-[#DF6951]/30 hover:shadow-xl hover:shadow-[#DF6951]/40 transition-all duration-300 mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#5E6282]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#DF6951] font-bold hover:underline">
                Sign in here
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
            <div className="w-14 h-14 rounded-2xl bg-[#F1A501] text-white flex items-center justify-center shadow-lg shadow-[#F1A501]/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DF6951]">
                Zero Recurring Subscriptions
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181E4B] leading-tight mt-1">
                One-time lifetime membership for your school
              </h2>
              <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-2">
                Unlock your complete institutional workspace with bundled generation credits included. No recurring monthly surprises.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-semibold text-[#181E4B]">
              {[
                'Bundled AI Generation Credits Included',
                'CBSE, ICSE & State Board Standards',
                'Print-Ready A4 Exams with School Branding',
                'Dedicated Support & Instant Activation',
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
                <span>350+ Educational Institutions Across India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}