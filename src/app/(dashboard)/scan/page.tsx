'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  UploadCloud,
  FileText,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  Layers,
  Bookmark,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScanPapersPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [docType, setDocType] = useState('question_paper');

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<any | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<any[]>([]);

  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : null;
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
    }
  }, []);

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setClasses(data.data);
        if (data.data.length > 0) {
          setSelectedClassId(data.data[0].id);
          fetchSubjects(data.data[0].id, authToken);
        }
      }
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
      if (data.data) {
        setSubjects(data.data);
        if (data.data.length > 0) {
          setSelectedSubjectId(data.data[0].id);
          fetchChapters(data.data[0].id, authToken);
        } else {
          setSelectedSubjectId('');
          setChapters([]);
        }
      }
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
      if (data.data) {
        setChapters(data.data);
        if (data.data.length > 0) {
          setSelectedChapterId(data.data[0].id);
        } else {
          setSelectedChapterId('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    if (classId) fetchSubjects(classId);
    else {
      setSubjects([]);
      setChapters([]);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    if (subjectId) fetchChapters(subjectId);
    else setChapters([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setScannedDoc(null);
      setEditableQuestions([]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      toast.error('Please select an image file to scan');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Cloudflare R2 via Backend API
      const reader = new FileReader();
      reader.readAsDataURL(file);

      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                base64,
                folder: 'scans',
                contentType: file.type || 'image/jpeg',
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to upload image to Cloudflare R2');
            resolve(data.url);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      const publicUrl = await uploadPromise;

      // 2. Create Scanned Document Record
      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_url: publicUrl,
          doc_type: docType,
          chapter_id: selectedChapterId || undefined,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create scan record');

      const doc = createData.data;
      setScannedDoc(doc);
      setIsUploading(false);
      setIsProcessing(true);

      // 3. Trigger OCR Processing via Gemini
      toast.info('Analyzing image with Gemini 1.5 Vision AI...');
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans/${doc.id}/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'Failed to process image');

      const finishedDoc = processData.data;
      setScannedDoc(finishedDoc);
      if (Array.isArray(finishedDoc.raw_ocr_json)) {
        setEditableQuestions(finishedDoc.raw_ocr_json);
      }
      toast.success(`Extracted ${finishedDoc.raw_ocr_json?.length || 0} questions successfully!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // Save extracted questions to Question Bank
  const handleSaveToQuestionBank = async () => {
    if (!editableQuestions || editableQuestions.length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scan_id: scannedDoc?.id,
          chapter_id: selectedChapterId || null,
          questions: editableQuestions,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save questions');

      toast.success(`Saved ${result.count || editableQuestions.length} questions to Question Bank!`);
      setScannedDoc((prev: any) => ({ ...prev, status: 'reviewed' }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving questions');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Scan Papers (OCR AI)</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Upload photos of question papers or textbook pages and let Google Gemini Vision extract structured questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Configuration Section (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border border-slate-200/90 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <UploadCloud className="h-5 w-5 text-indigo-600" />
                Upload & Categorize
              </CardTitle>
              <CardDescription className="text-xs">
                Target Class, Subject, and Chapter for these questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Class *</Label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Subject Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Subject *</Label>
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    disabled={!selectedClassId || subjects.length === 0}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Chapter Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Chapter (Optional)</Label>
                <div className="relative">
                  <select
                    value={selectedChapterId}
                    disabled={!selectedSubjectId || chapters.length === 0}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                  >
                    <option value="">-- Choose Chapter --</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Document Type Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Document Type</Label>
                <div className="relative">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="question_paper">Question Paper</option>
                    <option value="chapter_page">Textbook Page</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* File Upload Box */}
              <div className="pt-2">
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Select Paper Image</Label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/70 hover:bg-indigo-50/20 transition-all p-4 text-center">
                  <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="text-xs text-slate-700 font-medium">
                    {file ? file.name : <><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or JPEG (Cloudflare R2 stored)</p>
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                </label>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={handleUploadAndProcess}
                disabled={!file || isUploading || isProcessing}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading to R2...
                  </>
                ) : isProcessing ? (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4 animate-pulse text-cyan-300" /> Extracting with AI...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" /> Scan & Extract Questions
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Results & Extracted Questions Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border border-slate-200/90 shadow-sm flex flex-col min-h-[480px]">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Extracted Questions & Review
                </CardTitle>
                {selectedClass && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1 font-mono">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Class: {selectedClass.name}</span>
                    {selectedSubject && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Subject: {selectedSubject.name}</span>
                    )}
                    {selectedChapter && (
                      <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">Chapter: {selectedChapter.title}</span>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4 pt-4">
              {/* Image Preview thumbnail if uploaded */}
              {previewUrl && (
                <div className="rounded-xl border border-slate-200 p-2 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{file?.name}</div>
                      <div className="text-[10px] text-slate-400">{(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status indicator */}
              {scannedDoc && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                    scannedDoc.status === 'ocr_completed' || scannedDoc.status === 'reviewed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : scannedDoc.status === 'failed'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}
                >
                  {scannedDoc.status === 'ocr_completed' || scannedDoc.status === 'reviewed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : scannedDoc.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                  )}

                  <span className="capitalize font-mono">
                    Status: {scannedDoc.status.replace('_', ' ')}
                  </span>
                </div>
              )}

              {/* Extracted Questions List */}
              {editableQuestions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {editableQuestions.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="font-semibold text-slate-800 flex-1 leading-relaxed">
                          {q.question_text}
                        </div>
                      </div>

                      {/* Options if MCQ */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pl-7 text-[11px]">
                          {q.options.map((opt: string, j: number) => (
                            <div key={j} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-mono">
                              ({String.fromCharCode(65 + j)}) {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 pl-7 pt-1 font-mono text-[10px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                          Type: {q.question_type}
                        </span>
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold">
                          {q.marks || 1} Marks
                        </span>
                        {q.answer_text && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded truncate max-w-xs">
                            Ans: {q.answer_text}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !previewUrl && !scannedDoc ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-16">
                  <FileText className="w-12 h-12 mb-2 text-slate-300" />
                  <p>Upload a question paper image to extract questions.</p>
                </div>
              ) : null}
            </CardContent>

            {/* Save to Question Bank Footer Button */}
            {editableQuestions.length > 0 && (
              <CardFooter className="border-t border-slate-100 pt-4">
                <Button
                  onClick={handleSaveToQuestionBank}
                  disabled={isSaving || scannedDoc?.status === 'reviewed'}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving to Question Bank...
                    </>
                  ) : scannedDoc?.status === 'reviewed' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Saved in Question Bank
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Save {editableQuestions.length} Questions to Question Bank
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
