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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { printExamPaper, autoFormatMath } from '@/lib/paperPrinter';

export type QuestionType =
  | 'mcq'
  | 'fill_blank'
  | 'true_false'
  | 'match_the_following'
  | 'short_answer'
  | 'long_answer';

export interface SectionConfigItem {
  id: string;
  section_name: string;
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
}

interface QuestionItem {
  id: string;
  section_name?: string;
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
    section_name: 'Section E: Short Answer Questions',
    type: 'short_answer',
    count: 4,
    marks_per_question: 3,
    difficulty: 'medium',
    enabled: true,
  },
  {
    id: 'sec-6',
    section_name: 'Section F: Long Answer Questions',
    type: 'long_answer',
    count: 2,
    marks_per_question: 5,
    difficulty: 'hard',
    enabled: true,
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

export default function GeneratePaperPage() {
  const [token, setToken] = useState('');
  const [viewMode, setViewMode] = useState<'config' | 'preview'>('config');

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

  // Dynamic Section Config State
  const [sections, setSections] = useState<SectionConfigItem[]>(DEFAULT_SECTIONS);

  // Generated paper state
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

  // Inline Question Editing
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');

  const handleSaveEditedQuestion = () => {
    if (editingQuestionIdx === null) return;
    const newQuestions = [...paperQuestions];
    newQuestions[editingQuestionIdx].question_text = editingQuestionText;
    setPaperQuestions(newQuestions);
    setEditingQuestionIdx(null);
    setEditingQuestionText('');
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
        if (p.title) setExamTitle(p.title);
        if (p.total_marks) setTotalMarks(p.total_marks);
        if (p.duration_minutes) setTimeAllowed(`${p.duration_minutes} Mins`);
        if (p.class_id) {
          setSelectedClassId(p.class_id);
          if (tokenStr) fetchSubjects(p.class_id, tokenStr);
        }
        if (p.subject_id) {
          setSelectedSubjectId(p.subject_id);
          if (tokenStr) fetchChapters(p.subject_id, tokenStr);
        }
        if (p.schoolName) setSchoolName(p.schoolName);
        if (p.schoolLogo) setSchoolLogo(p.schoolLogo);
        if (p.schoolAddress) setSchoolAddress(p.schoolAddress);
        if (p.timeAllowed) setTimeAllowed(p.timeAllowed);
        if (p.instructions) setInstructions(p.instructions);
        if (p.selectedChapterIds) setSelectedChapterIds(p.selectedChapterIds);
        if (p.sections && Array.isArray(p.sections)) setSections(p.sections);
        if (p.selected_questions && Array.isArray(p.selected_questions) && p.selected_questions.length > 0) {
          setPaperQuestions(p.selected_questions);
          setViewMode('preview');
        }
        toast.success(`Loaded "${p.title}" for editing!`);
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
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setChapters(data.data);
        setSelectedChapterIds(data.data.map((c: ChapterItem) => c.id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterIds([]);
    setSubjects([]);
    setChapters([]);
    if (classId) fetchSubjects(classId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterIds([]);
    if (subjectId) fetchChapters(subjectId);
  };

  const toggleChapter = (chapterId: string) => {
    if (selectedChapterIds.includes(chapterId)) {
      setSelectedChapterIds(selectedChapterIds.filter((id) => id !== chapterId));
    } else {
      setSelectedChapterIds([...selectedChapterIds, chapterId]);
    }
  };

  const toggleSelectAllChapters = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(chapters.map((c) => c.id));
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate paper');

      if (data.data && Array.isArray(data.data)) {
        setPaperQuestions(data.data);
        setViewMode('preview');
        toast.success(
          `Generated ${data.data.length} questions across ${activeSections.length} sections!`
        );
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

  // Save Paper
  const handleSavePaper = async () => {
    if (paperQuestions.length === 0) {
      toast.error('Question paper is currently empty');
      return;
    }

    setIsSaving(true);
    try {
      const calculatedTotalMarks = paperQuestions.reduce(
        (acc, q) => acc + (Number(q.marks) || 1),
        0
      );

      const res = await fetch(`${API_URL}/api/question-papers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: examTitle,
          class_id: selectedClassId || null,
          subject_id: selectedSubjectId || null,
          exam_type: 'Exam',
          total_marks: calculatedTotalMarks || Number(totalMarks) || 50,
          time_allowed_minutes: 150,
          blueprint: {
            schoolName,
            schoolLogo,
            schoolAddress,
            timeAllowed,
            instructions,
            selectedChapterIds,
            sections: activeSections,
          },
          selected_questions: paperQuestions,
          status: 'final',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save paper');

      toast.success('Question paper saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save paper');
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

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';

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

  // Helper to group questions by section
  const groupedSections: { sectionName: string; type: string; questions: QuestionItem[] }[] = [];
  paperQuestions.forEach((q) => {
    const secName = q.section_name || 'General Questions';
    let group = groupedSections.find((g) => g.sectionName === secName);
    if (!group) {
      group = { sectionName: secName, type: q.type, questions: [] };
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
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider text-indigo-600 bg-indigo-50/90 border border-indigo-100 uppercase mb-2">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Paper Creation Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Automated Exam Paper Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Create custom exam papers with Fill in the Blanks, Match the Following, MCQs, True/False, and Descriptive sections.
            </p>
          </div>

          {/* Stepper Navigation & Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Stepper Tabs */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'config'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    viewMode === 'config'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  1
                </span>
                <span>Setup Form</span>
              </button>

              <span className="text-slate-400 text-xs px-1">→</span>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    viewMode === 'preview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  2
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
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-indigo-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  <span className="hidden sm:inline">Saved Papers</span>
                  <span className="sm:hidden">Saved</span>
                </Button>
              </Link>
              <Link href="/question-bank">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  <span>Bank</span>
                </Button>
              </Link>
              <Link href="/scan">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-emerald-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
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
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in print:hidden">
          {/* Row 1: Academic Selection & Paper Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Target Selection & Chapter Equal Weightage */}
            <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
              <CardHeader
                className="pb-3 cursor-pointer md:cursor-default select-none hover:bg-slate-50/50 md:hover:bg-transparent transition-colors"
                onClick={() => setAccordionOpenClassSubject(!accordionOpenClassSubject)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> 1. Class, Subject & Chapters
                  </CardTitle>
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
                    aria-label="Toggle Class and Subject selection"
                  >
                    {accordionOpenClassSubject ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <CardDescription className="text-xs">
                  Select chapters to distribute questions with equal weightage.
                </CardDescription>
              </CardHeader>
              <div className={`${accordionOpenClassSubject ? 'block' : 'hidden md:block'}`}>
                <CardContent className="space-y-4 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Class / Grade *</Label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <Label className="text-xs font-semibold text-slate-700">Subject *</Label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={!selectedClassId}
                      className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select a subject...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {chapters.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700">Included Chapters</Label>
                        <button
                          type="button"
                          onClick={toggleSelectAllChapters}
                          className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          {selectedChapterIds.length === chapters.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {/* Equal Weightage Badge Indicator */}
                      {selectedChapterIds.length > 0 && (
                        <div className="flex items-center gap-1.5 p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 font-semibold">
                          <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>
                            {selectedChapterIds.length} Chapters Selected (~{approxPerChapterMarks} Marks / Chapter)
                          </span>
                        </div>
                      )}

                      <div className="max-h-56 overflow-y-auto space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        {chapters.map((chap) => (
                          <label
                            key={chap.id}
                            className="flex items-center gap-2.5 text-xs text-slate-700 hover:bg-white p-2 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedChapterIds.includes(chap.id)}
                              onChange={() => toggleChapter(chap.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-medium">{chap.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>

            {/* 2. Paper Details */}
            <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
              <CardHeader
                className="pb-3 cursor-pointer md:cursor-default select-none hover:bg-slate-50/50 md:hover:bg-transparent transition-colors"
                onClick={() => setAccordionOpenPaperHeader(!accordionOpenPaperHeader)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-600" /> 2. Exam Paper Header
                  </CardTitle>
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
                    aria-label="Toggle Exam Paper Header"
                  >
                    {accordionOpenPaperHeader ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <CardDescription className="text-xs">
                  Set school name, examination title, duration and rules.
                </CardDescription>
              </CardHeader>
              <div className={`${accordionOpenPaperHeader ? 'block' : 'hidden md:block'}`}>
                <CardContent className="space-y-3.5 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">School Name</Label>
                    <Input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="mt-1 h-9 rounded-lg text-sm bg-white"
                      placeholder="e.g. Star Public School"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">School Logo (Image URL)</Label>
                    <Input
                      value={schoolLogo}
                      onChange={(e) => setSchoolLogo(e.target.value)}
                      className="mt-1 h-9 rounded-lg text-sm bg-white"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">School Address (Optional)</Label>
                    <Input
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="mt-1 h-9 rounded-lg text-sm bg-white"
                      placeholder="e.g. Mograwal, Mathia Bazar - 845105"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Exam Title</Label>
                    <Input
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="mt-1 h-9 rounded-lg text-sm bg-white"
                      placeholder="e.g. Annual Examination - 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Time Allowed</Label>
                      <Input
                        value={timeAllowed}
                        onChange={(e) => setTimeAllowed(e.target.value)}
                        className="mt-1 h-9 rounded-lg text-sm bg-white"
                        placeholder="2.5 Hours"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700">Total Marks</Label>
                        <button
                          type="button"
                          onClick={syncTotalMarks}
                          className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                        >
                          (Auto Calculate)
                        </button>
                      </div>
                      <Input
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        className="mt-1 h-9 rounded-lg text-sm bg-white"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">General Instructions</Label>
                    <Textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                      className="mt-1 text-xs rounded-lg bg-white"
                      placeholder="Instructions for students..."
                    />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Row 2: Dynamic Question Sections Builder */}
          <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
            <CardHeader
              className="pb-3 border-b border-slate-100 cursor-pointer md:cursor-default select-none hover:bg-slate-50/50 md:hover:bg-transparent transition-colors"
              onClick={() => setAccordionOpenSections(!accordionOpenSections)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" /> 3. Question Sections & Mark Breakdown
                    </CardTitle>
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
                      aria-label="Toggle Question Sections"
                    >
                      {accordionOpenSections ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Customize sections, add questions in the banks, and set the following, MCQs, True/False & Descriptive questions.
                  </CardDescription>
                </div>

                {/* Live Section Summary Actions */}
                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSection('mcq')}
                    className="h-8 text-xs font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                  </Button>
                  <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    Total: {totalConfiguredMarks} Marks
                  </div>
                </div>
              </div>
            </CardHeader>

            <div className={`${accordionOpenSections ? 'block' : 'hidden md:block'}`}>
              <CardContent className="space-y-4 pt-4">
                {/* Desktop & Tablet Section Cards List (>= md) */}
                <div className="hidden md:block space-y-3">
                  {sections.map((section, idx) => {
                    const sectionMarksTotal = section.count * section.marks_per_question;

                    return (
                      <div
                        key={section.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          section.enabled
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                            : 'bg-slate-50/70 border-dashed border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Drag grip, Reorder, Enable Checkbox, Title & Type */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {/* Reorder Buttons & Drag Handle */}
                            <div className="flex items-center gap-0.5 text-slate-400">
                              <GripVertical className="w-4 h-4 text-slate-300" />
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                  title="Move section up"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'down')}
                                  disabled={idx === sections.length - 1}
                                  className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                  title="Move section down"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            {/* Checkbox Toggle */}
                            <input
                              type="checkbox"
                              checked={section.enabled}
                              onChange={() => handleToggleSection(section.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                              title="Enable or disable section"
                            />

                            {/* Section Title Input */}
                            <div className="flex-1 min-w-[170px]">
                              <Input
                                value={section.section_name}
                                onChange={(e) =>
                                  handleUpdateSection(section.id, { section_name: e.target.value })
                                }
                                disabled={!section.enabled}
                                className="h-8 text-xs font-semibold rounded-lg bg-white border-slate-200"
                                placeholder="Section Name"
                              />
                            </div>

                            {/* Question Type Selector */}
                            <select
                              value={section.type}
                              onChange={(e) =>
                                handleUpdateSection(section.id, {
                                  type: e.target.value as QuestionType,
                                })
                              }
                              disabled={!section.enabled}
                              className="h-8 text-xs font-medium rounded-lg border border-slate-200 bg-white px-2.5 focus:outline-none cursor-pointer shrink-0"
                            >
                              <option value="mcq">MCQ (Multiple Choice)</option>
                              <option value="fill_blank">Fill in the Blanks</option>
                              <option value="match_the_following">Match the Following</option>
                              <option value="true_false">True / False</option>
                              <option value="short_answer">Short Answer</option>
                              <option value="long_answer">Long / Essay</option>
                            </select>
                          </div>

                          {/* Right: Count, Marks, Difficulty, Add, Delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Count */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                                Count
                              </span>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSection(section.id, {
                                      count: Math.max(1, section.count - 1),
                                    })
                                  }
                                  disabled={!section.enabled || section.count <= 1}
                                  className="w-6 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-l border border-r-0 border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={section.count}
                                  onChange={(e) =>
                                    handleUpdateSection(section.id, {
                                      count: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                  disabled={!section.enabled}
                                  className="w-10 h-7 rounded-none text-center text-xs font-bold border-slate-200 p-0"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSection(section.id, { count: section.count + 1 })
                                  }
                                  disabled={!section.enabled}
                                  className="w-6 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-r border border-l-0 border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Marks */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                                Marks
                              </span>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSection(section.id, {
                                      marks_per_question: Math.max(1, section.marks_per_question - 1),
                                    })
                                  }
                                  disabled={!section.enabled || section.marks_per_question <= 1}
                                  className="w-6 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-l border border-r-0 border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={section.marks_per_question}
                                  onChange={(e) =>
                                    handleUpdateSection(section.id, {
                                      marks_per_question: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                  disabled={!section.enabled}
                                  className="w-9 h-7 rounded-none text-center text-xs font-bold border-slate-200 p-0"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSection(section.id, {
                                      marks_per_question: section.marks_per_question + 1,
                                    })
                                  }
                                  disabled={!section.enabled}
                                  className="w-6 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-r border border-l-0 border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Difficulty */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                                Difficulty
                              </span>
                              <select
                                value={section.difficulty}
                                onChange={(e) =>
                                  handleUpdateSection(section.id, {
                                    difficulty: e.target.value as any,
                                  })
                                }
                                disabled={!section.enabled}
                                className="h-7 text-[11px] font-semibold rounded-md border border-slate-200 bg-white px-2 focus:outline-none cursor-pointer"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>

                            {/* Quick Add Button */}
                            <button
                              type="button"
                              onClick={() => handleAddSection(section.type)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer mt-3 px-1 py-1"
                              title="Duplicate or add section of this type"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-3"
                              title="Delete this section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Section Summary Tiles (< md) */}
                <div className="md:hidden space-y-2.5">
                  {sections.map((section, idx) => {
                    const isExpanded = mobileExpandedSectionId === section.id;
                    const sectionMarksTotal = section.count * section.marks_per_question;

                    return (
                      <div
                        key={section.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          section.enabled
                            ? 'bg-white border-slate-200 shadow-2xs'
                            : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Mobile Summary Tile Header (Matches Mockup!) */}
                        <div
                          onClick={() =>
                            setMobileExpandedSectionId(isExpanded ? null : section.id)
                          }
                          className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/60 select-none transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={section.enabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleSection(section.id);
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                            <div className="font-bold text-xs text-slate-800 truncate">
                              {section.section_name}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {section.count} Qs • {sectionMarksTotal} Marks
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Mobile Expanded Details */}
                        {isExpanded && (
                          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 space-y-3 animate-in fade-in-50 duration-150">
                            <div>
                              <Label className="text-[11px] font-semibold text-slate-600">
                                Section Name
                              </Label>
                              <Input
                                value={section.section_name}
                                onChange={(e) =>
                                  handleUpdateSection(section.id, {
                                    section_name: e.target.value,
                                  })
                                }
                                className="mt-1 h-8 text-xs bg-white"
                              />
                            </div>

                            <div>
                              <Label className="text-[11px] font-semibold text-slate-600">
                                Question Type
                              </Label>
                              <select
                                value={section.type}
                                onChange={(e) =>
                                  handleUpdateSection(section.id, {
                                    type: e.target.value as QuestionType,
                                  })
                                }
                                className="w-full mt-1 h-8 text-xs font-medium rounded-lg border border-slate-200 bg-white px-2.5 focus:outline-none"
                              >
                                <option value="mcq">MCQ (Multiple Choice)</option>
                                <option value="fill_blank">Fill in the Blanks</option>
                                <option value="match_the_following">Match the Following</option>
                                <option value="true_false">True / False</option>
                                <option value="short_answer">Short Answer</option>
                                <option value="long_answer">Long / Essay</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {/* Count */}
                              <div>
                                <Label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                  Count
                                </Label>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSection(section.id, {
                                        count: Math.max(1, section.count - 1),
                                      })
                                    }
                                    disabled={section.count <= 1}
                                    className="w-6 h-7 flex items-center justify-center bg-white border border-r-0 border-slate-200 rounded-l text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={section.count}
                                    onChange={(e) =>
                                      handleUpdateSection(section.id, {
                                        count: Math.max(1, Number(e.target.value) || 1),
                                      })
                                    }
                                    className="w-full h-7 rounded-none text-center text-xs font-bold border-slate-200 p-0 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSection(section.id, { count: section.count + 1 })
                                    }
                                    className="w-6 h-7 flex items-center justify-center bg-white border border-l-0 border-slate-200 rounded-r text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Marks */}
                              <div>
                                <Label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                  Marks
                                </Label>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSection(section.id, {
                                        marks_per_question: Math.max(
                                          1,
                                          section.marks_per_question - 1
                                        ),
                                      })
                                    }
                                    disabled={section.marks_per_question <= 1}
                                    className="w-6 h-7 flex items-center justify-center bg-white border border-r-0 border-slate-200 rounded-l text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={section.marks_per_question}
                                    onChange={(e) =>
                                      handleUpdateSection(section.id, {
                                        marks_per_question: Math.max(
                                          1,
                                          Number(e.target.value) || 1
                                        ),
                                      })
                                    }
                                    className="w-full h-7 rounded-none text-center text-xs font-bold border-slate-200 p-0 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSection(section.id, {
                                        marks_per_question: section.marks_per_question + 1,
                                      })
                                    }
                                    className="w-6 h-7 flex items-center justify-center bg-white border border-l-0 border-slate-200 rounded-r text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Difficulty */}
                              <div>
                                <Label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                  Difficulty
                                </Label>
                                <select
                                  value={section.difficulty}
                                  onChange={(e) =>
                                    handleUpdateSection(section.id, {
                                      difficulty: e.target.value as any,
                                    })
                                  }
                                  className="w-full h-7 text-xs font-semibold rounded-md border border-slate-200 bg-white px-2 focus:outline-none"
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                            </div>

                            {/* Actions on Mobile */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 text-xs flex items-center gap-1"
                                >
                                  <ArrowUp className="w-3 h-3" /> Up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'down')}
                                  disabled={idx === sections.length - 1}
                                  className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 text-xs flex items-center gap-1"
                                >
                                  <ArrowDown className="w-3 h-3" /> Down
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section.id)}
                                className="text-red-600 text-xs font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add New Section Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-semibold text-slate-600 mr-1 hidden sm:inline">
                      Quick Add Section:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSection('fill_blank')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Fill in Blanks
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('match_the_following')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Match
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('true_false')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + True/False
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('mcq')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('short_answer')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Short Qs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('long_answer')}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Long Qs
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSection('mcq')}
                    className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Custom Section
                  </Button>
                </div>

                {/* Main Full-Width Action Button on Desktop */}
                <div className="pt-3">
                  <Button
                    onClick={handleGeneratePaper}
                    disabled={
                      isGenerating ||
                      !selectedClassId ||
                      !selectedSubjectId ||
                      selectedChapterIds.length === 0 ||
                      activeSections.length === 0
                    }
                    className="w-full h-12 rounded-xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating {totalConfiguredQuestions} Questions across {activeSections.length} Sections with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Examination Paper ({totalConfiguredQuestions} Questions, {totalConfiguredMarks} Marks)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Sticky Bottom Action Bar for Mobile and Tablet (Matches Mockup!) */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30 md:hidden print:hidden">
            <Button
              onClick={handleGeneratePaper}
              disabled={
                isGenerating ||
                !selectedClassId ||
                !selectedSubjectId ||
                selectedChapterIds.length === 0 ||
                activeSections.length === 0
              }
              className="w-full h-12 rounded-xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Questions with AI...
                </>
              ) : paperQuestions.length > 0 ? (
                <>
                  Next: Paper Preview ({paperQuestions.length})
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next: Paper Preview ({totalConfiguredMarks} Marks)
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE VIEW 2: FULL-WIDTH PAPER PREVIEW & PRINT CANVAS                 */}
      {/* ========================================================================= */}
      {viewMode === 'preview' && (
        <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
          {/* Top Control Bar for Preview Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('config')}
                className="h-8 text-xs font-bold rounded-lg border-slate-300 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Edit Setup
              </Button>
              <Badge variant="outline" className="text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                {paperQuestions.length} Questions
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTwoColumn(!isTwoColumn)}
                className={`h-8 text-xs font-semibold rounded-lg cursor-pointer ${
                  isTwoColumn ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'text-slate-700'
                }`}
                title="Toggle 2-column examination layout"
              >
                <Columns className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                {isTwoColumn ? '2 Columns (Active)' : '2-Column Layout'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`h-8 text-xs font-semibold rounded-lg cursor-pointer ${
                  showAnswerKey ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'text-slate-700'
                }`}
              >
                <Key className="w-3.5 h-3.5 mr-1 text-amber-600" />
                {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSavePaper}
                disabled={isSaving || paperQuestions.length === 0}
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save Paper
              </Button>

              <Button
                onClick={handlePrint}
                disabled={paperQuestions.length === 0}
                size="sm"
                className="h-8 text-xs font-bold rounded-lg gradient-brand text-white shadow-xs hover:opacity-90 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print / Save PDF
              </Button>
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
                <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-200 pb-3">
                  <div>Name: _______________________________</div>
                  <div className="text-right">Roll No: ____________ Section: ____</div>
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
                        className={`print-section space-y-3 break-inside-avoid ${
                          isTwoColumn ? 'mb-6' : ''
                        }`}
                      >
                        {/* Section Header with Section Marks & Section Instruction */}
                        <div className="border-b-2 border-slate-800 pb-1.5 space-y-0.5">
                          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                            {secGroup.sectionName} ({secMarksTotal} Marks)
                          </h4>
                          {(() => {
                            const inst =
                              secGroup.type === 'mcq'
                                ? 'Choose and write the correct option for each question:'
                                : secGroup.type === 'fill_blank'
                                ? 'Fill in the blanks with suitable words / phrases:'
                                : secGroup.type === 'match_the_following'
                                ? 'Match the items in Column A with Column B:'
                                : secGroup.type === 'true_false'
                                ? 'State whether the following statements are True or False:'
                                : secGroup.type === 'short_answer'
                                ? 'Answer the following short answer questions:'
                                : secGroup.type === 'long_answer'
                                ? 'Answer the following questions in detail:'
                                : '';
                            return inst ? (
                              <p className="text-[11px] text-slate-600 italic font-medium">
                                {inst}
                              </p>
                            ) : null;
                          })()}
                        </div>

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
                                className={`print-question text-xs space-y-1.5 group relative ${
                                  isTwoColumn ? 'break-inside-avoid print:break-inside-avoid mb-4' : ''
                                }`}
                              >
                                {/* Question Header Line without chapter name or per-question marks */}
                                <div className="flex items-start justify-between font-medium">
                                  <div className="flex-1 leading-relaxed flex items-start gap-1.5 w-full">
                                    <span className="font-bold shrink-0 min-w-[24px]">{qNumber}.</span>
                                    {editingQuestionIdx === globalIdx ? (
                                      <div className="flex-1 space-y-2 print:hidden">
                                        <Textarea
                                          value={editingQuestionText}
                                          onChange={(e) => setEditingQuestionText(e.target.value)}
                                          className="text-xs min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={handleSaveEditedQuestion} className="h-6 text-[10px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">Save</Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingQuestionIdx(null)} className="h-6 text-[10px] px-2 cursor-pointer">Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="flex-1 whitespace-pre-wrap"><Latex>{autoFormatMath(displayQuestionText)}</Latex></span>
                                    )}
                                  </div>
                                  <div className="absolute top-0 right-0 flex items-center gap-2 print:hidden bg-white px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingQuestionIdx(globalIdx);
                                        setEditingQuestionText(q.question_text);
                                      }}
                                      className="text-slate-600 hover:text-indigo-600 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer border-r border-slate-200 pr-2 mr-0.5"
                                      title="Edit Question Text"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenImagePicker(globalIdx)}
                                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                      title="Attach diagram/image"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      {q.image_url ? 'Change Diagram' : '+ Diagram'}
                                    </button>
                                  </div>
                                </div>

                                {/* Attached Diagram / Image */}
                                {q.image_url && (
                                  <div className="relative inline-block my-2 border border-slate-300 rounded p-1 bg-white">
                                    <img
                                      src={q.image_url}
                                      alt={`Figure for Q${qNumber}`}
                                      className="max-h-48 max-w-sm object-contain rounded"
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
                                  <div className="mt-1.5 pl-4 text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 font-medium">
                                    <div>
                                      <span className="font-bold">✓ Model Answer: </span>
                                      {q.correct_option ? `Option (${q.correct_option}) ` : ''}
                                      {q.answer_text || q.correct_answer || 'N/A'}
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
    </div>
  );
}
