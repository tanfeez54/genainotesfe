'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  BookOpen,
  Camera,
  Eye,
  Sparkles,
  Calendar,
  Edit3,
  FileCheck,
  History,
  HelpCircle,
  Award,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Wallet,
  CreditCard,
  Gift,
  ArrowRight,
  Printer,
  Scale,
  Check,
  Flame,
  FileText,
  LayoutTemplate,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Menu,
  X,
  Star,
  Quote,
  Clock,
  SlidersHorizontal,
  Layers,
  CheckCheck,
} from 'lucide-react';

export default function LandingPage() {
  const [activeHeroTab, setActiveHeroTab] = useState<'suite' | 'ocr' | 'exam'>('suite');
  const [activeSuiteModule, setActiveSuiteModule] = useState<number>(1);
  const [activeExamView, setActiveExamView] = useState<'paper' | 'solutions'>('paper');
  const [ocrZoomLevel, setOcrZoomLevel] = useState<number>(100);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopySnippet = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] -right-40 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[130px]" />
        <div className="absolute top-[60%] left-1/3 w-[650px] h-[650px] bg-emerald-500/6 rounded-full blur-[150px]" />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR (FROSTED GLASS & MODERN DROPDOWN)                  */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                <GraduationCap className="w-5 h-5 transition-transform group-hover:rotate-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-heading font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                    NoteGen Academic
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/25 text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
                    PRO 2.0
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                  NEP 2020 Aligned Teacher Lesson Suite
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
              {/* Features Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setIsFeaturesOpen(true)}
                onMouseLeave={() => setIsFeaturesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    isFeaturesOpen ? 'text-primary bg-primary/5 font-bold' : 'hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>Features Suite</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>

                {/* Dropdown Panel with Glassmorphism */}
                {isFeaturesOpen && (
                  <div className="absolute top-full left-0 w-96 p-3 bg-card/95 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-2xl space-y-1.5 animate-fade-in z-50">
                    <a
                      href="#suite"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-xl hover:bg-muted/80 flex items-start gap-3.5 transition-all group cursor-pointer border border-transparent hover:border-border/60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <span>7-Core Lesson Suite</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-black">Flagship</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                          Teaching plans, lecture analogies, compulsory notes, homework, PYQ &amp; test blueprints.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#ocr-scanner"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-xl hover:bg-muted/80 flex items-start gap-3.5 transition-all group cursor-pointer border border-transparent hover:border-border/60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                          <span>Physical Textbook Scanner</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black">AI OCR</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                          Camera &amp; file upload scanner with isolated syllabus repository.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#doc-viewer"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-xl hover:bg-muted/80 flex items-start gap-3.5 transition-all group cursor-pointer border border-transparent hover:border-border/60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">
                          Document &amp; AI OCR Viewer
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                          High-res zoom &amp; pan controls, educational summaries &amp; verbatim transcription.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#exam-builder"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-xl hover:bg-muted/80 flex items-start gap-3.5 transition-all group cursor-pointer border border-transparent hover:border-border/60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                          Question Paper &amp; Blueprint Engine
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                          CBSE &amp; State Board exam papers with LaTeX formulas &amp; A4 print formatting.
                        </p>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <a href="#workflow" className="hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50">
                How It Works
              </a>

              <a href="#pricing" className="hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50 flex items-center gap-1.5">
                <span className="font-bold text-foreground">Pricing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Lifetime
                </span>
              </a>

              <a href="#comparison" className="hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50">
                Comparison
              </a>

              <a href="#faq" className="hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50">
                FAQ
              </a>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3.5">
              <Link
                href="/login"
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold rounded-xl px-5 h-10 text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <Link href="/dashboard">
                <Button size="sm" className="gradient-brand text-white rounded-xl text-xs px-3 h-9">
                  Launch
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-2xl px-4 py-5 space-y-4 animate-fade-in shadow-2xl">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <a
                href="#suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-muted/60 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>7-Core Suite</span>
              </a>
              <a
                href="#ocr-scanner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-muted/60 flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Textbook OCR</span>
              </a>
              <a
                href="#doc-viewer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-muted/60 flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Doc Viewer</span>
              </a>
              <a
                href="#exam-builder"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-muted/60 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Exam Engine</span>
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Pricing Plans</span>
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-muted/60 flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>FAQ</span>
              </a>
            </div>

            <div className="pt-2 border-t border-border flex flex-col gap-2.5">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full h-11 text-xs font-bold rounded-xl border-border">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full h-11 text-xs font-bold rounded-xl gradient-brand text-white shadow-md">
                  Launch Academic Workspace
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (ULTRA POLISHED WITH INTERACTIVE LIVE ENGINE PREVIEW)     */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 sm:pt-44 sm:pb-32 overflow-hidden">
        {/* Subtle geometric background grid */}
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs font-bold text-primary mb-8 animate-fade-in shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>NEP 2020 &amp; CBSE Aligned Academic Suite</span>
            <span className="text-primary/40">•</span>
            <span className="text-foreground/80 font-medium">Textbook OCR + 7-Core Lesson Modules</span>
            <ChevronRight className="w-3.5 h-3.5 text-primary/70" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black text-foreground mb-6 leading-[1.08] tracking-tight">
            Transform Scanned Textbooks into <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-primary">
              Complete 7-Core Teacher Lesson Suites.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Scan physical textbook pages with camera OCR, ground curriculum notes with verified page citations, and instantly generate teaching plans, compulsory notebook notes, homework sets, PYQ trends, and print-ready board exam papers.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-16">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gradient-brand text-white hover:opacity-95 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 rounded-2xl px-8 h-13 text-sm font-bold transition-all duration-300 group cursor-pointer gap-2.5"
              >
                <span>Launch Lesson Workspace Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <a href="#suite">
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-7 text-sm font-bold rounded-2xl bg-card/80 backdrop-blur-md hover:bg-muted/80 border-border/80 cursor-pointer gap-2 transition-all"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Explore 7-Core Modules</span>
              </Button>
            </a>

            <a href="#pricing">
              <Button
                variant="ghost"
                size="lg"
                className="h-13 px-6 text-sm font-bold text-foreground hover:bg-muted/60 rounded-2xl cursor-pointer gap-2"
              >
                <TagIcon className="w-4 h-4 text-emerald-600" />
                <span>Lifetime Plans (₹500 / ₹1,000)</span>
              </Button>
            </a>
          </div>

          {/* Social Proof Mini Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-14 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                    ★
                  </div>
                ))}
              </div>
              <span className="text-foreground font-bold">4.9 / 5.0</span> Rating by 1,200+ Teachers
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Hallucination Guaranteed (Source Citations)</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Official CBSE &amp; ICSE Taxonomy</span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* INTERACTIVE HERO PRODUCT SHOWCASE MOCKUP                               */}
          {/* ======================================================================= */}
          <div className="relative mx-auto max-w-5xl rounded-3xl border border-border/90 shadow-2xl overflow-hidden bg-card/90 backdrop-blur-xl text-left animate-fade-in group">
            {/* Window Glow Ring Accent */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 via-transparent to-transparent pointer-events-none opacity-50" />

            {/* Window Topbar with Interactive Switcher */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/60 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-2 ml-2 bg-background/80 px-3 py-1 rounded-lg border border-border text-[11px] font-mono text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>notegen.ai/workspace/class-10-science-chapter-1</span>
                </div>
              </div>

              {/* 3 Showcase Tabs */}
              <div className="flex items-center gap-1 bg-background/90 p-1 rounded-xl border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('suite')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeHeroTab === 'suite'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>7-Core Lesson Suite</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab('ocr')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeHeroTab === 'ocr'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Textbook OCR &amp; Viewer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab('exam')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeHeroTab === 'exam'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Board Exam Paper</span>
                </button>
              </div>
            </div>

            {/* Showcase Tab 1: 7-Core Lesson Suite (Fully Interactive!) */}
            {activeHeroTab === 'suite' && (
              <div className="p-6 sm:p-8 space-y-6 bg-card">
                {/* Header Context */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">Class 10 • Science</Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Grounded in 3 Scanned Pages
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mt-1.5">Chemical Reactions and Equations</h3>
                    <p className="text-xs text-muted-foreground">CBSE (NCERT Aligned) • 7 Recommended Classroom Periods</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Interactive Module Switcher:</span>
                    <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                      Module {activeSuiteModule} of 7 Active
                    </Badge>
                  </div>
                </div>

                {/* Module Pill Preview Bar - INTERACTIVE SWITCHER */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px] font-bold">
                  {[
                    { id: 1, name: '1. Teaching Plan' },
                    { id: 2, name: '2. Teaching Guide' },
                    { id: 3, name: '3. Mandatory Notes' },
                    { id: 4, name: '4. CW + HW Sets' },
                    { id: 5, name: '5. PYQ Analysis' },
                    { id: 6, name: '6. Quick Check' },
                    { id: 7, name: '7. Revision & Test' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveSuiteModule(m.id)}
                      className={`p-2.5 rounded-xl text-center transition-all cursor-pointer ${
                        activeSuiteModule === m.id
                          ? 'bg-primary text-white shadow-xs font-bold scale-[1.02]'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                {/* Dynamic Content Preview Based on Selected Module */}
                {activeSuiteModule === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> Period 1: Characteristics of Reactions
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">45 Mins</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Observations indicating a chemical reaction: gas evolution, temperature shifts (exothermic vs endothermic), and color change.
                      </p>
                      <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Activity 1.1:</strong> Burning of magnesium ribbon with dazzling white flame producing MgO powder.
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Period 2: Balancing Chemical Equations
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">45 Mins</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Step-by-step Law of Conservation of Mass proof. Number of atoms of each element must balance on LHS and RHS.
                      </p>
                      <div className="p-2.5 rounded-xl bg-card border border-border font-mono text-[11px] text-foreground font-semibold">
                        3Fe(s) + 4H2O(g) → Fe3O4(s) + 4H2(g)
                      </div>
                    </div>
                  </div>
                )}

                {activeSuiteModule === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Classroom Analogy for Quick Recall
                        </span>
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30">Pedagogy</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">Double Displacement like a Dance Partner Swap</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Explain: "Imagine two dance couples AB and CD. During the music, partner A pairs with D, and partner C pairs with B. The ions simply trade partners to form BaSO4 precipitate!"
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" /> Common Student Mistake Trap
                        </span>
                        <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-500/30">Warning</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">Changing Subscripts Instead of Coefficients</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Students often write H2 + O2 → H2O2 to balance oxygen! <strong>Teacher Remediation:</strong> Emphasize that chemical formulas represent identity. We can ONLY change front coefficients.
                      </p>
                    </div>
                  </div>
                )}

                {activeSuiteModule === 3 && (
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Mandatory Notebook Definition [Grounded: Page 1]
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySnippet("Chemical Reaction: A process in which one or more substances, the reactants, are transformed into one or more different substances, the products.")}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSnippet ? 'Copied!' : 'Copy to Clipboard'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-foreground/90 italic border-l-2 border-primary pl-3 py-1">
                      "A process in which one or more substances, the reactants, are transformed into one or more different substances, the products, via chemical bond rearrangement."
                    </p>
                    <div className="p-3 rounded-xl bg-card border border-border font-mono text-[11px] text-foreground font-bold">
                      CaO(s) [Quicklime] + H2O(l) → Ca(OH)2(aq) [Slaked Lime] + Heat (Exothermic)
                    </div>
                  </div>
                )}

                {activeSuiteModule > 3 && (
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Module {activeSuiteModule} Assessment &amp; Exercises
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Print-Ready</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Complete pedagogical materials are ready for classroom distribution: 3-tiered homework assignments (Basic, Standard, HOTS), 10-year previous board examination questions with frequency metrics, and rapid 5-minute pre-test cheat sheets.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Showcase Tab 2: Textbook OCR & Document Viewer */}
            {activeHeroTab === 'ocr' && (
              <div className="p-6 sm:p-8 space-y-6 bg-card animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">High-Resolution Physical Textbook Scanner</h3>
                      <p className="text-xs text-muted-foreground">Class 10 Science • Chapter 1 • Page 1 of 3</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                      99.8% OCR Precision
                    </Badge>
                  </div>
                </div>

                {/* 2-Column Split Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Scanned Document Preview with Interactive Zoom Controls */}
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Physical Textbook Camera Capture
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOcrZoomLevel(Math.max(50, ocrZoomLevel - 25))}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 py-0.5 rounded bg-card border border-border text-[10px] font-mono font-bold">
                          {ocrZoomLevel}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setOcrZoomLevel(Math.min(200, ocrZoomLevel + 25))}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOcrZoomLevel(100)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Reset"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Simulated High-Res Page Box with Laser Scan Effect */}
                    <div className="relative py-10 px-4 text-center border-2 border-dashed border-border/80 rounded-xl my-4 bg-card/80 overflow-hidden">
                      {/* Laser scan animation line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse top-1/2 shadow-xs shadow-emerald-500" />
                      
                      <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-80" />
                      <span className="text-xs font-bold text-foreground block">NCERT Class 10 Science - Page 1</span>
                      <span className="text-[11px] text-muted-foreground">High-resolution physical photograph stored securely</span>
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCheck className="w-3 h-3" /> Verbatim OCR Verified
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>chapter_1_p1.jpg (2.4 MB)</span>
                      <span className="text-emerald-600 font-bold">Isolated Syllabus Storage ✓</span>
                    </div>
                  </div>

                  {/* Right: AI Summary & Verbatim Extraction */}
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3">
                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Educational Page Summary:
                      </span>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        Covers basic definitions of chemical equations, experimental activities with magnesium ribbon burning in air, and formation of white magnesium oxide powder.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Extracted Key Concepts:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">Magnesium Ribbon Experiment</Badge>
                        <Badge variant="secondary" className="text-[10px]">Dazzling White Flame</Badge>
                        <Badge variant="secondary" className="text-[10px]">Magnesium Oxide Powder</Badge>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border font-mono text-[11px] text-muted-foreground max-h-24 overflow-hidden">
                      "Activity 1.1: Clean a magnesium ribbon about 3-4 cm long by rubbing it with sandpaper. Hold it with a pair of tongs. Burn it using a spirit lamp or burner..."
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Showcase Tab 3: Board Exam Paper Builder */}
            {activeHeroTab === 'exam' && (
              <div className="p-6 sm:p-8 space-y-5 bg-card animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">CBSE Board Standard Question Paper</h3>
                    <p className="text-xs text-muted-foreground">Time: 2 Hours • Max Marks: 50 • Aligned with Bloom's Taxonomy</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveExamView('paper')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeExamView === 'paper' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Question Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveExamView('solutions')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeExamView === 'solutions' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Marking Scheme &amp; Answers
                    </button>
                  </div>
                </div>

                {activeExamView === 'paper' ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Section A: Objective &amp; MCQs (1 Mark each)</span>
                        <span className="text-[10px] font-bold text-muted-foreground">Q1 of 10</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Which of the following represents a balanced chemical reaction for the slaking of lime?
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pl-2 pt-1 font-mono">
                        <span>(a) CaO + H2O → Ca(OH)2</span>
                        <span>(b) CaCO3 → CaO + CO2</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Section B: Short Answer Type (3 Marks each)</span>
                        <span className="text-[10px] font-bold text-muted-foreground">Q11 of 15</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        A shiny brown coloured element 'X' on heating in air becomes black in colour. Name element 'X' and the black compound formed. Write the balanced chemical reaction.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Answer Key &amp; Step-by-Step Marking Scheme</span>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Verified</Badge>
                      </div>
                      <p className="text-xs text-foreground font-semibold">Q1 Correct Option: (a) CaO + H2O → Ca(OH)2 [1 Mark]</p>
                      <p className="text-xs text-muted-foreground">
                        Q11: Element 'X' is Copper (Cu) [1 Mark]. Black compound formed is Copper(II) Oxide (CuO) [1 Mark]. Balanced Equation: 2Cu + O2 → 2CuO [1 Mark].
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. KEY METRICS & TRUST STATS STRIP                                        */}
      {/* ========================================================================= */}
      <section className="py-14 border-y border-border/80 bg-muted/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-card/60 border border-border/60 space-y-1.5">
              <div className="text-3xl sm:text-4xl font-heading font-black text-primary">7 Core</div>
              <p className="text-xs sm:text-sm font-bold text-foreground">Unified Lesson Modules</p>
              <p className="text-[11px] text-muted-foreground">Plans, notes, HW &amp; exams in 1 place</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border/60 space-y-1.5">
              <div className="text-3xl sm:text-4xl font-heading font-black text-emerald-600">99.8%</div>
              <p className="text-xs sm:text-sm font-bold text-foreground">OCR Precision</p>
              <p className="text-[11px] text-muted-foreground">Accurate formulas, diagrams &amp; Hindi</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border/60 space-y-1.5">
              <div className="text-3xl sm:text-4xl font-heading font-black text-indigo-600">CBSE / ICSE</div>
              <p className="text-xs sm:text-sm font-bold text-foreground">State Boards &amp; NEP 2020</p>
              <p className="text-[11px] text-muted-foreground">Bloom's Taxonomy competency tests</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border/60 space-y-1.5">
              <div className="text-3xl sm:text-4xl font-heading font-black text-foreground">4+ Hours</div>
              <p className="text-xs sm:text-sm font-bold text-foreground">Saved Per Chapter</p>
              <p className="text-[11px] text-muted-foreground">Instant classroom-ready delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE 7-CORE TEACHER LESSON SUITE (FLAGSHIP FEATURE SHOWCASE)            */}
      {/* ========================================================================= */}
      <section id="suite" className="py-20 sm:py-32 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3.5 py-1">
              The 7 Core Pillars of Modern Teaching
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight">
              Everything a Teacher Needs for a Chapter in One Unified Suite.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              No generic bullet points. NoteGen produces classroom-tested pedagogy, exact student notes, homework tiers, diagnostic assessments, and formal revision blueprints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-500/30 mb-1.5">
                    Module 1
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">🗓️ Chapter Teaching Plan</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Kab kya padhana hai:</strong> Period-by-period delivery breakdown with recommended classroom hours, pedagogical sequence rationale, duration, and prerequisite checks.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pacing &amp; Period Breakdown
                </div>
              </CardContent>
            </Card>

            {/* Module 2 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-500/30 mb-1.5">
                    Module 2
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">📖 Topic-wise Teaching Guide</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Kya padhana hai aur kaise samjhana hai:</strong> Concrete classroom delivery tips, memorable real-life analogies, and a table of Common Student Mistakes vs Teacher Corrections.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Analogies &amp; Mistake Traps
                </div>
              </CardContent>
            </Card>

            {/* Module 3 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 mb-1.5">
                    Module 3
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">✍️ Mandatory Classroom Notes</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Kya notebook me compulsory likhwana hai:</strong> Board-approved exact definitions with citations, SI units, formula derivation steps, and compulsory diagram label checklists.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> One-Click "Copy All Notes"
                </div>
              </CardContent>
            </Card>

            {/* Module 4 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30 mb-1.5">
                    Module 4
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">📝 Classwork + Homework Sets</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Lecture ke baad kya practice karani hai:</strong> Immediate in-class questions with teacher hints, plus 3-tiered homework (Basic, Standard, and HOTS / Brain-Teasers) with guided clues.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3-Tier Graded Assignments
                </div>
              </CardContent>
            </Card>

            {/* Module 5 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-purple-600 border-purple-500/30 mb-1.5">
                    Module 5
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">📄 PYQ &amp; Legacy Board Analysis</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Previous years me kya poocha gaya:</strong> Topic priority breakdown (High Yield vs Foundational), recurring question formats, board marks trends, and examiner trap warnings.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-purple-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Examiner Traps &amp; Frequencies
                </div>
              </CardContent>
            </Card>

            {/* Module 6 */}
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-teal-600 border-teal-500/30 mb-1.5">
                    Module 6
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground">🧪 Quick Diagnostic Check</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Har topic ke baad understanding check:</strong> 3-5 quick diagnostic questions identifying student misconceptions, with dedicated teacher remediation action plans.
                </p>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-bold text-teal-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Learning Gap Identification
                </div>
              </CardContent>
            </Card>

            {/* Module 7 (Spans full width on tablet/desktop) */}
            <Card className="md:col-span-2 lg:col-span-3 rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-primary/[0.04] to-card shadow-lg hover:border-primary/60 transition-all duration-300">
              <CardContent className="p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
                        Module 7
                      </Badge>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">🔄 Revision + Test Plan &amp; Blueprint</h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <strong>Chapter revision kab aur kaise karni hai:</strong> Multi-phase revision schedule, Top 10 Must-Solve Board Examination Questions with marks weightage, a formal chapter test blueprint, and a Rapid 5-Minute Pre-Exam Cheat Sheet.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard">
                    <Button className="gradient-brand text-white text-xs font-bold rounded-2xl px-6 h-12 cursor-pointer shadow-md shadow-primary/20 gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Complete Suite</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PHYSICAL TEXTBOOK SCANNER & DOCUMENT VIEWER SECTION                   */}
      {/* ========================================================================= */}
      <section id="ocr-scanner" className="py-20 sm:py-32 bg-muted/30 border-y border-border/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Camera &amp; Upload Physical Scanner</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight leading-tight">
                Physical Textbook OCR &amp; High-Resolution Document Viewer.
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Take a quick camera photo or upload textbook images. The AI extracts verbatim text, produces an educational summary of each page, and saves everything cleanly to your chapter's syllabus repository.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Isolated Syllabus Storage</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Scanned textbook pages are kept strictly separated from Question Papers. Scan and save multiple pages without premature generation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Two-Column Interactive Document Viewer</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">View the original high-res image with zoom controls (50% to 300%) side-by-side with verbatim OCR transcription, page summary, and key topics.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Grounded Citations in Lesson Notes</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Every generated formula, definition, and topic is grounded directly with verifiable citations like [Source: Scanned Page 1].</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/dashboard">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-7 h-12 text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer gap-2">
                    <Camera className="w-4 h-4" />
                    <span>Try Physical Scanner in Dashboard</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Visual Card */}
            <div id="doc-viewer" className="relative p-6 sm:p-8 rounded-3xl border border-border/80 bg-card shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-foreground">Document &amp; OCR Viewer Dialog</span>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  Interactive Preview
                </Badge>
              </div>

              {/* Mini Viewer Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Visual Image Side */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Original Scanned Page</span>
                    <span className="font-mono text-emerald-600 font-bold">Zoom: 100%</span>
                  </div>
                  <div className="h-40 rounded-xl bg-card border border-border flex flex-col items-center justify-center p-3 text-center">
                    <BookOpen className="w-10 h-10 text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-foreground">Physical Textbook Page 1</span>
                    <span className="text-[10px] text-muted-foreground">Full Resolution Photo Stored</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Page 1 of 3</span>
                    <span className="text-primary font-bold">High-Res Pan &amp; Zoom</span>
                  </div>
                </div>

                {/* OCR & Summary Side */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Page Educational Summary
                    </span>
                    <p className="text-[10px] text-foreground/90 leading-tight">
                      Introduction to chemical reactions with physical signs: gas evolution, temperature changes, and precipitate formation.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Key Topics Extracted:</span>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[9px] px-2 py-0.5">Chemical Equations</Badge>
                      <Badge variant="secondary" className="text-[9px] px-2 py-0.5">Balanced Reactions</Badge>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-card border border-border font-mono text-[9px] text-muted-foreground leading-tight">
                    "When magnesium ribbon is burnt in air, it produces white powder of magnesium oxide..."
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Teachers can copy verbatim text or download .txt files with a single click.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOARD-ALIGNED QUESTION PAPER & BLUEPRINT ENGINE                       */}
      {/* ========================================================================= */}
      <section id="exam-builder" className="py-20 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-xs font-bold px-3.5 py-1">
              Examination &amp; Assessment Engine
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight">
              Create Board-Standard Question Papers in Under 60 Seconds.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Design comprehensive exam papers tailored to CBSE, ICSE, Cambridge, or State Board blueprints with automatic marking schemes and LaTeX math formulas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-xs">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Multi-Section Formatting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate Section A (MCQs), Section B (Assertion-Reason &amp; Short Qs), Section C (Long Answers), and Section D (Case-based / HOTS problems) instantly.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-xs">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">LaTeX Equations &amp; Formatting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mathematical symbols, chemical equations, fractions, and scientific notation render with crisp typographic perfection without broken fonts.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-xs">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">A4 Print &amp; PDF Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One-click print preview formatted for standard physical classroom distribution, complete with school headers, student roll number lines, and answer keys.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HOW IT WORKS (STREAMLINED 3-STEP WORKFLOW)                             */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-20 sm:py-32 bg-muted/30 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              A Streamlined, High-Productivity Workflow
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              From physical textbook pages to complete classroom lesson suites and printed tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 relative group hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shadow-xs">
                01
              </div>
              <h3 className="text-lg font-bold text-foreground">Select Class &amp; Scan Pages</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose Class, Subject, and Chapter, then scan physical textbook pages with camera or file upload. Pages are saved cleanly in the syllabus repository.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 relative group hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 font-black text-lg flex items-center justify-center shadow-xs">
                02
              </div>
              <h3 className="text-lg font-bold text-foreground">Generate 7-Core Lesson Suite</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In the Generate tab, choose your board (CBSE, ICSE, State) and teaching language (English, Hinglish). AI synthesizes the deep pedagogical plan.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 relative group hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-lg flex items-center justify-center shadow-xs">
                03
              </div>
              <h3 className="text-lg font-bold text-foreground">Teach, Copy Notes &amp; Print Tests</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect source grounding, copy mandatory notes for students with 1-click, review diagnostic gap checks, and print complete assessment papers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING SECTION (MATCHING /billing: LIFETIME MEMBERSHIP + WALLET TOPUPS) */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-32 bg-background border-b border-border/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>One-Time Payment • Pay Once • Use Forever</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight">
              One-Time Lifetime Membership
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Zero monthly or annual subscriptions. Pay a single one-time institutional fee to unlock your school tenant forever, with free starter generations included! Afterwards, generate papers on a flexible <strong>Recharge &amp; Use</strong> model @ ₹5/paper.
            </p>

            {/* Trust Badges Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Instant Activation
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Bundled Generation Credits Included
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Secure via Cashfree Payments
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" /> Zero Recurring Fees Ever
              </span>
            </div>
          </div>

          {/* 2 Lifetime Membership Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* 1. Starter Lifetime Plan Card */}
            <Card className="rounded-3xl border border-border/80 bg-card p-8 sm:p-9 flex flex-col justify-between shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starter Tier</span>
                    <Badge variant="outline" className="text-xs font-semibold bg-muted/60">Single Branch / Coaching</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-heading font-black text-foreground">₹500</span>
                    <span className="text-xs text-muted-foreground ml-2 font-medium">one-time payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Pay once for lifetime school access. Ideal for coaching centers and single-branch schools.
                  </p>
                </div>

                {/* Free Included Credit Highlight */}
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-foreground leading-snug">
                    Includes ₹600 Generation Credit (120 Papers Free • +20% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly or annual renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>120 AI Question Papers Included</strong> (₹600 balance added instantly)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom School Logo, Stamp, Signatures &amp; Watermark</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>5 Teacher Accounts</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Full PDF Export with Solutions &amp; Answer Keys</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Recharge &amp; Use @ ₹5/extra generation (Tiered bonuses up to +50%)</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/billing">
                  <Button className="w-full h-12 text-xs font-bold rounded-2xl gradient-brand text-white shadow-md hover:opacity-95 cursor-pointer">
                    Get Starter Lifetime (₹500)
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 2. Institutional Lifetime Plan Card (Recommended) */}
            <Card className="rounded-3xl border-2 border-primary bg-primary/[0.03] p-8 sm:p-9 flex flex-col justify-between shadow-2xl relative">
              <span className="absolute -top-3.5 right-8 text-xs uppercase font-black tracking-wider px-4 py-1 rounded-full gradient-brand text-white shadow-md flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current" /> Recommended • Best Value
              </span>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Institutional Tier</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">Full Campus</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-heading font-black text-foreground">₹1,000</span>
                    <span className="text-xs text-muted-foreground ml-2 font-medium">one-time payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Complete institutional lifetime suite for growing schools, junior colleges, and academy chains.
                  </p>
                </div>

                {/* Free Included Credit Highlight */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                  <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-foreground leading-snug">
                    Includes ₹1,500 Generation Credit (300 Papers Free • +50% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly or annual renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>300 AI Question Papers Included</strong> (₹1,500 balance added instantly with +50% bonus)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Unlimited Teachers</strong>, Exam Coordinators &amp; Principals</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>OCR Textbook, Notes &amp; Past Paper Question Extraction</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priority AI Queue (Instant Paper &amp; Blueprint Generation)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom Multi-Section Layouts &amp; Bilingual Question Paper Settings</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/90">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated WhatsApp &amp; Technical Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/billing">
                  <Button className="w-full h-12 text-xs font-bold rounded-2xl gradient-brand text-white shadow-xl hover:opacity-95 cursor-pointer">
                    Get Institutional Lifetime (₹1,000)
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Section: Quick Wallet Top-up Packs (₹5/generation with tiered bonus) */}
          <div className="pt-10 border-t border-border/80 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Recharge School Wallet (Tiered Bonus Credits)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Get up to <strong>+50% Extra Free Bonus Generations</strong> on larger recharges! Funds never expire. Base cost is ₹5.00/generation.
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1 self-start sm:self-auto">
                ₹5 per Paper Generation
              </Badge>
            </div>

            {/* 5 Recharge Packs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Pack 1: ₹50 */}
              <Link href="/billing" className="block group">
                <div className="rounded-2xl border border-border/80 bg-card p-5 group-hover:border-primary/60 group-hover:shadow-lg transition-all h-full flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Starter Pack</span>
                    <div className="mt-2 text-2xl font-black font-heading text-foreground">₹50</div>
                    <div className="mt-1 text-xs font-bold text-foreground">10 Generations</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">₹5.00/paper</div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/80 text-[10px] text-muted-foreground font-semibold">
                    10 Base Papers
                  </div>
                </div>
              </Link>

              {/* Pack 2: ₹100 (Popular) */}
              <Link href="/billing" className="block group">
                <div className="rounded-2xl border-2 border-primary bg-primary/[0.03] p-5 group-hover:shadow-xl transition-all h-full flex flex-col justify-between relative">
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full gradient-brand text-white">
                    ⭐ Popular
                  </span>
                  <div>
                    <span className="text-xs font-bold text-primary block">Standard Pack</span>
                    <div className="mt-2 text-2xl font-black font-heading text-foreground">₹100</div>
                    <div className="mt-1 text-xs font-bold text-foreground">22 Generations</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">₹4.55/paper</div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/80 text-[10px] text-emerald-600 font-bold">
                    +10% Bonus (2 Extra Free)
                  </div>
                </div>
              </Link>

              {/* Pack 3: ₹250 */}
              <Link href="/billing" className="block group">
                <div className="rounded-2xl border border-border/80 bg-card p-5 group-hover:border-primary/60 group-hover:shadow-lg transition-all h-full flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Classroom Pack</span>
                    <div className="mt-2 text-2xl font-black font-heading text-foreground">₹250</div>
                    <div className="mt-1 text-xs font-bold text-foreground">57 Generations</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">₹4.39/paper</div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/80 text-[10px] text-emerald-600 font-bold">
                    +15% Bonus (7 Extra Free)
                  </div>
                </div>
              </Link>

              {/* Pack 4: ₹500 (Best Value) */}
              <Link href="/billing" className="block group">
                <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/[0.03] p-5 group-hover:shadow-xl transition-all h-full flex flex-col justify-between relative">
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-emerald-600 text-white">
                    Best Value
                  </span>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Institution Pack</span>
                    <div className="mt-2 text-2xl font-black font-heading text-foreground">₹500</div>
                    <div className="mt-1 text-xs font-bold text-foreground">120 Generations</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">₹4.17/paper</div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/80 text-[10px] text-emerald-600 font-bold">
                    +20% Bonus (20 Extra Free)
                  </div>
                </div>
              </Link>

              {/* Pack 5: ₹1000 (Mega Saver) */}
              <Link href="/billing" className="block group">
                <div className="rounded-2xl border-2 border-indigo-500/50 bg-indigo-500/[0.03] p-5 group-hover:shadow-xl transition-all h-full flex flex-col justify-between relative">
                  <span className="absolute -top-2.5 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-indigo-600 text-white">
                    Mega Saver
                  </span>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Mega District</span>
                    <div className="mt-2 text-2xl font-black font-heading text-foreground">₹1,000</div>
                    <div className="mt-1 text-xs font-bold text-foreground">300 Generations</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">₹3.33/paper</div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/80 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    +50% Bonus (100 Extra Free)
                  </div>
                </div>
              </Link>
            </div>

            <div className="text-center pt-2">
              <Link href="/billing">
                <Button variant="outline" className="text-xs font-bold rounded-2xl border-border/80 px-7 h-11 gap-2 cursor-pointer hover:bg-muted">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>View &amp; Manage Wallet in Billing Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. COMPARISON: TRADITIONAL PREPARATION VS NOTEGEN ACADEMIC               */}
      {/* ========================================================================= */}
      <section id="comparison" className="py-20 sm:py-32 bg-muted/20 border-b border-border/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              Why Top Educators Choose NoteGen
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare traditional manual lesson planning with NoteGen's grounded academic engine.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-5 font-bold text-foreground">Feature</th>
                  <th className="p-5 font-semibold text-muted-foreground">Traditional Planning</th>
                  <th className="p-5 font-bold text-primary">NoteGen Academic AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-5 font-bold text-foreground">Physical Textbook Grounding</td>
                  <td className="p-5 text-muted-foreground">Manual page flipping &amp; typing</td>
                  <td className="p-5 text-emerald-600 font-bold">✓ High-Res Camera Scan &amp; Verbatim OCR</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-foreground">Lesson Suite Structure</td>
                  <td className="p-5 text-muted-foreground">Disjointed notes &amp; separate word docs</td>
                  <td className="p-5 text-emerald-600 font-bold">✓ 7 Unified Modules (Plans, Notes, Tests)</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-foreground">Classroom Pedagogy &amp; Analogies</td>
                  <td className="p-5 text-muted-foreground">Ad-hoc examples during lecture</td>
                  <td className="p-5 text-emerald-600 font-bold">✓ Pre-structured analogies &amp; student traps</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-foreground">Compulsory Notebook Records</td>
                  <td className="p-5 text-muted-foreground">Writing definitions manually on board</td>
                  <td className="p-5 text-emerald-600 font-bold">✓ Board-approved definitions + derivation steps</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-foreground">Assessment &amp; PYQ Analysis</td>
                  <td className="p-5 text-muted-foreground">Searching 10-year question banks</td>
                  <td className="p-5 text-emerald-600 font-bold">✓ Automated frequency tags &amp; test blueprints</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)                            */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-32 bg-background border-b border-border/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about NoteGen, the lifetime membership, and the textbook scanner.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does the Lifetime Membership work? Are there really no monthly fees?',
                a: 'Yes, exactly! With our Starter (₹500) or Institutional (₹1,000) Lifetime membership, you pay once and your school account stays active forever. There are zero recurring monthly or annual subscription fees.',
              },
              {
                q: 'How do generation credits and wallet recharges work?',
                a: 'Your membership includes free bonus generation credits right away (₹600 credit with Starter, ₹1,500 credit with Institutional). Each question paper costs ₹5 from your wallet. When your credits run out, you can top up your wallet starting at ₹50, with up to +50% extra bonus credits.',
              },
              {
                q: 'Can teachers upload physical textbook photographs or handwritten notes?',
                a: 'Yes! NoteGen has a dedicated Camera Scanner and File Uploader. You can snap a photo of any physical textbook page or reference sheet. Our OCR digitizes the text, extracts key definitions, and saves it into your chapter syllabus.',
              },
              {
                q: 'Are generated notes and question papers aligned with CBSE and State Boards?',
                a: '100% yes. The engine is trained on NCERT / CBSE curriculum standards, Bloom\'s Taxonomy, and NEP 2020 competency benchmarks. It produces Section A (MCQs), Section B (Short Answers), Section C (Long Answers), and Case Studies with full solutions and marking keys.',
              },
              {
                q: 'Can multiple teachers and staff use the same school account?',
                a: 'The Starter plan supports up to 5 teacher accounts, while the Institutional plan provides unlimited teacher and staff accounts with centralized school branding (logo, watermarks, and principal signatures).',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-foreground cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FINAL HIGH-CONVERTING CALL TO ACTION                                  */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-muted/30 to-background text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3.5 py-1">
            Empower Your Teaching Today
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight">
            Ready to upgrade your classroom preparation?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join hundreds of teachers, department heads, and educational institutes saving 4+ hours per chapter while delivering world-class curriculum mastery.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gradient-brand text-white hover:opacity-95 rounded-2xl px-9 h-13 text-sm font-bold shadow-xl shadow-primary/25 cursor-pointer transition-all duration-300 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Teacher Workspace Free</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl px-8 h-13 text-sm font-bold bg-card hover:bg-muted border-border cursor-pointer"
              >
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. MODERN FOOTER                                                         */}
      {/* ========================================================================= */}
      <footer className="py-14 bg-background border-t border-border/80 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-foreground text-sm">NoteGen Academic Suite</span>
                <span className="text-[11px] text-muted-foreground ml-2">Powered by Kavion Innovation</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
              <a href="#suite" className="hover:text-foreground transition-colors">7-Core Suite</a>
              <a href="#ocr-scanner" className="hover:text-foreground transition-colors">Textbook Scanner</a>
              <a href="#doc-viewer" className="hover:text-foreground transition-colors">Doc Viewer</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Lifetime Pricing</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link href="/dashboard" className="text-primary hover:underline font-bold">Teacher Dashboard</Link>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground font-semibold">All Systems Operational</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} NoteGen Academic. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>CBSE / NCERT / ICSE Standards</span>
              <span>NEP 2020 Framework</span>
              <span>Secure Cashfree Processing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}
