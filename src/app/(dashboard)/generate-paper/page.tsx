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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'history'>('builder');

  // Academic hierarchy
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Paper Config & Metadata
  const [schoolName, setSchoolName] = useState('SchoolPapers Public School');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [examTitle, setExamTitle] = useState('Half-Yearly Examination 2026');
  const [timeAllowed, setTimeAllowed] = useState('3 Hours');
  const [timeMinutes, setTimeMinutes] = useState(180);
  const [targetMarks, setTargetMarks] = useState(80);
  const [instructions, setInstructions] = useState(
    '1. This question paper contains four sections: A, B, C and D.\n2. Section A comprises compulsory Multiple Choice Questions of 1 mark each.\n3. Section B comprises Short Answer type questions of 2/3 marks each.\n4. Section C comprises Long Answer type questions of 5 marks each.\n5. All questions are compulsory. Write answers clearly and neatly.'
  );
  const [language, setLanguage] = useState('English');
  const [customInstructions, setCustomInstructions] = useState('');

  // Generation Source Mode
  const [generationSource, setGenerationSource] = useState<'ai' | 'bank' | 'manual'>('ai');

  // Blueprint sections
  const [sections, setSections] = useState<SectionBlueprint[]>([
    {
      id: 'sec-1',
      name: 'Section A - Multiple Choice Questions',
      type: 'mcq',
      count: 10,
      marks_per_question: 1,
      difficulty: 'easy',
    },
    {
      id: 'sec-2',
      name: 'Section B - Short Answer Questions',
      type: 'short_answer',
      count: 6,
      marks_per_question: 3,
      difficulty: 'medium',
    },
    {
      id: 'sec-3',
      name: 'Section C - Long Answer Questions',
      type: 'long_answer',
      count: 4,
      marks_per_question: 5,
      difficulty: 'hard',
    },
    {
      id: 'sec-4',
      name: 'Section D - Fill in the Blanks / Conceptual',
      type: 'fill_blank',
      count: 6,
      marks_per_question: 2,
      difficulty: 'medium',
    },
  ]);

  // Generated / Assembled Questions
  const [paperQuestions, setPaperQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Saved Papers History
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchSchoolInfo(tokenStr);
      fetchSavedPapers(tokenStr);
    }
  }, []);

  async function fetchSchoolInfo(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/schools/my-school`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data?.name) {
        setSchoolName(data.data.name);
      }
      if (data.data?.logo_url) {
        setSchoolLogo(data.data.logo_url);
      }
    } catch (e) {
      console.error('Error fetching school info:', e);
    }
  }

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setClasses(data.data);
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  }

  async function fetchSubjects(classId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setSubjects(data.data);
      }
    } catch (e) {
      console.error('Error fetching subjects:', e);
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
      console.error('Error fetching chapters:', e);
    }
  }

  async function fetchSavedPapers(authToken = token) {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/question-papers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setSavedPapers(data.data);
      }
    } catch (e) {
      console.error('Error fetching saved papers:', e);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterIds([]);
    setSubjects([]);
    setChapters([]);
    if (classId) {
      fetchSubjects(classId);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterIds([]);
    if (subjectId) {
      fetchChapters(subjectId);
    }
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

  // Section Blueprint Handlers
  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + sections.length);
    const newSec: SectionBlueprint = {
      id: `sec-${Date.now()}`,
      name: `Section ${nextLetter} - Short Questions`,
      type: 'short_answer',
      count: 5,
      marks_per_question: 2,
      difficulty: 'medium',
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) {
      toast.error('At least one section is required');
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: keyof SectionBlueprint, value: any) => {
    setSections(
      sections.map((sec) => (sec.id === id ? { ...sec, [field]: value } : sec))
    );
  };

  // Calculate live blueprint stats
  const totalBlueprintMarks = sections.reduce(
    (acc, sec) => acc + (sec.count || 0) * (sec.marks_per_question || 0),
    0
  );
  const totalBlueprintQuestions = sections.reduce((acc, sec) => acc + (sec.count || 0), 0);

  // Generate Questions Handler (AI / Bank)
  const handleGeneratePaper = async () => {
    if (!selectedClassId) {
      toast.error('Please select a Class');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Please select a Subject');
      return;
    }

    const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
    const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';
    const selectedChapterNames = chapters
      .filter((c) => selectedChapterIds.includes(c.id))
      .map((c) => c.title);

    setIsGenerating(true);

    try {
      if (generationSource === 'ai') {
        toast.info('Generating questions with Gemini AI (3.5 Flash Lite)...');
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
            sections: sections.map((s) => ({
              section_name: s.name,
              type: s.type,
              count: s.count,
              marks_per_question: s.marks_per_question,
              difficulty: s.difficulty,
            })),
            language,
            custom_instructions: customInstructions,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

        setPaperQuestions(data.data);
        toast.success(`Generated ${data.data.length} questions successfully!`);
        setActiveTab('preview');
      } else if (generationSource === 'bank') {
        toast.info('Assembling questions from Question Bank & OCR...');
        const res = await fetch(`${API_URL}/api/question-papers/from-bank`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chapter_ids: selectedChapterIds,
            sections: sections.map((s) => ({
              section_name: s.name,
              type: s.type,
              count: s.count,
              marks_per_question: s.marks_per_question,
            })),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to pick from bank');

        setPaperQuestions(data.data);
        toast.success(`Picked ${data.data.length} questions from Question Bank!`);
        setActiveTab('preview');
      } else {
        // Manual mode
        if (paperQuestions.length === 0) {
          toast.info('You can now add custom questions manually');
        }
        setActiveTab('preview');
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      toast.error(err.message || 'Error occurred while generating paper');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Paper to Database
  const handleSavePaper = async () => {
    if (paperQuestions.length === 0) {
      toast.error('Cannot save an empty question paper');
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
          exam_type: examTitle.includes('Test') ? 'Unit Test' : 'Exam',
          total_marks: calculatedTotalMarks || targetMarks,
          time_allowed_minutes: timeMinutes,
          blueprint: {
            schoolName,
            timeAllowed,
            instructions,
            sections,
            language,
          },
          selected_questions: paperQuestions,
          status: 'finalized',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question paper');

      toast.success('Question Paper saved to database!');
      fetchSavedPapers();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save paper');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved paper
  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;

    try {
      const res = await fetch(`${API_URL}/api/question-papers/${paperId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete paper');

      toast.success('Paper deleted successfully');
      fetchSavedPapers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete paper');
    }
  };

  // Load a saved paper into preview
  const handleLoadPaper = (paper: SavedPaper) => {
    setExamTitle(paper.title);
    if (paper.class_id) setSelectedClassId(paper.class_id);
    if (paper.subject_id) setSelectedSubjectId(paper.subject_id);
    if (paper.total_marks) setTargetMarks(paper.total_marks);
    if (paper.time_allowed_minutes) {
      setTimeMinutes(paper.time_allowed_minutes);
      setTimeAllowed(`${Math.floor(paper.time_allowed_minutes / 60)} Hours`);
    }
    if (paper.blueprint?.schoolName) setSchoolName(paper.blueprint.schoolName);
    if (paper.blueprint?.instructions) setInstructions(paper.blueprint.instructions);
    if (paper.blueprint?.sections) setSections(paper.blueprint.sections);
    if (paper.selected_questions && Array.isArray(paper.selected_questions)) {
      setPaperQuestions(paper.selected_questions);
    }
    setActiveTab('preview');
    toast.success(`Loaded "${paper.title}"`);
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
    toast.info('Question removed');
  };

  const handleAddNewQuestion = (sectionName: string) => {
    const newQ: QuestionItem = {
      id: `custom-${Date.now()}`,
      section_name: sectionName,
      type: 'short_answer',
      question_text: 'Enter your new custom question here...',
      answer_text: 'Expected answer solution...',
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

  // Group questions by section for clean rendering
  const groupedQuestions: Record<string, QuestionItem[]> = {};
  paperQuestions.forEach((q) => {
    const sec = q.section_name || 'General Section';
    if (!groupedQuestions[sec]) groupedQuestions[sec] = [];
    groupedQuestions[sec].push(q);
  });

  const totalCalculatedMarks = paperQuestions.reduce(
    (acc, q) => acc + (Number(q.marks) || 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> SchoolPapers AI Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Exam Question Paper Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Design CBSE / ICSE style exam papers with Gemini AI, Question Bank, and instant 1-click printing.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Paper Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview & Print ({paperQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" /> Saved Papers ({savedPapers.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAPER BUILDER                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Academic & Exam Metadata */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Academic Selection */}
            <Card className="rounded-2xl border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <GraduationCap className="w-4 h-4 text-indigo-600" /> 1. Class, Subject & Chapters
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose the target class and syllabus chapters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Class / Grade *</Label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <Label className="text-xs font-semibold text-slate-700">Subject *</Label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={!selectedClassId}
                      className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Subject...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {chapters.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Syllabus Chapters</Label>
                      <button
                        type="button"
                        onClick={toggleSelectAllChapters}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        {selectedChapterIds.length === chapters.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      {chapters.map((chap) => (
                        <label
                          key={chap.id}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChapterIds.includes(chap.id)}
                            onChange={() => toggleChapter(chap.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{chap.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Exam Paper Header Info */}
            <Card className="rounded-2xl border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <School className="w-4 h-4 text-indigo-600" /> 2. Exam Paper Header & Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">School / Institution Name</Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="mt-1 h-9 rounded-lg text-sm"
                    placeholder="e.g. Modern Public School"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Exam Title / Assessment</Label>
                  <Input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="mt-1 h-9 rounded-lg text-sm"
                    placeholder="e.g. Annual Examination 2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Time Allowed</Label>
                    <Input
                      value={timeAllowed}
                      onChange={(e) => setTimeAllowed(e.target.value)}
                      className="mt-1 h-9 rounded-lg text-sm"
                      placeholder="e.g. 3 Hours"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Target Total Marks</Label>
                    <Input
                      type="number"
                      value={targetMarks}
                      onChange={(e) => setTargetMarks(Number(e.target.value))}
                      className="mt-1 h-9 rounded-lg text-sm"
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Language</Label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Hinglish">Hinglish / Bilingual</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Generation Source</Label>
                    <select
                      value={generationSource}
                      onChange={(e) => setGenerationSource(e.target.value as any)}
                      className="w-full mt-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ai">⚡ Gemini AI (3.5 Flash Lite)</option>
                      <option value="bank">📚 School Question Bank</option>
                      <option value="manual">✍️ Custom Manual Builder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">General Instructions</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    className="mt-1 text-xs rounded-lg"
                    placeholder="Enter instructions for students..."
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Special Instructions for AI (Optional)</Label>
                  <Input
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="mt-1 h-9 rounded-lg text-xs"
                    placeholder="e.g. Include 2 numericals, emphasize real-world applications..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Blueprint & Sections Config */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="rounded-2xl border-slate-200 shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                    <Layers className="w-4 h-4 text-indigo-600" /> 3. Section Blueprint & Marks Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure question counts, marks, and question types per section.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddSection}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Blueprint Summary Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <div>
                      Sections: <span className="text-indigo-600">{sections.length}</span>
                    </div>
                    <div>
                      Total Questions: <span className="text-indigo-600">{totalBlueprintQuestions}</span>
                    </div>
                    <div>
                      Blueprint Marks:{' '}
                      <span
                        className={
                          totalBlueprintMarks === targetMarks
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }
                      >
                        {totalBlueprintMarks} / {targetMarks} Marks
                      </span>
                    </div>
                  </div>
                  {totalBlueprintMarks === targetMarks ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                      Balanced ✓
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                      {targetMarks - totalBlueprintMarks > 0
                        ? `+${targetMarks - totalBlueprintMarks} Marks Needed`
                        : `${totalBlueprintMarks - targetMarks} Marks Exceeded`}
                    </Badge>
                  )}
                </div>

                {/* Section List */}
                <div className="space-y-3">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={sec.name}
                          onChange={(e) => handleUpdateSection(sec.id, 'name', e.target.value)}
                          className="h-8 text-xs font-bold text-slate-900 max-w-sm rounded-lg"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] font-semibold">
                            {sec.count * sec.marks_per_question} Marks
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(sec.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div>
                          <Label className="text-[11px] text-slate-500">Question Type</Label>
                          <select
                            value={sec.type}
                            onChange={(e) => handleUpdateSection(sec.id, 'type', e.target.value)}
                            className="w-full mt-1 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="mcq">MCQ (1 Mark)</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="long_answer">Long Answer</option>
                            <option value="fill_blank">Fill in Blank</option>
                            <option value="true_false">True / False</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-[11px] text-slate-500">Questions Count</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={sec.count}
                            onChange={(e) =>
                              handleUpdateSection(sec.id, 'count', Math.max(1, Number(e.target.value)))
                            }
                            className="mt-1 h-8 text-xs rounded-lg bg-slate-50"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-slate-500">Marks Each</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={sec.marks_per_question}
                            onChange={(e) =>
                              handleUpdateSection(
                                sec.id,
                                'marks_per_question',
                                Math.max(1, Number(e.target.value))
                              )
                            }
                            className="mt-1 h-8 text-xs rounded-lg bg-slate-50"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-slate-500">Difficulty</Label>
                          <select
                            value={sec.difficulty}
                            onChange={(e) =>
                              handleUpdateSection(sec.id, 'difficulty', e.target.value)
                            }
                            className="w-full mt-1 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Generate Button */}
                <div className="pt-3">
                  <Button
                    onClick={handleGeneratePaper}
                    disabled={isGenerating || !selectedClassId || !selectedSubjectId}
                    className="w-full h-12 rounded-xl gradient-brand text-white font-bold shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Question Paper with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Examination Paper ({totalBlueprintQuestions} Questions)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PREVIEW, EDIT & PRINT                                              */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('builder')}
                className="rounded-xl text-xs"
              >
                ← Back to Config
              </Button>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
                {paperQuestions.length} Questions | {totalCalculatedMarks} Total Marks
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`rounded-xl text-xs ${
                  showAnswerKey ? 'bg-amber-50 border-amber-300 text-amber-800' : ''
                }`}
              >
                <Key className="w-3.5 h-3.5 mr-1.5" />
                {showAnswerKey ? 'Hide Teacher Answer Key' : 'Show Teacher Answer Key'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSavePaper}
                disabled={isSaving || paperQuestions.length === 0}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save Paper
              </Button>
              <Button
                onClick={handlePrint}
                size="sm"
                className="rounded-xl gradient-brand text-white text-xs font-bold shadow-xs hover:opacity-90"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Export PDF
              </Button>
            </div>
          </div>

          {paperQuestions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Questions Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Go to the Paper Builder tab and click "Generate Examination Paper" or add custom questions.
              </p>
              <Button onClick={() => setActiveTab('builder')} className="mt-2 rounded-xl gradient-brand text-white text-xs">
                Go to Paper Builder
              </Button>
            </div>
          ) : (
            /* Printable Exam Paper Container */
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-6 text-slate-900 font-serif">
              {/* Exam Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                {schoolLogo && (
                  <img src={schoolLogo} alt="School Logo" className="h-16 mx-auto mb-2 object-contain" />
                )}
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                  {schoolName || 'School Name'}
                </h2>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase">
                  {examTitle}
                </h3>
                <div className="flex flex-wrap items-center justify-between text-xs font-bold pt-2 border-t border-slate-300 mt-2">
                  <span>Class: {selectedClassName || 'Standard'}</span>
                  <span>Subject: {selectedSubjectName || 'Subject'}</span>
                  <span>Time: {timeAllowed}</span>
                  <span>Max. Marks: {totalCalculatedMarks || targetMarks}</span>
                </div>
              </div>

              {/* Student Details Grid (Print only / Standard) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 p-2 rounded">
                <div>Name: _________________</div>
                <div>Roll No: _______________</div>
                <div>Section: _______________</div>
                <div>Date: __________________</div>
              </div>

              {/* General Instructions Box */}
              {instructions && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="font-bold uppercase text-[11px] tracking-wider text-slate-700">
                    General Instructions:
                  </div>
                  <div className="whitespace-pre-line text-slate-600 leading-relaxed">
                    {instructions}
                  </div>
                </div>
              )}

              {/* Questions Section by Section */}
              <div className="space-y-6 pt-2">
                {Object.entries(groupedQuestions).map(([sectionName, qList], secIdx) => (
                  <div key={secIdx} className="space-y-4">
                    {/* Section Title Header */}
                    <div className="flex items-center justify-between border-b border-slate-400 pb-1 mt-4">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                        {sectionName}
                      </h4>
                      <span className="text-xs font-semibold text-slate-600">
                        [{qList.reduce((acc, q) => acc + (Number(q.marks) || 1), 0)} Marks]
                      </span>
                    </div>

                    {/* Questions within this Section */}
                    <div className="space-y-4">
                      {qList.map((q, qIdx) => {
                        const globalIdx = paperQuestions.findIndex((item) => item.id === q.id);
                        return (
                          <div
                            key={q.id || qIdx}
                            className="group relative p-3 rounded-lg border border-transparent hover:border-slate-200 transition-all space-y-2"
                          >
                            {/* Question Header & Marks */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1">
                                <span className="font-bold text-xs">Q{globalIdx + 1}.</span>
                                <div className="text-xs font-medium text-slate-900 leading-relaxed flex-1">
                                  <textarea
                                    value={q.question_text}
                                    onChange={(e) =>
                                      handleUpdateQuestion(globalIdx, 'question_text', e.target.value)
                                    }
                                    rows={2}
                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded p-1 resize-y text-xs font-serif"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-700 whitespace-nowrap">
                                  [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(globalIdx)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 print:hidden"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Options if MCQ */}
                            {q.type === 'mcq' && q.options && Array.isArray(q.options) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pt-1 text-xs">
                                {q.options.map((opt: any, optIdx: number) => {
                                  const label = typeof opt === 'string' ? String.fromCharCode(65 + optIdx) : opt.label;
                                  const text = typeof opt === 'string' ? opt : opt.text;
                                  return (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700">({label})</span>
                                      <span>{text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Teacher's Answer Key */}
                            {showAnswerKey && (q.answer_text || q.correct_option) && (
                              <div className="ml-6 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 font-sans space-y-0.5">
                                <div className="font-bold text-amber-950">
                                  Answer Key / Model Solution:
                                </div>
                                {q.correct_option && (
                                  <div>
                                    <span className="font-semibold">Correct Option:</span> ({q.correct_option})
                                  </div>
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

                    {/* Add Custom Question Button to this section */}
                    <div className="pl-4 pt-1 print:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddNewQuestion(sectionName)}
                        className="text-[11px] text-indigo-600 hover:bg-indigo-50 font-bold h-7 rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Question to {sectionName}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exam Paper Footer */}
              <div className="border-t-2 border-slate-900 pt-4 text-center text-xs font-bold text-slate-600 uppercase tracking-widest mt-8">
                *** END OF EXAMINATION PAPER ***
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED PAPERS HISTORY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Saved Examination Papers</h3>
              <p className="text-xs text-slate-500">
                View, re-open, print, or manage previously generated exam papers.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSavedPapers()}
              className="rounded-xl text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading history...
            </div>
          ) : savedPapers.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Saved Papers Yet</h4>
              <p className="text-xs text-slate-500">
                Create a paper in the Paper Builder and click "Save Paper" to view it here anytime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPapers.map((p) => (
                <Card key={p.id} className="rounded-2xl border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border-indigo-100">
                        {p.exam_type || 'Exam'}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 truncate mt-1">
                      {p.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {p.classes?.name || 'All Classes'} • {p.subjects?.name || 'Subject'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold bg-slate-50 p-2 rounded-xl">
                      <span>Total Marks: {p.total_marks}</span>
                      <span>{p.selected_questions?.length || 0} Questions</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleLoadPaper(p)}
                        className="flex-1 rounded-xl gradient-brand text-white text-xs font-bold h-8"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Open & Print
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePaper(p.id)}
                        className="rounded-xl text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
