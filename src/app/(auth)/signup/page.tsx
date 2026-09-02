'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, User, Phone, Loader2, ArrowRight, LayoutTemplate } from 'lucide-react';
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
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
        {/* Left: Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-card">
          <div className="w-full max-w-sm animate-fade-in">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">ExamPrep AI</span>
            </Link>

            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Request Access</h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Create an enterprise account to generate smart exam papers.
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
                    className="pl-10 h-11 bg-background"
                    autoComplete="name"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-destructive font-medium">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.edu"
                    className="pl-10 h-11 bg-background"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="pl-10 h-11 bg-background"
                    autoComplete="tel"
                    {...register('mobile')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-md mt-4"
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
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="hidden lg:flex flex-1 bg-muted/40 items-center justify-center p-12 border-l border-border relative">
          <div className="absolute inset-0 dotted-bg opacity-50"></div>
          
          <div className="relative z-10 text-center max-w-sm">
            <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center mx-auto mb-8 shadow-sm">
              <LayoutTemplate className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Standardize Assessments</h2>
            <p className="text-muted-foreground leading-relaxed text-sm mb-8">
              Generate consistent, high-quality examination papers aligned with your institutional standards.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm font-medium">
              {['Auto-Formatting', 'Syllabus Alignment', 'Secure Storage', 'Print Ready'].map((f) => (
                <div key={f} className="bg-background rounded-md px-3 py-2 border border-border text-foreground">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}