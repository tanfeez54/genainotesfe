'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, User, Phone, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to sign up');

      // Store email in sessionStorage for verify page
      sessionStorage.setItem('otpEmail', data.email);

      toast.success('Check your inbox!', {
        description: `We sent a 6-digit code to ${data.email}`,
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
    <div className="min-h-screen bg-background flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md group-hover:shadow-primary/30 transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-brand-text">ExamPrep AI</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create an account</h1>
          <p className="text-muted-foreground mb-8">
            Join us to start generating smart AI notes instantly.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10 h-11"
                  autoComplete="name"
                  {...register('full_name')}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium">
                Mobile Number <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="pl-10 h-11"
                  autoComplete="tel"
                  {...register('mobile')}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gradient-brand text-white hover:opacity-90 transition-opacity font-semibold shadow-md mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Brand panel */}
      <div className="hidden lg:flex flex-1 gradient-brand items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative text-white text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Study smarter, not harder</h2>
          <p className="text-white/80 leading-relaxed">
            Turn any URL into structured, editable study notes using Gemini AI. 
            Perfect for exams, revisions, and deep learning.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {['AI-Powered Notes', 'Any Language', 'Edit Inline', 'Export Anywhere'].map((f) => (
              <div key={f} className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}