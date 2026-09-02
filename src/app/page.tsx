'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Brain,
  FileText,
  Download,
  CheckSquare,
  ListOrdered,
  LayoutTemplate
} from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Any Subject, Any Topic',
    description: 'Paste any curriculum, textbook extract, or topic list. Works seamlessly across all educational subjects.',
  },
  {
    icon: Brain,
    title: 'Intelligent Generation',
    description: 'Automatically creates well-structured examination papers tailored to your specified difficulty level and total marks.',
  },
  {
    icon: FileText,
    title: 'Edit & Perfect',
    description: 'Edit generated questions inline, organize by section, and make adjustments directly in the browser.',
  },
  {
    icon: CheckSquare,
    title: 'Diverse Question Types',
    description: 'Supports Multiple Choice (MCQs), Short & Long Answers, True/False, and Match the Following.',
  },
  {
    icon: LayoutTemplate,
    title: 'Professional Layout',
    description: 'Generated papers are automatically formatted with proper sections, headings, and marking schemes.',
  },
  {
    icon: Download,
    title: 'Print & PDF Export',
    description: 'Print directly with precise page breaks and A4 formatting, or export as a clean PDF document.',
  }
];

const steps = [
  {
    step: '01',
    title: 'Input Curriculum',
    description: 'Provide the topics, syllabus, or paste text to base the examination on.',
  },
  {
    step: '02',
    title: 'Configure Exam',
    description: 'Select difficulty, total marks, and the desired mix of question types.',
  },
  {
    step: '03',
    title: 'Generate & Print',
    description: 'Review the generated paper, make inline edits, and print or export to PDF.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground tracking-tight">ExamPrep AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-5 h-9 font-medium shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden bg-muted/30">
        <div className="absolute inset-0 grid-bg opacity-40"></div>
        
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <div className="animate-fade-in">
            <Badge variant="outline" className="mb-6 px-3 py-1 text-xs font-semibold rounded-full border-border bg-background text-muted-foreground">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Enterprise-Grade Assessment Platform
            </Badge>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-foreground mb-6 leading-tight tracking-tight">
              Professional examination papers <br className="hidden sm:block" />
              <span className="text-primary">generated in seconds.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform any curriculum into highly structured, ready-to-print assessments. Support for MCQs, short answers, long answers, and automated formatting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:opacity-90 shadow-sm rounded-md px-8 h-12 text-base font-medium transition-all group"
                >
                  Start Creating
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-md bg-background hover:bg-muted">
                  View Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="mt-16 sm:mt-24 animate-fade-in delay-200">
            <div className="relative mx-auto max-w-4xl rounded-xl border border-border shadow-2xl overflow-hidden bg-background">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <div className="flex-1 ml-4 h-6 rounded-md bg-background border border-border/50 px-3 text-[11px] text-muted-foreground flex items-center justify-center font-medium max-w-sm mx-auto">
                  examprep.ai/workspace
                </div>
              </div>
              <div className="p-8 text-left bg-background">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 h-10 rounded-md bg-muted/50 border border-border flex items-center px-4">
                    <span className="text-sm font-medium text-foreground">Subject: Computer Science - Data Structures</span>
                  </div>
                  <div className="w-full sm:w-32 h-10 rounded-md bg-primary flex items-center justify-center shadow-sm">
                    <span className="text-primary-foreground text-sm font-medium">Generate</span>
                  </div>
                </div>
                
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b border-border flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Generated Paper Preview</span>
                    <Badge variant="secondary" className="text-xs">50 Marks</Badge>
                  </div>
                  <div className="p-6 space-y-6 bg-background">
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Section A: Multiple Choice Questions (10 Marks)</h4>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">1. Which data structure uses LIFO?</div>
                        <div className="text-sm text-muted-foreground pl-4 text-xs">A) Queue &nbsp; B) Stack &nbsp; C) Tree &nbsp; D) Graph</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">Section B: Short Answer Questions (20 Marks)</h4>
                      <div className="text-sm text-muted-foreground">1. Explain the time complexity of Binary Search.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              Streamlined Creation Process
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">From syllabus to printed paper in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className="relative p-8 rounded-xl border border-border bg-card shadow-sm group hover:border-primary/50 transition-colors"
              >
                <div className="text-4xl font-heading font-bold text-muted-foreground/20 mb-4 group-hover:text-primary/20 transition-colors">
                  {step.step}
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              Comprehensive Feature Set
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage, generate, and distribute professional examination papers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background text-center border-b border-border">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl sm:text-5xl font-heading font-bold text-foreground mb-6">
            Ready to upgrade your assessments?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join educational institutions worldwide using ExamPrep AI to standardize and accelerate their examination process.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-10 h-12 text-base font-medium transition-all shadow-sm"
            >
              Start Creating Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-heading font-bold text-foreground">ExamPrep AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExamPrep AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
