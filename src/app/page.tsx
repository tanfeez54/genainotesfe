'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronDown,
  Play,
  Send,
  MapPin,
  Heart,
  Share2,
  Menu,
  X,
  ChevronUp,
  Clock,
  Building,
  CheckCheck,
} from 'lucide-react';

export default function LandingPage() {
  const [activeHeroTab, setActiveHeroTab] = useState<'suite' | 'ocr' | 'exam'>('suite');
  const [activeSuiteModule, setActiveSuiteModule] = useState<number>(1);
  const [activeExamView, setActiveExamView] = useState<'paper' | 'solutions'>('paper');
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const testimonials = [
    {
      name: 'Dr. Albert Sharma',
      role: 'Senior PGT Chemistry, DPS R.K. Puram',
      quote:
        'NoteGen has completely revolutionized our faculty preparation. Scanning textbook pages and generating classroom-ready lesson plans with verified citations saved our science department over 4 hours per chapter. The exam papers strictly adhere to CBSE standards.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Meera Thomas',
      role: 'Principal, St. Xavier Senior Secondary',
      quote:
        'The one-time lifetime membership model is a breath of fresh air for Indian schools. No recurring monthly SaaS bills. Our teachers love the 3-tiered homework and Bloom\'s taxonomy question paper builder. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Rajesh K. Verma',
      role: 'Director, Zenith Academy Kota',
      quote:
        'The physical textbook OCR with isolated syllabus storage is flawless. We snap NCERT and reference sheets, and within 30 seconds we have mandatory notebook notes, formulas, and mock board papers with full answer keys.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailSubscribed(true);
      setTimeout(() => setEmailSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#212832] font-body-jadoo relative overflow-x-hidden selection:bg-[#DF6951]/20 selection:text-[#DF6951]">
      {/* ========================================================================= */}
      {/* JADOO SIGNATURE AMBIENT BACKGROUND GLOW BLOBS                            */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-Right Warm Amber/Coral Blob */}
        <div className="absolute -top-24 -right-24 w-[650px] h-[650px] bg-gradient-to-bl from-[#FFF1DA] via-[#FDE8D3]/50 to-transparent rounded-full blur-3xl opacity-80" />
        {/* Left Mid Pastel Glow */}
        <div className="absolute top-[35%] -left-32 w-[550px] h-[550px] bg-gradient-to-tr from-[#F4F1FE] via-[#FFF1DA]/30 to-transparent rounded-full blur-3xl opacity-60" />
        {/* Bottom Lavender Glow */}
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#DFD7F9]/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* ========================================================================= */}
      {/* 1. JADOO-STYLE TOP NAVIGATION BAR                                         */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFFDFB]/85 backdrop-blur-md transition-all border-b border-[#212832]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Jadoo Brand Logo with Coral Period */}
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="font-heading font-black text-2xl sm:text-3xl text-[#181E4B] tracking-tight group-hover:opacity-90 transition-opacity">
                NoteGen
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-1.5 animate-pulse" />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-10 text-sm font-medium text-[#212832]">
              {/* Features Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setIsFeaturesOpen(true)}
                onMouseLeave={() => setIsFeaturesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                  className={`flex items-center gap-1.5 py-2 hover:text-[#DF6951] transition-colors cursor-pointer ${
                    isFeaturesOpen ? 'text-[#DF6951] font-semibold' : ''
                  }`}
                >
                  <span>Features</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180 text-[#DF6951]' : ''}`} />
                </button>

                {/* Dropdown Card */}
                {isFeaturesOpen && (
                  <div className="absolute top-full left-0 w-88 p-3 bg-white/95 backdrop-blur-2xl border border-[#212832]/10 rounded-3xl shadow-2xl space-y-1.5 animate-fade-in z-50">
                    <a
                      href="#suite"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-2xl hover:bg-[#FFF1DA]/60 flex items-start gap-3.5 transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#F1A501]/10 text-[#F1A501] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F1A501] group-hover:text-white transition-all">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#181E4B] group-hover:text-[#DF6951] transition-colors flex items-center gap-1.5">
                          <span>7-Core Lesson Suite</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#DF6951]/10 text-[#DF6951] text-[9px] font-bold">Flagship</span>
                        </div>
                        <p className="text-[11px] text-[#5E6282] leading-snug mt-1">
                          Teaching plans, topic guides, notebook notes, homework, PYQ &amp; test blueprints.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#ocr-scanner"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-2xl hover:bg-[#FFF1DA]/60 flex items-start gap-3.5 transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#DF6951]/10 text-[#DF6951] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#DF6951] group-hover:text-white transition-all">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#181E4B] group-hover:text-[#DF6951] transition-colors flex items-center gap-1.5">
                          <span>Physical Textbook Scanner</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#F1A501]/10 text-[#F1A501] text-[9px] font-bold">AI OCR</span>
                        </div>
                        <p className="text-[11px] text-[#5E6282] leading-snug mt-1">
                          Camera &amp; file upload scanner with isolated syllabus repository.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#doc-viewer"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-2xl hover:bg-[#FFF1DA]/60 flex items-start gap-3.5 transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#5956E9]/10 text-[#5956E9] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#5956E9] group-hover:text-white transition-all">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#181E4B] group-hover:text-[#5956E9] transition-colors">
                          Document &amp; AI OCR Viewer
                        </div>
                        <p className="text-[11px] text-[#5E6282] leading-snug mt-1">
                          High-res zoom &amp; pan controls, educational summaries &amp; verbatim transcription.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#exam-builder"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="p-3 rounded-2xl hover:bg-[#FFF1DA]/60 flex items-start gap-3.5 transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#00A389]/10 text-[#00A389] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00A389] group-hover:text-white transition-all">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#181E4B] group-hover:text-[#00A389] transition-colors">
                          Question Paper &amp; Blueprint Engine
                        </div>
                        <p className="text-[11px] text-[#5E6282] leading-snug mt-1">
                          CBSE &amp; State Board exam papers with LaTeX formulas &amp; A4 print formatting.
                        </p>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <a href="#workflow" className="hover:text-[#DF6951] transition-colors">
                How It Works
              </a>

              <a href="#pricing" className="hover:text-[#DF6951] transition-colors flex items-center gap-1.5 font-semibold text-[#181E4B]">
                <span>Pricing</span>
                <span className="px-2 py-0.5 rounded-full bg-[#DF6951]/10 text-[#DF6951] text-[10px] font-bold">
                  Lifetime
                </span>
              </a>

              <a href="#testimonials" className="hover:text-[#DF6951] transition-colors">
                Testimonials
              </a>

              <a href="#comparison" className="hover:text-[#DF6951] transition-colors">
                Comparison
              </a>
            </div>

            {/* Desktop Actions (Jadoo Outlined Sign up Button) */}
            <div className="hidden sm:flex items-center gap-7 text-sm font-semibold">
              <Link href="/login" className="text-[#212832] hover:text-[#DF6951] transition-colors">
                Login
              </Link>
              <Link href="/dashboard">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl border border-[#212832] text-[#212832] hover:bg-[#212832] hover:text-white transition-all duration-300 font-semibold cursor-pointer shadow-xs"
                >
                  Sign up
                </button>
              </Link>
              <div className="flex items-center gap-1 text-xs text-[#212832] font-semibold cursor-pointer hover:text-[#DF6951]">
                <span>EN</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center gap-2">
              <Link href="/dashboard">
                <button type="button" className="px-4 py-2 rounded-xl bg-[#DF6951] text-white text-xs font-bold shadow-sm">
                  Launch
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl border border-[#212832]/20 text-[#212832] hover:bg-[#FFF1DA]/50"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-[#212832]/10 bg-[#FFFDFB] px-5 py-6 space-y-4 animate-fade-in shadow-2xl">
            <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
              <a href="#suite" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[#FFF1DA]/60 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#F1A501]" />
                <span>7-Core Suite</span>
              </a>
              <a href="#ocr-scanner" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[#FFF1DA]/60 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#DF6951]" />
                <span>Textbook OCR</span>
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[#DF6951]/10 text-[#DF6951] font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#DF6951]" />
                <span>Pricing Plans</span>
              </a>
              <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-2xl bg-[#FFF1DA]/60 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#5956E9]" />
                <span>How It Works</span>
              </a>
            </div>
            <div className="pt-2 border-t border-[#212832]/10 flex flex-col gap-2.5">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button type="button" className="w-full py-3 rounded-xl border border-[#212832] text-xs font-bold">
                  Login
                </button>
              </Link>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <button type="button" className="w-full py-3 rounded-xl bg-[#DF6951] text-white text-xs font-bold shadow-md shadow-[#DF6951]/30">
                  Launch Academic Workspace
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. JADOO HERO SECTION: SERIF TYPOGRAPHY + BRUSH STROKE UNDERLINE + DUAL CTA */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading & Content */}
            <div className="lg:col-span-7 space-y-7 text-left">
              {/* Jadoo Coral Eyebrow */}
              <div className="inline-block">
                <span className="text-[#DF6951] font-extrabold text-xs sm:text-sm uppercase tracking-widest block font-sans">
                  Best Academic &amp; Teacher Lesson Suites
                </span>
              </div>

              {/* Jadoo Display Headline with Signature Brush Stroke Underline */}
              <h1 className="font-serif-display text-4xl sm:text-6xl lg:text-7xl font-bold text-[#181E4B] leading-[1.08] tracking-tight">
                Scan,{' '}
                <span className="relative inline-block text-[#181E4B]">
                  teach
                  {/* Jadoo Curved Brush Underline */}
                  <svg
                    className="absolute -bottom-2 sm:-bottom-3 left-0 w-full overflow-visible pointer-events-none"
                    viewBox="0 0 255 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 11.5C65.5 2.5 178.5 2 252.5 11.5"
                      stroke="#DF6951"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                and deliver a new standard of education
              </h1>

              {/* Muted Description */}
              <p className="text-base sm:text-lg text-[#5E6282] max-w-xl leading-relaxed font-normal">
                Transform physical textbook photos into comprehensive 7-Core Lesson Suites, student notebook definitions, 3-tiered homework, and CBSE/ICSE board question papers with 1-click.
              </p>

              {/* Dual Jadoo CTAs: Golden Amber Button + Red Circular Play Button */}
              <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8">
                {/* Find Out More / Launch Button (Jadoo Mustard Yellow #F1A501) */}
                <Link href="/dashboard">
                  <button
                    type="button"
                    className="bg-[#F1A501] hover:bg-[#e09900] text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl shadow-[#F1A501]/30 hover:shadow-2xl hover:shadow-[#F1A501]/40 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                  >
                    <span>Launch Workspace Free</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                {/* Play Live Demo Button (Jadoo Coral Circle #DF6951 with Pulse Shadow) */}
                <a href="#suite" className="flex items-center gap-3.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-full bg-[#DF6951] text-white flex items-center justify-center shadow-lg shadow-[#DF6951]/40 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-[#5E6282] group-hover:text-[#181E4B] transition-colors">
                    Explore 7 Modules
                  </span>
                </a>
              </div>

              {/* Subtle Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#5E6282] font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00A389]" /> 100% Grounded in Scanned Pages
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#5956E9]" /> NEP 2020 &amp; CBSE Aligned
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#DF6951]" /> Zero Monthly Subscriptions
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual with Organic Shape & Interactive Card Mockup */}
            <div className="lg:col-span-5 relative">
              {/* Jadoo Warm Peach Backdrop Shape */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF1DA] to-[#FDE8D3]/80 rounded-[40px] -rotate-2 scale-105 -z-10 shadow-lg" />

              {/* Floating Paper Airplane Icon (Jadoo Accent) */}
              <div className="absolute -top-6 -right-4 w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#DF6951] -rotate-12 z-20">
                <Send className="w-6 h-6 fill-[#DF6951]/10" />
              </div>

              {/* Interactive Showcase Window */}
              <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-[#212832]/5 space-y-5 text-left">
                {/* Header Window Switcher */}
                <div className="flex items-center justify-between pb-3 border-b border-[#212832]/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#DF6951]" />
                    <span className="w-3 h-3 rounded-full bg-[#F1A501]" />
                    <span className="w-3 h-3 rounded-full bg-[#00A389]" />
                    <span className="text-[11px] font-mono font-bold text-[#5E6282] ml-2">Class 10 Science</span>
                  </div>
                  <Badge className="bg-[#DF6951]/10 text-[#DF6951] border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Live Engine
                  </Badge>
                </div>

                {/* 3 Interactive Showcase Tabs */}
                <div className="flex items-center gap-1.5 bg-[#FFF1DA]/40 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('suite')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeHeroTab === 'suite' ? 'bg-[#DF6951] text-white shadow-sm' : 'text-[#5E6282] hover:text-[#181E4B]'
                    }`}
                  >
                    7-Core Suite
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('ocr')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeHeroTab === 'ocr' ? 'bg-[#F1A501] text-white shadow-sm' : 'text-[#5E6282] hover:text-[#181E4B]'
                    }`}
                  >
                    Textbook OCR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab('exam')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeHeroTab === 'exam' ? 'bg-[#5956E9] text-white shadow-sm' : 'text-[#5E6282] hover:text-[#181E4B]'
                    }`}
                  >
                    Board Exam
                  </button>
                </div>

                {/* Tab 1: 7-Core Suite Preview */}
                {activeHeroTab === 'suite' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h4 className="font-serif-display text-lg font-bold text-[#181E4B]">
                        Chemical Reactions &amp; Equations
                      </h4>
                      <p className="text-xs text-[#5E6282] mt-0.5">CBSE Curriculum • 7 Classroom Periods</p>
                    </div>

                    {/* Interactive Sub-module Switcher */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      {['1. Teaching Plan', '2. Teaching Guide', '3. Student Notes', '4. CW+HW'].map((name, i) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setActiveSuiteModule(i + 1)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            activeSuiteModule === i + 1
                              ? 'bg-[#181E4B] text-white'
                              : 'bg-[#FFF1DA]/60 text-[#5E6282] hover:text-[#181E4B]'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#181E4B]">
                        <span className="flex items-center gap-1.5 text-[#DF6951]">
                          <Calendar className="w-3.5 h-3.5" /> Period {activeSuiteModule}: Classroom Pacing
                        </span>
                        <span className="text-[10px] bg-[#00A389]/10 text-[#00A389] px-2 py-0.5 rounded-full font-mono">
                          45 Mins
                        </span>
                      </div>
                      <p className="text-xs text-[#5E6282] leading-relaxed">
                        Observations indicating a chemical reaction: gas evolution, temperature changes, and precipitate formation.
                      </p>
                      <div className="p-2 rounded-xl bg-white border border-[#212832]/5 font-mono text-[11px] text-[#181E4B] font-bold">
                        CaO(s) + H2O(l) → Ca(OH)2(aq) + Heat
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: OCR Scanner Preview */}
                {activeHeroTab === 'ocr' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-display text-lg font-bold text-[#181E4B]">
                        High-Res Camera Page 1 of 3
                      </h4>
                      <Badge className="bg-[#00A389]/10 text-[#00A389] text-[10px] font-bold">
                        99.8% Precision
                      </Badge>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#DF6951]">
                        <Sparkles className="w-3.5 h-3.5" /> AI Page Educational Summary:
                      </div>
                      <p className="text-xs text-[#5E6282] leading-relaxed">
                        Covers basic definitions of chemical equations, magnesium ribbon burning in air, and white powder formation.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF1DA] text-[#181E4B] text-[10px] font-semibold">
                          Magnesium Ribbon
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF1DA] text-[#181E4B] text-[10px] font-semibold">
                          Exothermic Reaction
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Board Exam Preview */}
                {activeHeroTab === 'exam' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-display text-lg font-bold text-[#181E4B]">
                        CBSE Standard Blueprint
                      </h4>
                      <span className="text-xs font-bold text-[#5956E9]">50 Marks • 2 Hours</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DF6951]">
                        Section A: MCQ (1 Mark)
                      </span>
                      <p className="text-xs font-bold text-[#181E4B]">
                        Which of the following represents a balanced chemical reaction for the slaking of lime?
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#5E6282] font-mono pt-1">
                        <span>(a) CaO + H2O → Ca(OH)2</span>
                        <span>(b) CaCO3 → CaO + CO2</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-[#5E6282] border-t border-[#212832]/5">
                  <span className="flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-[#00A389]" /> Verifiable Citations
                  </span>
                  <Link href="/dashboard" className="text-[#DF6951] font-bold hover:underline">
                    Open in Workspace →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. JADOO "CATEGORY / WE OFFER BEST SERVICES" (4 SERVICES GRID WITH CORAL TAB) */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 sm:py-28 relative">
        {/* Decorative Cross-Dot Matrix (Top Right) */}
        <div className="absolute top-10 right-8 sm:right-20 pointer-events-none opacity-40 -z-10">
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#DF6951]/60" />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#5E6282] block font-sans">
            Category
          </span>
          <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#14183E] tracking-tight">
            We Offer Best Academic Services
          </h2>
          <p className="text-sm sm:text-base text-[#5E6282] max-w-2xl mx-auto pb-8">
            Every module is tailored to school requirements, classroom pacing, and formal examination boards.
          </p>

          {/* 4 Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
            {/* Service 1: Physical Textbook Scanner */}
            <div className="p-8 rounded-[36px] bg-white border border-[#212832]/5 hover:shadow-2xl transition-all duration-300 text-center space-y-4 group">
              <div className="w-16 h-16 rounded-2xl bg-[#00A389]/10 text-[#00A389] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#181E4B]">Textbook OCR</h3>
              <p className="text-xs text-[#5E6282] leading-relaxed">
                Snap photos of textbook pages or upload files. High-accuracy OCR extracts verbatim text with isolated syllabus storage.
              </p>
            </div>

            {/* Service 2: 7-Core Lesson Suite (JADOO SIGNATURE ACTIVE CARD WITH CORAL TAB!) */}
            <div className="relative group">
              {/* The Jadoo signature coral rounded rectangle behind the card */}
              <div className="w-24 h-24 bg-[#DF6951] rounded-3xl absolute -bottom-6 -left-6 -z-10 group-hover:-bottom-8 group-hover:-left-8 transition-all duration-300 shadow-xl shadow-[#DF6951]/30" />

              <div className="p-8 rounded-[36px] bg-white border border-[#212832]/5 shadow-2xl transition-all duration-300 text-center space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#F1A501]/10 text-[#F1A501] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#181E4B]">7-Core Lesson Suite</h3>
                <p className="text-xs text-[#5E6282] leading-relaxed">
                  Complete chapter pedagogy, teaching plans, classroom analogies, compulsory notebook notes, and homework tiers.
                </p>
              </div>
            </div>

            {/* Service 3: Document & AI OCR Viewer */}
            <div className="p-8 rounded-[36px] bg-white border border-[#212832]/5 hover:shadow-2xl transition-all duration-300 text-center space-y-4 group">
              <div className="w-16 h-16 rounded-2xl bg-[#DF6951]/10 text-[#DF6951] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#181E4B]">Document Viewer</h3>
              <p className="text-xs text-[#5E6282] leading-relaxed">
                Two-column interactive viewer with zoom controls (50% to 300%), verbatim OCR transcription, and educational summaries.
              </p>
            </div>

            {/* Service 4: Board Question Paper Engine */}
            <div className="p-8 rounded-[36px] bg-white border border-[#212832]/5 hover:shadow-2xl transition-all duration-300 text-center space-y-4 group">
              <div className="w-16 h-16 rounded-2xl bg-[#5956E9]/10 text-[#5956E9] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#181E4B]">Question Papers</h3>
              <p className="text-xs text-[#5E6282] leading-relaxed">
                CBSE, ICSE &amp; State Board papers with Bloom\'s Taxonomy, LaTeX math, and print-ready A4 formatting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. JADOO "TOP SELLING / DESTINATIONS" (CORE ACADEMIC MODULES SHOWCASE)    */}
      {/* ========================================================================= */}
      <section id="destinations" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#5E6282] block font-sans">
            Top Selling
          </span>
          <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#14183E] tracking-tight">
            Curriculum Packages
          </h2>
          <p className="text-sm sm:text-base text-[#5E6282] max-w-2xl mx-auto pb-8">
            Complete grounded blueprints ready for classroom lecture delivery and assessment.
          </p>

          {/* 3 Tall Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 relative">
            {/* Card 1: Science Suite */}
            <div className="rounded-[32px] overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#212832]/5 flex flex-col text-left group">
              <div className="h-64 bg-gradient-to-tr from-[#181E4B] via-[#2A3370] to-[#DF6951] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1 relative z-10">
                  <Badge className="bg-[#F1A501] text-white border-none text-[10px] font-bold">Class 10 CBSE</Badge>
                  <h3 className="font-serif-display text-xl font-bold text-white">Chemical Reactions</h3>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="flex items-center justify-between text-sm font-bold text-[#181E4B]">
                  <span>7 Classroom Periods</span>
                  <span className="text-[#DF6951]">Full Suite</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5E6282]">
                  <Send className="w-3.5 h-3.5 text-[#181E4B]" />
                  <span>3 Scanned Pages Grounded</span>
                </div>
              </div>
            </div>

            {/* Card 2: Math Suite */}
            <div className="rounded-[32px] overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#212832]/5 flex flex-col text-left group">
              <div className="h-64 bg-gradient-to-tr from-[#F1A501] via-[#DF6951] to-[#181E4B] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="space-y-1 relative z-10">
                  <Badge className="bg-[#181E4B] text-white border-none text-[10px] font-bold">Class 10 ICSE</Badge>
                  <h3 className="font-serif-display text-xl font-bold text-white">Quadratic Equations</h3>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="flex items-center justify-between text-sm font-bold text-[#181E4B]">
                  <span>8 Classroom Periods</span>
                  <span className="text-[#DF6951]">Full Suite</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5E6282]">
                  <Send className="w-3.5 h-3.5 text-[#181E4B]" />
                  <span>LaTeX Proofs &amp; Formula Sheets</span>
                </div>
              </div>
            </div>

            {/* Card 3: Board Assessment (With Decorative Swirl Spiral behind!) */}
            <div className="rounded-[32px] overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#212832]/5 flex flex-col text-left group relative">
              {/* Jadoo Signature Mandala / Swirl lines behind 3rd card */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border-2 border-dashed border-[#5E6282]/20 pointer-events-none -z-10" />

              <div className="h-64 bg-gradient-to-tr from-[#5956E9] via-[#7B78FF] to-[#DF6951] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1 relative z-10">
                  <Badge className="bg-[#00A389] text-white border-none text-[10px] font-bold">Class 12 Term Exam</Badge>
                  <h3 className="font-serif-display text-xl font-bold text-white">Board Mock Paper</h3>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="flex items-center justify-between text-sm font-bold text-[#181E4B]">
                  <span>3 Hours • 80 Marks</span>
                  <span className="text-[#DF6951]">Print Ready</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5E6282]">
                  <Send className="w-3.5 h-3.5 text-[#181E4B]" />
                  <span>Marking Scheme &amp; Answer Keys</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. JADOO "EASY AND FAST" (3 EASY STEPS + THE SIGNATURE FLOATING CARD)     */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: 3 Steps */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#5E6282] block font-sans">
                Easy and Fast
              </span>
              <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#14183E] tracking-tight leading-tight">
                Prepare Your Next Chapter <br />In 3 Easy Steps
              </h2>

              <div className="space-y-6 pt-2">
                {/* Step 1: Yellow Square */}
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1A501] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#F1A501]/30">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#181E4B]">Choose Class, Subject &amp; Chapter</h4>
                    <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-0.5">
                      Select your academic grade and syllabus topic. NoteGen establishes curriculum boundaries with instant board alignment.
                    </p>
                  </div>
                </div>

                {/* Step 2: Coral Square */}
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#DF6951] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#DF6951]/30">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#181E4B]">Snap or Upload Physical Textbook Pages</h4>
                    <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-0.5">
                      Take a photo of textbook pages with your camera. AI digitizes text, produces summaries, and saves everything to syllabus storage.
                    </p>
                  </div>
                </div>

                {/* Step 3: Teal Square */}
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#00A389] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#00A389]/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#181E4B]">Generate 7-Core Suite &amp; Print Tests</h4>
                    <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed mt-0.5">
                      Receive teaching plans, compulsory student notes, homework sets, and board exam papers with solutions in 60 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: JADOO SIGNATURE FLOATING CARD COMPOSITION */}
            <div className="lg:col-span-5 relative">
              {/* Cyan / Blue Blur Glow behind the card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#5956E9]/15 rounded-full blur-3xl -z-10" />

              {/* Main Jadoo Card */}
              <div className="rounded-[32px] bg-white p-6 shadow-2xl border border-[#212832]/5 space-y-4 relative text-left">
                {/* Preview Image */}
                <div className="h-44 rounded-2xl bg-gradient-to-tr from-[#181E4B] via-[#DF6951] to-[#F1A501] p-4 text-white flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">Class 10 Science</Badge>
                    <span className="text-xs font-mono font-bold">7 Periods</span>
                  </div>
                  <h4 className="font-serif-display text-lg font-bold">Chemical Reactions &amp; Equations</h4>
                </div>

                {/* Card Title & Subtitle */}
                <div>
                  <h4 className="font-bold text-base text-[#181E4B]">Academic Teaching Plan</h4>
                  <p className="text-xs text-[#5E6282] mt-0.5">14-29 June | by Senior Faculty</p>
                </div>

                {/* 3 Circular Soft Action Buttons (Leaf, Map, Send) */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#5E6282] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#5E6282] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#5E6282] flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                </div>

                {/* Card Footer: Building icon + 24 teachers + Heart */}
                <div className="flex items-center justify-between pt-2 text-xs text-[#5E6282] font-semibold border-t border-[#212832]/5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#5E6282]" />
                    <span>24 teachers using this</span>
                  </div>
                  <Heart className="w-4 h-4 text-[#DF6951] fill-[#DF6951]" />
                </div>
              </div>

              {/* OVERLAPPING FLOATING MINI-CARD (JADOO SIGNATURE BADGE) */}
              <div className="absolute -bottom-8 -right-4 sm:-right-8 w-68 bg-white p-4 rounded-2xl shadow-2xl border border-[#212832]/5 flex items-start gap-3.5 z-20 text-left animate-fade-in">
                <div className="w-11 h-11 rounded-full bg-[#DF6951]/10 text-[#DF6951] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1 w-full">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#5E6282]">Ongoing</span>
                  <h5 className="text-xs font-bold text-[#181E4B]">Chapter 1 Assessment</h5>
                  <div className="flex items-center justify-between text-[10px] text-[#5E6282] font-semibold pt-1">
                    <span className="text-[#DF6951] font-bold">40% completed</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#FFF1DA] overflow-hidden">
                    <div className="w-[40%] h-full bg-[#DF6951] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. JADOO "TESTIMONIALS / WHAT PEOPLE SAY ABOUT US" (OVERLAPPING CARDS)    */}
      {/* ========================================================================= */}
      <section id="testimonials" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Title & Pagination Dots */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#5E6282] block font-sans">
                Testimonials
              </span>
              <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#14183E] tracking-tight leading-tight">
                What People Say <br />About Us.
              </h2>

              {/* 3 Pagination Dots */}
              <div className="flex items-center gap-4 pt-4">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTestimonialIdx(idx)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      activeTestimonialIdx === idx ? 'bg-[#181E4B] scale-125' : 'bg-[#E5E5E5] hover:bg-[#5E6282]'
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: JADOO OVERLAPPING TESTIMONIAL CARDS + ARROW CONTROLS */}
            <div className="lg:col-span-7 flex items-center gap-6">
              <div className="relative w-full text-left">
                {/* Bottom Card (Peeking underneath) */}
                <div className="rounded-[32px] bg-white/70 border border-[#212832]/5 p-8 shadow-md translate-y-8 translate-x-8 -z-10 absolute inset-0 opacity-40">
                  <p className="text-xs text-[#5E6282]">
                    "{testimonials[(activeTestimonialIdx + 1) % testimonials.length].quote.slice(0, 100)}..."
                  </p>
                  <h5 className="font-bold text-sm text-[#181E4B] mt-4">
                    {testimonials[(activeTestimonialIdx + 1) % testimonials.length].name}
                  </h5>
                </div>

                {/* Top Active Card with Floating Circular Avatar */}
                <div className="rounded-[32px] bg-white border border-[#212832]/5 p-8 sm:p-10 shadow-2xl relative z-10 space-y-6">
                  {/* Floating Circular Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-xl -top-8 -left-6 absolute">
                    <img
                      src={testimonials[activeTestimonialIdx].avatar}
                      alt={testimonials[activeTestimonialIdx].name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-sm sm:text-base text-[#5E6282] leading-relaxed pt-2">
                    "{testimonials[activeTestimonialIdx].quote}"
                  </p>

                  <div>
                    <h4 className="font-bold text-base text-[#181E4B]">
                      {testimonials[activeTestimonialIdx].name}
                    </h4>
                    <p className="text-xs text-[#5E6282] mt-0.5">
                      {testimonials[activeTestimonialIdx].role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vertical Arrows (↑ and ↓) */}
              <div className="hidden sm:flex flex-col gap-5 text-[#5E6282]">
                <button
                  type="button"
                  onClick={() =>
                    setActiveTestimonialIdx((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
                  }
                  className="p-2 rounded-full hover:bg-[#FFF1DA] text-[#181E4B] cursor-pointer transition-colors"
                  aria-label="Previous Testimonial"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTestimonialIdx((prev) => (prev + 1) % testimonials.length)}
                  className="p-2 rounded-full hover:bg-[#FFF1DA] text-[#181E4B] cursor-pointer transition-colors"
                  aria-label="Next Testimonial"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. JADOO PARTNERS & CURRICULUM LOGO STRIP                                */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-[#212832]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-8 text-[#5E6282] opacity-70 grayscale hover:grayscale-0 transition-all font-heading font-black text-lg sm:text-xl">
            <span className="tracking-wider">CBSE CURRICULUM</span>
            <span className="tracking-wider">NCERT STANDARDS</span>
            <span className="tracking-wider">ICSE BOARD</span>
            <span className="tracking-wider">STATE BOARDS</span>
            <span className="tracking-wider">CASHFREE PAY</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING SECTION (100% MATCHING /billing IN WARM JADOO AESTHETICS)       */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
              Transparent Membership
            </span>
            <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#14183E] tracking-tight">
              One-Time Lifetime Membership
            </h2>
            <p className="text-sm sm:text-base text-[#5E6282] leading-relaxed">
              Zero recurring monthly subscriptions. Pay once to unlock your school workspace for life, with bundled starter generations included! Extra papers are generated on a simple <strong>Recharge &amp; Use</strong> model @ ₹5/paper.
            </p>
          </div>

          {/* 2 Lifetime Membership Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Starter Plan Card (₹500) */}
            <div className="rounded-[36px] bg-white border border-[#212832]/5 p-8 sm:p-10 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 text-left">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5E6282]">Starter Tier</span>
                    <Badge className="bg-[#FFF1DA] text-[#181E4B] border-none text-xs font-bold">Coaching / Single Branch</Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-serif-display text-5xl font-black text-[#181E4B]">₹500</span>
                    <span className="text-xs text-[#5E6282]">one-time lifetime</span>
                  </div>
                  <p className="text-xs text-[#5E6282] mt-2">
                    Pay once for lifetime school access. Ideal for coaching centers and independent tutors.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF1DA]/60 border border-[#F1A501]/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#F1A501] shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-[#181E4B] leading-snug">
                    Includes ₹600 Generation Credit (120 Papers Free • +20% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-3 text-xs text-[#181E4B]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly or annual renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span><strong>120 AI Question Papers Included</strong> (₹600 balance added instantly)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>Custom School Logo, Stamp, Signatures &amp; Watermark</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>Up to <strong>5 Teacher Accounts</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>Full PDF Export with Solutions &amp; Answer Keys</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/billing">
                  <button
                    type="button"
                    className="w-full py-4 rounded-2xl bg-[#181E4B] hover:bg-[#2A3370] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Get Starter Lifetime (₹500)
                  </button>
                </Link>
              </div>
            </div>

            {/* Institutional Plan Card (₹1,000) (JADOO BEST VALUE HIGHLIGHT) */}
            <div className="rounded-[36px] bg-white border-2 border-[#DF6951] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative text-left">
              <span className="absolute -top-3.5 right-8 text-[11px] uppercase font-black tracking-wider px-4 py-1 rounded-full bg-[#DF6951] text-white shadow-md flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current" /> Recommended • Best Value
              </span>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#DF6951]">Institutional Tier</span>
                    <Badge className="bg-[#DF6951]/10 text-[#DF6951] border-none text-xs font-bold">Full Campus</Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-serif-display text-5xl font-black text-[#181E4B]">₹1,000</span>
                    <span className="text-xs text-[#5E6282]">one-time lifetime</span>
                  </div>
                  <p className="text-xs text-[#5E6282] mt-2">
                    Complete institutional suite for schools, junior colleges, and academy chains.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#DF6951]/10 border border-[#DF6951]/20 flex items-start gap-3">
                  <Gift className="w-5 h-5 text-[#DF6951] shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-[#181E4B] leading-snug">
                    Includes ₹1,500 Generation Credit (300 Papers Free • +50% Bonus Included!)
                  </span>
                </div>

                <div className="space-y-3 text-xs text-[#181E4B]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span><strong>Lifetime Access</strong> — No monthly renewals ever</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span><strong>300 AI Question Papers Included</strong> (₹1,500 balance added with +50% bonus)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span><strong>Unlimited Teachers</strong> &amp; Exam Coordinators</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>OCR Textbook, Notes &amp; Past Paper Question Extraction</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>Priority AI Queue (Instant Paper &amp; Blueprint Generation)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00A389] shrink-0" />
                    <span>Dedicated WhatsApp &amp; Technical Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/billing">
                  <button
                    type="button"
                    className="w-full py-4 rounded-2xl bg-[#DF6951] hover:bg-[#c9523b] text-white text-xs font-bold shadow-xl shadow-[#DF6951]/30 transition-all cursor-pointer"
                  >
                    Get Institutional Lifetime (₹1,000)
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Wallet Recharge Grid */}
          <div className="pt-10 border-t border-[#212832]/5 space-y-6 max-w-5xl mx-auto text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-display text-2xl font-bold text-[#181E4B]">
                  Recharge School Wallet (Tiered Bonus Credits)
                </h3>
                <p className="text-xs text-[#5E6282] mt-1">
                  Get up to <strong>+50% Extra Free Bonus Generations</strong> on larger recharges! Base cost is ₹5.00/generation.
                </p>
              </div>
              <Badge className="bg-[#181E4B] text-white text-xs font-bold px-3 py-1 self-start sm:self-auto">
                ₹5 per Paper Generation
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: 'Starter', price: '₹50', papers: '10', rate: '₹5.00', bonus: '10 Base Papers', popular: false },
                { name: 'Standard', price: '₹100', papers: '22', rate: '₹4.55', bonus: '+10% Bonus (2 Free)', popular: true },
                { name: 'Classroom', price: '₹250', papers: '57', rate: '₹4.39', bonus: '+15% Bonus (7 Free)', popular: false },
                { name: 'Institution', price: '₹500', papers: '120', rate: '₹4.17', bonus: '+20% Bonus (20 Free)', popular: false },
                { name: 'Mega District', price: '₹1,000', papers: '300', rate: '₹3.33', bonus: '+50% Bonus (100 Free)', popular: false },
              ].map((pack) => (
                <Link key={pack.price} href="/billing" className="block group">
                  <div
                    className={`rounded-3xl p-5 transition-all duration-300 h-full flex flex-col justify-between ${
                      pack.popular
                        ? 'bg-white border-2 border-[#DF6951] shadow-xl relative'
                        : 'bg-white border border-[#212832]/5 group-hover:border-[#DF6951]/40 group-hover:shadow-lg'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 right-3 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DF6951] text-white">
                        ⭐ Popular
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold text-[#5E6282] block">{pack.name}</span>
                      <div className="mt-2 text-2xl font-black font-serif-display text-[#181E4B]">{pack.price}</div>
                      <div className="mt-1 text-xs font-bold text-[#181E4B]">{pack.papers} Generations</div>
                      <div className="text-[11px] text-[#5E6282] mt-0.5 font-mono">{pack.rate}/paper</div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#212832]/5 text-[10px] text-[#00A389] font-bold">
                      {pack.bonus}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. JADOO SIGNATURE NEWSLETTER / LIFETIME ACCESS BANNER                    */}
      {/* ========================================================================= */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Signature Lavender Container with Concentric Circles & Floating Airplane */}
          <div className="rounded-[40px] bg-[#DFD7F9]/30 p-10 sm:p-16 relative overflow-hidden text-center shadow-lg">
            {/* Floating Purple Paper Plane Badge (Top Right) */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5956E9] to-[#7B78FF] text-white shadow-xl flex items-center justify-center -top-3 -right-3 absolute rotate-12 z-20">
              <Send className="w-6 h-6 fill-white" />
            </div>

            {/* Decorative Concentric Circular Line Art (Left Side) */}
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full border border-[#5956E9]/20 pointer-events-none -z-10" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full border border-[#5956E9]/15 pointer-events-none -z-10" />

            {/* Cross-Dot Matrix (Bottom Right) */}
            <div className="absolute bottom-6 right-8 pointer-events-none opacity-30">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#DF6951]" />
                ))}
              </div>
            </div>

            <h2 className="font-serif-display text-2xl sm:text-4xl font-bold text-[#181E4B] max-w-2xl mx-auto leading-tight mb-8">
              Subscribe to get curriculum updates, new board blueprints and lifetime access offers
            </h2>

            {/* Jadoo Inline Email Subscription Form */}
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <input
                  type="email"
                  required
                  placeholder="Your school email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-5 pr-4 py-4 rounded-2xl bg-white border border-[#212832]/10 text-xs sm:text-sm text-[#181E4B] placeholder:text-[#5E6282] focus:outline-none focus:ring-2 focus:ring-[#DF6951] shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#DF6951] hover:bg-[#c9523b] text-white text-xs sm:text-sm font-bold shadow-xl shadow-[#DF6951]/30 transition-all cursor-pointer whitespace-nowrap"
              >
                {emailSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. JADOO-STYLE 5-COLUMN FOOTER                                          */}
      {/* ========================================================================= */}
      <footer className="pt-16 pb-12 border-t border-[#212832]/5 text-left text-xs text-[#5E6282]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Column 1: Jadoo Logo & Tagline (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="flex items-center gap-1 group">
                <span className="font-heading font-black text-2xl sm:text-3xl text-[#181E4B]">
                  NoteGen
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-1.5" />
              </Link>
              <p className="text-xs text-[#5E6282] leading-relaxed max-w-xs">
                Book your school's AI transformation in minutes, get full control for lifetime.
              </p>
            </div>

            {/* Column 2: Company */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-[#181E4B]">Company</h4>
              <ul className="space-y-2">
                <li><a href="#suite" className="hover:text-[#DF6951] transition-colors">About</a></li>
                <li><a href="#workflow" className="hover:text-[#DF6951] transition-colors">Careers</a></li>
                <li><a href="#destinations" className="hover:text-[#DF6951] transition-colors">Mobile</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-[#181E4B]">Contact</h4>
              <ul className="space-y-2">
                <li><a href="#pricing" className="hover:text-[#DF6951] transition-colors">Help/FAQ</a></li>
                <li><a href="#testimonials" className="hover:text-[#DF6951] transition-colors">Press</a></li>
                <li><a href="#services" className="hover:text-[#DF6951] transition-colors">Affiliates</a></li>
              </ul>
            </div>

            {/* Column 4: More */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-[#181E4B]">More</h4>
              <ul className="space-y-2">
                <li><a href="#suite" className="hover:text-[#DF6951] transition-colors">CBSE Aligned</a></li>
                <li><a href="#ocr-scanner" className="hover:text-[#DF6951] transition-colors">Textbook OCR</a></li>
                <li><a href="#pricing" className="hover:text-[#DF6951] transition-colors">Low Fees Tips</a></li>
              </ul>
            </div>

            {/* Column 5: Social Icons & App Badges */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#181E4B] hover:text-[#DF6951] cursor-pointer">
                  f
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F1A501] via-[#DF6951] to-[#5956E9] text-white shadow-md flex items-center justify-center cursor-pointer">
                  📷
                </div>
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#181E4B] hover:text-[#DF6951] cursor-pointer">
                  🐦
                </div>
              </div>
              <p className="text-xs font-semibold text-[#181E4B]">Discover our app</p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-[#181E4B] text-white text-[10px] font-bold">
                  Google Play
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#181E4B] text-white text-[10px] font-bold">
                  Apple Store
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-[#212832]/5 text-xs text-[#5E6282]">
            <p>All rights reserved @notegen.ai</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
