'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  Layers,
  BookOpen,
  GraduationCap,
  Sparkles,
  Camera,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : null;
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchQuestions(tokenStr);
    }
  }, []);

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects?class_id=${classId}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) setChapters(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchQuestions(authToken = token, chapterId = selectedChapterId, search = searchQuery, type = selectedType) {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/questions?`;
      const params = new URLSearchParams();
      if (chapterId) params.append('chapter_id', chapterId);
      if (search) params.append('search', search);
      if (type) params.append('type', type);

      const res = await fetch(url + params.toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setQuestions(data.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    if (classId) {
      fetchSubjects(classId);
    } else {
      setSubjects([]);
      setChapters([]);
    }
    fetchQuestions(token, '');
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    if (subjectId) {
      fetchChapters(subjectId);
    } else {
      setChapters([]);
    }
    fetchQuestions(token, '');
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    fetchQuestions(token, chapterId);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete question');
      toast.success('Question deleted successfully');
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" /> Question Bank
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Browse and manage all questions scanned from test papers and textbooks categorized by Class, Subject & Chapter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/scan">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer">
              <Camera className="w-4 h-4 mr-1.5" /> Scan New Papers
            </Button>
          </Link>
          <Link href="/generate-paper">
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-xl cursor-pointer">
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Create Paper
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border border-slate-200 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Class Filter */}
            <div>
              <Label className="text-[11px] font-bold text-slate-700 mb-1 block">Class</Label>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <Label className="text-[11px] font-bold text-slate-700 mb-1 block">Subject</Label>
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  disabled={!selectedClassId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Chapter Filter */}
            <div>
              <Label className="text-[11px] font-bold text-slate-700 mb-1 block">Chapter</Label>
              <div className="relative">
                <select
                  value={selectedChapterId}
                  disabled={!selectedSubjectId}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                >
                  <option value="">All Chapters</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Search Box */}
            <div>
              <Label className="text-[11px] font-bold text-slate-700 mb-1 block">Search Questions</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchQuestions(token)}
                    className="text-xs rounded-xl pr-8"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
                <Button
                  size="sm"
                  onClick={() => fetchQuestions(token)}
                  className="rounded-xl bg-slate-900 text-white text-xs px-3 font-semibold"
                >
                  Go
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Showing {questions.length} Questions
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span>Loading question bank...</span>
          </div>
        ) : questions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, idx) => (
              <Card key={q.id} className="rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {q.type?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                      {q.marks || 1} Marks
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {q.question_text}
                  </p>

                  {/* Options if MCQ */}
                  {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pl-2 text-[11px]">
                      {q.options.map((opt: any, optIdx: number) => {
                        const label = typeof opt === 'object' && opt?.label ? opt.label : String.fromCharCode(65 + optIdx);
                        const text = typeof opt === 'object' && opt?.text ? opt.text : opt;
                        return (
                          <div key={optIdx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                            <span className="font-bold text-indigo-600">({label})</span> {text}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer if present */}
                  {q.answer_text && (
                    <div className="text-[11px] bg-emerald-50/70 border border-emerald-200 rounded-lg p-2 text-emerald-900">
                      <span className="font-bold text-emerald-800">Ans:</span> {q.answer_text}
                    </div>
                  )}

                  {/* Chapter and Subject Tags */}
                  {q.chapters && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-indigo-600 font-semibold truncate">
                        {q.chapters.subjects?.classes?.name} &bull; {q.chapters.subjects?.name} &bull; {q.chapters.title}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <FileText className="w-12 h-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Questions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No questions found for the selected Class/Subject/Chapter. Use the Camera Scanner to scan and extract questions from papers.
            </p>
            <Link href="/scan" className="mt-4">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
                <Camera className="w-4 h-4 mr-1.5" /> Scan Document Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
