'use client';

import { useState, useEffect } from 'react';
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
  Sliders,
  HelpCircle,
  Check,
  ChevronRight,
  Download,
  Key,
  FolderOpen,
  ArrowRight,
  ListOrdered,
  FileCheck,
  AlertCircle,
  FileScan,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Columns,
  Square,
  UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

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

interface ScannedDocItem {
  id: string;
  image_url: string;
  doc_type: string;
  status: string;
  raw_ocr_text?: string;
  created_at: string;
  chapter_id?: string;
  chapters?: {
    id: string;
    title: string;
    subjects?: {
      id: string;
      name: string;
      classes?: {
        id: string;
        name: string;
      };
    };
  };
}

interface QuestionOption {
  label: string;
  text: string;
}

interface QuestionItem {
  id: string;
  section_name?: string;
  chapter_id?: string;
  chapter_title?: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank' | 'match_the_following' | string;
  question_text: string;
  options?: QuestionOption[] | string[] | null;
  correct_option?: string | null;
  answer_text?: string | null;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
}

interface SectionBlueprint {
  id: string;
  name: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
  count: number;
  marks_per_question: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SavedPaper {
  id: string;
  title: string;
  exam_type: string;
  total_marks: number;
  time_allowed_minutes: number;
  created_at: string;
  class_id?: string;
  subject_id?: string;
  classes?: { id: string; name: string };
  subjects?: { id: string; name: string };
  selected_questions?: QuestionItem[];
  blueprint?: any;
}

export default function GeneratePaperPage() {
  const [token, setToken] = useState('');

  // Academic hierarchy & scans
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [scannedDocs, setScannedDocs] = useState<ScannedDocItem[]>([]);

  // Selection states
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [currentOcrText, setCurrentOcrText] = useState<string>('');
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Paper Header & Meta
  const [schoolName, setSchoolName] = useState('Modern Public School');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [examTitle, setExamTitle] = useState('Periodic Test / Half-Yearly Exam');
  const [timeAllowed, setTimeAllowed] = useState('1.5 Hours');
  const [targetMarks, setTargetMarks] = useState(40);
  const [generalInstructions, setGeneralInstructions] = useState(
    '1. All questions are compulsory.\n2. Section A has 1-mark objective questions. Section B has descriptive questions.'
  );
  const [language, setLanguage] = useState('English');
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Blueprint sections
  const [sections, setSections] = useState<SectionBlueprint[]>([
    {
      id: 'sec-1',
      name: 'SECTION A (Objective Type - 1 Mark)',
      type: 'mcq',
      count: 6,
      marks_per_question: 1,
      difficulty: 'easy',
    },
    {
      id: 'sec-2',
      name: 'SECTION B (Short Answer - 3 Marks)',
      type: 'short_answer',
      count: 4,
      marks_per_question: 3,
      difficulty: 'medium',
    },
    {
      id: 'sec-3',
      name: 'SECTION C (Long Answer - 5 Marks)',
      type: 'long_answer',
      count: 2,
      marks_per_question: 5,
      difficulty: 'hard',
    },
  ]);

  // Questions state
  const [paperQuestions, setPaperQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOcr, setIsSavingOcr] = useState(false);

  // Saved Papers
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchSchoolInfo(tokenStr);
      fetchScannedDocs(tokenStr);
      fetchSavedPapers(tokenStr);
    }
  }, []);

  async function fetchSchoolInfo(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/schools/my-school`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data?.name) setSchoolName(data.data.name);
      if (data.data?.logo_url) setSchoolLogo(data.data.logo_url);
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
      if (data.data) setChapters(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchScannedDocs(authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/scans`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setScannedDocs(data.data);
        if (data.data.length > 0 && !selectedScanId) {
          handleSelectScan(data.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSavedPapers(authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/question-papers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) setSavedPapers(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  // Handle Scan selection
  const handleSelectScan = (scan: ScannedDocItem) => {
    setSelectedScanId(scan.id);
    setCurrentOcrText(scan.raw_ocr_text || '');
    if (scan.chapters) {
      const chap = scan.chapters;
      setSelectedChapterId(chap.id);
      if (chap.subjects) {
        setSelectedSubjectId(chap.subjects.id);
        if (chap.subjects.classes) {
          setSelectedClassId(chap.subjects.classes.id);
          fetchSubjects(chap.subjects.classes.id);
          fetchChapters(chap.subjects.id);
        }
      }
    }
  };

  // Save modified OCR Text to Backend
  const handleSaveOcrText = async () => {
    if (!selectedScanId) {
      toast.error('Please select a scanned document first');
      return;
    }
    setIsSavingOcr(true);
    try {
      const res = await fetch(`${API_URL}/api/scans/${selectedScanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_ocr_text: currentOcrText,
          status: 'ocr_completed',
        }),
      });
      if (!res.ok) throw new Error('Failed to update OCR text');
      toast.success('OCR text saved successfully in database!');
      setIsEditingOcr(false);
      fetchScannedDocs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save OCR text');
    } finally {
      setIsSavingOcr(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSubjects([]);
    setChapters([]);
    if (classId) fetchSubjects(classId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    if (subjectId) fetchChapters(subjectId);
  };

  // Sections config helpers
  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + sections.length);
    const newSec: SectionBlueprint = {
      id: `sec-${Date.now()}`,
      name: `SECTION ${nextLetter} (Questions)`,
      type: 'short_answer',
      count: 3,
      marks_per_question: 3,
      difficulty: 'medium',
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: keyof SectionBlueprint, value: any) => {
    setSections(
      sections.map((sec) => (sec.id === id ? { ...sec, [field]: value } : sec))
    );
  };

  // Generate Questions using Saved OCR Data with Gemini AI
  const handleGenerateFromOcr = async () => {
    if (!currentOcrText || !currentOcrText.trim()) {
      toast.error('No OCR text available for this document. Please scan a document or paste text.');
      return;
    }

    const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';
    const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject';
    const selectedChapterTitle = chapters.find((c) => c.id === selectedChapterId)?.title || '';

    setIsGenerating(true);
    toast.info('Generating exam questions strictly from saved OCR data with Gemini...');

    try {
      const res = await fetch(`${API_URL}/api/question-papers/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scan_ids: selectedScanId ? [selectedScanId] : undefined,
          raw_ocr_text: currentOcrText,
          strict_ocr_only: true,
          class_id: selectedClassId || undefined,
          subject_id: selectedSubjectId || undefined,
          class_name: selectedClassName,
          subject_name: selectedSubjectName,
          chapter_names: selectedChapterTitle ? [selectedChapterTitle] : undefined,
          sections: sections.map((s) => ({
            section_name: s.name,
            type: s.type,
            count: s.count,
            marks_per_question: s.marks_per_question,
            difficulty: s.difficulty,
          })),
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract questions from OCR data');

      setPaperQuestions(data.data || []);
      toast.success(`Generated ${data.data.length} questions strictly from document!`);
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error(err.message || 'Error creating paper from OCR');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Paper to Database
  const handleSavePaper = async () => {
    if (paperQuestions.length === 0) {
      toast.error('Question paper is currently empty');
      return;
    }

    setIsSaving(true);
    try {
      const calculatedTotalMarks = paperQuestions.reduce(
        (acc, q) => acc + (Number(q.marks) || 0),
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
          total_marks: calculatedTotalMarks || targetMarks,
          time_allowed_minutes: 90,
          blueprint: {
            schoolName,
            timeAllowed,
            generalInstructions,
            sections,
            language,
          },
          selected_questions: paperQuestions,
          status: 'finalized',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save paper');

      toast.success('Question paper saved successfully!');
      fetchSavedPapers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save paper');
    } finally {
      setIsSaving(false);
    }
  };

  // Load Saved Paper
  const handleLoadPaper = (paper: SavedPaper) => {
    setExamTitle(paper.title);
    if (paper.class_id) setSelectedClassId(paper.class_id);
    if (paper.subject_id) setSelectedSubjectId(paper.subject_id);
    if (paper.total_marks) setTargetMarks(paper.total_marks);
    if (paper.blueprint?.schoolName) setSchoolName(paper.blueprint.schoolName);
    if (paper.blueprint?.generalInstructions) setGeneralInstructions(paper.blueprint.generalInstructions);
    if (paper.blueprint?.sections) setSections(paper.blueprint.sections);
    if (paper.selected_questions && Array.isArray(paper.selected_questions)) {
      setPaperQuestions(paper.selected_questions);
    }
    setShowSavedModal(false);
    toast.success(`Loaded "${paper.title}"`);
  };

  // Delete Saved Paper
  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    try {
      const res = await fetch(`${API_URL}/api/question-papers/${paperId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete paper');
      toast.success('Paper deleted');
      fetchSavedPapers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete paper');
    }
  };

  // Question editing helpers
  const handleUpdateQuestion = (idx: number, field: keyof QuestionItem, val: any) => {
    const updated = [...paperQuestions];
    updated[idx] = { ...updated[idx], [field]: val };
    setPaperQuestions(updated);
  };

  const handleDeleteQuestion = (idx: number) => {
    const updated = paperQuestions.filter((_, i) => i !== idx);
    setPaperQuestions(updated);
    toast.info('Question deleted');
  };

  const handleAddNewQuestion = (sectionName: string) => {
    const newQ: QuestionItem = {
      id: `custom-${Date.now()}`,
      section_name: sectionName,
      type: 'short_answer',
      question_text: 'Type custom question here...',
      answer_text: 'Expected answer...',
      marks: 3,
      difficulty: 'medium',
    };
    setPaperQuestions([...paperQuestions, newQ]);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';
  const totalCalculatedMarks = paperQuestions.reduce(
    (acc, q) => acc + (Number(q.marks) || 0),
    0
  );

  // Group questions by section
  const groupedQuestions: Record<string, QuestionItem[]> = {};
  paperQuestions.forEach((q) => {
    const sec = q.section_name || 'GENERAL SECTION';
    if (!groupedQuestions[sec]) groupedQuestions[sec] = [];
    groupedQuestions[sec].push(q);
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Studio Control Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-30 print-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-none">
                Exam Paper Studio (1-2 Page Fit)
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5 font-bold">
                Saved OCR Grounded
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Strict document extraction & compact printable sheets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 2-Column Layout Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTwoColumn(!isTwoColumn)}
            className={`h-8 text-xs font-semibold rounded-lg ${
              isTwoColumn ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'text-slate-700 border-slate-300'
            }`}
            title="Toggle 2-column compact layout"
          >
            <Columns className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            {isTwoColumn ? '2 Columns (Dense)' : '1 Column'}
          </Button>

          {/* Saved Papers */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedModal(true)}
            className="h-8 text-xs font-semibold rounded-lg text-slate-700 border-slate-300"
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Saved ({savedPapers.length})
          </Button>

          {/* Answer Key Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`h-8 text-xs font-semibold rounded-lg ${
              showAnswerKey ? 'bg-amber-50 border-amber-300 text-amber-900' : 'text-slate-700 border-slate-300'
            }`}
          >
            <Key className="w-3.5 h-3.5 mr-1 text-amber-600" />
            {showAnswerKey ? 'Hide Key' : 'Answer Key'}
          </Button>

          {/* Save Paper */}
          <Button
            onClick={handleSavePaper}
            disabled={isSaving || paperQuestions.length === 0}
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save Paper
          </Button>

          {/* Clean Download PDF / Print */}
          <Button
            onClick={handlePrint}
            size="sm"
            className="h-8 text-xs font-bold rounded-lg gradient-brand text-white shadow-xs hover:opacity-90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download PDF / Print
          </Button>
        </div>
      </header>

      {/* Main Single-Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Document Selector & Exam Controls (~360px) */}
        <aside className="w-full lg:w-[360px] bg-white border-r border-slate-200 flex flex-col h-auto lg:h-[calc(100vh-53px)] overflow-y-auto p-4 space-y-4 print-hidden">
          {/* 1. Scanned Document Selection (Clean & Hidden OCR) */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <FileScan className="w-4 h-4 text-indigo-600" /> 1. Select Scanned Document
              </span>
              <Link href="/scan" className="text-[11px] font-bold text-indigo-600 hover:underline">
                + Scan New
              </Link>
            </div>

            {scannedDocs.length === 0 ? (
              <div className="p-3 bg-white rounded-lg border border-indigo-100 text-center space-y-1.5">
                <p className="text-[11px] text-slate-500">No scanned documents found.</p>
                <Link href="/scan">
                  <Button size="sm" className="h-7 text-xs gradient-brand text-white rounded-lg">
                    Scan a Page Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedScanId}
                  onChange={(e) => {
                    const found = scannedDocs.find((s) => s.id === e.target.value);
                    if (found) handleSelectScan(found);
                    else setSelectedScanId(e.target.value);
                  }}
                  className="w-full h-9 px-2.5 rounded-lg border border-indigo-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Choose a Scanned Document...</option>
                  {scannedDocs.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Doc #{idx + 1} — {s.chapters?.title || s.doc_type || 'Scanned Document'}
                    </option>
                  ))}
                </select>

                {selectedScanId && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Document ready for question extraction</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Compact Academic Details */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Exam Setup
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Class</Label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full mt-0.5 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Subject</Label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!selectedClassId}
                  className="w-full mt-0.5 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-slate-600">School Name</Label>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="h-8 text-xs mt-0.5 rounded-lg"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-slate-600">Exam Title</Label>
              <Input
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="h-8 text-xs mt-0.5 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Time</Label>
                <Input
                  value={timeAllowed}
                  onChange={(e) => setTimeAllowed(e.target.value)}
                  className="h-8 text-xs mt-0.5 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Total Marks</Label>
                <Input
                  type="number"
                  value={targetMarks}
                  onChange={(e) => setTargetMarks(Number(e.target.value))}
                  className="h-8 text-xs mt-0.5 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 3. Section Question Counts */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Sections (Max 1-2 Pages)
              </span>
              <button
                type="button"
                onClick={handleAddSection}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                + Add Section
              </button>
            </div>

            <div className="space-y-1.5">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <input
                      value={sec.name}
                      onChange={(e) => handleUpdateSection(sec.id, 'name', e.target.value)}
                      className="font-bold text-[11px] bg-transparent border-none focus:outline-none text-slate-800 flex-1 truncate"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      className="text-slate-400 hover:text-red-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <select
                      value={sec.type}
                      onChange={(e) => handleUpdateSection(sec.id, 'type', e.target.value)}
                      className="h-6 px-1 rounded border border-slate-200 bg-white text-[10px]"
                    >
                      <option value="mcq">MCQ (1M)</option>
                      <option value="short_answer">Short</option>
                      <option value="long_answer">Long</option>
                      <option value="fill_blank">Fill Blank</option>
                      <option value="true_false">True/False</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <span>Count:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={sec.count}
                        onChange={(e) =>
                          handleUpdateSection(sec.id, 'count', Math.max(1, Number(e.target.value)))
                        }
                        className="w-10 h-6 px-1 rounded border border-slate-200 bg-white text-center font-bold text-[10px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Marks:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={sec.marks_per_question}
                        onChange={(e) =>
                          handleUpdateSection(
                            sec.id,
                            'marks_per_question',
                            Math.max(1, Number(e.target.value))
                          )
                        }
                        className="w-10 h-6 px-1 rounded border border-slate-200 bg-white text-center font-bold text-[10px]"
                      />
                    </div>
                    <span className="ml-auto font-bold text-slate-600 text-[10px]">
                      ={sec.count * sec.marks_per_question}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Action: Generate Strictly from OCR */}
          <div className="pt-2">
            <Button
              onClick={handleGenerateFromOcr}
              disabled={isGenerating || !currentOcrText}
              className="w-full h-11 rounded-xl gradient-brand text-white font-bold text-xs shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Questions from OCR...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Paper from Saved OCR
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Right Side: Live Compact 1-2 Page Printable Sheet Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-slate-200/60">
          <div className="print-page w-full max-w-4xl bg-white shadow-md rounded-xl border border-slate-300 p-6 sm:p-8 text-slate-900 font-serif min-h-[950px] flex flex-col justify-between">
            <div className="space-y-4">
              {/* Paper Header (Clean & Compact) */}
              <div className="print-header text-center border-b-2 border-slate-900 pb-2 space-y-1">
                {schoolLogo && (
                  <img src={schoolLogo} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />
                )}
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wide leading-tight">
                  {schoolName}
                </h2>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight">
                  {examTitle}
                </h3>
                <div className="flex flex-wrap items-center justify-between text-[11px] font-bold pt-1 border-t border-slate-300 mt-1 font-sans">
                  <span>Class: {selectedClassName || 'Standard'}</span>
                  <span>Subject: {selectedSubjectName || 'Subject'}</span>
                  <span>Time: {timeAllowed}</span>
                  <span>Max. Marks: {totalCalculatedMarks || targetMarks}</span>
                </div>
              </div>

              {/* Student Details Line */}
              <div className="flex flex-wrap items-center justify-between text-[10px] border border-slate-300 px-2 py-1 rounded font-sans">
                <div>Candidate Name: _____________________</div>
                <div>Roll No: __________</div>
                <div>Section: _______</div>
                <div>Date: _________</div>
              </div>

              {/* General Instructions */}
              {generalInstructions && (
                <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-sans">
                  <span className="font-bold text-slate-800">General Instructions: </span>
                  <span className="text-slate-600">{generalInstructions.replace(/\n/g, ' ')}</span>
                </div>
              )}

              {/* Live Questions Canvas */}
              {paperQuestions.length === 0 ? (
                <div className="py-24 text-center space-y-2 print-hidden">
                  <FileScan className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">Exam Paper is Ready to Assemble</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-sans">
                    Select a scanned document on the left and click <strong>"Generate Paper from Saved OCR"</strong> to instantly populate this sheet.
                  </p>
                </div>
              ) : (
                <div className={`space-y-4 pt-1 ${isTwoColumn ? 'columns-1 sm:columns-2 gap-6' : ''}`}>
                  {Object.entries(groupedQuestions).map(([sectionName, qList], secIdx) => (
                    <div key={secIdx} className="space-y-2 print-question">
                      {/* Section Title */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 mt-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                          {sectionName}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-700 font-sans">
                          [{qList.reduce((acc, q) => acc + (Number(q.marks) || 1), 0)} Marks]
                        </span>
                      </div>

                      {/* Questions in Section */}
                      <div className="space-y-2">
                        {qList.map((q, qIdx) => {
                          const globalIdx = paperQuestions.findIndex((item) => item.id === q.id);
                          return (
                            <div
                              key={q.id || qIdx}
                              className="print-question group relative p-1.5 rounded border border-transparent hover:border-slate-300 hover:bg-slate-50/50 transition-all space-y-1"
                            >
                              {/* Question Number, Text & Inline Marks */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 flex-1">
                                  <span className="font-bold text-[11px] select-none">Q{globalIdx + 1}.</span>
                                  <div className="flex-1 text-[11px] font-medium text-slate-900 leading-snug">
                                    <textarea
                                      value={q.question_text}
                                      onChange={(e) =>
                                        handleUpdateQuestion(globalIdx, 'question_text', e.target.value)
                                      }
                                      rows={1}
                                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded p-0.5 resize-y text-[11px] font-serif leading-snug"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[10px] text-slate-800 font-sans whitespace-nowrap">
                                    [{q.marks}M]
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(globalIdx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 print-hidden"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Horizontal Compact MCQ Options */}
                              {q.type === 'mcq' && q.options && Array.isArray(q.options) && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pl-4 pt-0.5 text-[10px] font-sans">
                                  {q.options.map((opt: any, optIdx: number) => {
                                    const label = typeof opt === 'string' ? String.fromCharCode(65 + optIdx) : opt.label;
                                    const text = typeof opt === 'string' ? opt : opt.text;
                                    return (
                                      <div key={optIdx} className="flex items-center gap-1">
                                        <span className="font-bold text-slate-700">({label})</span>
                                        <span className="truncate">{text}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Teacher's Model Answer / Key */}
                              {showAnswerKey && (q.answer_text || q.correct_option) && (
                                <div className="ml-4 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-950 font-sans space-y-0.5">
                                  <div className="font-bold text-amber-900">
                                    Answer Key:
                                  </div>
                                  {q.correct_option && (
                                    <div><strong>Ans:</strong> ({q.correct_option})</div>
                                  )}
                                  {q.answer_text && (
                                    <div className="whitespace-pre-line text-slate-700">{q.answer_text}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Question Button */}
                      <div className="pl-2 pt-0.5 print-hidden">
                        <button
                          type="button"
                          onClick={() => handleAddNewQuestion(sectionName)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> Add Question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Paper Footer */}
            {paperQuestions.length > 0 && (
              <div className="border-t border-slate-900 pt-2 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-6 font-sans">
                --- END OF QUESTION PAPER ---
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Saved Papers Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 p-5 space-y-3 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Saved Examination Papers</h3>
              <button onClick={() => setShowSavedModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {savedPapers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No saved papers found.
                </div>
              ) : (
                savedPapers.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.classes?.name || 'Class'} • {p.subjects?.name || 'Subject'} • {p.total_marks} Marks
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleLoadPaper(p)}
                        className="h-7 text-[11px] font-bold gradient-brand text-white rounded-lg"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePaper(p.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
