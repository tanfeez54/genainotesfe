'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Zap,
  Shield,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Brain,
  FileText,
  Download,
} from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Any Topic, Instantly',
    description: 'Paste any syllabus, textbook extract, or topic list. Works on any subject.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    icon: Brain,
    title: 'AI-Powered Question Generation',
    description: 'Gemini 1.5 Pro creates MCQs, short, and long answer questions tailored to your level.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
  },
  {
    icon: FileText,
    title: 'Edit & Perfect',
    description: 'Edit papers inline, organize by subject, print directly in professional A4 format.',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
  },
  {
    icon: Zap,
    title: 'Multiple Subjects',
    description: 'Math, Science, History, or Literature — generates context-aware questions.',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your test papers are private by default. Row-level security ensures only you can access your data.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/40',
  },
  {
    icon: Download,
    title: 'Print & PDF Ready',
    description: 'Print directly with perfect page breaks or export as PDF — take them anywhere.',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
];

const steps = [
  {
    step: '01',
    title: 'Provide Topics',
    description: 'Enter the subjects, topics, or paste a syllabus to base the exam on.',
  },
  {
    step: '02',
    title: 'Choose Settings',
    description: 'Select difficulty level, total marks, and paper structure (MCQs, Short answers, etc).',
  },
  {
    step: '03',
    title: 'Get Exam Paper',
    description: 'AI generates an organized, printable exam paper in seconds. Edit and print it directly.',
  },
];

const plans = [
  'Multiple Choice Questions',
  'Short & Long Answers',
  'Match the Following',
  'True/False',
  'Auto-Formatting for Print',
  'Subject-Specific Focus',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-brand-text">ExamPrep AI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-chart-2/8 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="animate-fade-in">
            <Badge className="mb-6 px-3 py-1 text-sm font-medium border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Powered by Gemini 1.5 Pro
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Turn any curriculum into{' '}
              <span className="gradient-brand-text">perfect exam papers</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload a syllabus or topics. Our AI reads it, structures it, and generates professional, ready-to-print examination papers in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="gradient-brand text-white hover:opacity-90 transition-all shadow-lg hover:shadow-primary/30 hover:shadow-xl px-8 h-12 text-base font-semibold"
                >
                  Start for Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  See how it works
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['No credit card required', 'Free to start', 'Powered by Gemini AI'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero preview card */}
          <div className="mt-16 animate-fade-in delay-200">
            <div className="relative mx-auto max-w-3xl rounded-2xl border border-border shadow-2xl bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 ml-4 h-6 rounded-md bg-background border border-border px-3 text-xs text-muted-foreground flex items-center">
                  examprep.ai/generate-paper
                </div>
              </div>
              <div className="p-6 text-left">
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 h-10 rounded-lg bg-muted/60 border border-border flex items-center px-3">
                    <span className="text-sm text-muted-foreground">Class 10 Science - Periodic Classification</span>
                  </div>
                  <div className="w-24 h-10 rounded-lg gradient-brand flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Generate</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['Final Exam', 'Hard', '50 Marks'].map((v) => (
                    <div key={v} className="h-8 rounded-md bg-muted/60 border border-border flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {['Section A: Multiple Choice', 'Section B: Short Answer', 'Section C: Long Answer'].map((s, i) => (
                    <div key={s} className={`h-12 rounded-lg border border-border p-3 flex items-center gap-3 animate-fade-in`} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">How it works</Badge>
            <h2 className="text-4xl font-bold text-foreground">
              Prepare papers smarter in 3 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className={`relative p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-lg group animate-fade-in`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="text-6xl font-black gradient-brand-text mb-4 opacity-30 group-hover:opacity-50 transition-opacity">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-5 top-1/2 -translate-y-1/2 hidden md:block text-border w-10 h-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Features</Badge>
            <h2 className="text-4xl font-bold text-foreground">
              Everything you need to create exams
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Included in every paper</Badge>
          <h2 className="text-4xl font-bold text-foreground mb-12">
            Rich, structured exams — every time
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{plan}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to prepare exams faster?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of teachers using ExamPrep AI to turn any syllabus into perfect exam papers.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="gradient-brand text-white hover:opacity-90 transition-all shadow-lg hover:shadow-primary/30 hover:shadow-xl px-10 h-14 text-lg font-semibold"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">ExamPrep AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExamPrep AI. Built with Gemini 1.5 Pro.
          </p>
        </div>
      </footer>
    </div>
  );
}
