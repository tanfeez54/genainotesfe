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
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  Save,
  Key,
  Download,
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

interface QuestionItem {
  id: string;
  chapter_id?: string;
  chapter_title?: string;
  type: string;
  question_text: string;
  options?: any;
  correct_option?: string;
  correct_answer?: string;
  answer_text?: string;
  marks?: number;
  difficulty?: string;
}

export default function GeneratePaperPage() {
  const [token, setToken] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Paper Config & Metadata
  const [schoolName, setSchoolName] = useState('Modern Public School');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [examTitle, setExamTitle] = useState('Annual Examination - 2026');
  const [timeAllowed, setTimeAllowed] = useState('2.5 Hours');
  const [totalMarks, setTotalMarks] = useState('50');
  const [instructions, setInstructions] = useState(
    '1. Attempt all questions.\n2. Write answers clearly and neatly.\n3. Section A is compulsory.'
  );

  // Question counts by type
  const [mcqCount, setMcqCount] = useState(5);
  const [mcqMarks, setMcqMarks] = useState(1);
  const [shortCount, setShortCount] = useState(4);
  const [shortMarks, setShortMarks] = useState(3);
  const [longCount, setLongCount] = useState(3);
  const [longMarks, setLongMarks] = useState(5);

  // Generated paper state
  const [paperQuestions, setPaperQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchSchoolInfo(tokenStr);
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

  // Generate Paper using Gemini AI & Scanned Document / Chapter Content
  const handleGeneratePaper = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Please select both a class and a subject');
      return;
    }

    const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';
    const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject';
    const selectedChapterNames = chapters
      .filter((c) => selectedChapterIds.includes(c.id))
      .map((c) => c.title);

    setIsGenerating(true);
    toast.info('Generating examination paper with AI from scanned documents...');

    try {
      const sections = [
        {
          section_name: 'Section A: Multiple Choice Questions',
          type: 'mcq',
          count: mcqCount,
          marks_per_question: mcqMarks,
          difficulty: 'easy',
        },
        {
          section_name: 'Section B: Short Answer Questions',
          type: 'short_answer',
          count: shortCount,
          marks_per_question: shortMarks,
          difficulty: 'medium',
        },
        {
          section_name: 'Section C: Long Answer Questions',
          type: 'long_answer',
          count: longCount,
          marks_per_question: longMarks,
          difficulty: 'hard',
        },
      ];

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
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate paper');

      if (data.data && Array.isArray(data.data)) {
        setPaperQuestions(data.data);
        toast.success(`Generated paper with ${data.data.length} questions!`);
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
            timeAllowed,
            instructions,
          },
          selected_questions: paperQuestions,
          status: 'finalized',
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
    window.print();
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';

  const mcqs = paperQuestions.filter((q) => q.type === 'mcq');
  const shorts = paperQuestions.filter((q) => q.type === 'short_answer' || q.type === 'short');
  const longs = paperQuestions.filter((q) => q.type === 'long_answer' || q.type === 'long');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Paper Creator Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Automated Exam Paper Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Design, customize, and print high-quality school exam papers in seconds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/question-bank">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" /> Question Bank
            </Button>
          </Link>
          <Link href="/scan">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2 text-emerald-600" /> Scan Papers
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Cards */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* 1. Target Selection */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> 1. Class & Subject
              </CardTitle>
              <CardDescription className="text-xs">
                Select the target grade and subject for this examination paper.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Included Chapters</Label>
                    <button
                      type="button"
                      onClick={toggleSelectAllChapters}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      {selectedChapterIds.length === chapters.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
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

          {/* 2. Paper Details */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-600" /> 2. Exam Paper Header
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">School Name</Label>
                <Input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="mt-1 h-9 rounded-lg text-sm"
                  placeholder="e.g. Modern Public School"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Exam Title</Label>
                <Input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="mt-1 h-9 rounded-lg text-sm"
                  placeholder="e.g. Mid-Term Examination 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Time Allowed</Label>
                  <Input
                    value={timeAllowed}
                    onChange={(e) => setTimeAllowed(e.target.value)}
                    className="mt-1 h-9 rounded-lg text-sm"
                    placeholder="e.g. 2.5 Hours"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Total Marks</Label>
                  <Input
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="mt-1 h-9 rounded-lg text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">General Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs rounded-lg"
                  placeholder="Instructions for students..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Question Distribution */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> 3. Question Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Multiple Choice (MCQ)</div>
                  <div className="text-[11px] text-slate-500">1-mark objective questions</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={mcqCount}
                    onChange={(e) => setMcqCount(Number(e.target.value))}
                    className="w-14 h-8 text-center text-xs font-bold"
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={mcqMarks}
                    onChange={(e) => setMcqMarks(Number(e.target.value))}
                    className="w-12 h-8 text-center text-xs"
                  />
                  <span className="text-xs text-slate-500">m</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Short Answer Questions</div>
                  <div className="text-[11px] text-slate-500">2-3 mark conceptual questions</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={shortCount}
                    onChange={(e) => setShortCount(Number(e.target.value))}
                    className="w-14 h-8 text-center text-xs font-bold"
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={shortMarks}
                    onChange={(e) => setShortMarks(Number(e.target.value))}
                    className="w-12 h-8 text-center text-xs"
                  />
                  <span className="text-xs text-slate-500">m</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Long / Essay Questions</div>
                  <div className="text-[11px] text-slate-500">4-5 mark detailed questions</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={longCount}
                    onChange={(e) => setLongCount(Number(e.target.value))}
                    className="w-14 h-8 text-center text-xs font-bold"
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={longMarks}
                    onChange={(e) => setLongMarks(Number(e.target.value))}
                    className="w-12 h-8 text-center text-xs"
                  />
                  <span className="text-xs text-slate-500">m</span>
                </div>
              </div>

              <Button
                onClick={handleGeneratePaper}
                disabled={isGenerating || !selectedClassId || !selectedSubjectId}
                className="w-full h-11 rounded-xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Exam Paper with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Exam Paper ({mcqCount + shortCount + longCount} Questions)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Paper Preview & Print Setup */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Preview:</span>
              <Badge variant="outline" className="text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                {paperQuestions.length} Questions
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`h-8 text-xs font-semibold rounded-lg ${
                  showAnswerKey ? 'bg-amber-50 border-amber-300 text-amber-900' : 'text-slate-700'
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
                className="h-8 text-xs font-bold rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
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

          {/* Printable Exam Paper Canvas */}
          <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-md min-h-[600px] text-slate-900 print:shadow-none print:border-none print:p-0">
            {paperQuestions.length === 0 ? (
              <div className="h-[450px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 print:hidden">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Paper Preview Ready</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Select your class, subject, and question distribution on the left, then click &ldquo;Generate Exam Paper&rdquo;.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Paper Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                    {schoolName}
                  </h2>
                  <h3 className="text-sm sm:text-base font-bold text-slate-700">
                    {examTitle}
                  </h3>
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

                {/* Question Sections */}
                <div className="space-y-6 pt-2">
                  {/* Section A: MCQs */}
                  {mcqs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section A: Multiple Choice Questions ({mcqs.length * mcqMarks} Marks)
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {mcqs.map((q, idx) => (
                          <div key={q.id || idx} className="text-xs space-y-1">
                            <div className="flex items-start justify-between font-medium">
                              <span>
                                Q{idx + 1}. {q.question_text}
                              </span>
                              <span className="font-bold text-slate-500">[{q.marks || mcqMarks}m]</span>
                            </div>
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4 pt-1 text-slate-700">
                                {q.options.map((opt: any, oIdx: number) => {
                                  const label = typeof opt === 'string' ? String.fromCharCode(65 + oIdx) : opt.label || String.fromCharCode(65 + oIdx);
                                  const text = typeof opt === 'string' ? opt : opt.text;
                                  return (
                                    <div key={oIdx}>
                                      ({label}) {text}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {showAnswerKey && (q.correct_option || q.correct_answer || q.answer_text) && (
                              <div className="text-[11px] text-emerald-700 font-semibold pl-4">
                                ✓ Key: {q.correct_option || q.correct_answer || q.answer_text}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Short Questions */}
                  {shorts.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section B: Short Answer Questions ({shorts.length * shortMarks} Marks)
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {shorts.map((q, idx) => (
                          <div key={q.id || idx} className="text-xs space-y-1">
                            <div className="flex items-start justify-between font-medium">
                              <span>
                                Q{idx + 1 + mcqs.length}. {q.question_text}
                              </span>
                              <span className="font-bold text-slate-500">[{q.marks || shortMarks}m]</span>
                            </div>
                            {showAnswerKey && (q.answer_text || q.correct_answer) && (
                              <div className="text-[11px] text-emerald-700 font-semibold pl-4">
                                ✓ Model Answer: {q.answer_text || q.correct_answer}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Long Questions */}
                  {longs.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section C: Long / Essay Questions ({longs.length * longMarks} Marks)
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {longs.map((q, idx) => (
                          <div key={q.id || idx} className="text-xs space-y-1">
                            <div className="flex items-start justify-between font-medium">
                              <span>
                                Q{idx + 1 + mcqs.length + shorts.length}. {q.question_text}
                              </span>
                              <span className="font-bold text-slate-500">[{q.marks || longMarks}m]</span>
                            </div>
                            {showAnswerKey && (q.answer_text || q.correct_answer) && (
                              <div className="text-[11px] text-emerald-700 font-semibold pl-4">
                                ✓ Model Answer: {q.answer_text || q.correct_answer}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-slate-200 text-[11px] text-slate-400">
                  *** End of Examination Paper ***
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
