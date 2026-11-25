'use client';

import { useState, useEffect, useRef } from 'react';
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
  Eye,
  BookOpen,
  School,
  Clock,
  Layers,
  GraduationCap,
  Save,
  Key,
  Download,
  Image as ImageIcon,
  Upload,
  X,
  Scale,
  Columns,
  Sliders,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  CheckSquare,
  AlignLeft,
  ListOrdered,
  Shuffle,
  FileCheck2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Cloud,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_URL, getAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { printExamPaper, autoFormatMath } from '@/lib/paperPrinter';

export type QuestionType =
  | 'mcq'
  | 'fill_blank'
  | 'true_false'
  | 'match_the_following'
  | 'picture_based'
  | 'short_answer'
  | 'long_answer';

export interface RawPatternRow {
  id: string;
  label: string;
  pattern: string;
  blanksCount: number;
}

export interface RawBuilderQuestion {
  id: string;
  title: string;
  marks: number;
  sectionName: string;
  subSection?: string;
  rows: RawPatternRow[];
}

export interface SectionConfigItem {
  id: string;
  section_name: string;
  sub_section?: string;
  instructions?: string;
  type: QuestionType;
  count: number;
  marks_per_question: number;
  difficulty: 'easy' | 'medium' | 'hard';
  enabled: boolean;
}

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
  class_id: string;
}

interface ChapterItem {
  id: string;
  title: string;
  subject_id: string;
  has_pdf?: boolean;
  pdf_url?: string | null;
  documents_count?: number;
  pdf_scans?: any[];
  subjects?: {
    id?: string;
    name?: string;
    class_id?: string;
    classes?: {
      id?: string;
      name?: string;
    };
  };
}

interface QuestionItem {
  id: string;
  section_name?: string;
  sub_section?: string;
  chapter_id?: string;
  chapter_title?: string;
  type: string;
  question_text: string;
  options?: any;
  correct_option?: string;
  correct_answer?: string;
  answer_text?: string;
  image_url?: string | null;
  marks?: number;
  difficulty?: string;
}

export interface UploadedPdfItem {
  id: string;
  name: string;
  size: string;
  dataUrl: string;
  file?: File;
  isCloudflare?: boolean;
}

const SECTION_TYPE_METADATA: Record<
  QuestionType,
  { label: string; defaultMarks: number; defaultCount: number; badgeColor: string; icon: any }
> = {
  mcq: {
    label: 'Multiple Choice (MCQ)',
    defaultMarks: 1,
    defaultCount: 5,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: CheckSquare,
  },
  fill_blank: {
    label: 'Fill in the Blanks',
    defaultMarks: 1,
    defaultCount: 5,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: AlignLeft,
  },
  true_false: {
    label: 'True / False',
    defaultMarks: 1,
    defaultCount: 4,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: CheckCircle2,
  },
  match_the_following: {
    label: 'Match the Following',
    defaultMarks: 4,
    defaultCount: 2,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Shuffle,
  },
  picture_based: {
    label: 'Picture / Diagram Based (चित्र आधारित प्रश्न)',
    defaultMarks: 3,
    defaultCount: 2,
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: ImageIcon,
  },
  short_answer: {
    label: 'Short Answer Questions',
    defaultMarks: 3,
    defaultCount: 4,
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: FileText,
  },
  long_answer: {
    label: 'Long / Essay Questions',
    defaultMarks: 5,
    defaultCount: 2,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ListOrdered,
  },
};

const DEFAULT_SECTIONS: SectionConfigItem[] = [
  {
    id: 'sec-1',
    section_name: 'Section A: Multiple Choice Questions',
    type: 'mcq',
    count: 5,
    marks_per_question: 1,
    difficulty: 'easy',
    enabled: true,
  },
  {
    id: 'sec-2',
    section_name: 'Section B: Fill in the Blanks',
    type: 'fill_blank',
    count: 5,
    marks_per_question: 1,
    difficulty: 'easy',
    enabled: true,
  },
  {
    id: 'sec-3',
    section_name: 'Section C: Match the Following',
    type: 'match_the_following',
    count: 2,
    marks_per_question: 4,
    difficulty: 'medium',
    enabled: true,
  },
  {
    id: 'sec-4',
    section_name: 'Section D: True or False',
    type: 'true_false',
    count: 4,
    marks_per_question: 1,
    difficulty: 'easy',
    enabled: false,
  },
  {
    id: 'sec-5',
    section_name: 'Section E: Picture / Diagram Based Questions (चित्र आधारित प्रश्न)',
    type: 'picture_based',
    count: 2,
    marks_per_question: 3,
    difficulty: 'medium',
    enabled: true,
  },
  {
    id: 'sec-6',
    section_name: 'Section F: Short Answer Questions',
    type: 'short_answer',
    count: 4,
    marks_per_question: 3,
    difficulty: 'medium',
    enabled: true,
  },
  {
    id: 'sec-7',
    section_name: 'Section G: Long Answer Questions',
    type: 'long_answer',
    count: 2,
    marks_per_question: 5,
    difficulty: 'hard',
    enabled: true,
  },
];

export interface ExamPreset {
  id: string;
  name: string;
  badge: string;
  defaultTime: string;
  defaultMarks: string;
  sections: SectionConfigItem[];
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'unit_test_20',
    name: '20M Unit Test',
    badge: 'Class Test',
    defaultTime: '45 Mins',
    defaultMarks: '20',
    sections: [
      { id: 'sec-1', section_name: 'Section A: Multiple Choice Questions', type: 'mcq', count: 5, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-2', section_name: 'Section B: Fill in the Blanks', type: 'fill_blank', count: 5, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-3', section_name: 'Section C: Short Answer Questions', type: 'short_answer', count: 2, marks_per_question: 2.5, difficulty: 'medium', enabled: true },
      { id: 'sec-4', section_name: 'Section D: Long / Application Question', type: 'long_answer', count: 1, marks_per_question: 5, difficulty: 'medium', enabled: true },
    ],
  },
  {
    id: 'periodic_40',
    name: '40M Periodic Test',
    badge: 'Mid-Term',
    defaultTime: '1.5 Hours',
    defaultMarks: '40',
    sections: [
      { id: 'sec-1', section_name: 'Section A: Multiple Choice Questions', type: 'mcq', count: 8, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-2', section_name: 'Section B: Fill in the Blanks', type: 'fill_blank', count: 5, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-3', section_name: 'Section C: Match the Following', type: 'match_the_following', count: 1, marks_per_question: 4, difficulty: 'medium', enabled: true },
      { id: 'sec-4', section_name: 'Section D: Short Answer Questions', type: 'short_answer', count: 5, marks_per_question: 3, difficulty: 'medium', enabled: true },
      { id: 'sec-5', section_name: 'Section E: Long / Descriptive Questions', type: 'long_answer', count: 2, marks_per_question: 4, difficulty: 'hard', enabled: true },
    ],
  },
  {
    id: 'half_yearly_50',
    name: '50M Half-Yearly',
    badge: 'Term Exam',
    defaultTime: '2 Hours',
    defaultMarks: '50',
    sections: [
      { id: 'sec-1', section_name: 'Section A: Multiple Choice Questions', type: 'mcq', count: 10, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-2', section_name: 'Section B: Fill in the Blanks', type: 'fill_blank', count: 5, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-3', section_name: 'Section C: Match the Following', type: 'match_the_following', count: 2, marks_per_question: 4, difficulty: 'medium', enabled: true },
      { id: 'sec-4', section_name: 'Section D: Short Answer Questions', type: 'short_answer', count: 4, marks_per_question: 3, difficulty: 'medium', enabled: true },
      { id: 'sec-5', section_name: 'Section E: Long / Analytical Questions', type: 'long_answer', count: 3, marks_per_question: 5, difficulty: 'hard', enabled: true },
    ],
  },
  {
    id: 'board_80',
    name: '80M Board Pattern',
    badge: 'Annual Exam',
    defaultTime: '3 Hours',
    defaultMarks: '80',
    sections: [
      { id: 'sec-1', section_name: 'Section A: Multiple Choice Questions (1M)', type: 'mcq', count: 16, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-2', section_name: 'Section B: Very Short / Objective Questions (1M)', type: 'fill_blank', count: 6, marks_per_question: 1, difficulty: 'easy', enabled: true },
      { id: 'sec-3', section_name: 'Section C: Short Answer Questions (3M)', type: 'short_answer', count: 6, marks_per_question: 3, difficulty: 'medium', enabled: true },
      { id: 'sec-4', section_name: 'Section D: Long / Essay Questions (5M)', type: 'long_answer', count: 5, marks_per_question: 5, difficulty: 'hard', enabled: true },
      { id: 'sec-5', section_name: 'Section E: Case Study / Diagram Questions (5M)', type: 'picture_based', count: 3, marks_per_question: 5, difficulty: 'hard', enabled: true },
    ],
  },
];

