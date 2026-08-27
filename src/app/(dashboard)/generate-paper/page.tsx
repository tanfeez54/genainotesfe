'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Printer,
  FileText,
  Settings2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Eye,
  BookOpen,
  School,
  Calendar,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  chapter_id: string;
  type: string;
  question_text: string;
  options?: any;
  correct_answer?: string;
  solution?: string;
  marks?: number;
  difficulty?: string;
}

export default function GeneratePaperPage() {
  const [token, setToken] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Paper Config
  const [schoolName, setSchoolName] = useState('SchoolPapers International');
  const [examTitle, setExamTitle] = useState('Annual Examination - 2026');
  const [timeAllowed, setTimeAllowed] = useState('2 Hours');
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
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
      if (data.data?.name) {
        setSchoolName(data.data.name);
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

  async function fetchQuestionsForSubject(subjectId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/questions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setAvailableQuestions(data.data);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
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
      fetchQuestionsForSubject(subjectId);
    }
  };

  const toggleChapter = (chapterId: string) => {
    if (selectedChapterIds.includes(chapterId)) {
      setSelectedChapterIds(selectedChapterIds.filter((id) => id !== chapterId));
    } else {
      setSelectedChapterIds([...selectedChapterIds, chapterId]);
    }
  };

  const handleGeneratePaper = () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Please select both a class and a subject');
      return;
    }

    setIsGenerating(true);

    // Filter available questions by selected chapters
    const eligibleQuestions = availableQuestions.filter((q) =>
      selectedChapterIds.length === 0 || selectedChapterIds.includes(q.chapter_id)
    );

    const mcqs = eligibleQuestions.filter((q) => q.type === 'mcq');
    const shorts = eligibleQuestions.filter((q) => q.type === 'short' || q.type === 'numerical');
    const longs = eligibleQuestions.filter((q) => q.type === 'long' || q.type === 'diagram');
    const others = eligibleQuestions.filter((q) => !['mcq', 'short', 'numerical', 'long', 'diagram'].includes(q.type));

    // Shuffle helper
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const pickedMcqs = shuffle(mcqs).slice(0, mcqCount).map(q => ({ ...q, marks: mcqMarks }));
    const pickedShorts = shuffle(shorts.length > 0 ? shorts : others).slice(0, shortCount).map(q => ({ ...q, marks: shortMarks }));
    const pickedLongs = shuffle(longs.length > 0 ? longs : others).slice(0, longCount).map(q => ({ ...q, marks: longMarks }));

    const finalQuestions = [...pickedMcqs, ...pickedShorts, ...pickedLongs];

    if (finalQuestions.length === 0) {
      // Fallback sample questions if question bank is currently empty
      const sampleClass = classes.find(c => c.id === selectedClassId)?.name || 'Grade 10';
      const sampleSubject = subjects.find(s => s.id === selectedSubjectId)?.name || 'Science';

      const fallback: QuestionItem[] = [
        {
          id: 'fb-1',
          chapter_id: '1',
          type: 'mcq',
          question_text: `Which of the following is the fundamental law related to ${sampleSubject}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'Option A',
          marks: mcqMarks,
        },
        {
          id: 'fb-2',
          chapter_id: '1',
          type: 'mcq',
          question_text: 'Define the SI unit of measurement for this subject module.',
          options: ['Newton', 'Joule', 'Watt', 'Pascal'],
          correct_answer: 'Joule',
          marks: mcqMarks,
        },
        {
          id: 'fb-3',
          chapter_id: '1',
          type: 'short',
          question_text: `Explain key concepts of chapter 1 in ${sampleSubject} with a brief example.`,
          marks: shortMarks,
        },
        {
          id: 'fb-4',
          chapter_id: '1',
          type: 'short',
          question_text: 'Differentiate between primary and secondary principles in 3 points.',
          marks: shortMarks,
        },
        {
          id: 'fb-5',
          chapter_id: '1',
          type: 'long',
          question_text: `Describe in detail the complete experimental procedure and theoretical derivation for ${sampleSubject}.`,
          marks: longMarks,
        },
      ];
      setPaperQuestions(fallback);
      toast.info('Using sample questions from question bank template');
    } else {
      setPaperQuestions(finalQuestions);
      toast.success(`Generated paper with ${finalQuestions.length} questions!`);
    }

    setIsGenerating(false);
    setIsPreviewMode(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
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
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Selection */}
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
                    <span className="text-[11px] text-slate-400">
                      {selectedChapterIds.length}/{chapters.length} selected
                    </span>
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

          {/* Paper Details */}
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
                <Label className="text-xs font-semibold text-slate-700">Instructions</Label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Exam instructions..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Breakdown */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> 3. Structure & Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
                <span>Section</span>
                <span>Count</span>
                <span>Marks/Q</span>
              </div>

              {/* MCQs */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <span className="font-medium text-slate-800">MCQs</span>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={mcqMarks}
                  onChange={(e) => setMcqMarks(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
              </div>

              {/* Short Questions */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <span className="font-medium text-slate-800">Short Qs</span>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={shortCount}
                  onChange={(e) => setShortCount(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={shortMarks}
                  onChange={(e) => setShortMarks(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
              </div>

              {/* Long Questions */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <span className="font-medium text-slate-800">Long Qs</span>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={longCount}
                  onChange={(e) => setLongCount(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={longMarks}
                  onChange={(e) => setLongMarks(Number(e.target.value))}
                  className="h-8 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3">
                <Button
                  onClick={handleGeneratePaper}
                  disabled={!selectedClassId || !selectedSubjectId || isGenerating}
                  className="w-full gradient-brand text-white font-semibold rounded-xl h-11 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating Paper...' : 'Generate Exam Paper'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Paper Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" /> Live Paper Preview
            </h2>

            {paperQuestions.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className="text-xs cursor-pointer"
                >
                  {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
                </Button>
                <Button
                  onClick={handlePrint}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save PDF
                </Button>
              </div>
            )}
          </div>

          {/* Paper Sheet Preview */}
          <div
            id="printable-paper"
            className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-md min-h-[600px] text-slate-900"
          >
            {paperQuestions.length === 0 ? (
              <div className="h-[450px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
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
                  {paperQuestions.some((q) => q.type === 'mcq') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section A: Multiple Choice Questions ({paperQuestions.filter(q => q.type === 'mcq').length * mcqMarks} Marks)
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {paperQuestions
                          .filter((q) => q.type === 'mcq')
                          .map((q, idx) => (
                            <div key={q.id || idx} className="text-xs space-y-1">
                              <div className="flex items-start justify-between font-medium">
                                <span>
                                  Q{idx + 1}. {q.question_text}
                                </span>
                                <span className="font-bold text-slate-500">[{q.marks || mcqMarks}m]</span>
                              </div>
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4 pt-1 text-slate-700">
                                  {q.options.map((opt: string, oIdx: number) => (
                                    <div key={oIdx}>
                                      ({String.fromCharCode(65 + oIdx)}) {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {showAnswerKey && q.correct_answer && (
                                <div className="text-[11px] text-emerald-700 font-semibold pl-4">
                                  ✓ Key: {q.correct_answer}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Short Questions */}
                  {paperQuestions.some((q) => q.type !== 'mcq' && q.type !== 'long') && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section B: Short Answer Questions
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {paperQuestions
                          .filter((q) => q.type !== 'mcq' && q.type !== 'long')
                          .map((q, idx) => (
                            <div key={q.id || idx} className="text-xs space-y-1">
                              <div className="flex items-start justify-between font-medium">
                                <span>
                                  Q{idx + 1 + paperQuestions.filter(x => x.type === 'mcq').length}. {q.question_text}
                                </span>
                                <span className="font-bold text-slate-500">[{q.marks || shortMarks}m]</span>
                              </div>
                              {showAnswerKey && q.correct_answer && (
                                <div className="text-[11px] text-emerald-700 font-semibold pl-4">
                                  ✓ Model Answer: {q.correct_answer}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Long Questions */}
                  {paperQuestions.some((q) => q.type === 'long') && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">
                          Section C: Long / Essay Questions
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {paperQuestions
                          .filter((q) => q.type === 'long')
                          .map((q, idx) => (
                            <div key={q.id || idx} className="text-xs space-y-1">
                              <div className="flex items-start justify-between font-medium">
                                <span>
                                  Q{idx + 1 + paperQuestions.filter(x => x.type !== 'long').length}. {q.question_text}
                                </span>
                                <span className="font-bold text-slate-500">[{q.marks || longMarks}m]</span>
                              </div>
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
