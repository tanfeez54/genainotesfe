'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Printer,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Layers,
  School,
  Clock,
  Download,
  Image as ImageIcon,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Copy,
  BookOpen,
  Building2,
  UploadCloud,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_URL, getAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { printExamPaper, printRawPaperFromDom, downloadRawPaperAsPdf, autoFormatMath } from '@/lib/paperPrinter';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface RawPatternRow {
  id: string;
  label: string;
  pattern: string;
  blanksCount: number;
}

interface RawBuilderQuestion {
  id: string;
  title: string;
  marks: number;
  sectionName: string;
  subSection?: string;
  rows: RawPatternRow[];
}

interface QuestionItem {
  id: string;
  section_name?: string;
  sub_section?: string;
  type: string;
  question_text: string;
  options?: any;
  answer_text?: string;
  marks?: number;
}

interface UploadedMediaItem {
  id: string;
  name: string;
  size: string;
  type: string;
  data: string;
}

const TERMINAL_PRESETS = [
  '1st Terminal Examination',
  '2nd Terminal Examination',
  '3rd Terminal Examination',
  'Annual Examination',
];

export default function IndependentRawPaperPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'builder' | 'text'>('scan');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // School & Exam Header State (Independent & 100% Editable)
  const [schoolName, setSchoolName] = useState('Modern Public School');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [examTitle, setExamTitle] = useState('1st Terminal Examination');
  const [className, setClassName] = useState('U.K.G');
  const [subjectName, setSubjectName] = useState('English');
  const [timeAllowed, setTimeAllowed] = useState('45 Mins');
  const [totalMarks, setTotalMarks] = useState('20');
  const [instructions, setInstructions] = useState('1. Attempt all questions.\n2. Write answers clearly.');
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [headingHighlight, setHeadingHighlight] = useState<'blue' | 'yellow' | 'bold' | 'none'>('blue');
  const [solveInsidePaper, setSolveInsidePaper] = useState(true);
  const [fitSinglePage, setFitSinglePage] = useState(false);
  const [mathSpaceSize, setMathSpaceSize] = useState<'huge' | 'xlarge' | 'large' | 'medium'>('xlarge');
  const [mathColumns, setMathColumns] = useState<number>(2);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-3.5-flash-lite');
  const [isManualModel, setIsManualModel] = useState<boolean>(false);
  const [manualModelInput, setManualModelInput] = useState<string>('');

  const PRESET_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-4-hydrogen',
    'gemini-2.5-flash',
  ];

  useEffect(() => {
    const saved = localStorage.getItem('schoolpapers_gemini_model');
    if (saved) {
      setSelectedAiModel(saved);
      if (!PRESET_MODELS.includes(saved)) {
        setIsManualModel(true);
        setManualModelInput(saved);
      }
    }
  }, []);

  // Uploaded media files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMediaItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Raw Builder state (Visual Rows / Patterns)
  const [builderQuestions, setBuilderQuestions] = useState<RawBuilderQuestion[]>([
    {
      id: 'rbq-1',
      title: 'Understand the pattern in each line and draw more.',
      marks: 3,
      sectionName: 'Section A: Pattern Questions',
      subSection: 'Observe each pattern and complete the blank spaces',
      rows: [
        { id: 'r-1', label: '(i)', pattern: '^ V ^ V', blanksCount: 3 },
        { id: 'r-2', label: '(ii)', pattern: 'M W M W', blanksCount: 4 },
        { id: 'r-3', label: '(iii)', pattern: '■ ■ ■ ■', blanksCount: 4 },
        { id: 'r-4', label: '(iv)', pattern: '■ ■ ■ ■', blanksCount: 4 },
        { id: 'r-5', label: '(v)', pattern: 'A B C A', blanksCount: 3 },
        { id: 'r-6', label: '(vi)', pattern: 'A P P A', blanksCount: 3 },
      ],
    },
  ]);

  // Raw Textarea state
  const [rawText, setRawText] = useState<string>(
    `1. Write the singular to plural. (3)
Book - Books
Pen - _______
Tiger - _______
Animal - _______

2. Write the opposite words. (2)
New - _______
Near - _______
Fat - _______
Small - _______

3. Write the english. (3)
पंखा - Fan
चावल - _______
भोर - _______
सुबह - _______

4. Write the four 'ill' sound words. (2)
_______   _______
_______   _______

5. Translate in to english. (2)
कोमल - Komal`
  );

  // Final Generated Questions for Preview & Print
  const [paperQuestions, setPaperQuestions] = useState<QuestionItem[]>([]);

  // Editing state inside preview
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingMarks, setEditingMarks] = useState(1);

  // Fetch school info (Logo, Address, Name) from Settings API
  const fetchSchoolInfo = async (showToast = false) => {
    setIsLoadingSchool(true);
    try {
      const token = getAuthToken();
      if (!token) {
        if (showToast) toast.error('Session expired. Please log in.');
        return;
      }
      const res = await fetch(`${API_URL}/api/schools/my-school`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.school || data.data;
        if (s) {
          if (s.name) setSchoolName(s.name);
          if (s.logo_url) setSchoolLogo(s.logo_url);
          if (s.address) setSchoolAddress(s.address);
          if (showToast) toast.success('Loaded School Logo, Name & Address from Settings!');
        } else if (showToast) {
          toast.info('No school settings found.');
        }
      } else if (showToast) {
        toast.error('Failed to load school profile from settings.');
      }
    } catch (err) {
      console.error('Error fetching school profile:', err);
      if (showToast) toast.error('Error connecting to school settings.');
    } finally {
      setIsLoadingSchool(false);
    }
  };

  useEffect(() => {
    fetchSchoolInfo(false);
  }, []);

  // Handle Logo Upload directly from header
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSchoolLogo(reader.result as string);
      toast.success('School logo updated for PDF & preview!');
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Multi-File selection (Photos / PDFs)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadedMediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newItems.push({
        id: `media-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        data: dataUrl,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} file(s) for instant paper creation`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // AI Extract Paper from uploaded Photos / PDF
  const handleExtractFromPhotosOrPdf = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one photo or PDF');
      return;
    }

    setIsExtracting(true);
    try {
      const token = getAuthToken() || '';
      if (!token) {
        toast.error('Session expired. Please log in again.');
        setIsExtracting(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/question-papers/extract-from-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          media_files: uploadedFiles.map((f) => ({
            name: f.name,
            data: f.data,
            mimeType: f.type,
          })),
          model: selectedAiModel,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to extract paper');
      }

      const extracted = resData.data;
      const header = extracted.header || {};
      const questions = extracted.questions || [];

      // Set Header fields automatically (all remain editable)
      if (header.school_name) setSchoolName(header.school_name);
      if (header.exam_title) setExamTitle(header.exam_title);
      if (header.class_name) setClassName(header.class_name);
      if (header.subject_name) setSubjectName(header.subject_name);
      if (header.total_marks) setTotalMarks(String(header.total_marks));
      if (header.time_allowed) setTimeAllowed(header.time_allowed);
      if (header.instructions) setInstructions(header.instructions);

      if (questions.length === 0) {
        toast.warning('No questions could be extracted from the images.');
        return;
      }

      const formatted: QuestionItem[] = questions.map((q: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx + 1}`,
        section_name: q.section_name || '',
        sub_section: q.sub_section || undefined,
        type: q.type || (q.question_text?.includes('_______') ? 'fill_blank' : 'short_answer'),
        question_text: q.question_text || '',
        options: q.options || null,
        answer_text: q.answer_text || '',
        marks: Number(q.marks) || 1,
      }));

      setPaperQuestions(formatted);
      setViewMode('preview');
      toast.success(`🎉 AI extracted ${formatted.length} questions and set header from your photos!`);
    } catch (err: any) {
      console.error('Extract Error:', err);
      toast.error(err.message || 'Failed to extract questions');
    } finally {
      setIsExtracting(false);
    }
  };

  // Convert Builder to Questions
  const handleConvertBuilder = (andPrint: boolean = false) => {
    if (builderQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const newQuestions: QuestionItem[] = builderQuestions.map((bq, qIdx) => {
      const rowsFormatted = bq.rows
        .map((r) => {
          const blanks = Array(Math.max(1, r.blanksCount || 1))
            .fill('_______')
            .join('  ');
          const prefix = r.label ? `${r.label} ` : '';
          return `${prefix}${r.pattern}   ${blanks}`;
        })
        .join('\n');

      const fullQText = bq.title.trim()
        ? `${bq.title.trim()}\n${rowsFormatted}`
        : rowsFormatted;

      return {
        id: `builder-${Date.now()}-${qIdx + 1}`,
        section_name: bq.sectionName || 'Section A: Pattern Questions',
        sub_section: bq.subSection || undefined,
        type: 'fill_blank',
        question_text: fullQText,
        marks: Number(bq.marks) || 1,
      };
    });

    setPaperQuestions(newQuestions);
    setViewMode('preview');
    toast.success(`Created printable paper with ${newQuestions.length} question(s)!`);

    if (andPrint) {
      setTimeout(() => {
        triggerPrint(newQuestions);
      }, 400);
    }
  };

  // Convert Raw Text to Questions
  const handleConvertRawText = (andPrint: boolean = false) => {
    if (!rawText.trim()) {
      toast.error('Please enter raw question text');
      return;
    }

    const lines = rawText.trim().split('\n');
    const newQuestions: QuestionItem[] = [];
    const questionStartRegex = /^(?:(\d+)[\.\)]\s*|(?:[Qq]uestion|[Qq])\s*(\d+)[\.\:\)]\s*)/;
    let currentLines: string[] = [];
    let currentMarks = 1;

    const flushCurrent = () => {
      if (currentLines.length === 0) return;
      const fullText = currentLines.join('\n').trim();
      if (!fullText) return;
      newQuestions.push({
        id: `raw-${Date.now()}-${newQuestions.length + 1}`,
        section_name: 'Questions (प्रश्न)',
        type: fullText.includes('_______') ? 'fill_blank' : 'short_answer',
        question_text: fullText,
        marks: currentMarks,
      });
      currentLines = [];
      currentMarks = 1;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(questionStartRegex);
      if (match) {
        flushCurrent();
        const marksMatch = trimmed.match(/[\(\[]\s*(\d+)\s*(?:marks?|pts?|अंक)?\s*[\)\]]\s*$/i);
        if (marksMatch) {
          currentMarks = parseInt(marksMatch[1], 10) || 1;
        }
        currentLines.push(trimmed);
      } else {
        currentLines.push(line);
      }
    });
    flushCurrent();

    if (newQuestions.length === 0) {
      newQuestions.push({
        id: `raw-${Date.now()}-1`,
        section_name: 'Questions (प्रश्न)',
        type: rawText.includes('_______') ? 'fill_blank' : 'short_answer',
        question_text: rawText.trim(),
        marks: 3,
      });
    }

    setPaperQuestions(newQuestions);
    setViewMode('preview');
    toast.success(`Converted ${newQuestions.length} question(s) to printable paper!`);

    if (andPrint) {
      setTimeout(() => {
        triggerPrint(newQuestions);
      }, 400);
    }
  };

  const triggerDownloadPdf = async (questionsList?: QuestionItem[]) => {
    const list = questionsList || paperQuestions;
    if (list.length === 0) {
      toast.error('No questions available to download');
      return;
    }

    const doDownload = async () => {
      setIsDownloadingPdf(true);
      try {
        const fname = `${className || 'Class'}_${subjectName || 'Paper'}_${examTitle || 'Exam'}.pdf`;
        await downloadRawPaperAsPdf('printable-raw-paper', fname);
        toast.success('PDF downloaded successfully!');
      } catch (err: any) {
        console.error('PDF Download Error:', err);
        toast.error(err?.message || 'Failed to download PDF');
      } finally {
        setIsDownloadingPdf(false);
      }
    };

    if (viewMode !== 'preview') {
      setViewMode('preview');
      setTimeout(() => {
        doDownload();
      }, 300);
    } else {
      await doDownload();
    }
  };

  const triggerPrint = (questionsList?: QuestionItem[]) => {
    const list = questionsList || paperQuestions;
    if (list.length === 0) {
      toast.error('No questions available to print');
      return;
    }
    if (viewMode !== 'preview') {
      setViewMode('preview');
      setTimeout(() => {
        printRawPaperFromDom('printable-raw-paper');
      }, 250);
    } else {
      printRawPaperFromDom('printable-raw-paper');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        accept="image/*,application/pdf"
        multiple
        className="hidden"
      />

      {/* Hidden Logo File Input */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-amber-800 bg-amber-100/80 border border-amber-300 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Independent Instant Paper Maker
            </div>
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">Model:</span>
              <select
                value={isManualModel ? '__manual__' : selectedAiModel}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__manual__') {
                    setIsManualModel(true);
                    setManualModelInput(selectedAiModel);
                  } else {
                    setIsManualModel(false);
                    setSelectedAiModel(val);
                    localStorage.setItem('schoolpapers_gemini_model', val);
                    toast.success(`Gemini Model set to: ${val}`);
                  }
                }}
                className="text-[11px] font-bold bg-transparent text-indigo-900 dark:text-indigo-100 focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                <option value="gemini-4-hydrogen">Gemini 4 Hydrogen</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="__manual__">✏️ Manual / Custom...</option>
              </select>
              {isManualModel && (
                <div className="inline-flex items-center gap-1 ml-1">
                  <input
                    type="text"
                    value={manualModelInput}
                    onChange={(e) => setManualModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualModelInput.trim()) {
                        const m = manualModelInput.trim();
                        setSelectedAiModel(m);
                        localStorage.setItem('schoolpapers_gemini_model', m);
                        toast.success(`Manual Gemini Model set: ${m}`);
                      }
                    }}
                    placeholder="e.g. gemini-3.8-flash"
                    className="h-5 w-36 px-1.5 text-[11px] font-mono bg-white dark:bg-card border border-indigo-300 rounded text-indigo-950 dark:text-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const m = manualModelInput.trim();
                      if (!m) {
                        toast.error('Enter a model name');
                        return;
                      }
                      setSelectedAiModel(m);
                      localStorage.setItem('schoolpapers_gemini_model', m);
                      toast.success(`Manual Gemini Model set: ${m}`);
                    }}
                    className="h-5 px-2 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Instant Raw & Photo-to-Paper Generator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Syllabus ya chapter selection ki zaroorat nahi. Seedha photos, PDF ya raw questions daalein aur <strong>as-it-is A4 exam paper download/print karein</strong>!
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/80 p-1 rounded-2xl border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'editor'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>1. Paper Input</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (paperQuestions.length === 0) {
                  if (activeTab === 'scan' && uploadedFiles.length > 0) {
                    handleExtractFromPhotosOrPdf();
                    return;
                  }
                  if (activeTab === 'builder') {
                    handleConvertBuilder();
                    return;
                  }
                  handleConvertRawText();
                  return;
                }
                setViewMode('preview');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'preview'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Paper Preview ({paperQuestions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              onClick={() => triggerDownloadPdf()}
              disabled={paperQuestions.length === 0 || isDownloadingPdf}
              className="h-9 px-3.5 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs cursor-pointer"
            >
              {isDownloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span className="hidden sm:inline">{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
              <span className="sm:hidden">{isDownloadingPdf ? '...' : 'PDF'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => triggerPrint()}
              disabled={paperQuestions.length === 0}
              title="Print Exam Paper"
              className="h-9 px-3 text-xs font-bold rounded-xl border-border cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
              <span>Print</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: INDEPENDENT INPUT & EDITOR                                    */}
      {/* ========================================================================= */}
      {viewMode === 'editor' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          {/* Method Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 border border-border/80 rounded-2xl max-w-xl">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'scan'
                ? 'bg-white text-indigo-700 shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>📸 Photos / PDF AI Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'builder'
                ? 'bg-white text-amber-700 shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Layers className="w-4 h-4 text-amber-600" />
              <span>✍️ Row / Pattern Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'text'
                ? 'bg-white text-slate-800 shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>📋 Paste Raw Text</span>
            </button>
          </div>

          {/* TAB 1: 📸 PHOTO / PDF AI SCANNER */}
          {activeTab === 'scan' && (
            <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/40 via-background to-purple-50/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 uppercase mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Auto Header & Questions Extraction
                    </div>
                    <CardTitle className="text-lg font-bold text-indigo-950">
                      Upload Handwritten Test Photos or PDF
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      Apne mobile se khinchi notebook ki photo (jaise UKG English test) ya PDF upload karein — AI Class, Subject, Marks & Questions ko <strong>as-it-is detect karke print-ready bana dega</strong>!
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-9 px-3.5 text-xs font-bold border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      <span>+ Add Photos / PDF</span>
                    </Button>

                    {uploadedFiles.length > 0 && (
                      <Button
                        type="button"
                        disabled={isExtracting}
                        onClick={handleExtractFromPhotosOrPdf}
                        className="h-9 px-4 text-xs font-bold gradient-brand text-white shadow-xs cursor-pointer"
                      >
                        {isExtracting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            <span>AI Analyzing Paper...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            <span>⚡ AI Auto-Extract Paper</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* AI Model Selector Bar on Scanner */}
                <div className="mt-3 pt-2.5 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-100/80 text-indigo-900 border border-indigo-200 text-[11px] font-bold">
                      <Cpu className="w-3.5 h-3.5 text-indigo-700" />
                      <span>AI Model:</span>
                    </div>
                    <select
                      value={selectedAiModel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAiModel(val);
                        localStorage.setItem('schoolpapers_gemini_model', val);
                        toast.success(`Switched AI Model to: ${val}`);
                      }}
                      className="h-7 text-xs font-bold bg-white dark:bg-card border border-indigo-300 rounded-lg px-2.5 py-0.5 text-indigo-950 dark:text-foreground cursor-pointer shadow-2xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Fastest & Light - Recommended)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (Balanced & Fast)</option>
                      <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                      <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (High Quality)</option>
                      <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Latest Free Flagship)</option>
                      <option value="gemini-4-argon">Gemini 4 Argon</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rock Solid)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                    </select>
                  </div>

                  <Link
                    href="/settings"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                  >
                    <span>⚙️ Custom Model / Manage in Settings</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="pt-1">
                {uploadedFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Drop photos of notebook pages, handwritten tests, or PDF question papers here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports Camera Photos (JPG, PNG), Scanned Documents & PDFs • Multiple pages supported
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="relative group rounded-xl border border-indigo-200 bg-white p-2 shadow-2xs flex flex-col items-center justify-between text-center overflow-hidden"
                        >
                          {file.type.startsWith('image/') ? (
                            <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 mb-1.5">
                              <img
                                src={file.data}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-lg bg-red-50 flex flex-col items-center justify-center text-red-600 mb-1.5">
                              <FileText className="w-8 h-8" />
                              <span className="text-[10px] font-bold mt-1 uppercase">PDF Document</span>
                            </div>
                          )}
                          <p className="text-[11px] font-semibold text-slate-700 truncate w-full" title={file.name}>
                            {file.name}
                          </p>
                          <span className="text-[10px] text-slate-400">{file.size}</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(file.id);
                            }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
                      <span className="text-xs text-indigo-900 font-semibold">
                        📎 {uploadedFiles.length} file(s) attached. AI will read all pages, detect the header, and extract all questions.
                      </span>
                      <Button
                        type="button"
                        disabled={isExtracting}
                        onClick={handleExtractFromPhotosOrPdf}
                        className="h-9 px-5 text-xs font-bold gradient-brand text-white shadow-xs cursor-pointer w-full sm:w-auto"
                      >
                        {isExtracting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            <span>AI Extracting Questions...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            <span>⚡ Start AI Extraction & Generate PDF</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ✍️ ROW / PATTERN BUILDER */}
          {activeTab === 'builder' && (
            <div className="space-y-4">
              {builderQuestions.map((q, qIdx) => (
                <Card key={q.id} className="border border-border shadow-xs">
                  <CardHeader className="pb-3 bg-muted/30 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">Question {qIdx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Marks:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={q.marks}
                            onChange={(e) => {
                              const updated = [...builderQuestions];
                              updated[qIdx].marks = Number(e.target.value) || 1;
                              setBuilderQuestions(updated);
                            }}
                            className="w-16 h-7.5 text-xs font-bold text-center"
                          />
                        </div>
                        {builderQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setBuilderQuestions(builderQuestions.filter((item) => item.id !== q.id))}
                            className="h-7.5 w-7.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Question Instruction / Heading
                        </Label>
                        <Input
                          value={q.title}
                          onChange={(e) => {
                            const updated = [...builderQuestions];
                            updated[qIdx].title = e.target.value;
                            setBuilderQuestions(updated);
                          }}
                          className="h-9 text-xs sm:text-sm font-semibold mt-1"
                          placeholder="e.g. Understand the pattern in each line and draw more."
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Section Name
                        </Label>
                        <Input
                          value={q.sectionName}
                          onChange={(e) => {
                            const updated = [...builderQuestions];
                            updated[qIdx].sectionName = e.target.value;
                            setBuilderQuestions(updated);
                          }}
                          className="h-9 text-xs mt-1"
                          placeholder="e.g. Section A: Patterns"
                        />
                      </div>
                    </div>

                    {/* Pattern Rows */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between pb-1 border-b border-border">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Pattern Rows (हर लाइन और उसके खाली स्थान)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Jitna blanks count utne <code className="bg-muted px-1 rounded">_______</code> empty spaces
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.rows.map((row) => (
                          <div
                            key={row.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="w-16 shrink-0">
                              <Input
                                value={row.label}
                                onChange={(e) => {
                                  const updated = [...builderQuestions];
                                  const r = updated[qIdx].rows.find((x) => x.id === row.id);
                                  if (r) r.label = e.target.value;
                                  setBuilderQuestions(updated);
                                }}
                                className="h-8 text-xs font-bold text-center bg-card"
                                placeholder="(i)"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <Input
                                value={row.pattern}
                                onChange={(e) => {
                                  const updated = [...builderQuestions];
                                  const r = updated[qIdx].rows.find((x) => x.id === row.id);
                                  if (r) r.pattern = e.target.value;
                                  setBuilderQuestions(updated);
                                }}
                                className="h-8 text-xs sm:text-sm font-mono font-bold bg-card"
                                placeholder="Pattern e.g. ^ V ^ V or M W M W or A B C A"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Blanks:</span>
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={row.blanksCount}
                                onChange={(e) => {
                                  const updated = [...builderQuestions];
                                  const r = updated[qIdx].rows.find((x) => x.id === row.id);
                                  if (r) r.blanksCount = Math.max(1, Number(e.target.value) || 1);
                                  setBuilderQuestions(updated);
                                }}
                                className="w-14 h-8 text-xs font-bold text-center bg-card"
                              />
                            </div>

                            {/* Live Preview */}
                            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-background border border-border/60 rounded-lg text-xs flex-1 max-w-[260px] overflow-hidden whitespace-nowrap text-ellipsis">
                              <span className="font-bold text-foreground">{row.pattern || '...'}</span>
                              <span className="text-muted-foreground font-mono">
                                {Array(Math.max(1, row.blanksCount || 1)).fill('_______').join('  ')}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = [...builderQuestions];
                                updated[qIdx].rows = updated[qIdx].rows.filter((x) => x.id !== row.id);
                                setBuilderQuestions(updated);
                              }}
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = [...builderQuestions];
                            const romanLabels = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                            const nextLabel = romanLabels[updated[qIdx].rows.length] || `(${updated[qIdx].rows.length + 1})`;
                            updated[qIdx].rows.push({
                              id: `r-${Date.now()}`,
                              label: nextLabel,
                              pattern: '',
                              blanksCount: 3,
                            });
                            setBuilderQuestions(updated);
                          }}
                          className="h-8 text-xs font-semibold rounded-xl border-dashed border-border hover:bg-muted cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Add More Line / Row (+ लाइन जोड़ें)</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBuilderQuestions([
                      ...builderQuestions,
                      {
                        id: `rbq-${Date.now()}`,
                        title: 'Understand the pattern in each line and draw more.',
                        marks: 3,
                        sectionName: 'Section A: Pattern Questions',
                        rows: [
                          { id: `r-${Date.now()}-1`, label: '(i)', pattern: '', blanksCount: 3 },
                          { id: `r-${Date.now()}-2`, label: '(ii)', pattern: '', blanksCount: 3 },
                        ],
                      },
                    ]);
                  }}
                  className="h-9 text-xs font-bold rounded-xl border-dashed border-border hover:bg-muted cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Add Another Question (+ नया प्रश्न जोड़ें)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleConvertBuilder()}
                  className="h-9 px-4 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Generate Exam Paper Preview</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: 📋 PASTE RAW TEXT */}
          {activeTab === 'text' && (
            <Card className="border border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Paste Raw Question Text Here</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Preserves all lines and empty spaces
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Yahan aap direct pura question text paste kar sakte hain. Numbered questions (1., 2.) alag-alag questions ban jayenge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="font-mono text-xs sm:text-sm min-h-[300px] leading-relaxed bg-muted/20 border-border"
                  placeholder="Paste your raw questions here..."
                />

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={() => handleConvertRawText()}
                    className="h-9 px-5 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    <span>Generate Exam Paper Preview</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* EDITABLE EXAM PAPER HEADER DETAILS CARD */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <School className="w-4 h-4 text-primary" />
                    <span>Exam Paper Header Details (100% Editable)</span>
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    School logo, address aur terminal title automatically load hote hain aur print/PDF me shamil hote hain.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoadingSchool}
                    onClick={() => fetchSchoolInfo(true)}
                    className="h-8 text-xs font-semibold rounded-xl border-border hover:bg-muted cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingSchool ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                    <span>🔄 Load from School Settings</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {/* Row 1: School Name, Address & Logo */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>School Profile & Branding (Logo & Address for PDF)</span>
                  </span>
                  {schoolLogo ? (
                    <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                      ✓ Logo Attached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-slate-500">
                      No Logo (Text Only)
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* School Logo Preview & Actions */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {schoolLogo ? (
                        <img
                          src={schoolLogo}
                          alt="School Logo"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <School className="w-6 h-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3 h-3 mr-1 text-primary" />
                        <span>{schoolLogo ? 'Change Logo' : 'Upload Logo'}</span>
                      </Button>
                      {schoolLogo && (
                        <button
                          type="button"
                          onClick={() => setSchoolLogo('')}
                          className="block text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* School Name */}
                  <div className="md:col-span-4">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                      School / Institute Name
                    </Label>
                    <Input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="h-8.5 text-xs mt-1 font-semibold"
                      placeholder="e.g. Modern Public School"
                    />
                  </div>

                  {/* School Address */}
                  <div className="md:col-span-5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                      School Address (Printed under School Name)
                    </Label>
                    <Input
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="h-8.5 text-xs mt-1"
                      placeholder="e.g. Civil Lines, Main Road, New Delhi"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Terminal / Exam Title (100% Editable with quick presets) */}
              <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Terminal / Examination Title (टर्मिनल / परीक्षा का नाम - 100% Editable)</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Click below to auto-select</span>
                </div>

                <Input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="h-9 text-xs sm:text-sm font-bold bg-white dark:bg-card border-indigo-200 text-indigo-950 dark:text-foreground"
                  placeholder="e.g. 1st Terminal Examination"
                />

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Presets:</span>
                  {TERMINAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExamTitle(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${examTitle === preset
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Class, Subject, Time Allowed, Total Marks, Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Class / Grade</Label>
                  <Input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="h-8.5 text-xs mt-1 font-bold"
                    placeholder="e.g. U.K.G"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Subject</Label>
                  <Input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="h-8.5 text-xs mt-1 font-bold"
                    placeholder="e.g. English"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Time Allowed</Label>
                  <Input
                    value={timeAllowed}
                    onChange={(e) => setTimeAllowed(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="e.g. 45 Mins / 1 Hour"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Total Marks (F.M.)</Label>
                  <Input
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="h-8.5 text-xs mt-1 font-bold text-primary"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Print Layout</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant={!isTwoColumn ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsTwoColumn(false)}
                      className="h-8.5 text-xs flex-1 cursor-pointer"
                    >
                      Single
                    </Button>
                    <Button
                      type="button"
                      variant={isTwoColumn ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsTwoColumn(true)}
                      className="h-8.5 text-xs flex-1 cursor-pointer"
                    >
                      Two Col
                    </Button>
                  </div>
                </div>
              </div>

              {/* Question Heading Style Selector (Highlight / Dark Bold after 1.) */}
              <div className="pt-2 border-t border-dashed border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Question Heading Style (1. ke baad jo heading hai - Highlight / Dark Bold)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Jaise &apos;1. Understand the pattern in each line...&apos; ko dark bold ya blue highlight me dikhana
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHeadingHighlight('blue')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${headingHighlight === 'blue'
                      ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                  >
                    🔷 Blue Highlight + Dark Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingHighlight('yellow')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${headingHighlight === 'yellow'
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                  >
                    🟨 Yellow Highlight
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingHighlight('bold')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${headingHighlight === 'bold'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                  >
                    ⬛ Dark Bold Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingHighlight('none')}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${headingHighlight === 'none'
                      ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-2xs font-bold'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      }`}
                  >
                    Plain
                  </button>
                </div>
              </div>

              {/* Solve Inside Paper Toggle for Junior / KG Classes */}
              <div className="p-3.5 rounded-xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="solveInsidePaperCheck"
                      checked={solveInsidePaper}
                      onChange={(e) => setSolveInsidePaper(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label htmlFor="solveInsidePaperCheck" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span>📝 Solve Directly on Paper (Question-cum-Answer Worksheet / उत्तर इसी में हल करें)</span>
                    </Label>
                    <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-100 border-amber-300 font-semibold">
                      Junior / KG Recommended
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-6">
                    Chhote bachhon (Nursery, KG, UKG, Class 1-4) ke liye: Har question ke sath likhne ki khuli jagah, tall writing blanks, aur &quot;Marks Obtained&quot; box shamil karta hai.
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant={solveInsidePaper ? 'default' : 'outline'}
                    onClick={() => setSolveInsidePaper(!solveInsidePaper)}
                    className="h-8 text-xs font-bold cursor-pointer"
                  >
                    {solveInsidePaper ? '✓ Solve-on-Paper Active' : 'Off (Standard Question Paper)'}
                  </Button>
                </div>
              </div>

              {/* Single Page Fitting Optimization (1-Page Test / 20 Marks) */}
              <div className="p-3.5 rounded-xl border border-emerald-300/80 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fitSinglePageCheck"
                      checked={fitSinglePage}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFitSinglePage(checked);
                        if (checked) setMathSpaceSize('medium');
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <Label htmlFor="fitSinglePageCheck" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span>📄 Fit 1 Single Page (20 Marks Test / 1 पेज में पूरा पेपर फिट करें)</span>
                    </Label>
                    <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-100 border-emerald-300 font-bold">
                      {fitSinglePage ? '1 Page Active' : 'Off'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-6">
                    Weekly / Terminal tests (10–25 marks) ke liye margins aur calculation cells ko calibrate karta hai taki paper <strong>100% ek hi single A4 page me download/print ho</strong>.
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant={fitSinglePage ? 'default' : 'outline'}
                    onClick={() => {
                      const next = !fitSinglePage;
                      setFitSinglePage(next);
                      if (next) setMathSpaceSize('medium');
                    }}
                    className={`h-8 text-xs font-bold cursor-pointer ${fitSinglePage ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                  >
                    {fitSinglePage ? '✓ Single Page Fit: ON' : 'Multi-Page Allowed'}
                  </Button>
                </div>
              </div>

              {/* Math / Division Solving Space Options */}
              <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>➗ Math & Division Solving Space (गणित / भाग हल करने की खुली जगह)</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Chhote bachhon ke long division (jaise 5 ) 7380 ( ) ke step-by-step subtraction aur calculation ke liye baddi jagah.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-card border border-border p-1 rounded-xl">
                    <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase">Space:</span>
                    <button
                      type="button"
                      onClick={() => setMathSpaceSize('huge')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'huge'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                      title="Huge Space (290px height) - Ideal for 4-digit long divisions"
                    >
                      🟣 Huge (290px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathSpaceSize('xlarge')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'xlarge'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                      title="Extra Large (230px height) - Recommended"
                    >
                      🟢 Extra Large (230px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathSpaceSize('large')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'large'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      🟡 Large (180px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathSpaceSize('medium')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'medium'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      ⚪ Medium (130px)
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-card border border-border p-1 rounded-xl">
                    <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase">Cols:</span>
                    <button
                      type="button"
                      onClick={() => setMathColumns(2)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathColumns === 2
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                      title="2 Columns (Spacious width for children)"
                    >
                      2 Col (Best)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathColumns(1)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathColumns === 1
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                      title="1 Column (Full page width workspace)"
                    >
                      1 Col (Full Width)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathColumns(3)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathColumns === 3
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      3 Col
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-2 border-t border-dashed border-border/70">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  General Instructions (Optional)
                </Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="text-xs min-h-[50px] mt-1 bg-muted/20"
                  placeholder="Enter exam instructions..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: FULL A4 PRINTABLE PAPER PREVIEW & DOWNLOAD                   */}
      {/* ========================================================================= */}
      {viewMode === 'preview' && (
        <div className="max-w-5xl mx-auto space-y-4 animate-fade-in pb-24 md:pb-6">
          {/* Document Control Bar */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('editor')}
                className="h-8 px-3 text-xs font-semibold rounded-xl border-border cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <span>Back to Editor / Upload</span>
              </Button>

              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ {paperQuestions.length} Questions Ready
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Heading Highlight & Dark Bold Style */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase">Style:</span>
                <button
                  type="button"
                  onClick={() => setHeadingHighlight('blue')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${headingHighlight === 'blue'
                    ? 'bg-sky-500 text-white shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Blue Highlight + Dark Bold"
                >
                  🔷 Blue
                </button>
                <button
                  type="button"
                  onClick={() => setHeadingHighlight('yellow')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${headingHighlight === 'yellow'
                    ? 'bg-amber-400 text-amber-950 shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Yellow Highlight + Dark Bold"
                >
                  🟨 Yellow
                </button>
                <button
                  type="button"
                  onClick={() => setHeadingHighlight('bold')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${headingHighlight === 'bold'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Dark Bold Only"
                >
                  ⬛ Dark Bold
                </button>
                <button
                  type="button"
                  onClick={() => setHeadingHighlight('none')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all ${headingHighlight === 'none'
                    ? 'bg-slate-300 text-slate-800 shadow-2xs font-bold'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Plain Text"
                >
                  Plain
                </button>
              </div>

              {/* Solve on Paper Pill Button */}
              <button
                type="button"
                onClick={() => setSolveInsidePaper(!solveInsidePaper)}
                className={`h-8 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${solveInsidePaper
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                title="Toggle Question-cum-Answer Sheet (Extra blank lines for kids to solve on paper)"
              >
                <span>📝 Solve on Paper: {solveInsidePaper ? 'ON' : 'OFF'}</span>
              </button>

              {/* Fit Single Page Pill Button (Essential for 20 Marks Test) */}
              <button
                type="button"
                onClick={() => {
                  const next = !fitSinglePage;
                  setFitSinglePage(next);
                  if (next) setMathSpaceSize('medium');
                }}
                className={`h-8 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${fitSinglePage
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                title="Strictly fit whole paper onto 1 Single A4 Page (Ideal for 20-mark tests)"
              >
                <span>📄 1-Page Fit: {fitSinglePage ? 'ON (20 Mks)' : 'OFF'}</span>
              </button>

              {/* Math Space Size in Preview */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase">Math:</span>
                <button
                  type="button"
                  onClick={() => setMathSpaceSize('huge')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'huge'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Huge Space (290px height) - Max room for long division"
                >
                  🟣 Huge
                </button>
                <button
                  type="button"
                  onClick={() => setMathSpaceSize('xlarge')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'xlarge'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Extra Large (230px height) - Recommended"
                >
                  🟢 X-Large
                </button>
                <button
                  type="button"
                  onClick={() => setMathSpaceSize('large')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${mathSpaceSize === 'large'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                  title="Large (180px height)"
                >
                  🟡 Large
                </button>
                <button
                  type="button"
                  onClick={() => setMathColumns(mathColumns === 2 ? 1 : 2)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all bg-background border border-border hover:bg-muted text-foreground ml-1"
                  title="Toggle 1 Column or 2 Columns for math workspace"
                >
                  {mathColumns === 1 ? '1 Col (Full)' : '2 Col (Wide)'}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTwoColumn(!isTwoColumn)}
                className="h-8 px-3 text-xs font-semibold rounded-xl border-border cursor-pointer shadow-2xs"
              >
                Layout: {isTwoColumn ? 'Two Column' : 'Single Column'}
              </Button>

              <Button
                type="button"
                onClick={() => triggerDownloadPdf()}
                disabled={isDownloadingPdf}
                className="h-8 px-4 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs cursor-pointer"
              >
                {isDownloadingPdf ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>{isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => triggerPrint()}
                title="Print Exam Paper"
                className="h-8 px-3 text-xs font-bold rounded-xl border-border cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                <span>Print</span>
              </Button>
            </div>
          </div>

          {/* Quick Terminal & Header Editor Toolbar inside Preview */}
          <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-foreground shrink-0">Terminal / Exam:</span>
              <Input
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="h-8 text-xs font-bold bg-background max-w-sm"
                placeholder="e.g. 1st Terminal Examination"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {TERMINAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setExamTitle(preset)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${examTitle === preset
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Printable A4 Paper Container */}
          <div className="w-full flex justify-center py-2 print:p-0 overflow-x-auto">
            <div
              id="printable-raw-paper"
              className="print-page w-full min-w-0 sm:min-w-[700px] max-w-[800px] bg-white border border-slate-300 rounded-xl p-6 sm:p-10 shadow-xl text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0"
            >
              {/* Exam Header with Logo, Name, Address & Terminal Title */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
                <div className="relative flex flex-col sm:flex-row items-center justify-center text-center min-h-[60px]">
                  {schoolLogo && (
                    <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex items-center justify-center mb-2 sm:mb-0">
                      <img
                        src={schoolLogo}
                        alt="School Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="max-w-[calc(100%-140px)] mx-auto text-center">
                    {schoolName && (
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 leading-tight">
                        {schoolName}
                      </h1>
                    )}
                    {schoolAddress && (
                      <p className="text-[11px] sm:text-xs text-slate-600 font-bold uppercase mt-0.5">
                        {schoolAddress}
                      </p>
                    )}
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider pt-1">
                      {examTitle || 'EXAMINATION'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-300 text-xs font-bold text-slate-800">
                  <div>CLASS: {className}</div>
                  <div>SUBJECT: {subjectName}</div>
                  <div>TIME: {timeAllowed}</div>
                  <div>FULL MARKS: {totalMarks}</div>
                </div>
              </div>

              {/* Candidate Details & Signatures Row */}
              <div className="space-y-2.5 border-b border-slate-200 pb-2.5 mb-3 text-xs font-medium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="shrink-0 font-bold text-slate-900">Name of Candidate:</span>
                    <span className="border-b-2 border-slate-900 border-dotted flex-1 min-w-[120px] inline-block h-3"></span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">Roll No:</span>
                      <span className="border-b-2 border-slate-900 border-dotted w-14 inline-block h-3"></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">Section:</span>
                      <span className="border-b-2 border-slate-900 border-dotted w-10 inline-block h-3"></span>
                    </span>
                    {solveInsidePaper && (
                      <div className="flex items-center gap-1 border-2 border-slate-900 rounded-md px-2 py-0.5 font-bold text-[11px] bg-slate-50 text-slate-950 shadow-2xs">
                        <span>Marks:</span>
                        <span className="border-b-2 border-slate-900 border-dotted w-8 inline-block h-3"></span>
                        <span>/ {totalMarks}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invigilator & Examiner Signatures */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="shrink-0 font-bold text-slate-900">Invigilator&apos;s Signature:</span>
                    <span className="border-b-2 border-slate-900 border-dotted flex-1 min-w-[120px] max-w-[220px] inline-block h-3.5"></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 sm:justify-end">
                    <span className="shrink-0 font-bold text-slate-900">Examiner&apos;s Signature:</span>
                    <span className="border-b-2 border-slate-900 border-dotted flex-1 min-w-[120px] max-w-[220px] inline-block h-3.5"></span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {instructions && (
                <div className="text-[11px] text-slate-700 italic pb-2 mb-3 border-b border-dashed border-slate-300 whitespace-pre-wrap">
                  <strong>Instructions:</strong> {instructions}
                </div>
              )}

              {/* Questions List */}
              <div
                className={`space-y-2 ${isTwoColumn ? 'columns-1 md:columns-2 gap-6 [column-rule:1px_solid_#cbd5e1]' : ''
                  }`}
              >
                {paperQuestions.map((q, qIdx) => {
                  const hasMath =
                    /\b(divide|division|भाग|quotient|remainder|multiply|multiplication|गुणा|product|addition|subtraction|solve|calculate)\b/i.test(
                      (q.question_text || '').split('\n')[0] || ''
                    ) ||
                    /\d+\s*\)\s*\d+/.test(q.question_text || '') ||
                    /[÷×]/.test((q.question_text || '').split('\n')[0] || '');

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`raw-q-block text-xs relative group ${hasMath ? '' : 'raw-q-item break-inside-avoid print:break-inside-avoid'} ${solveInsidePaper
                        ? fitSinglePage
                          ? 'mb-1.5'
                          : 'mb-2.5'
                        : 'mb-2'
                        }`}
                    >
                      <div className="flex items-start justify-between font-medium leading-relaxed">
                        <div className="flex-1 flex items-start gap-1.5">
                          <span className="font-extrabold text-slate-950 shrink-0 min-w-[22px]">{qIdx + 1}.</span>
                          {editingQuestionIdx === qIdx ? (
                            <div className="flex-1 space-y-2 p-2 rounded border border-indigo-300 bg-indigo-50/40">
                              <Textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="text-xs min-h-[60px] bg-white"
                              />
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px]">Marks:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={editingMarks}
                                  onChange={(e) => setEditingMarks(Number(e.target.value) || 1)}
                                  className="w-16 h-6 text-xs bg-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...paperQuestions];
                                    updated[qIdx].question_text = editingText;
                                    updated[qIdx].marks = editingMarks;
                                    setPaperQuestions(updated);
                                    setEditingQuestionIdx(null);
                                  }}
                                  className="h-6 text-[10px] px-2"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingQuestionIdx(null)}
                                  className="h-6 text-[10px] px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            (() => {
                              const lines = (q.question_text || '').split('\n');
                              const firstLine = lines[0] || '';
                              const remainingLines = lines.slice(1).join('\n');

                              const rawSubItems = remainingLines
                                .split('\n')
                                .map((l) => l.trim())
                                .filter(Boolean);

                              const isMathQuestion =
                                /\b(divide|division|भाग|quotient|remainder|multiply|multiplication|गुणा|product|addition|subtraction|solve|calculate)\b/i.test(firstLine) ||
                                /\d+\s*\)\s*\d+/.test(q.question_text || '') ||
                                /[÷×]/.test(firstLine);

                              let mathSubGrid = null;
                              if (isMathQuestion && rawSubItems.length >= 1) {
                                const numColsClass =
                                  mathColumns === 1 || rawSubItems.length === 1
                                    ? 'grid-cols-1'
                                    : mathColumns === 3
                                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                                      : 'grid-cols-1 sm:grid-cols-2';

                                const boxMinHeightPx =
                                  fitSinglePage
                                    ? 135
                                    : mathSpaceSize === 'huge'
                                      ? 290
                                      : mathSpaceSize === 'xlarge'
                                        ? 230
                                        : mathSpaceSize === 'large'
                                          ? 180
                                          : 130;

                                mathSubGrid = (
                                  <div className={`grid gap-3 my-2 ${numColsClass}`}>
                                    {rawSubItems.map((sub, sIdx) => (
                                      <div
                                        key={sIdx}
                                        style={{
                                          minHeight: `${boxMinHeightPx}px`,
                                          ['--box-min-h' as any]: `${boxMinHeightPx}px`,
                                        }}
                                        className="math-calc-box break-inside-avoid print:break-inside-avoid border-2 border-dashed border-slate-400 rounded-xl p-3 bg-white flex flex-col justify-start shadow-2xs hover:border-indigo-400 transition-colors"
                                      >
                                        <div className="font-bold text-sm sm:text-base text-slate-950 font-mono tracking-wider border-b border-slate-300 pb-1.5">
                                          <span>{sub}</span>
                                        </div>
                                        <div className="flex-1 w-full pt-2"></div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              let highlightClasses = 'font-bold text-slate-900 inline';
                              if (headingHighlight === 'blue') {
                                highlightClasses = 'font-bold text-sky-950 bg-sky-100/90 border border-sky-200/80 px-1.5 py-0.5 rounded shadow-2xs inline print:bg-sky-100 print:text-sky-950';
                              } else if (headingHighlight === 'yellow') {
                                highlightClasses = 'font-bold text-amber-950 bg-amber-100/90 border border-amber-200/80 px-1.5 py-0.5 rounded shadow-2xs inline print:bg-amber-100 print:text-amber-950';
                              } else if (headingHighlight === 'bold') {
                                highlightClasses = 'font-black text-slate-950 inline';
                              } else {
                                highlightClasses = 'font-medium text-slate-900 inline';
                              }

                              // Match the Following 2-Column Table Renderer
                              const isMatchQuestion =
                                q.type === 'match_the_following' ||
                                Boolean(q.options && !Array.isArray(q.options) && (q.options.column_a || q.options.columnA)) ||
                                /\b(match\s+the\s+following|match\s+column|match\s+with|मिलान|जोड़े)\b/i.test(firstLine);

                              let matchTableEl = null;
                              if (isMatchQuestion) {
                                let colA: string[] = [];
                                let colB: string[] = [];

                                if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
                                  const rawA = q.options.column_a || q.options.columnA || [];
                                  const rawB = q.options.column_b || q.options.columnB || [];
                                  colA = rawA.map((it: any) => (typeof it === 'string' ? it : it?.text || ''));
                                  colB = rawB.map((it: any) => (typeof it === 'string' ? it : it?.text || ''));
                                }

                                if (colA.length === 0 && rawSubItems.length > 0) {
                                  const colBHeaderIdx = rawSubItems.findIndex((l) => /^column\s*b\b/i.test(l));
                                  if (colBHeaderIdx > 0) {
                                    colA = rawSubItems
                                      .slice(0, colBHeaderIdx)
                                      .filter((l) => !/^column\s*a\b/i.test(l))
                                      .map((l) => l.replace(/^\s*(?:\(\s*[ivxIVX0-9a-zA-Z]+\s*\)|[0-9]+[\.\)]|[a-zA-Z][\.\)])\s*/, '').trim());
                                    colB = rawSubItems
                                      .slice(colBHeaderIdx + 1)
                                      .map((l) => l.replace(/^\s*(?:\(\s*[ivxIVX0-9a-zA-Z]+\s*\)|[0-9]+[\.\)]|[a-zA-Z][\.\)])\s*/, '').trim());
                                  } else {
                                    rawSubItems
                                      .filter((l) => !/^column\s*a\b.*\bcolumn\s*b\b/i.test(l))
                                      .forEach((line) => {
                                        const cleaned = line.replace(/^\s*(?:\(\s*[ivxIVX0-9a-zA-Z]+\s*\)|[0-9]+[\.\)]|[a-zA-Z][\.\)])\s*/, '');
                                        const parts = cleaned.split(/\s*(?:\||->|=>|\t|\s{2,}|\s-\s)\s*/);
                                        if (parts.length >= 2) {
                                          colA.push(parts[0].trim());
                                          colB.push(parts.slice(1).join(' ').replace(/^\s*(?:\(\s*[a-zA-Z0-9]+\s*\)|[a-zA-Z][\.\)])\s*/, '').trim());
                                        } else {
                                          colA.push(cleaned.trim());
                                          colB.push('');
                                        }
                                      });
                                  }
                                }

                                const stripPrefix = (val: string) =>
                                  val.replace(/^\s*(?:\(\s*[ivxIVX0-9a-zA-Z]+\s*\)|[0-9]+[\.\)]|[a-zA-Z][\.\)])\s*/, '').trim();

                                const maxMatchRows = Math.max(colA.length, colB.length);
                                if (maxMatchRows > 0) {
                                  const romanNums = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
                                  matchTableEl = (
                                    <div className="my-2 max-w-[540px] rounded-lg border border-slate-300 bg-white overflow-hidden">
                                      <table className="w-full border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 border-b border-slate-300">
                                            <th className="text-left font-bold text-slate-900 px-3 py-1.5 w-[42%]">
                                              Column A
                                            </th>
                                            <th className="w-[16%]"></th>
                                            <th className="text-left font-bold text-slate-900 px-3 py-1.5 w-[42%]">
                                              Column B
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.from({ length: maxMatchRows }).map((_, rIdx) => {
                                            const labelA = romanNums[rIdx] ? `(${romanNums[rIdx]})` : `${rIdx + 1}.`;
                                            const labelB = `(${String.fromCharCode(65 + rIdx)})`;
                                            const valA = stripPrefix(colA[rIdx] || '');
                                            const valB = stripPrefix(colB[rIdx] || '');
                                            return (
                                              <tr key={rIdx} className="border-b last:border-b-0 border-slate-200/80">
                                                <td className="px-3 py-2 font-medium text-slate-900 align-middle">
                                                  {valA && (
                                                    <>
                                                      <span className="font-bold mr-1.5">{labelA}</span>
                                                      <Latex>{autoFormatMath(valA)}</Latex>
                                                    </>
                                                  )}
                                                </td>
                                                <td className="py-2"></td>
                                                <td className="px-3 py-2 font-medium text-slate-900 align-middle">
                                                  {valB && (
                                                    <>
                                                      <span className="font-bold mr-1.5">{labelB}</span>
                                                      <Latex>{autoFormatMath(valB)}</Latex>
                                                    </>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                              }

                              // Pre-Primary (Nursery / LKG / UKG) Worksheet Enhancement:
                              // Keep exact underline/dash look from the paper, just neatly aligned in clean columns
                              let kidsWorksheetEl = null;
                              const isCountingGrid =
                                !isMatchQuestion &&
                                !isMathQuestion &&
                                rawSubItems.length > 0 &&
                                (/\b(counting|count\s+and\s+write|missing\s+number|1\s+to\s+\d+|\d+\s+to\s+\d+|a\s+to\s+z)\b/i.test(firstLine) ||
                                  rawSubItems.some((l) => (l.match(/_{2,}/g) || []).length >= 3));

                              const isAfterBeforeBetween =
                                !isMatchQuestion &&
                                !isMathQuestion &&
                                !isCountingGrid &&
                                rawSubItems.length > 0 &&
                                (/\b(comes\s+after|comes\s+before|comes\s+between|what\s+comes)\b/i.test(firstLine) ||
                                  rawSubItems.every((l) => /^\s*(?:\d+\s*[-_]+\s*|_{2,}\s*\d+)\s*$/.test(l)));

                              if (isCountingGrid) {
                                const tokens = rawSubItems
                                  .join(' ')
                                  .split(/\s+/)
                                  .map((t) => t.trim())
                                  .filter(Boolean);
                                if (tokens.length >= 4) {
                                  const cols = tokens.length <= 5 ? tokens.length : 5;
                                  kidsWorksheetEl = (
                                    <div
                                      className={`grid gap-x-5 gap-y-4 my-2.5 max-w-[480px] ${
                                        cols === 4 ? 'grid-cols-4' : 'grid-cols-5'
                                      }`}
                                    >
                                      {tokens.map((tok, tIdx) => {
                                        const isBlank = /^_{2,}$/.test(tok);
                                        return (
                                          <div
                                            key={tIdx}
                                            className={`h-8 pb-0.5 flex items-end justify-center text-sm font-bold ${
                                              isBlank ? 'border-b-2 border-slate-900' : 'border-b-2 border-slate-900 text-slate-950'
                                            }`}
                                          >
                                            {isBlank ? '' : tok}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                              } else if (isAfterBeforeBetween) {
                                const items: Array<{ left: string; mid: string; right: string }> = [];
                                rawSubItems.forEach((line) => {
                                  const chunks = line.split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
                                  chunks.forEach((ch) => {
                                    const betweenMatch = ch.match(/^([0-9a-zA-Z]+)\s+_{2,}\s+([0-9a-zA-Z]+)$/);
                                    const beforeMatch = ch.match(/^_{2,}\s*([0-9a-zA-Z]+)$/);
                                    const afterMatch = ch.match(/^([0-9a-zA-Z]+)\s*[-_]+\s*$/);
                                    if (betweenMatch) {
                                      items.push({ left: betweenMatch[1], mid: 'BLANK', right: betweenMatch[2] });
                                    } else if (beforeMatch) {
                                      items.push({ left: 'BLANK', mid: '', right: beforeMatch[1] });
                                    } else if (afterMatch) {
                                      items.push({ left: afterMatch[1], mid: '-', right: 'BLANK' });
                                    } else {
                                      items.push({ left: ch.replace(/_{2,}/g, '').trim(), mid: '-', right: 'BLANK' });
                                    }
                                  });
                                });

                                if (items.length > 0) {
                                  kidsWorksheetEl = (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 my-2">
                                      {items.map((it, idx) => (
                                        <div key={idx} className="flex items-end gap-2 text-sm font-bold text-slate-950">
                                          {it.left === 'BLANK' ? (
                                            <span className="w-16 h-6 border-b-2 border-slate-900 inline-block shrink-0"></span>
                                          ) : (
                                            <span className="min-w-[18px] text-center">{it.left}</span>
                                          )}
                                          {it.mid && (
                                            it.mid === 'BLANK' ? (
                                              <span className="w-16 h-6 border-b-2 border-slate-900 inline-block shrink-0"></span>
                                            ) : (
                                              <span className="text-slate-900">{it.mid}</span>
                                            )
                                          )}
                                          {it.right === 'BLANK' ? (
                                            <span className="w-16 h-6 border-b-2 border-slate-900 inline-block shrink-0"></span>
                                          ) : (
                                            <span className="min-w-[18px] text-center">{it.right}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                              }

                              return (
                                <div className="flex-1 min-w-0">
                                  <span className={highlightClasses}>
                                    <Latex>{autoFormatMath(firstLine)}</Latex>
                                  </span>
                                  {matchTableEl ? (
                                    matchTableEl
                                  ) : kidsWorksheetEl ? (
                                    kidsWorksheetEl
                                  ) : mathSubGrid ? (
                                    mathSubGrid
                                  ) : q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 ? (
                                    <div className="mt-1.5 space-y-1.5">
                                      {remainingLines.trim() && (
                                        <div className="text-xs sm:text-[13px] font-medium text-slate-900 whitespace-pre-wrap leading-snug">
                                          <Latex>{autoFormatMath(remainingLines)}</Latex>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 pl-3 pt-0.5">
                                        {q.options.map((opt: any, oIdx: number) => {
                                          const label = String.fromCharCode(65 + oIdx);
                                          const txt = typeof opt === 'string' ? opt : opt?.text || '';
                                          return (
                                            <div key={oIdx} className="text-xs text-slate-900 flex items-center gap-1.5">
                                              <span className="font-bold">({label})</span>
                                              <span><Latex>{autoFormatMath(txt)}</Latex></span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : remainingLines.trim() ? (
                                    (() => {
                                      const hasOptionLines = rawSubItems.some((l) =>
                                        /(?:\(\s*[ivxIVXa-dA-D0-9]+\s*\)|[☐□])/.test(l)
                                      );
                                      if (hasOptionLines) {
                                        return (
                                          <div className="mt-1.5 space-y-1.5 pl-1">
                                            {rawSubItems.map((line, lIdx) => {
                                              const optTokens = line
                                                .split(/(?=\(\s*(?:i{1,3}|iv|v|vi{0,3}|[a-dA-D])\s*\))/)
                                                .map((s) => s.trim())
                                                .filter(Boolean);
                                              if (optTokens.length >= 2) {
                                                const colsCls =
                                                  optTokens.length === 2
                                                    ? 'grid-cols-2'
                                                    : optTokens.length === 4
                                                      ? 'grid-cols-2 sm:grid-cols-4'
                                                      : 'grid-cols-3';
                                                return (
                                                  <div
                                                    key={lIdx}
                                                    className={`grid ${colsCls} gap-x-4 gap-y-1 pl-4 pb-1.5 text-xs text-slate-800`}
                                                  >
                                                    {optTokens.map((tok, tIdx) => (
                                                      <div key={tIdx} className="flex items-center gap-1.5">
                                                        <span><Latex>{autoFormatMath(tok)}</Latex></span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                );
                                              }
                                              return (
                                                <div key={lIdx} className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug pt-0.5">
                                                  <Latex>{autoFormatMath(line)}</Latex>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className={`mt-1 font-normal text-slate-900 whitespace-pre-wrap ${solveInsidePaper ? (fitSinglePage ? 'leading-[1.65rem] text-sm font-medium' : 'leading-[1.95rem] text-sm font-medium') : 'leading-relaxed'}`}>
                                          <Latex>{autoFormatMath(remainingLines)}</Latex>
                                        </div>
                                      );
                                    })()
                                  ) : solveInsidePaper && !q.question_text?.includes('_______') && !isMathQuestion && !isMatchQuestion ? (
                                    <div className="mt-2 ml-2 space-y-1.5">
                                      <div className="h-6 border-b border-dashed border-slate-300 flex items-end">
                                        <span className="text-[11px] font-bold text-slate-500 mr-2">Ans:</span>
                                      </div>
                                      {!fitSinglePage && <div className="h-6 border-b border-dashed border-slate-300"></div>}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()
                          )}
                        </div>
                        <span className="font-bold text-slate-700 ml-2 shrink-0">
                          ({q.marks || 1})
                        </span>
                      </div>

                      {/* Hover Edit Button (Hidden in print) */}
                      <div className="print:hidden opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionIdx(qIdx);
                            setEditingText(q.question_text);
                            setEditingMarks(q.marks || 1);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaperQuestions(paperQuestions.filter((_, idx) => idx !== qIdx));
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 ml-2"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