const toRoman = (num: number): string => {
  const lookup: any = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  let roman = '';
  for (let i in lookup ) {
    while ( num >= lookup[i] ) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

const formatQuestionNumber = (secIdx: number, qIdx: number): string => {
  const n = qIdx + 1;
  const style = secIdx % 5;
  const alphaChar = String.fromCharCode(97 + ((n - 1) % 26));
  switch (style) {
    case 0: return `${n}`; // 1, 2, 3
    case 1: return alphaChar; // a, b, c
    case 2: return toRoman(n); // I, II, III
    case 3: return alphaChar.toUpperCase(); // A, B, C
    case 4: return toRoman(n).toLowerCase(); // i, ii, iii
    default: return `${n}`;
  }
};

const getDefaultSectionInstruction = (type: string): string => {
  switch (type) {
    case 'mcq':
      return 'Choose and write the correct option for each question:';
    case 'fill_blank':
      return 'Fill in the blanks with suitable words / phrases:';
    case 'match_the_following':
      return 'Match the items in Column A with Column B:';
    case 'true_false':
      return 'State whether the following statements are True or False:';
    case 'picture_based':
      return 'Observe the given pictures / diagrams carefully and answer the questions (चित्रों को देखकर उत्तर दीजिए):';
    case 'short_answer':
      return 'Answer the following short answer questions:';
    case 'long_answer':
      return 'Answer the following questions in detail:';
    default:
      return 'Answer the following questions:';
  }
};

export default function GeneratePaperPage() {
  const [token, setToken] = useState('');
  const [viewMode, setViewMode] = useState<'config' | 'raw' | 'preview'>('config');

  // Raw / Row Question to PDF Tab State
  const [rawInputMode, setRawInputMode] = useState<'builder' | 'text'>('builder');
  const [rawTextContent, setRawTextContent] = useState<string>(
`1. Understand the pattern in each line and draw more. (3)
(i)   ^ V ^ V   _______  _______  _______
(ii)  M W M W   _______  _______  _______  _______
(iii) ■ ■ ■ ■   _______  _______  _______  _______
(iv)  ■ ■ ■ ■   _______  _______  _______  _______
(v)   A B C A   _______  _______  _______
(vi)  A P P A   _______  _______  _______`
  );

  const [rawBuilderQuestions, setRawBuilderQuestions] = useState<RawBuilderQuestion[]>([
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

  interface UploadedMediaItem {
    id: string;
    name: string;
    size: string;
    type: string;
    data: string;
  }

  const [rawUploadedFiles, setRawUploadedFiles] = useState<UploadedMediaItem[]>([]);
  const [isExtractingRawMedia, setIsExtractingRawMedia] = useState(false);
  const rawMediaFileInputRef = useRef<HTMLInputElement | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  const [schoolName, setSchoolName] = useState('Modern Public School');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [examTitle, setExamTitle] = useState('Annual Examination - 2026');
  const [timeAllowed, setTimeAllowed] = useState('2.5 Hours');
  const [totalMarks, setTotalMarks] = useState('50');
  const [instructions, setInstructions] = useState(
    '1. Attempt all questions.\n2. Write answers clearly and neatly.\n3. Section A is compulsory.'
  );

  // Dynamic Section Config State & Presets
  const [sections, setSections] = useState<SectionConfigItem[]>(DEFAULT_SECTIONS);
  const [activePresetId, setActivePresetId] = useState<string>('half_yearly_50');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  const applyPreset = (preset: ExamPreset) => {
    setActivePresetId(preset.id);
    setSections(JSON.parse(JSON.stringify(preset.sections)));
    setTotalMarks(preset.defaultMarks);
    setTimeAllowed(preset.defaultTime);
    toast.success(`Applied ${preset.name} (${preset.defaultMarks} Marks • ${preset.defaultTime})`);
  };

  // Generated paper state
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isTwoColumn, setIsTwoColumn] = useState(false);

  // Mobile Accordion toggles for Cards 1, 2, 3
  const [accordionOpenClassSubject, setAccordionOpenClassSubject] = useState(true);
  const [accordionOpenPaperHeader, setAccordionOpenPaperHeader] = useState(true);
  const [accordionOpenSections, setAccordionOpenSections] = useState(true);

  // Mobile expanded section ID for inline editing
  const [mobileExpandedSectionId, setMobileExpandedSectionId] = useState<string | null>(null);

  // Image Upload state for questions
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeQuestionIdxForImage, setActiveQuestionIdxForImage] = useState<number | null>(null);

  // Dedicated Gen with PDF State (Supports Multi-Chapter PDFs)
  const [generationSource, setGenerationSource] = useState<'blueprint' | 'pdf'>('blueprint');
  const [pdfFilesList, setPdfFilesList] = useState<UploadedPdfItem[]>([]);
  const [pdfMode, setPdfMode] = useState<'verbatim_paper' | 'generate_from_content'>('generate_from_content');
  const [pdfCustomInstructions, setPdfCustomInstructions] = useState<string>('');
  const [pdfCustomClass, setPdfCustomClass] = useState<string>('');
  const [pdfCustomSubject, setPdfCustomSubject] = useState<string>('');
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // Cloudflare Library State with Class & Subject Cascading
  const [isCloudflareLibraryOpen, setIsCloudflareLibraryOpen] = useState(false);
  const [modalClassId, setModalClassId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalSubjects, setModalSubjects] = useState<SubjectItem[]>([]);
  const [modalChapters, setModalChapters] = useState<ChapterItem[]>([]);
  const [modalSelectedChapterIds, setModalSelectedChapterIds] = useState<string[]>([]);
  const [isLoadingModalChapters, setIsLoadingModalChapters] = useState(false);

  // Chapter loading and inline upload states
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isUploadingChapterPdfId, setIsUploadingChapterPdfId] = useState<string | null>(null);
  const chapterPdfUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadChapter, setTargetUploadChapter] = useState<ChapterItem | null>(null);

  const handleOpenCloudflareLibrary = async () => {
    setIsCloudflareLibraryOpen(true);
    const initialClassId =
      selectedClassId && selectedClassId !== '__custom__' ? selectedClassId : classes[0]?.id || '';
    setModalClassId(initialClassId);

    if (initialClassId) {
      try {
        const resSub = await fetch(`${API_URL}/api/subjects?class_id=${initialClassId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataSub = await resSub.json();
        const subs: SubjectItem[] = dataSub.data || [];
        setModalSubjects(subs);

        const initialSubId =
          selectedSubjectId &&
          selectedSubjectId !== '__custom__' &&
          subs.some((s) => s.id === selectedSubjectId)
            ? selectedSubjectId
            : subs[0]?.id || '';
        setModalSubjectId(initialSubId);

        if (initialSubId) {
          fetchModalChapters(initialSubId);
        } else {
          setModalChapters([]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleModalClassChange = async (classId: string) => {
    setModalClassId(classId);
    setModalSubjectId('');
    setModalChapters([]);
    setModalSelectedChapterIds([]);

    if (classId) {
      try {
        const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const subs: SubjectItem[] = data.data || [];
        setModalSubjects(subs);
        if (subs.length > 0) {
          setModalSubjectId(subs[0].id);
          fetchModalChapters(subs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setModalSubjects([]);
    }
  };

  const handleModalSubjectChange = (subjectId: string) => {
    setModalSubjectId(subjectId);
    setModalSelectedChapterIds([]);
    if (subjectId) {
      fetchModalChapters(subjectId);
    } else {
      setModalChapters([]);
    }
  };

  const fetchModalChapters = async (subjectId: string) => {
    setIsLoadingModalChapters(true);
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setModalChapters(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch chapters');
    } finally {
      setIsLoadingModalChapters(false);
    }
  };

  const handleToggleModalChapterSelect = (chapterId: string) => {
    setModalSelectedChapterIds((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleToggleModalSelectAll = () => {
    const chaptersWithPdf = modalChapters.filter((c) => c.has_pdf && c.pdf_url);
    if (modalSelectedChapterIds.length === chaptersWithPdf.length) {
      setModalSelectedChapterIds([]);
    } else {
      setModalSelectedChapterIds(chaptersWithPdf.map((c) => c.id));
    }
  };

  const handleAttachModalSelectedChapters = () => {
    const chaptersToAttach = modalChapters.filter((c) => modalSelectedChapterIds.includes(c.id));
    if (chaptersToAttach.length === 0) {
      toast.error('Please select at least one chapter with a saved PDF.');
      return;
    }

    const missingPdfs = chaptersToAttach.filter((c) => !c.pdf_url);
    if (missingPdfs.length > 0) {
      toast.error(`"${missingPdfs[0].title}" does not have a PDF in Cloudflare yet.`);
      return;
    }

    const chosenClass = classes.find((c) => c.id === modalClassId);
    const chosenSubject = modalSubjects.find((s) => s.id === modalSubjectId);
    const newItems: UploadedPdfItem[] = [];

    chaptersToAttach.forEach((chap) => {
      const already = pdfFilesList.some((p) => p.dataUrl === chap.pdf_url || p.id === `cf-${chap.id}`);
      if (!already && chap.pdf_url) {
        newItems.push({
          id: `cf-${chap.id}`,
          name: `${chosenClass?.name ? `${chosenClass.name} - ` : ''}${chap.title}.pdf`,
          size: 'Cloudflare R2',
          dataUrl: chap.pdf_url,
          isCloudflare: true,
        });
      }
    });

    if (newItems.length > 0) {
      setPdfFilesList((prev) => [...prev, ...newItems]);
      toast.success(`Attached ${newItems.length} chapter PDF(s) from Cloudflare!`);
    } else {
      toast.info('Selected chapters are already attached.');
    }

    // Auto-sync class & subject in form if not selected
    if (chosenClass && (!selectedClassId || selectedClassId === '__custom__')) {
      setSelectedClassId(chosenClass.id);
      fetchSubjects(chosenClass.id);
    }
    if (chosenSubject && (!selectedSubjectId || selectedSubjectId === '__custom__')) {
      setSelectedSubjectId(chosenSubject.id);
      fetchChapters(chosenSubject.id);
    }

    setIsCloudflareLibraryOpen(false);
  };

  // Direct upload of a textbook PDF for a specific chapter
  const handleTriggerUploadPdfForChapter = (chap: ChapterItem) => {
    setTargetUploadChapter(chap);
    if (chapterPdfUploadInputRef.current) {
      chapterPdfUploadInputRef.current.value = '';
      chapterPdfUploadInputRef.current.click();
    }
  };

  const handleDirectChapterPdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !targetUploadChapter) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF document.');
      return;
    }

    const chap = targetUploadChapter;
    setIsUploadingChapterPdfId(chap.id);
    toast.info(`Uploading "${file.name}" to Cloudflare R2 for "${chap.title}"...`);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch(`${API_URL}/api/scans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_url: base64,
            doc_type: 'chapter_page',
            chapter_id: chap.id,
            subject_id: chap.subject_id || selectedSubjectId,
            class_id: selectedClassId,
          }),
        });
        const scanData = await res.json();
        if (!res.ok) throw new Error(scanData.error || 'Failed to upload PDF');

        toast.success(`PDF saved to Cloudflare R2 for "${chap.title}"!`);

        // Refresh chapters
        if (selectedSubjectId) {
          await fetchChapters(selectedSubjectId);
        }

        // Auto select this chapter
        setSelectedChapterIds((prev) => (prev.includes(chap.id) ? prev : [...prev, chap.id]));
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to upload PDF');
      } finally {
        setIsUploadingChapterPdfId(null);
        setTargetUploadChapter(null);
      }
    };
    reader.onerror = () => {
      setIsUploadingChapterPdfId(null);
      setTargetUploadChapter(null);
      toast.error('Failed to read PDF file');
    };
    reader.readAsDataURL(file);
  };

  // Toggle chapter PDF in Card 1 directly
  const handleTogglePdfChapter = (chap: ChapterItem) => {
    if (!chap.pdf_url) {
      toast.error(`"${chap.title}" does not have a PDF uploaded to Cloudflare yet. You can upload one in Classes & Curriculum or upload a local PDF below.`);
      return;
    }

    const isAlreadyAttached = pdfFilesList.some((p) => p.dataUrl === chap.pdf_url || p.id === `cf-${chap.id}`);

    if (isAlreadyAttached) {
      setPdfFilesList((prev) => prev.filter((p) => p.dataUrl !== chap.pdf_url && p.id !== `cf-${chap.id}`));
      toast.info(`Removed "${chap.title}"`);
    } else {
      const newItem: UploadedPdfItem = {
        id: `cf-${chap.id}`,
        name: `${chap.title}.pdf`,
        size: 'Cloudflare R2',
        dataUrl: chap.pdf_url,
        isCloudflare: true,
      };
      setPdfFilesList((prev) => [...prev, newItem]);
      toast.success(`Attached "${chap.title}" from Cloudflare R2!`);
    }
  };

  const handleSelectAllPdfChapters = () => {
    const chaptersWithPdfs = chapters.filter((c) => c.has_pdf && c.pdf_url);
    if (chaptersWithPdfs.length === 0) {
      toast.error('No chapters with saved Cloudflare PDFs found for this subject.');
      return;
    }

    const allAttached = chaptersWithPdfs.every((c) =>
      pdfFilesList.some((p) => p.dataUrl === c.pdf_url || p.id === `cf-${c.id}`)
    );

    if (allAttached) {
      const urlsToRemove = new Set(chaptersWithPdfs.map((c) => c.pdf_url));
      const idsToRemove = new Set(chaptersWithPdfs.map((c) => `cf-${c.id}`));
      setPdfFilesList((prev) => prev.filter((p) => !urlsToRemove.has(p.dataUrl) && !idsToRemove.has(p.id)));
      toast.info('Deselected all chapters for this subject');
    } else {
      const newItems: UploadedPdfItem[] = [];

      chaptersWithPdfs.forEach((c) => {
        const exists = pdfFilesList.some((p) => p.dataUrl === c.pdf_url || p.id === `cf-${c.id}`);
        if (!exists && c.pdf_url) {
          newItems.push({
            id: `cf-${c.id}`,
            name: `${c.title}.pdf`,
            size: 'Cloudflare R2',
            dataUrl: c.pdf_url,
            isCloudflare: true,
          });
        }
      });

      setPdfFilesList((prev) => [...prev, ...newItems]);
      toast.success(`Attached ${chaptersWithPdfs.length} chapters from Cloudflare R2!`);
    }
  };

  // Section Title & Description Editing States in Preview Mode
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
  const [editSecTitle, setEditSecTitle] = useState('');
  const [editSecInstruction, setEditSecInstruction] = useState('');
  const [sectionCustomMeta, setSectionCustomMeta] = useState<Record<string, { subSection?: string; instruction?: string }>>({});

  // Enhanced Inline Question Editing States
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const [editingQuestionSection, setEditingQuestionSection] = useState('');
  const [editingQuestionSubSection, setEditingQuestionSubSection] = useState('');
  const [editingQuestionMarks, setEditingQuestionMarks] = useState<number>(1);
  const [editingQuestionOptions, setEditingQuestionOptions] = useState<string[]>([]);

  const handleStartEditQuestion = (globalIdx: number) => {
    const q = paperQuestions[globalIdx];
    setEditingQuestionIdx(globalIdx);
    setEditingQuestionText(q.question_text || '');
    setEditingQuestionSection(q.section_name || 'General Questions');
    setEditingQuestionSubSection(q.sub_section || '');
    setEditingQuestionMarks(q.marks || 1);
    setEditingQuestionOptions(
      Array.isArray(q.options)
        ? q.options.map((o: any) => (typeof o === 'string' ? o : o.text || ''))
        : []
    );
  };

  const handleSaveEditedQuestion = () => {
    if (editingQuestionIdx === null) return;
    const newQuestions = [...paperQuestions];
    const targetQ = newQuestions[editingQuestionIdx];

    let updatedOptions = targetQ.options;
    if (targetQ.type === 'mcq' && editingQuestionOptions.length > 0) {
      if (Array.isArray(targetQ.options) && typeof targetQ.options[0] === 'object') {
        updatedOptions = editingQuestionOptions.map((optText, oIdx) => ({
          label: targetQ.options[oIdx]?.label || String.fromCharCode(65 + oIdx),
          text: optText,
        }));
      } else {
        updatedOptions = editingQuestionOptions;
      }
    }

    newQuestions[editingQuestionIdx] = {
      ...targetQ,
      question_text: editingQuestionText,
      section_name: editingQuestionSection.trim() || 'General Questions',
      sub_section: editingQuestionSubSection.trim() || undefined,
      marks: Number(editingQuestionMarks) || 1,
      options: updatedOptions,
    };

    setPaperQuestions(newQuestions);
    setEditingQuestionIdx(null);
    setEditingQuestionText('');
    setEditingQuestionSection('');
    setEditingQuestionSubSection('');
    setEditingQuestionOptions([]);
    toast.success('Question updated successfully!');
    handleSavePaper(false, newQuestions, true);
  };

  const handleStartEditSection = (
    secName: string,
    currentInst?: string,
    defaultInst?: string
  ) => {
    setEditingSectionName(secName);
    setEditSecTitle(secName);
    const resolvedInst = currentInst || defaultInst || 'Answer the following questions:';
    setEditSecInstruction(resolvedInst);
  };

  const handleSaveEditedSection = () => {
    if (!editingSectionName) return;
    const oldName = editingSectionName;
    const newName = editSecTitle.trim() || oldName;
    const newInst = editSecInstruction.trim();

    // 1. Update questions in this section
    const updatedQuestions = paperQuestions.map((q) => {
      const qSec = q.section_name || 'General Questions';
      if (qSec === oldName) {
        return {
          ...q,
          section_name: newName,
          sub_section: newInst ? newInst : undefined,
        };
      }
      return q;
    });

    // 2. Update blueprint sections
    setSections((prev) =>
      prev.map((s) => {
        if (s.section_name === oldName) {
          return {
            ...s,
            section_name: newName,
            instructions: newInst ? newInst : undefined,
            sub_section: newInst ? newInst : undefined,
          };
        }
        return s;
      })
    );

    // 3. Update custom metadata
    setSectionCustomMeta((prev) => {
      const copy = { ...prev };
      delete copy[oldName];
      copy[newName] = {
        instruction: newInst || undefined,
        subSection: newInst || undefined,
      };
      return copy;
    });

    setPaperQuestions(updatedQuestions);
    setEditingSectionName(null);
    toast.success(`Updated "${newName}"!`);
    handleSavePaper(false, updatedQuestions, true);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (paperQuestions.length <= 1) {
      toast.error('The paper must contain at least 1 question');
      return;
    }
    const newQuestions = paperQuestions.filter((_, i) => i !== idx);
    setPaperQuestions(newQuestions);
    toast.success('Question removed from paper');
  };

  const handleStartNewPaper = () => {
    if (editingPaperId) {
      if (!confirm('Start a new paper? You will exit edit mode for this paper.')) return;
      setEditingPaperId(null);
      setIsAutoSaved(false);
      setLastSavedAt(null);
      setPaperQuestions([]);
      setViewMode('config');
      toast.info('Cleared edit session. Ready for a new paper.');
    } else {
      setPaperQuestions([]);
      setIsAutoSaved(false);
      setLastSavedAt(null);
      setViewMode('config');
    }
  };

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchSchoolInfo(tokenStr);
    }

    // Check if user clicked Edit from Saved Papers
    try {
      const savedPaperJson = sessionStorage.getItem('edit_paper_data');
      if (savedPaperJson) {
        sessionStorage.removeItem('edit_paper_data');
        const p = JSON.parse(savedPaperJson);
        if (p.id) setEditingPaperId(p.id);
        if (p.title) setExamTitle(p.title);
        if (p.total_marks) setTotalMarks(String(p.total_marks));
        if (p.duration_minutes) setTimeAllowed(`${p.duration_minutes} Mins`);
        if (p.class_id) {
          setSelectedClassId(p.class_id);
          if (tokenStr) fetchSubjects(p.class_id, tokenStr);
        }
        if (p.subject_id) {
          setSelectedSubjectId(p.subject_id);
          if (tokenStr) fetchChapters(p.subject_id, tokenStr);
        }

        const bp = p.blueprint || {};
        if (bp.schoolName) setSchoolName(bp.schoolName);
        else if (p.schoolName) setSchoolName(p.schoolName);

        if (bp.schoolLogo) setSchoolLogo(bp.schoolLogo);
        else if (p.schoolLogo) setSchoolLogo(p.schoolLogo);

        if (bp.schoolAddress) setSchoolAddress(bp.schoolAddress);
        else if (p.schoolAddress) setSchoolAddress(p.schoolAddress);

        if (bp.timeAllowed) setTimeAllowed(bp.timeAllowed);
        if (p.instructions || bp.instructions) setInstructions(p.instructions || bp.instructions);
        if (bp.selectedChapterIds && Array.isArray(bp.selectedChapterIds)) {
          setSelectedChapterIds(bp.selectedChapterIds);
        }
        if (bp.sections && Array.isArray(bp.sections)) {
          setSections(bp.sections);
        }
        if (bp.sectionCustomMeta && typeof bp.sectionCustomMeta === 'object') {
          setSectionCustomMeta(bp.sectionCustomMeta);
        }

        // Questions can be in bp.selected_questions or p.selected_questions
        const loadedQuestions = bp.selected_questions || p.selected_questions;
        if (Array.isArray(loadedQuestions) && loadedQuestions.length > 0) {
          setPaperQuestions(loadedQuestions);
          setIsAutoSaved(true);
          setLastSavedAt(new Date());
          setViewMode('preview'); // Open preview immediately so user can edit and review
        }
        toast.info(`Editing "${p.title}" — Saving will update this paper directly without using any credits!`, {
          duration: 6000,
        });
      }
    } catch (e) {
      console.error('Failed to load edit_paper_data', e);
    }
  }, []);

  async function fetchSchoolInfo(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/schools/my-school`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.school?.name) setSchoolName(data.school.name);
      if (data.school?.logo_url) setSchoolLogo(data.school.logo_url);
      if (data.school?.address) setSchoolAddress(data.school.address);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) setClasses(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSubjects(classId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) setSubjects(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchChapters(subjectId: string, authToken = token) {
    setIsLoadingChapters(true);
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        const fetchedChapters: ChapterItem[] = data.data;
        setChapters(fetchedChapters);
        const allIds = fetchedChapters.map((c: ChapterItem) => c.id);
        setSelectedChapterIds(allIds);

        // Also sync any Cloudflare PDFs into pdfFilesList
        const newPdfItems: UploadedPdfItem[] = [];
        fetchedChapters.forEach((c: ChapterItem) => {
          if (c.has_pdf && c.pdf_url) {
            newPdfItems.push({
              id: `cf-${c.id}`,
              name: `${c.title}.pdf`,
              size: 'Cloudflare R2',
              dataUrl: c.pdf_url,
              isCloudflare: true,
            });
          }
        });
        if (newPdfItems.length > 0) {
          setPdfFilesList((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const filteredNew = newPdfItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...filteredNew];
          });
        }
      } else {
        setChapters([]);
        setSelectedChapterIds([]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load chapters for this subject');
    } finally {
      setIsLoadingChapters(false);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterIds([]);
    setSubjects([]);
    setChapters([]);
    // Remove previous cloudflare chapters from pdfFilesList when class changes
    setPdfFilesList((prev) => prev.filter((p) => !p.isCloudflare));
    if (classId && classId !== '__custom__') fetchSubjects(classId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterIds([]);
    setChapters([]);
    // Remove previous cloudflare chapters from pdfFilesList when subject changes
    setPdfFilesList((prev) => prev.filter((p) => !p.isCloudflare));
    if (subjectId && subjectId !== '__custom__') fetchChapters(subjectId);
  };

  const toggleChapter = (chapterId: string) => {
    let nextIds: string[];
    if (selectedChapterIds.includes(chapterId)) {
      nextIds = selectedChapterIds.filter((id) => id !== chapterId);
    } else {
      nextIds = [...selectedChapterIds, chapterId];
    }
    setSelectedChapterIds(nextIds);

    // Sync with pdfFilesList for PDF mode
    const chap = chapters.find((c) => c.id === chapterId);
    if (chap && chap.has_pdf && chap.pdf_url) {
      if (nextIds.includes(chapterId)) {
        if (!pdfFilesList.some((p) => p.dataUrl === chap.pdf_url || p.id === `cf-${chap.id}`)) {
          setPdfFilesList((prev) => [
            ...prev,
            {
              id: `cf-${chap.id}`,
              name: `${chap.title}.pdf`,
              size: 'Cloudflare R2',
              dataUrl: chap.pdf_url!,
              isCloudflare: true,
            },
          ]);
        }
      } else {
        setPdfFilesList((prev) => prev.filter((p) => p.dataUrl !== chap.pdf_url && p.id !== `cf-${chap.id}`));
      }
    }
  };

  const toggleSelectAllChapters = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([]);
      const cfUrls = new Set(chapters.map((c) => c.pdf_url).filter(Boolean));
      const cfIds = new Set(chapters.map((c) => `cf-${c.id}`));
      setPdfFilesList((prev) => prev.filter((p) => !cfUrls.has(p.dataUrl) && !cfIds.has(p.id)));
    } else {
      const allIds = chapters.map((c) => c.id);
      setSelectedChapterIds(allIds);
      const newItems: UploadedPdfItem[] = [];
      chapters.forEach((c) => {
        if (c.has_pdf && c.pdf_url) {
          const exists = pdfFilesList.some((p) => p.dataUrl === c.pdf_url || p.id === `cf-${c.id}`);
          if (!exists) {
            newItems.push({
              id: `cf-${c.id}`,
              name: `${c.title}.pdf`,
              size: 'Cloudflare R2',
              dataUrl: c.pdf_url,
              isCloudflare: true,
            });
          }
        }
      });
      if (newItems.length > 0) {
        setPdfFilesList((prev) => [...prev, ...newItems]);
      }
    }
  };

  // Section Management Handlers
  const handleToggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleUpdateSection = (id: string, updates: Partial<SectionConfigItem>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      toast.error('You must keep at least one section');
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === sections.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newSections = [...sections];
    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setSections(newSections);
  };

  const handleAddSection = (type: QuestionType = 'mcq') => {
    const meta = SECTION_TYPE_METADATA[type];
    const letter = String.fromCharCode(65 + sections.length);
    const newSection: SectionConfigItem = {
      id: `sec-${Date.now()}`,
      section_name: `Section ${letter}: ${meta.label}`,
      type,
      count: meta.defaultCount,
      marks_per_question: meta.defaultMarks,
      difficulty: 'medium',
      enabled: true,
    };
    setSections((prev) => [...prev, newSection]);
    toast.success(`Added ${meta.label} section`);
  };

  // Total Configured Marks & Questions
  const activeSections = sections.filter((s) => s.enabled && s.count > 0);
  const totalConfiguredMarks = activeSections.reduce(
    (acc, s) => acc + s.count * s.marks_per_question,
    0
  );
  const totalConfiguredQuestions = activeSections.reduce(
    (acc, s) => acc + s.count,
    0
  );
  const approxPerChapterMarks =
    selectedChapterIds.length > 0
      ? (totalConfiguredMarks / selectedChapterIds.length).toFixed(1)
      : '0';

  // Synchronize totalMarks with configured marks automatically when sections change
  const syncTotalMarks = () => {
    setTotalMarks(String(totalConfiguredMarks));
    toast.info(`Updated Total Marks to ${totalConfiguredMarks}`);
  };

  // Image attachment handler
  const handleOpenImagePicker = (qIdx: number) => {
    setActiveQuestionIdxForImage(qIdx);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeQuestionIdxForImage !== null) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const updated = [...paperQuestions];
        updated[activeQuestionIdxForImage] = {
          ...updated[activeQuestionIdxForImage],
          image_url: base64Data,
        };
        setPaperQuestions(updated);
        toast.success(`Diagram attached to Question ${activeQuestionIdxForImage + 1}!`);
        setActiveQuestionIdxForImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (qIdx: number) => {
    const updated = [...paperQuestions];
    updated[qIdx] = {
      ...updated[qIdx],
      image_url: null,
    };
    setPaperQuestions(updated);
    toast.info(`Diagram removed from Question ${qIdx + 1}`);
  };

  // Generate Paper using Gemini AI
  const handleGeneratePaper = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Please select both a class and a subject');
      return;
    }

    if (selectedChapterIds.length === 0) {
      toast.error('Please select at least one chapter');
      return;
    }

    if (activeSections.length === 0) {
      toast.error('Please enable at least one section with at least 1 question');
      return;
    }

    const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';
    const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject';
    const selectedChapterNames = chapters
      .filter((c) => selectedChapterIds.includes(c.id))
      .map((c) => c.title);

    setIsGenerating(true);
    toast.info(
      `Generating paper with ${activeSections.length} sections balanced across ${selectedChapterNames.length} chapters...`
    );

    try {
      const payloadSections = activeSections.map((s) => ({
        section_name: s.section_name,
        type: s.type,
        count: Number(s.count),
        marks_per_question: Number(s.marks_per_question),
        difficulty: s.difficulty,
      }));

      const res = await fetch(`${API_URL}/api/question-papers/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          class_name: selectedClassName,
          subject_name: selectedSubjectName,
          chapter_ids: selectedChapterIds,
          chapter_names: selectedChapterNames,
          strict_ocr_only: true,
          sections: payloadSections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(
            data.error || 'Insufficient wallet balance. Each generation costs ₹5. Please recharge in Billing & Wallet.',
            {
              action: {
                label: 'Recharge',
                onClick: () => window.location.href = '/billing',
              },
              duration: 8000,
            }
          );
          return;
        }
        throw new Error(data.error || 'Failed to generate paper');
      }

      if (data.data && Array.isArray(data.data)) {
        setPaperQuestions(data.data);
        setViewMode('preview');

        // Notify layout to update live wallet balance in header/sidebar
        window.dispatchEvent(new Event('billing-updated'));

        // AUTO-SAVE: Automatically save newly generated paper immediately to DB
        await handleSavePaper(false, data.data, true);

        const isCloudflarePdfGen = data.meta?.engine === 'cloudflare_pdf';
        if (data.billing) {
          toast.success(
            isCloudflarePdfGen
              ? `Generated from Cloudflare PDFs via Gemini Vision! (${data.data.length} questions • ₹${data.billing.cost_deducted} deducted • Balance: ₹${Number(data.billing.new_balance).toFixed(2)})`
              : `Generated & Auto-Saved ${data.data.length} questions! (₹${data.billing.cost_deducted} deducted • Balance: ₹${Number(data.billing.new_balance).toFixed(2)})`
          );
        } else {
          toast.success(
            isCloudflarePdfGen
              ? `Generated directly from Cloudflare chapter PDFs via Gemini Vision! (${data.data.length} questions)`
              : `Generated & Auto-Saved ${data.data.length} questions across ${activeSections.length} sections!`
          );
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      toast.error(err.message || 'Error occurred while generating paper');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct PDF Handlers (Supports Multiple Chapter PDFs for Term Exams)
  const handlePdfFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessPdfFiles(Array.from(files));
    }
  };

  const handleProcessPdfFiles = (files: File[]) => {
    if (!files || files.length === 0) return;

    const validPdfs: File[] = [];
    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error(`"${file.name}" is not a PDF file. Please upload PDF documents only.`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 25MB limit.`);
        continue;
      }
      validPdfs.push(file);
    }

    if (validPdfs.length === 0) return;

    let processedCount = 0;
    const newItems: UploadedPdfItem[] = [];

    validPdfs.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newItems.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          dataUrl: reader.result as string,
          file,
        });
        processedCount++;
        if (processedCount === validPdfs.length) {
          setPdfFilesList((prev) => {
            const combined = [...prev, ...newItems];
            toast.success(`Attached ${newItems.length} PDF(s). Total: ${combined.length} chapter(s) ready!`);
            return combined;
          });

          // Auto-populate exam title if default
          if (!examTitle || examTitle === 'Annual Examination - 2026') {
            const firstClean = validPdfs[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            if (firstClean) {
              setExamTitle(firstClean.charAt(0).toUpperCase() + firstClean.slice(1));
            }
          }
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to read "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePdfItem = (id: string) => {
    setPdfFilesList((prev) => prev.filter((p) => p.id !== id));
    toast.info('Removed PDF chapter');
  };

  const handleClearAllPdfs = () => {
    setPdfFilesList([]);
    if (pdfFileInputRef.current) {
      pdfFileInputRef.current.value = '';
    }
  };

  const handleGenerateFromPdf = async () => {
    if (pdfFilesList.length === 0) {
      toast.error('Please upload at least one PDF chapter/document first');
      return;
    }

    const activeSections = sections.filter((s) => s.enabled && Number(s.count) > 0);
    if (pdfMode === 'generate_from_content' && activeSections.length === 0) {
      toast.error('Please enable at least one section with at least 1 question in the blueprint below');
      return;
    }

    setIsGenerating(true);
    toast.info(`Sending ${pdfFilesList.length} chapter PDF(s) directly to Gemini AI Vision... Formulating exam paper...`);

    try {
      const payloadSections = activeSections.map((s) => ({
        section_name: s.section_name,
        type: s.type,
        count: Number(s.count),
        marks_per_question: Number(s.marks_per_question),
        difficulty: s.difficulty,
      }));

      const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
      const currentSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';

      const finalClassName =
        (selectedClassId === '__custom__' ? pdfCustomClass.trim() : (currentClassName || pdfCustomClass.trim())) ||
        'General Grade';
      const finalSubjectName =
        (selectedSubjectId === '__custom__' ? pdfCustomSubject.trim() : (currentSubjectName || pdfCustomSubject.trim())) ||
        'General Subject';

      const payloadFiles = pdfFilesList.map((p) => ({
        name: p.name,
        data: p.dataUrl,
      }));

      const res = await fetch(`${API_URL}/api/question-papers/ai-generate-from-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pdf_files: payloadFiles,
          mode: pdfMode,
          class_name: finalClassName,
          subject_name: finalSubjectName,
          sections: payloadSections,
          custom_instructions: pdfCustomInstructions || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(
            data.error || 'Insufficient wallet balance. Each generation costs ₹5. Please recharge in Billing & Wallet.',
            {
              action: {
                label: 'Recharge',
                onClick: () => window.location.href = '/billing',
              },
              duration: 8000,
            }
          );
          return;
        }
        throw new Error(data.error || 'Failed to generate questions from PDF');
      }

      if (data.data && Array.isArray(data.data)) {
        setPaperQuestions(data.data);
        const totalMarksGenerated = data.data.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
        if (totalMarksGenerated > 0) {
          setTotalMarks(String(totalMarksGenerated));
        }

        setViewMode('preview');

        // Notify layout to update live wallet balance in header/sidebar
        window.dispatchEvent(new Event('billing-updated'));

        // AUTO-SAVE: Automatically save newly generated paper immediately to DB
        await handleSavePaper(false, data.data, true);

        if (data.billing) {
          toast.success(
            `Extracted & Auto-Saved ${data.data.length} questions from ${pdfFilesList.length} chapter(s)! (₹${data.billing.cost_deducted} deducted • Balance: ₹${Number(data.billing.new_balance).toFixed(2)})`
          );
        } else {
          toast.success(`Generated & Auto-Saved ${data.data.length} questions across ${pdfFilesList.length} chapter(s)!`);
        }
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err: any) {
      console.error('PDF Paper Generation Error:', err);
      toast.error(err.message || 'Error occurred while generating paper from PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Paper (In-place update if editingPaperId, or create new, with auto-save support)
  const handleSavePaper = async (
    createAsNew = false,
    questionsToSave?: QuestionItem[],
    isAutoSave = false
  ) => {
    const questions = questionsToSave || paperQuestions;
    if (!questions || questions.length === 0) {
      if (!isAutoSave) toast.error('Question paper is currently empty');
      return null;
    }

    setIsSaving(true);
    try {
      const calculatedTotalMarks = questions.reduce(
        (acc, q) => acc + (Number(q.marks) || 1),
        0
      );

      const parsedDuration = Number(timeAllowed.replace(/[^0-9]/g, '')) || 120;
      const safeTitle =
        examTitle?.trim() ||
        `${selectedClassName || 'General'} ${selectedSubjectName || 'Subject'} Examination`;

      const payload = {
        title: safeTitle,
        class_id: selectedClassId || null,
        subject_id: selectedSubjectId || null,
        exam_type: 'Exam',
        total_marks: calculatedTotalMarks || Number(totalMarks) || 50,
        time_allowed_minutes: parsedDuration,
        blueprint: {
          schoolName,
          schoolLogo,
          schoolAddress,
          timeAllowed,
          instructions,
          selectedChapterIds,
          sections: activeSections,
          sectionCustomMeta,
          selected_questions: questions,
        },
        selected_questions: questions,
        status: 'final',
      };

      const isUpdating = Boolean(editingPaperId && !createAsNew);
      const url = isUpdating
        ? `${API_URL}/api/question-papers/${editingPaperId}`
        : `${API_URL}/api/question-papers`;
      const method = isUpdating ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save paper');

      setIsAutoSaved(true);
      setLastSavedAt(new Date());

      if (isUpdating) {
        if (!isAutoSave) {
          toast.success('Question paper updated in place! (0 Credits Used)');
        }
      } else {
        if (data.data?.id) {
          setEditingPaperId(data.data.id);
        }
        if (!isAutoSave) {
          toast.success('Question paper saved successfully!');
        }
      }
      return data.data;
    } catch (err: any) {
      console.error('Save Paper Error:', err);
      if (!isAutoSave) {
        toast.error(err.message || 'Failed to save paper');
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (paperQuestions.length === 0) return;
    printExamPaper({
      schoolName,
      schoolLogo,
      schoolAddress,
      title: examTitle,
      className: selectedClassName,
      subjectName: selectedSubjectName,
      timeAllowed,
      totalMarks,
      instructions,
      questions: paperQuestions,
      isTwoColumn,
    });
  };

  // Convert Raw Text to Questions
  const handleConvertRawTextToPaper = (andPrint: boolean = false) => {
    if (!rawTextContent.trim()) {
      toast.error('Please enter raw question text');
      return;
    }

    const lines = rawTextContent.trim().split('\n');
    const newQuestions: QuestionItem[] = [];

    const questionStartRegex = /^(?:(\d+)[\.\)]\s*|(?:[Qq]uestion|[Qq])\s*(\d+)[\.\:\)]\s*)/;
    let currentLines: string[] = [];
    let currentMarks = 1;

    const flushCurrent = () => {
      if (currentLines.length === 0) return;
      const fullText = currentLines.join('\n').trim();
      if (!fullText) return;
      newQuestions.push({
        id: `raw-text-${Date.now()}-${newQuestions.length + 1}`,
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
        id: `raw-text-${Date.now()}-1`,
        section_name: 'Questions (प्रश्न)',
        type: rawTextContent.includes('_______') ? 'fill_blank' : 'short_answer',
        question_text: rawTextContent.trim(),
        marks: 3,
      });
    }

    setPaperQuestions(newQuestions);
    setViewMode('preview');
    toast.success(`Converted ${newQuestions.length} raw question(s) to printable paper!`);

    if (andPrint) {
      setTimeout(() => {
        printExamPaper({
          schoolName,
          schoolLogo,
          schoolAddress,
          title: examTitle,
          className: selectedClassName,
          subjectName: selectedSubjectName,
          timeAllowed,
          totalMarks,
          instructions,
          questions: newQuestions,
          isTwoColumn,
        });
      }, 400);
    }
  };

  // Convert Builder Rows to Questions
  const handleConvertBuilderToPaper = (andPrint: boolean = false) => {
    if (rawBuilderQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const newQuestions: QuestionItem[] = rawBuilderQuestions.map((bq, qIdx) => {
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
        id: `raw-bld-${Date.now()}-${qIdx + 1}`,
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
        printExamPaper({
          schoolName,
          schoolLogo,
          schoolAddress,
          title: examTitle,
          className: selectedClassName,
          subjectName: selectedSubjectName,
          timeAllowed,
          totalMarks,
          instructions,
          questions: newQuestions,
          isTwoColumn,
        });
      }, 400);
    }
  };

  const handleAddRawQuestion = () => {
    const newQ: RawBuilderQuestion = {
      id: `rbq-${Date.now()}`,
      title: 'Understand the pattern in each line and draw more.',
      marks: 3,
      sectionName: 'Section A: Pattern Questions',
      rows: [
        { id: `r-${Date.now()}-1`, label: '(i)', pattern: '', blanksCount: 3 },
        { id: `r-${Date.now()}-2`, label: '(ii)', pattern: '', blanksCount: 3 },
      ],
    };
    setRawBuilderQuestions([...rawBuilderQuestions, newQ]);
  };

  const handleRemoveRawQuestion = (qId: string) => {
    if (rawBuilderQuestions.length <= 1) {
      toast.info('At least one question is required');
      return;
    }
    setRawBuilderQuestions(rawBuilderQuestions.filter((q) => q.id !== qId));
  };

  const handleAddRawPatternRow = (qId: string) => {
    setRawBuilderQuestions(
      rawBuilderQuestions.map((q) => {
        if (q.id !== qId) return q;
        const romanLabels = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
        const nextLabel = romanLabels[q.rows.length] || `(${q.rows.length + 1})`;
        return {
          ...q,
          rows: [
            ...q.rows,
            { id: `r-${Date.now()}`, label: nextLabel, pattern: '', blanksCount: 3 },
          ],
        };
      })
    );
  };

  const handleRemoveRawPatternRow = (qId: string, rowId: string) => {
    setRawBuilderQuestions(
      rawBuilderQuestions.map((q) => {
        if (q.id !== qId) return q;
        if (q.rows.length <= 1) {
          toast.info('At least one row is required');
          return q;
        }
        return {
          ...q,
          rows: q.rows.filter((r) => r.id !== rowId),
        };
      })
    );
  };

  const handleUpdateRawPatternRow = (
    qId: string,
    rowId: string,
    field: 'label' | 'pattern' | 'blanksCount',
    val: any
  ) => {
    setRawBuilderQuestions(
      rawBuilderQuestions.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          rows: q.rows.map((r) => (r.id === rowId ? { ...r, [field]: val } : r)),
        };
      })
    );
  };

  const handleRawMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setRawUploadedFiles((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} file(s) for AI paper analysis`);
    if (rawMediaFileInputRef.current) rawMediaFileInputRef.current.value = '';
  };

  const handleRemoveRawUploadedFile = (id: string) => {
    setRawUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleExtractPaperFromMedia = async () => {
    if (rawUploadedFiles.length === 0) {
      toast.error('Please upload at least one photo or PDF of your exam paper');
      return;
    }

    setIsExtractingRawMedia(true);
    try {
      const token = getAuthToken() || '';
      if (!token) {
        toast.error('Session expired. Please log in again.');
        setIsExtractingRawMedia(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/question-papers/extract-from-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          media_files: rawUploadedFiles.map((f) => ({
            name: f.name,
            data: f.data,
            mimeType: f.type,
          })),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to extract paper');
      }

      const extracted = resData.data;
      const header = extracted.header || {};
      const questions = extracted.questions || [];

      // Automatically populate header (all fully editable by the user)
      if (header.school_name) setSchoolName(header.school_name);
      if (header.exam_title) setExamTitle(header.exam_title);
      if (header.class_name) setPdfCustomClass(header.class_name);
      if (header.subject_name) setPdfCustomSubject(header.subject_name);
      if (header.total_marks) setTotalMarks(String(header.total_marks));
      if (header.time_allowed) setTimeAllowed(header.time_allowed);
      if (header.instructions) setInstructions(header.instructions);

      if (questions.length === 0) {
        toast.warning('No questions were found in the uploaded images');
        return;
      }

      // Format questions into QuestionItem array
      const formattedQuestions: QuestionItem[] = questions.map((q: any, idx: number) => ({
        id: `extracted-q-${Date.now()}-${idx + 1}`,
        section_name: q.section_name || 'Questions (प्रश्न)',
        sub_section: q.sub_section || undefined,
        type: q.type || (q.question_text?.includes('_______') ? 'fill_blank' : 'short_answer'),
        question_text: q.question_text || '',
        options: q.options || null,
        answer_text: q.answer_text || '',
        marks: Number(q.marks) || 1,
        difficulty: q.difficulty || 'easy',
      }));

      setPaperQuestions(formattedQuestions);

      // Also sync raw text content so user can view/edit in raw text mode
      const textJoined = formattedQuestions.map((q, idx) => `${idx + 1}. ${q.question_text} (${q.marks})`).join('\n\n');
      setRawTextContent(textJoined);

      // Transition to Preview so teacher sees the full paper immediately!
      setViewMode('preview');
      toast.success(`🎉 AI extracted ${formattedQuestions.length} questions & set header from your upload!`);
    } catch (err: any) {
      console.error('Extract Paper Error:', err);
      toast.error(err.message || 'Failed to extract paper from images/PDF');
    } finally {
      setIsExtractingRawMedia(false);
    }
  };

  const selectedClassName =
    (selectedClassId === '__custom__' ? pdfCustomClass : classes.find((c) => c.id === selectedClassId)?.name) ||
    pdfCustomClass ||
    '';
  const selectedSubjectName =
    (selectedSubjectId === '__custom__' ? pdfCustomSubject : subjects.find((s) => s.id === selectedSubjectId)?.name) ||
    pdfCustomSubject ||
    '';

  // Helper to parse match_the_following questions into clean Column A and Column B data
  const parseMatchTheFollowing = (q: QuestionItem) => {
    let colA: { label: string; text: string }[] = [];
    let colB: { label: string; text: string }[] = [];
    let cleanQuestionText = q.question_text || 'Match the items in Column A with Column B:';

    // Case 1: options is an object with column_a and column_b
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const rawColA = q.options.column_a || q.options.columnA || [];
      const rawColB = q.options.column_b || q.options.columnB || [];
      if (Array.isArray(rawColA) && rawColA.length > 0) {
        colA = rawColA.map((item: any, idx: number) => ({
          label: item.label || item.id || `${idx + 1}`,
          text: typeof item === 'string' ? item : item.text || '',
        }));
      }
      if (Array.isArray(rawColB) && rawColB.length > 0) {
        colB = rawColB.map((item: any, idx: number) => ({
          label: item.label || item.id || String.fromCharCode(65 + idx),
          text: typeof item === 'string' ? item : item.text || '',
        }));
      }
    }

    // Case 2: options is an array of pairs / arrow strings (e.g. "(1) Area of a Circle -> q. πr²")
    if (colA.length === 0 && Array.isArray(q.options) && q.options.length > 0) {
      q.options.forEach((opt: any, idx: number) => {
        const rawText = typeof opt === 'string' ? opt : opt.text || '';
        const parts = rawText.split(/->|—|:|\t/);
        if (parts.length >= 2) {
          const leftClean = parts[0].replace(/^\s*\(?\d+\)?[\.\)]?\s*/, '').trim();
          const rightClean = parts[1].replace(/^\s*\(?[a-zA-Z0-9]+\)?[\.\)]?\s*/, '').trim();
          colA.push({ label: `${idx + 1}`, text: leftClean });
          colB.push({ label: String.fromCharCode(65 + idx), text: rightClean });
        } else {
          colA.push({ label: typeof opt === 'object' && opt.label ? opt.label : `${idx + 1}`, text: rawText });
        }
      });
    }

    // Case 3: Parse from question_text if text contains "Column A" and "Column B"
    if (colA.length === 0 && cleanQuestionText && cleanQuestionText.includes('Column A') && cleanQuestionText.includes('Column B')) {
      try {
        const colASplit = cleanQuestionText.split(/Column A:?/i);
        if (colASplit.length > 1) {
          cleanQuestionText = colASplit[0].trim() || 'Match the items in Column A with Column B:';
          const colBSplit = colASplit[1].split(/Column B:?/i);
          const colALines = colBSplit[0].split('\n').map((s: string) => s.trim()).filter(Boolean);
          const colBLines = (colBSplit[1] || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

          colALines.forEach((line: string, idx: number) => {
            const labelMatch = line.match(/^(\d+|\([a-z0-9]+\)|[a-z]\.)\s*(.*)/i);
            colA.push({
              label: labelMatch ? labelMatch[1].replace(/[\(\)\.]/g, '') : `${idx + 1}`,
              text: labelMatch ? labelMatch[2] : line,
            });
          });

          colBLines.forEach((line: string, idx: number) => {
            const labelMatch = line.match(/^([a-z]|\([a-z0-9]+\)|\d+\.)\s*(.*)/i);
            colB.push({
              label: labelMatch ? labelMatch[1].replace(/[\(\)\.]/g, '') : String.fromCharCode(65 + idx),
              text: labelMatch ? labelMatch[2] : line,
            });
          });
        }
      } catch (e) {
        console.error('Error parsing match question text:', e);
      }
    }

    // If cleanQuestionText still has Column A text, clean it
    if (cleanQuestionText.includes('Column A')) {
      cleanQuestionText = cleanQuestionText.split(/Column A/i)[0].trim() || 'Match the items in Column A with Column B:';
    }

    return { colA, colB, cleanQuestionText };
  };

  // Helper to group questions by section and sub-section
  const groupedSections: {
    sectionName: string;
    subSection?: string;
    instruction?: string;
    type: string;
    questions: QuestionItem[];
  }[] = [];

  paperQuestions.forEach((q) => {
    const secName = q.section_name || 'General Questions';
    let group = groupedSections.find((g) => g.sectionName === secName);
    if (!group) {
      const customMeta = sectionCustomMeta[secName] || {};
      const bpSec = sections.find((s) => s.section_name === secName);
      group = {
        sectionName: secName,
        subSection: customMeta.subSection || q.sub_section || bpSec?.sub_section,
        instruction: customMeta.instruction || bpSec?.instructions,
        type: q.type,
        questions: [],
      };
      groupedSections.push(group);
    }
    group.questions.push(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input for Image Uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-primary bg-[#FFF1DA]/70 border border-[#F1A501]/30 uppercase mb-2">
              <Sparkles className="w-3 h-3 text-primary" /> Paper Creation Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
              Automated Exam Paper Generator
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Create custom exam papers with Fill in the Blanks, Match the Following, MCQs, True/False, and Descriptive sections.
            </p>
          </div>

          {/* Stepper Navigation & Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Stepper Tabs */}
            <div className="flex items-center bg-muted/80 p-1 rounded-2xl border border-border shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'config'
                    ? 'bg-[#FFF1DA] text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    viewMode === 'config'
                      ? 'gradient-brand text-white shadow-2xs'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  1
                </span>
                <span>AI Setup</span>
              </button>

              <span className="text-muted-foreground/40 text-xs px-0.5">|</span>

              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-[#FFF1DA] text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    viewMode === 'raw'
                      ? 'gradient-brand text-white shadow-2xs'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  2
                </span>
                <span className="hidden sm:inline">⚡ Raw / Row Questions</span>
                <span className="sm:hidden">⚡ Raw</span>
              </button>

              <span className="text-muted-foreground/40 text-xs px-0.5">→</span>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-[#FFF1DA] text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    viewMode === 'preview'
                      ? 'gradient-brand text-white shadow-2xs'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  3
                </span>
                <span className="hidden sm:inline">Paper Preview</span>
                <span className="sm:hidden">Preview</span>
                <span className="text-[11px] opacity-80">({paperQuestions.length})</span>
              </button>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-1.5">
              <Link href="/papers">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-primary bg-card border-border hover:bg-[#FFF1DA]/40 cursor-pointer shadow-2xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span className="hidden sm:inline">Saved Papers</span>
                  <span className="sm:hidden">Saved</span>
                </Button>
              </Link>
              <Link href="/question-bank">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-foreground bg-card border-border hover:bg-muted cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span>Bank</span>
                </Button>
              </Link>
              <Link href="/scan">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-[#F1A501] bg-card border-border hover:bg-[#FFF1DA]/40 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-[#F1A501]" />
                  <span>Scan</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL PAGE VIEW 1: FULL-WIDTH CONFIGURATION SETUP                          */}
      {/* ========================================================================= */}
      {viewMode === 'config' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in print:hidden pb-24 md:pb-6">
          {/* Hidden file inputs for chapter PDF upload and optional local PDF upload */}
          <input
            type="file"
            ref={chapterPdfUploadInputRef}
            onChange={handleDirectChapterPdfSelected}
            accept="application/pdf"
            className="hidden"
          />
          <input
            type="file"
            ref={pdfFileInputRef}
            onChange={handlePdfFilesSelected}
            accept="application/pdf"
            multiple
            className="hidden"
          />

          {/* Quick Switch Banner to Raw / Row Questions Tab */}
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Direct Raw / Row Questions Se Paper Banana Hai?
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Agar aapke paas pehle se questions ya patterns hain (jaise &ldquo;Understand the pattern&rdquo;), toh bina AI wait ke instant PDF banayein.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setViewMode('raw')}
              className="h-8.5 px-3.5 text-xs font-bold gradient-brand text-white rounded-xl shadow-2xs hover:opacity-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Open Raw / Row Questions Maker</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* 1. Sleek Collapsible School & Exam Header */}
          <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap text-xs">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <School className="w-4 h-4 text-primary" /> {schoolName || 'Modern Public School'}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-semibold text-foreground">{examTitle || 'Annual Examination'}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {timeAllowed}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <Badge variant="outline" className="text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                  🎯 Target: {totalMarks} Marks
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="h-8 text-xs font-bold text-primary border-border hover:bg-[#FFF1DA]/60 cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                {isHeaderCollapsed ? 'Customize Paper Header ⚙️' : 'Close Header ✕'}
              </Button>
            </div>

            {/* Expanded Header Customization Form */}
            {!isHeaderCollapsed && (
              <div className="mt-4 pt-4 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
                <div>
                  <Label className="text-xs font-bold text-foreground">School / Institute Name</Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-white"
                    placeholder="e.g. Modern Public School"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">School Address</Label>
                  <Input
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-white"
                    placeholder="e.g. Civil Lines, New Delhi"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">Terminal / Exam Title</Label>
                  <Input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-white font-semibold"
                    placeholder="e.g. 1st Terminal Examination"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['1st Terminal', '2nd Terminal', '3rd Terminal', 'Annual'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setExamTitle(t.includes('Annual') ? 'Annual Examination' : `${t} Examination`)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">Time Allowed</Label>
                  <Input
                    value={timeAllowed}
                    onChange={(e) => setTimeAllowed(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-white"
                    placeholder="e.g. 2.5 Hours"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Total Marks</Label>
                    <button
                      type="button"
                      onClick={syncTotalMarks}
                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      (Sync)
                    </button>
                  </div>
                  <Input
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs bg-white font-bold"
                    placeholder="50"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-4">
                  <Label className="text-xs font-bold text-foreground">General Instructions (Printed at Top of Paper)</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    className="mt-1 text-xs rounded-xl bg-white"
                    placeholder="1. Attempt all questions. 2. Write answers clearly..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Step 1: Curriculum & Syllabus Selection */}
          <Card className="rounded-3xl border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4.5 h-4.5 text-primary" /> Step 1: Select Class, Subject & Chapters
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Select chapters to distribute questions with balanced syllabus coverage.
                  </CardDescription>
                </div>
                {selectedChapterIds.length > 0 && (
                  <Badge variant="outline" className="text-xs font-bold text-primary bg-[#FFF1DA]/70 border-[#F1A501]/40 self-start sm:self-auto">
                    {selectedChapterIds.length} Chapters Selected (~{approxPerChapterMarks}M / Chapter)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Class & Subject Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-foreground">Class / Grade *</Label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground">Subject *</Label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={!selectedClassId}
                    className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">
                      {!selectedClassId
                        ? 'Select Class first...'
                        : subjects.length === 0
                        ? 'No subjects found'
                        : 'Select Subject...'}
                    </option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapters Checklist */}
              {selectedSubjectId && (
                <div className="space-y-2.5 animate-fade-in pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      Chapters ({selectedChapterIds.length} of {chapters.length} Selected)
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAllChapters}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {selectedChapterIds.length === chapters.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                        title="Attach additional sample paper or textbook PDF"
                      >
                        <Upload className="w-3 h-3" /> + Extra PDF
                      </button>
                    </div>
                  </div>

                  {isLoadingChapters ? (
                    <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-xs font-bold text-foreground">Loading chapters from curriculum...</p>
                    </div>
                  ) : chapters.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 text-center space-y-2">
                      <p className="text-xs font-bold text-amber-900">No chapters found for this subject</p>
                      <p className="text-[11px] text-amber-700">
                        Add chapters in Classes & Curriculum or attach a PDF document below.
                      </p>
                      <Link href="/classes">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-100 mt-1 cursor-pointer">
                          Go to Classes & Curriculum
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-200">
                      {chapters.map((chap, idx) => {
                        const isSelected = selectedChapterIds.includes(chap.id);
                        const hasPdf = chap.has_pdf && chap.pdf_url;
                        const isUploadingThis = isUploadingChapterPdfId === chap.id;

                        return (
                          <div
                            key={chap.id}
                            onClick={() => toggleChapter(chap.id)}
                            className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'border-primary/40 bg-white font-semibold text-foreground shadow-2xs'
                                : 'border-slate-200/80 bg-white/60 hover:bg-white text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-400 font-bold w-4 shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="truncate">{chap.title}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                              {hasPdf ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                  <Cloud className="w-2.5 h-2.5 text-emerald-600" /> Textbook Ready
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerUploadPdfForChapter(chap)}
                                  disabled={isUploadingThis}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 bg-[#FFF1DA] px-2 py-0.5 rounded-full border border-[#F1A501]/40 transition-colors cursor-pointer"
                                  title="Upload textbook PDF for this chapter"
                                >
                                  {isUploadingThis ? (
                                    <>
                                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-2.5 h-2.5" /> + Add PDF
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Attached local PDFs list if any */}
                  {pdfFilesList.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>📎 Extra Attached PDFs ({pdfFilesList.length})</span>
                        <button
                          type="button"
                          onClick={handleClearAllPdfs}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      {pdfFilesList.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs"
                        >
                          <span className="truncate font-medium text-emerald-950">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePdfItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Step 2: Exam Blueprint & Presets */}
          <Card className="rounded-3xl border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-primary" /> Step 2: Question Paper Blueprint
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Choose an exam preset or customize question types, marks, and counts.
                  </CardDescription>
                </div>

                {/* Total Marks Match Status Indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      Number(totalMarks) === totalConfiguredMarks
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span>
                      Total: {totalConfiguredMarks} Marks
                    </span>
                    {Number(totalMarks) !== totalConfiguredMarks && (
                      <button
                        type="button"
                        onClick={syncTotalMarks}
                        className="underline text-[11px] font-black cursor-pointer hover:text-amber-950"
                        title="Set Target Marks to match configured sections"
                      >
                        (Sync to {totalConfiguredMarks}M)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Standard 1-Click Exam Presets */}
              <div className="pt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground mr-1">Quick Presets:</span>
                {EXAM_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FFF1DA] text-primary border-[#F1A501]/50 shadow-2xs font-extrabold'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Sparkles className={`w-3 h-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{preset.name}</span>
                      <span className="text-[10px] opacity-70 font-normal">({preset.defaultTime})</span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Compact Section Blueprint Matrix (Clean Table / Rows) */}
              <div className="space-y-2">
                {sections.map((section) => {
                  const sectionTotal = Number(section.count) * Number(section.marks_per_question);
                  const meta = SECTION_TYPE_METADATA[section.type];
                  const Icon = meta?.icon || FileText;

                  return (
                    <div
                      key={section.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        section.enabled
                          ? 'bg-card border-border shadow-2xs hover:border-border/80'
                          : 'bg-muted/30 border-dashed border-border/70 opacity-50'
                      }`}
                    >
                      {/* Left: Enable toggle, Type badge, Section name */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => {
                            handleToggleSection(section.id);
                            setActivePresetId('custom');
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold shrink-0 flex items-center gap-1 ${meta?.badgeColor || 'bg-muted text-foreground'}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          <span>{meta?.label || section.type}</span>
                        </Badge>
                        <Input
                          value={section.section_name}
                          onChange={(e) => {
                            handleUpdateSection(section.id, { section_name: e.target.value });
                            setActivePresetId('custom');
                          }}
                          className="h-8 text-xs font-semibold bg-transparent border-transparent hover:border-border focus:border-primary focus:bg-white rounded-lg flex-1 min-w-[150px]"
                        />
                      </div>

                      {/* Right: Count Stepper, Marks Stepper, Subtotal, Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {/* Questions Count Stepper */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground font-semibold mr-1">Qs:</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateSection(section.id, { count: Math.max(1, section.count - 1) });
                              setActivePresetId('custom');
                            }}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={section.count}
                            onChange={(e) => {
                              handleUpdateSection(section.id, { count: Math.max(1, Number(e.target.value) || 1) });
                              setActivePresetId('custom');
                            }}
                            className="w-12 h-7 text-center text-xs font-bold p-0 rounded-md bg-white border-border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateSection(section.id, { count: section.count + 1 });
                              setActivePresetId('custom');
                            }}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Marks Per Question Stepper */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground font-semibold mr-1">Marks/Q:</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateSection(section.id, { marks_per_question: Math.max(0.5, section.marks_per_question - 0.5) });
                              setActivePresetId('custom');
                            }}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            step={0.5}
                            min={0.5}
                            max={20}
                            value={section.marks_per_question}
                            onChange={(e) => {
                              handleUpdateSection(section.id, { marks_per_question: Math.max(0.5, Number(e.target.value) || 1) });
                              setActivePresetId('custom');
                            }}
                            className="w-12 h-7 text-center text-xs font-bold p-0 rounded-md bg-white border-border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateSection(section.id, { marks_per_question: section.marks_per_question + 0.5 });
                              setActivePresetId('custom');
                            }}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Section Subtotal */}
                        <div className="w-16 text-right font-black text-xs text-foreground">
                          {sectionTotal} M
                        </div>

                        {/* Delete Section */}
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteSection(section.id);
                            setActivePresetId('custom');
                          }}
                          className="p-1 text-muted-foreground hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Section Bar */}
              <div className="pt-2 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground mr-1">+ Add Type:</span>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('mcq'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                  >
                    + MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('fill_blank'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    + Fill-ups
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('true_false'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                  >
                    + True/False
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('match_the_following'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                  >
                    + Match
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('short_answer'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 cursor-pointer"
                  >
                    + Short Q
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('long_answer'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                  >
                    + Long Q
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleAddSection('picture_based'); setActivePresetId('custom'); }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 cursor-pointer"
                  >
                    + Diagram Q
                  </button>
                </div>
              </div>

              {/* Main Generate Button */}
              <div className="pt-4">
                <Button
                  onClick={pdfFilesList.length > 0 ? handleGenerateFromPdf : handleGeneratePaper}
                  disabled={
                    isGenerating ||
                    activeSections.length === 0 ||
                    (pdfFilesList.length === 0 && (!selectedClassId || !selectedSubjectId || selectedChapterIds.length === 0))
                  }
                  className="w-full h-12 rounded-2xl gradient-brand text-white font-extrabold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>Formulating Question Paper with 100% Curriculum Accuracy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>
                        Generate Complete Exam Paper ({totalConfiguredMarks} Marks)
                      </span>
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <span>⚡ 100% Textbook Grounded</span>
                  <span>•</span>
                  <span>Instant Printable Exam Paper & Answer Key</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sticky Bottom Action Bar for Mobile and Tablet */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30 md:hidden print:hidden">
            <Button
              onClick={pdfFilesList.length > 0 ? handleGenerateFromPdf : handleGeneratePaper}
              disabled={
                isGenerating ||
                activeSections.length === 0 ||
                (pdfFilesList.length === 0 && (!selectedClassId || !selectedSubjectId || selectedChapterIds.length === 0))
              }
              className="w-full h-12 rounded-xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : paperQuestions.length > 0 ? (
                <>
                  <span>Preview Paper ({paperQuestions.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Generate Exam Paper ({totalConfiguredMarks}M)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE VIEW: RAW / ROW QUESTIONS TO PDF GENERATOR                      */}
      {/* ========================================================================= */}
      {viewMode === 'raw' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in print:hidden pb-24 md:pb-6">
          {/* Top Banner Card */}
          <Card className="border border-border/80 bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-amber-700 bg-amber-100/80 border border-amber-300 uppercase mb-1.5">
                    ⚡ Instant PDF Generator (Zero AI Wait)
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    Raw / Row Questions to Printable PDF
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Yahan aap direct question type/paste karke ya pattern rows set karke as-it-is A4 exam paper bana sakte hain.
                  </CardDescription>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center bg-muted p-1 rounded-xl border border-border shrink-0">
                  <button
                    type="button"
                    onClick={() => setRawInputMode('builder')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rawInputMode === 'builder'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Row / Pattern Builder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawInputMode('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rawInputMode === 'text'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Direct Paste Raw Text</span>
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Hidden File Input for Raw Media Upload (Images & PDFs) */}
          <input
            type="file"
            ref={rawMediaFileInputRef}
            onChange={handleRawMediaFilesSelected}
            accept="image/*,application/pdf"
            multiple
            className="hidden"
          />

          {/* 📸 AI PHOTO / PDF INSTANT SCANNER CARD */}
          <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 uppercase">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>AI Handwriting & Paper Scanner</span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-indigo-950">
                    <span>Upload Exam Paper Photos or PDF (हैंडरिटेन या प्रिंटेड पेपर अपलोड करें)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Handwritten notebook photo (jaise UKG English test), printed paper ya PDF upload karein — AI Class, Subject, Marks & Questions ko <strong>as-it-is extract karke instant PDF</strong> bana dega!
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => rawMediaFileInputRef.current?.click()}
                    variant="outline"
                    className="h-9 px-3 text-xs font-bold border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    <span>+ Add Photos / PDF</span>
                  </Button>

                  {rawUploadedFiles.length > 0 && (
                    <Button
                      type="button"
                      disabled={isExtractingRawMedia}
                      onClick={handleExtractPaperFromMedia}
                      className="h-9 px-4 text-xs font-bold gradient-brand text-white shadow-xs cursor-pointer"
                    >
                      {isExtractingRawMedia ? (
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
            </CardHeader>

            <CardContent className="pt-1">
              {rawUploadedFiles.length === 0 ? (
                <div
                  onClick={() => rawMediaFileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      Click here to upload photos of notebook pages, handwritten tests, or PDF papers
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP, and PDF • Multiple pages/images supported
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {rawUploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="relative group rounded-xl border border-indigo-200 bg-white p-2 shadow-2xs flex flex-col items-center justify-between text-center overflow-hidden"
                      >
                        {file.type.startsWith('image/') ? (
                          <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-100 mb-1.5">
                            <img
                              src={file.data}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-20 rounded-lg bg-red-50 flex flex-col items-center justify-center text-red-600 mb-1.5">
                            <FileText className="w-7 h-7" />
                            <span className="text-[9px] font-bold mt-1 uppercase">PDF Doc</span>
                          </div>
                        )}
                        <p className="text-[10px] font-semibold text-slate-700 truncate w-full" title={file.name}>
                          {file.name}
                        </p>
                        <span className="text-[9px] text-slate-400">{file.size}</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRawUploadedFile(file.id);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-xs text-indigo-900 font-medium">
                      📎 {rawUploadedFiles.length} file(s) ready. Click below to let AI automatically extract header & questions.
                    </span>
                    <Button
                      type="button"
                      disabled={isExtractingRawMedia}
                      onClick={handleExtractPaperFromMedia}
                      size="sm"
                      className="h-8 px-4 text-xs font-bold gradient-brand text-white shadow-xs cursor-pointer w-full sm:w-auto"
                    >
                      {isExtractingRawMedia ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          <span>Processing Images...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          <span>⚡ Start AI Extraction</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Header Quick Configuration Card */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                <span>Exam Paper Header Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">School / Institute Name</Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="School Name"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">School Address</Label>
                  <Input
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="Address"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Terminal / Exam Title</Label>
                  <Input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="h-8.5 text-xs mt-1 font-semibold"
                    placeholder="e.g. 1st Terminal Examination"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['1st Terminal', '2nd Terminal', '3rd Terminal', 'Annual'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setExamTitle(t.includes('Annual') ? 'Annual Examination' : `${t} Examination`)}
                        className="text-[9px] px-1 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Class / Grade</Label>
                  <Input
                    value={pdfCustomClass || (selectedClassId ? classes.find(c => c.id === selectedClassId)?.name || '' : '')}
                    onChange={(e) => setPdfCustomClass(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="e.g. Class 2 / Class 3"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Subject</Label>
                  <Input
                    value={pdfCustomSubject || (selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name || '' : '')}
                    onChange={(e) => setPdfCustomSubject(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="e.g. Mathematics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-dashed border-border/70">
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
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Total Marks</Label>
                  <Input
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="h-8.5 text-xs mt-1"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Layout Mode</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant={!isTwoColumn ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsTwoColumn(false)}
                      className="h-8.5 text-xs flex-1 cursor-pointer"
                    >
                      Single Column
                    </Button>
                    <Button
                      type="button"
                      variant={isTwoColumn ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsTwoColumn(true)}
                      className="h-8.5 text-xs flex-1 cursor-pointer"
                    >
                      Two Column
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MAIN CONTENT AREA ACCORDING TO MODE */}
          {rawInputMode === 'builder' ? (
            /* ========================================================================= */
            /* BUILDER MODE: VISUAL ROW / PATTERN BUILDER                                */
            /* ========================================================================= */
            <div className="space-y-4">
              {rawBuilderQuestions.map((q, qIdx) => (
                <Card key={q.id} className="border border-border/90 shadow-xs">
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
                              const updated = [...rawBuilderQuestions];
                              updated[qIdx].marks = Number(e.target.value) || 1;
                              setRawBuilderQuestions(updated);
                            }}
                            className="w-16 h-7.5 text-xs font-bold text-center"
                          />
                        </div>
                        {rawBuilderQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRawQuestion(q.id)}
                            className="h-7.5 w-7.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Question Title & Section row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Question Instruction / Heading
                        </Label>
                        <Input
                          value={q.title}
                          onChange={(e) => {
                            const updated = [...rawBuilderQuestions];
                            updated[qIdx].title = e.target.value;
                            setRawBuilderQuestions(updated);
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
                            const updated = [...rawBuilderQuestions];
                            updated[qIdx].sectionName = e.target.value;
                            setRawBuilderQuestions(updated);
                          }}
                          className="h-9 text-xs mt-1"
                          placeholder="e.g. Section A: Patterns"
                        />
                      </div>
                    </div>

                    {/* Rows Table */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between pb-1 border-b border-border">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Pattern Rows (हर लाइन और उसके खाली स्थान)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Jitna blanks count utne <code className="bg-muted px-1 rounded">_______</code> aayenge
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.rows.map((row, rIdx) => (
                          <div
                            key={row.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            {/* Label */}
                            <div className="w-16 shrink-0">
                              <Input
                                value={row.label}
                                onChange={(e) => handleUpdateRawPatternRow(q.id, row.id, 'label', e.target.value)}
                                className="h-8 text-xs font-bold text-center bg-card"
                                placeholder="(i)"
                              />
                            </div>

                            {/* Pattern input */}
                            <div className="flex-1 min-w-0">
                              <Input
                                value={row.pattern}
                                onChange={(e) => handleUpdateRawPatternRow(q.id, row.id, 'pattern', e.target.value)}
                                className="h-8 text-xs sm:text-sm font-mono font-bold bg-card"
                                placeholder="Pattern e.g. ^ V ^ V or M W M W or A B C A"
                              />
                            </div>

                            {/* Blank count */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Blanks:</span>
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={row.blanksCount}
                                onChange={(e) => handleUpdateRawPatternRow(q.id, row.id, 'blanksCount', Math.max(1, Number(e.target.value) || 1))}
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

                            {/* Delete row */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRawPatternRow(q.id, row.id)}
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
                          onClick={() => handleAddRawPatternRow(q.id)}
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
                  onClick={handleAddRawQuestion}
                  className="h-9 text-xs font-bold rounded-xl border-dashed border-border hover:bg-muted cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Add Another Question (+ नया प्रश्न जोड़ें)</span>
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TEXT PASTE MODE: DIRECT RAW TEXTAREA                                      */
            /* ========================================================================= */
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
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  className="font-mono text-xs sm:text-sm min-h-[300px] leading-relaxed bg-muted/20 border-border"
                  placeholder="Paste your raw questions here..."
                />

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Formatting Tips:</span>
                  </div>
                  <div>• Subparts ke liye <code className="bg-background px-1 rounded">(i)</code>, <code className="bg-background px-1 rounded">(ii)</code> format use karein.</div>
                  <div>• Khali jagah ke liye multiple <code className="bg-background px-1 rounded">_______  _______  _______</code> use karein.</div>
                  <div>• Marks specify karne ke liye line ke aakhir me <code className="bg-background px-1 rounded">(3)</code> ya <code className="bg-background px-1 rounded">(3 Marks)</code> likhein.</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bottom Action Control Bar */}
          <Card className="border border-border/80 shadow-xs bg-muted/30">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode('config')}
                className="h-10 text-xs font-bold rounded-xl border-border hover:bg-muted cursor-pointer w-full sm:w-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Switch to AI Generator</span>
              </Button>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                {rawInputMode === 'builder' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleConvertBuilderToPaper(true)}
                      className="h-10 px-4 text-xs font-bold rounded-xl border-border hover:bg-muted cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      <span>Instant Direct Print</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleConvertBuilderToPaper(false)}
                      className="h-10 px-5 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs hover:opacity-95 cursor-pointer flex-1 sm:flex-initial"
                    >
                      <span>Preview & Review Paper</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleConvertRawTextToPaper(true)}
                      className="h-10 px-4 text-xs font-bold rounded-xl border-border hover:bg-muted cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      <span>Instant Direct Print</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleConvertRawTextToPaper(false)}
                      className="h-10 px-5 text-xs font-bold gradient-brand text-white rounded-xl shadow-xs hover:opacity-95 cursor-pointer flex-1 sm:flex-initial"
                    >
                      <span>Preview & Review Paper</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE VIEW 2: FULL-WIDTH PAPER PREVIEW & PRINT CANVAS                 */}
      {/* ========================================================================= */}
      {viewMode === 'preview' && (
        <div className="max-w-5xl mx-auto space-y-4 animate-fade-in pb-24 md:pb-6">
          {/* Unified Professional Document Control Bar */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 print:hidden">
            {/* Top Tier: Navigation, Title & Live Status */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Back & Document Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('config')}
                  className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border-border text-foreground hover:bg-muted cursor-pointer shrink-0 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-muted-foreground" />
                  <span>AI Setup</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('raw')}
                  className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border-border text-foreground hover:bg-muted cursor-pointer shrink-0 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-muted-foreground" />
                  <span>Raw / Row Paper</span>
                </Button>

                <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <h2
                    className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[150px] sm:max-w-[260px] md:max-w-sm"
                    title={examTitle}
                  >
                    {examTitle || 'Exam Paper'}
                  </h2>
                </div>
              </div>

              {/* Status Pills & Metrics */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="h-7 text-xs font-semibold text-foreground bg-muted/70 border-border px-2.5 rounded-lg shadow-2xs"
                >
                  {paperQuestions.length} Questions • {totalMarks} Marks
                </Badge>

                {isSaving ? (
                  <Badge
                    variant="outline"
                    className="h-7 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 flex items-center gap-1.5 px-2.5 rounded-lg animate-pulse"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
                    <span>Saving...</span>
                  </Badge>
                ) : editingPaperId || isAutoSaved ? (
                  <Badge
                    variant="outline"
                    className="h-7 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1.5 px-2.5 rounded-lg shadow-2xs"
                    title="Auto-saved to your library. Edits, questions, and mark adjustments are completely free (0 credits used)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Auto-Saved {lastSavedAt ? `(${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
                    <span className="hidden md:inline text-[11px] text-emerald-700/80 dark:text-emerald-400 font-normal pl-1.5 border-l border-emerald-500/30">
                      0 Credits Used
                    </span>
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Bottom Tier: View Controls & Document Actions */}
            <div className="border-t border-border/70 pt-2.5 flex flex-wrap items-center justify-between gap-2.5">
              {/* View Layout Controls */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTwoColumn(!isTwoColumn)}
                  className={`h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs ${
                    isTwoColumn
                      ? 'bg-secondary text-primary border-primary/40 font-bold'
                      : 'text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                  }`}
                  title="Toggle 2-column examination layout"
                >
                  <Columns className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <span>{isTwoColumn ? '2 Columns (Active)' : '2 Columns'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className={`h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs ${
                    showAnswerKey
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold'
                      : 'text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                  }`}
                  title="Toggle display of Answer Key"
                >
                  <Key className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  <span>{showAnswerKey ? 'Hide Answers' : 'Answer Key'}</span>
                </Button>
              </div>

              {/* Document Actions */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {editingPaperId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSavePaper(true)}
                    disabled={isSaving || paperQuestions.length === 0}
                    className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border-border text-foreground hover:bg-muted cursor-pointer shadow-2xs"
                    title="Save as a new separate question paper in your library"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    <span>Save as Copy</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartNewPaper}
                  className="h-8 px-2.5 sm:px-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Start creating a fresh paper"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>New Paper</span>
                </Button>

                <Button
                  onClick={() => handleSavePaper(false)}
                  disabled={isSaving || paperQuestions.length === 0}
                  size="sm"
                  variant="outline"
                  className={`h-8 px-3 text-xs font-bold rounded-lg cursor-pointer shadow-2xs ${
                    editingPaperId
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  )}
                  <span>{editingPaperId ? 'Update (0 Credits)' : 'Save Paper'}</span>
                </Button>

                <Button
                  onClick={handlePrint}
                  disabled={paperQuestions.length === 0}
                  size="sm"
                  className="h-8 px-3.5 sm:px-4 text-xs font-bold rounded-xl gradient-brand text-white shadow-sm hover:opacity-95 cursor-pointer active:scale-98 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  <span>Print / Save PDF</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Centered A4 Exam Paper Canvas Wrapper */}
          <div className="w-full flex justify-center py-2 print:p-0 overflow-x-auto">
            <div
              id="printable-exam-paper"
              className="print-page w-full min-w-0 sm:min-w-[700px] max-w-[800px] bg-white border border-slate-300 rounded-xl p-4 sm:p-8 lg:p-12 shadow-xl min-h-[600px] sm:min-h-[1050px] text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-w-0"
            >
            {paperQuestions.length === 0 ? (
              <div className="h-[450px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 print:hidden space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Paper Preview Ready</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click below to go to the setup form, select your chapters and generate.
                </p>
                <Button onClick={() => setViewMode('config')} className="h-8 text-xs gradient-brand text-white rounded-lg cursor-pointer">
                  Go to Setup Form
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Paper Header */}
                <div className="print-header text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <div className="relative flex items-center justify-center">
                    {schoolLogo && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-24 flex items-center">
                        <img src={schoolLogo} alt="School Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <div className="max-w-[calc(100%-220px)] mx-auto">
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                        {schoolName}
                      </h2>
                      {schoolAddress && (
                        <div className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase mb-1">
                          {schoolAddress}
                        </div>
                      )}
                      <h3 className="text-sm sm:text-base font-bold text-slate-700">
                        {examTitle}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs font-semibold pt-2 text-slate-800 border-t border-slate-200 mt-2">
                    <span>CLASS: {selectedClassName || 'N/A'}</span>
                    <span>SUBJECT: {selectedSubjectName || 'N/A'}</span>
                    <span>TIME: {timeAllowed}</span>
                    <span>MAX MARKS: {totalMarks}</span>
                  </div>
                </div>

                {/* Candidate Details Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-medium border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="shrink-0 font-bold text-slate-800">Name:</span>
                    <span className="border-b border-slate-400 border-dotted flex-1 min-w-[120px] inline-block h-3"></span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">Roll No:</span>
                      <span className="border-b border-slate-400 border-dotted w-16 inline-block h-3"></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">Section:</span>
                      <span className="border-b border-slate-400 border-dotted w-12 inline-block h-3"></span>
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                {instructions && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 italic border border-slate-200">
                    <p className="font-bold not-italic mb-0.5">Instructions:</p>
                    <p className="whitespace-pre-line">{instructions}</p>
                  </div>
                )}

                {/* Dynamic Question Sections Rendered in Order */}
                <div
                  className={`space-y-6 pt-2 ${
                    isTwoColumn
                      ? 'columns-1 sm:columns-2 gap-8 [column-rule:1px_solid_#cbd5e1] print:columns-2 print:gap-6'
                      : ''
                  }`}
                >
                  {groupedSections.map((secGroup, secIdx) => {
                    const secQuestions = secGroup.questions;
                    const secMarksTotal = secQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

                    return (
                      <div
                        key={secGroup.sectionName || secIdx}
                        className={`print-section space-y-2.5 print:space-y-1.5 ${
                          isTwoColumn ? 'mb-4' : 'mb-3'
                        }`}
                      >
                        {/* Section Header with Section Marks, Description / Instructions, and Edit Controls */}
                        {editingSectionName === secGroup.sectionName ? (
                          <div className="border-2 border-indigo-500 bg-indigo-50/50 rounded-xl p-3.5 space-y-3 print:hidden shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Edit Section & Description
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditedSection}
                                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer px-3"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSectionName(null)}
                                  className="h-7 text-xs cursor-pointer px-3"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Section Title (e.g. SECTION A: SHORT ANSWER QUESTIONS)
                                </label>
                                <Input
                                  value={editSecTitle}
                                  onChange={(e) => setEditSecTitle(e.target.value)}
                                  className="h-8 text-xs bg-white font-medium"
                                  placeholder="Section Title"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Section Description / Instruction (e.g. Answer the following questions / Attempt any 4 questions)
                                </label>
                                <Input
                                  value={editSecInstruction}
                                  onChange={(e) => setEditSecInstruction(e.target.value)}
                                  className="h-8 text-xs bg-white"
                                  placeholder="e.g. Answer the following questions:"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-b-2 border-slate-800 pb-1.5 space-y-0.5 group/sec relative">
                            <div className="flex items-baseline justify-between gap-3">
                              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                                {secGroup.sectionName} ({secMarksTotal} Marks)
                              </h4>
                              <div className="flex items-center gap-1.5 print:hidden opacity-0 group-hover/sec:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartEditSection(
                                      secGroup.sectionName,
                                      secGroup.instruction,
                                      getDefaultSectionInstruction(secGroup.type)
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer transition-colors"
                                  title="Edit section title and description"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit Section & Description
                                </button>
                              </div>
                            </div>

                            {/* Section Description / Instruction (e.g. "Answer the following questions:") */}
                            {(() => {
                              const displayInst =
                                secGroup.instruction || getDefaultSectionInstruction(secGroup.type);
                              return displayInst ? (
                                <div
                                  onClick={() =>
                                    handleStartEditSection(
                                      secGroup.sectionName,
                                      secGroup.instruction,
                                      getDefaultSectionInstruction(secGroup.type)
                                    )
                                  }
                                  className="group/desc inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-100/70 rounded px-1 py-0.5 -mx-1 transition-colors"
                                  title="Click to edit this description"
                                >
                                  <p className="text-[11px] text-slate-600 italic font-medium">
                                    {displayInst}
                                  </p>
                                  <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/desc:opacity-100 transition-opacity print:hidden" />
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {/* Questions in this Section */}
                        <div className="space-y-4">
                          {secQuestions.map((q, qIdx) => {
                            const globalIdx = paperQuestions.findIndex((item) => item.id === q.id);
                            const qNumber = formatQuestionNumber(secIdx, qIdx);
                            const { colA, colB, cleanQuestionText } = parseMatchTheFollowing(q);
                            const displayQuestionText =
                              q.type === 'match_the_following'
                                ? 'Match the following:'
                                : q.question_text;

                            return (
                              <div
                                key={q.id || globalIdx}
                                className={`print-question text-xs space-y-1 group relative break-inside-avoid print:break-inside-avoid ${
                                  isTwoColumn ? 'mb-4' : 'mb-2.5'
                                }`}
                              >
                                {/* Sub-section header if this question introduces a new subsection within the section */}
                                {q.sub_section && q.sub_section !== secGroup.subSection && (qIdx === 0 || secQuestions[qIdx - 1]?.sub_section !== q.sub_section) && (
                                  <div className="pt-2 pb-1 border-b border-dashed border-slate-300 mb-2">
                                    <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 print:border-none print:bg-transparent print:p-0">
                                      {q.sub_section}
                                    </span>
                                  </div>
                                )}

                                {/* Question Header Line */}
                                <div className="flex items-start justify-between font-medium">
                                  <div className="flex-1 leading-relaxed flex items-start gap-1.5 w-full">
                                    <span className="font-bold shrink-0 min-w-[24px]">{qNumber}.</span>
                                    {editingQuestionIdx === globalIdx ? (
                                      <div className="flex-1 space-y-2.5 p-3 rounded-lg border-2 border-indigo-400 bg-indigo-50/30 print:hidden">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                            Question Text
                                          </label>
                                          <Textarea
                                            value={editingQuestionText}
                                            onChange={(e) => setEditingQuestionText(e.target.value)}
                                            className="text-xs min-h-[70px] bg-white"
                                            placeholder="Type question text..."
                                          />
                                        </div>

                                        {/* Section, Subsection & Marks row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                              Section Name
                                            </label>
                                            <Input
                                              value={editingQuestionSection}
                                              onChange={(e) => setEditingQuestionSection(e.target.value)}
                                              className="h-7 text-xs bg-white font-medium"
                                              placeholder="Section Name"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                              Subsection / Part
                                            </label>
                                            <Input
                                              value={editingQuestionSubSection}
                                              onChange={(e) => setEditingQuestionSubSection(e.target.value)}
                                              className="h-7 text-xs bg-white"
                                              placeholder="e.g. Part 1: Grammar"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                              Marks
                                            </label>
                                            <Input
                                              type="number"
                                              min={1}
                                              max={50}
                                              value={editingQuestionMarks}
                                              onChange={(e) => setEditingQuestionMarks(Number(e.target.value) || 1)}
                                              className="h-7 text-xs bg-white font-bold"
                                            />
                                          </div>
                                        </div>

                                        {/* MCQ Options Editor if type is mcq */}
                                        {q.type === 'mcq' && editingQuestionOptions.length > 0 && (
                                          <div className="space-y-1.5 pt-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                              Options (A, B, C, D)
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {editingQuestionOptions.map((optVal, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-1.5">
                                                  <span className="font-bold text-xs text-indigo-700 w-5 text-center">
                                                    ({String.fromCharCode(65 + optIdx)})
                                                  </span>
                                                  <Input
                                                    value={optVal}
                                                    onChange={(e) => {
                                                      const updatedOpts = [...editingQuestionOptions];
                                                      updatedOpts[optIdx] = e.target.value;
                                                      setEditingQuestionOptions(updatedOpts);
                                                    }}
                                                    className="h-7 text-xs bg-white flex-1"
                                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Save and Cancel buttons */}
                                        <div className="flex items-center gap-2 pt-1">
                                          <Button
                                            size="sm"
                                            onClick={handleSaveEditedQuestion}
                                            className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                          >
                                            Save Question
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingQuestionIdx(null)}
                                            className="h-7 text-xs px-3 cursor-pointer"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="flex-1 whitespace-pre-wrap"><Latex>{autoFormatMath(displayQuestionText)}</Latex></span>
                                    )}
                                  </div>
                                  <div className="absolute top-0 right-0 flex items-center gap-2 print:hidden bg-white px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditQuestion(globalIdx)}
                                      className="text-slate-600 hover:text-indigo-600 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer border-r border-slate-200 pr-2 mr-0.5"
                                      title="Edit Question, Section, and Subsection"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenImagePicker(globalIdx)}
                                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer border-r border-slate-200 pr-2 mr-0.5"
                                      title="Attach diagram/image"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      {q.image_url ? 'Change Diagram' : '+ Diagram'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestion(globalIdx)}
                                      className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                      title="Remove question from paper"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Attached Diagram / Image */}
                                {q.image_url && (
                                  <div className="relative inline-block my-1 border border-slate-300 rounded p-1 bg-white">
                                    <img
                                      src={q.image_url}
                                      alt={`Figure for Q${qNumber}`}
                                      className="max-h-32 max-w-xs object-contain rounded"
                                    />
                                    <div className="text-[10px] text-center text-slate-500 font-serif italic mt-0.5">
                                      [Fig. Q{qNumber}]
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(globalIdx)}
                                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 print:hidden cursor-pointer"
                                      title="Remove diagram"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}

                                {/* 1. MCQ Options */}
                                {q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 && (() => {
                                  const maxOptLen = Math.max(0, ...q.options.map((o: any) => (typeof o === 'string' ? o : o.text || '').length));
                                  let colClass = maxOptLen < 20 ? 'grid-cols-2 sm:grid-cols-4' : maxOptLen < 50 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
                                  
                                  // In two-column paper layout, space is limited, so max 2 columns unless very small
                                  if (isTwoColumn) {
                                    colClass = maxOptLen < 8 ? 'grid-cols-4' : maxOptLen < 25 ? 'grid-cols-2' : 'grid-cols-1';
                                  }

                                  return (
                                    <div className={`grid ${colClass} gap-x-4 gap-y-2 pl-4 pt-1 text-slate-800`}>
                                      {q.options.map((opt: any, oIdx: number) => {
                                      const label =
                                        typeof opt === 'string'
                                          ? String.fromCharCode(65 + oIdx)
                                          : opt.label || String.fromCharCode(65 + oIdx);
                                      const text = autoFormatMath(typeof opt === 'string' ? opt : opt.text);
                                      return (
                                          <div key={oIdx} className="font-normal flex items-start gap-1 text-sm">
                                            <span className="font-semibold shrink-0">({label})</span>
                                            <span className="flex-1"><Latex>{text}</Latex></span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                                {/* 2. True / False Indicator */}
                                {q.type === 'true_false' && (
                                  <div className="pl-4 pt-1 flex items-center gap-6 text-slate-700 font-semibold text-[11px]">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded border border-slate-400 inline-block"></span>
                                      True
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded border border-slate-400 inline-block"></span>
                                      False
                                    </span>
                                  </div>
                                )}

                                {/* 3. Match the Following - Clean Board Exam Two-Column Format */}
                                {q.type === 'match_the_following' && (
                                  <div className="pl-4 pt-1.5 space-y-1.5 max-w-xl">
                                    {/* Column Headers with bottom divider */}
                                    <div className="match-row grid grid-cols-2 gap-6 font-bold text-xs text-slate-900 border-b border-slate-300 pb-1">
                                      <div>Column A</div>
                                      <div>Column B</div>
                                    </div>

                                    {/* Side-by-Side Items */}
                                    <div className="space-y-1.5 pt-1 text-xs text-slate-800">
                                      {Array.from({ length: Math.max(colA.length, colB.length, 1) }).map((_, rIdx) => {
                                        const itemA = colA[rIdx];
                                        const itemB = colB[rIdx];
                                        const labelA = itemA?.label ? itemA.label.replace(/\.$/, '') : `${rIdx + 1}`;
                                        const labelB = itemB?.label ? itemB.label.replace(/\.$/, '') : String.fromCharCode(65 + rIdx);

                                        return (
                                          <div key={rIdx} className="match-row grid grid-cols-2 gap-6 items-start py-0.5">
                                            <div className="pr-2">
                                              {itemA ? (() => {
                                                const textA = autoFormatMath(typeof itemA === 'string' ? itemA : itemA.text || '');
                                                return (
                                                  <div className="flex items-start gap-1">
                                                    <span className="font-bold text-slate-900 shrink-0">{labelA}. </span>
                                                    <span className="flex-1"><Latex>{textA}</Latex></span>
                                                  </div>
                                                );
                                              })() : ''}
                                            </div>
                                            <div>
                                              {itemB ? (() => {
                                                const textB = autoFormatMath(typeof itemB === 'string' ? itemB : itemB.text || '');
                                                return (
                                                  <div className="flex items-start gap-1">
                                                    <span className="font-bold text-slate-900 shrink-0">{labelB}. </span>
                                                    <span className="flex-1"><Latex>{textB}</Latex></span>
                                                  </div>
                                                );
                                              })() : ''}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Answer Key for Teachers */}
                                {showAnswerKey && (
                                  <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 font-medium space-y-1 shadow-2xs break-words overflow-hidden">
                                    <div className="flex items-start gap-1.5 leading-relaxed">
                                      <span className="font-bold shrink-0 text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline shrink-0" />
                                        Model Answer:
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        {q.correct_option && (
                                          <span className="font-bold mr-1.5 text-emerald-950 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded text-[11px]">
                                            Option ({q.correct_option})
                                          </span>
                                        )}
                                        <span className="inline-block break-words max-w-full">
                                          <Latex>{autoFormatMath(q.answer_text || q.correct_answer || 'N/A')}</Latex>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-slate-200 text-[11px] text-slate-400">
                    *** End of Examination Paper ***
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Floating Bottom Bar for Preview Mode */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30 md:hidden print:hidden flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode('config')}
              className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-300 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Setup
            </Button>
            <Button
              onClick={handlePrint}
              disabled={paperQuestions.length === 0}
              className="flex-2 h-11 rounded-xl gradient-brand text-white font-bold text-xs shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
            </Button>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* CLOUDFLARE CHAPTER LIBRARY MODAL                                          */}
      {/* ========================================================================= */}
      {isCloudflareLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-[#181E4B]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                  <Cloud className="w-4 h-4 text-emerald-600" /> Cloudflare R2 Chapter Library
                </div>
                <h2 className="text-lg font-heading font-black text-foreground">
                  Saved Chapter PDFs
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select previously uploaded chapter PDFs to formulate exam papers instantly with zero re-uploading!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCloudflareLibraryOpen(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-border/40 flex items-center justify-center text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1 & 2: Cascading Class & Subject Dropdowns */}
            <div className="p-4 border-b border-border bg-card space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-foreground">1. Select Class / Grade *</Label>
                  <select
                    value={modalClassId}
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Select a class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground">2. Select Subject *</Label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => handleModalSubjectChange(e.target.value)}
                    disabled={!modalClassId || modalSubjects.length === 0}
                    className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {!modalClassId ? 'First select class above...' : modalSubjects.length === 0 ? 'No subjects found' : 'Select a subject...'}
                    </option>
                    {modalSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick chapter selection header when subject is chosen */}
              {modalSubjectId && modalChapters.length > 0 && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="text-[11px] font-bold text-muted-foreground">
                    3. Select Chapters with Cloudflare PDFs ({modalSelectedChapterIds.length}/{modalChapters.filter(c => c.has_pdf).length} selected)
                  </div>
                  {modalChapters.some(c => c.has_pdf) && (
                    <button
                      type="button"
                      onClick={handleToggleModalSelectAll}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {modalSelectedChapterIds.length === modalChapters.filter(c => c.has_pdf).length ? 'Deselect All' : 'Select All with PDFs'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Body: Chapter Selection Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {!modalClassId ? (
                <div className="h-52 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/20 space-y-2">
                  <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  <h4 className="text-xs font-bold text-foreground">Select Class First</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    Please select a Class / Grade above to view its available subjects and chapters.
                  </p>
                </div>
              ) : !modalSubjectId ? (
                <div className="h-52 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/20 space-y-2">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                  <h4 className="text-xs font-bold text-foreground">Select Subject</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    Now select a Subject to view all chapters with Cloudflare PDFs.
                  </p>
                </div>
              ) : isLoadingModalChapters ? (
                <div className="h-52 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">Fetching chapters from Cloudflare R2...</p>
                </div>
              ) : modalChapters.length === 0 ? (
                <div className="h-52 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-2xl bg-muted/20 space-y-2">
                  <Cloud className="w-8 h-8 text-muted-foreground" />
                  <h4 className="text-xs font-bold text-foreground">No Chapters Found</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    No chapters exist for this subject yet. You can create chapters and upload PDFs in <strong>Classes &amp; Curriculum</strong>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {modalChapters.map((chap) => {
                    const isChecked = modalSelectedChapterIds.includes(chap.id);
                    const hasPdf = chap.has_pdf && chap.pdf_url;
                    const isAlreadyInPaper = pdfFilesList.some(
                      (p) => p.dataUrl === chap.pdf_url || p.id === `cf-${chap.id}`
                    );

                    return (
                      <label
                        key={chap.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                          !hasPdf
                            ? 'border-slate-200 bg-white/50 opacity-60 cursor-not-allowed'
                            : isChecked
                            ? 'border-emerald-400 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-400'
                            : 'border-border bg-card hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!hasPdf}
                          checked={isChecked}
                          onChange={() => handleToggleModalChapterSelect(chap.id)}
                          className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-foreground truncate">
                              {chap.title}
                            </span>
                            {isAlreadyInPaper && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                                In Paper
                              </span>
                            )}
                          </div>
                          {hasPdf ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                              <Cloud className="w-2.5 h-2.5 text-emerald-600" /> Cloudflare PDF Ready
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              No PDF uploaded yet
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {modalSelectedChapterIds.length} chapter(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCloudflareLibraryOpen(false)}
                  className="h-8 px-3 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={modalSelectedChapterIds.length === 0}
                  onClick={handleAttachModalSelectedChapters}
                  className="h-8 px-4 text-xs font-bold rounded-xl gradient-brand text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Attach Selected Chapters ({modalSelectedChapterIds.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
