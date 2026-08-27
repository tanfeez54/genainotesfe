'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Camera,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  SwitchCamera,
  X,
  Layers,
  BookOpen,
  GraduationCap,
  HelpCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function ScanPapersPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  // Mandatory fields
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  
  // Custom new chapter creation inline
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isSavingNewChapter, setIsSavingNewChapter] = useState(false);

  const [docType, setDocType] = useState<'question_paper' | 'chapter_page'>('question_paper');

  // Image & Camera State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<any | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<any[]>([]);
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{ count: number; chapterTitle: string } | null>(null);

  const [token, setToken] = useState('');

  // Check if all 3 mandatory categories are fulfilled
  const isCategorizationComplete = Boolean(
    selectedClassId && 
    selectedSubjectId && 
    (selectedChapterId || (isCreatingNewChapter && newChapterTitle.trim().length > 0))
  );

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : null;
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
    }
  }, []);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects?class_id=${classId}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setChapters(data.data);
      }
    } catch (e) {
      console.error('Error fetching chapters:', e);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setIsCreatingNewChapter(false);
    setNewChapterTitle('');
    if (classId) {
      fetchSubjects(classId);
    } else {
      setSubjects([]);
      setChapters([]);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    setIsCreatingNewChapter(false);
    setNewChapterTitle('');
    if (subjectId) {
      fetchChapters(subjectId);
    } else {
      setChapters([]);
    }
  };

  // Inline Quick Chapter Creation
  const handleQuickCreateChapter = async () => {
    if (!newChapterTitle.trim() || !selectedSubjectId) {
      toast.error('Please enter a valid Chapter Name and select Subject');
      return;
    }
    setIsSavingNewChapter(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          title: newChapterTitle.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create chapter');

      toast.success(`Chapter "${data.data.title}" created successfully!`);
      await fetchChapters(selectedSubjectId);
      setSelectedChapterId(data.data.id);
      setIsCreatingNewChapter(false);
      setNewChapterTitle('');
    } catch (err: any) {
      toast.error(err.message || 'Error creating chapter');
    } finally {
      setIsSavingNewChapter(false);
    }
  };

  // --- Live Camera Functions ---
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    if (!isCategorizationComplete) {
      toast.error('Please select Class, Subject and Chapter Name first before scanning!');
      return;
    }

    setCameraError(null);
    setCameraActive(true);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please check browser permissions or upload a file.');
      toast.error('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setPreviewUrl(dataUrl);
    setFile(null); // using dataUrl directly
    stopCamera();
    toast.success('Document captured! Click "Scan & Extract with AI" to process.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setScannedDoc(null);
      setEditableQuestions([]);
      setSavedSuccessInfo(null);
    }
  };

  // --- Scan & Process OCR ---
  const handleUploadAndProcess = async () => {
    if (!isCategorizationComplete) {
      toast.error('Please select Class, Subject and Chapter Name before scanning!');
      return;
    }

    if (!previewUrl && !file) {
      toast.error('Please capture a document using Camera or upload an image file');
      return;
    }

    setIsUploading(true);
    setSavedSuccessInfo(null);

    try {
      let imageDataUrl = previewUrl || '';

      // If file was uploaded from file input, convert to base64
      if (file) {
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });
      }

      // Step 1: Create Scanned Document in Backend DB with mandatory Chapter
      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_url: imageDataUrl,
          doc_type: docType,
          chapter_id: selectedChapterId || undefined,
          chapter_name: isCreatingNewChapter ? newChapterTitle.trim() : undefined,
          subject_id: selectedSubjectId,
          class_id: selectedClassId,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create scan record');

      const doc = createData.data;
      if (createData.chapter_id && !selectedChapterId) {
        setSelectedChapterId(createData.chapter_id);
      }

      setScannedDoc(doc);
      setIsUploading(false);
      setIsProcessing(true);

      // Step 2: Trigger AI OCR Processing via Gemini
      toast.info('Analyzing document with Gemini AI OCR...');
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans/${doc.id}/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'Failed to OCR process image');

      const finishedDoc = processData.data;
      setScannedDoc(finishedDoc);

      const extracted = processData.questions || finishedDoc.raw_ocr_json;
      if (Array.isArray(extracted)) {
        setEditableQuestions(extracted);
        toast.success(`Successfully extracted ${extracted.length} questions from document!`);
      } else {
        toast.warning('OCR completed, but no questions were automatically detected.');
      }
    } catch (error: any) {
      console.error('Scan Error:', error);
      toast.error(error.message || 'Error occurred during scan & OCR process');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // --- Question Modification Handlers ---
  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      const currentOpts = Array.isArray(updated[qIndex].options) ? [...updated[qIndex].options] : [];
      if (typeof currentOpts[optIndex] === 'object' && currentOpts[optIndex] !== null) {
        currentOpts[optIndex] = { ...currentOpts[optIndex], text: value };
      } else {
        currentOpts[optIndex] = value;
      }
      updated[qIndex] = { ...updated[qIndex], options: currentOpts };
      return updated;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setEditableQuestions((prev) => prev.filter((_, i) => i !== index));
    toast.info('Question removed from list');
  };

  const handleAddNewQuestion = () => {
    setEditableQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'short_answer',
        marks: 2,
        difficulty: 'medium',
        options: [],
        answer_text: '',
      },
    ]);
  };

  // --- Save to Question Bank & Database ---
  const handleSaveToQuestionBank = async () => {
    if (!selectedChapterId) {
      toast.error('Chapter is strictly mandatory! Please select a chapter before saving.');
      return;
    }

    if (!editableQuestions || editableQuestions.length === 0) {
      toast.error('No questions available to save.');
      return;
    }

    // Verify questions have text
    const validQuestions = editableQuestions.filter((q) => q.question_text?.trim().length > 0);
    if (validQuestions.length === 0) {
      toast.error('Please ensure questions have text content before saving.');
      return;
    }

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
          chapter_id: selectedChapterId,
          questions: validQuestions,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save questions');

      const chapterObj = chapters.find((c) => c.id === selectedChapterId);
      const chapterTitle = chapterObj?.title || 'Selected Chapter';

      toast.success(`Saved ${result.count || validQuestions.length} questions into Question Bank!`);
      setSavedSuccessInfo({
        count: result.count || validQuestions.length,
        chapterTitle,
      });
      setScannedDoc((prev: any) => ({ ...prev, status: 'reviewed' }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving questions to database');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Camera Document Scanner & OCR
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Scan exam papers and textbook pages using your Camera or upload images. Auto-extracts questions with Gemini AI.
              </p>
            </div>
          </div>
        </div>

        {/* Status validation badge */}
        <div className="flex items-center gap-2">
          {isCategorizationComplete ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Categorization Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Class, Subject & Chapter Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 1. Categorization & 2. Camera/Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Mandatory Categorization */}
          <Card className={`rounded-2xl border transition-all ${
            isCategorizationComplete ? 'border-emerald-200 bg-white shadow-sm' : 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-md'
          }`}>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Select Categorization <span className="text-red-500">*</span>
                </CardTitle>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mandatory</span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Bina Class, Subject aur Chapter select kiye scan ya save nahi hoga.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Class Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    Class <span className="text-red-500">*</span>
                  </Label>
                  {selectedClassId && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Class (Required) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Subject Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  {selectedSubjectId && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    disabled={!selectedClassId || subjects.length === 0}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedClassId ? '-- Select Class first --' : subjects.length === 0 ? '-- No Subjects found --' : '-- Choose Subject (Required) --'}
                    </option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Chapter Selection & Inline Creation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Chapter Name <span className="text-red-500">*</span>
                  </Label>
                  {selectedSubjectId && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewChapter(!isCreatingNewChapter)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isCreatingNewChapter ? 'Select from list' : '+ New Chapter'}
                    </button>
                  )}
                </div>

                {!isCreatingNewChapter ? (
                  <div className="relative">
                    <select
                      value={selectedChapterId}
                      disabled={!selectedSubjectId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedSubjectId ? '-- Select Subject first --' : chapters.length === 0 ? '-- No chapters found (Click + New Chapter) --' : '-- Choose Chapter (Required) --'}
                      </option>
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new chapter name (e.g. Chemical Reactions)"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        className="text-xs rounded-xl bg-white border-indigo-300 focus:border-indigo-600"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleQuickCreateChapter}
                        disabled={isSavingNewChapter || !newChapterTitle.trim()}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 font-semibold"
                      >
                        {isSavingNewChapter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Chapter will be automatically saved under this Subject.
                    </p>
                  </div>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold text-slate-800">Document Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType('question_paper')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      docType === 'question_paper'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Question Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('chapter_page')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      docType === 'chapter_page'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Textbook Page
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Camera Scanner & Upload */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                Scan Document via Camera or Upload
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Live Camera se photo kheench kar ya device se image upload karke scan karein.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* If Camera is active, show live viewfinder */}
              {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500 shadow-inner">
                  {/* Live Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-72 sm:h-80 object-cover"
                  />

                  {/* Document Framing Overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center text-[10px] text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded w-fit">
                      <span>ALIGN DOCUMENT INSIDE FRAME</span>
                    </div>
                    <div className="text-center text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded mx-auto">
                      <span>Hold steady for clear OCR</span>
                    </div>
                  </div>

                  {/* Camera Controls Bar */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 px-4">
                    {/* Switch Camera Front/Back */}
                    <button
                      type="button"
                      onClick={switchCameraFacing}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>

                    {/* Shutter Button */}
                    <button
                      type="button"
                      onClick={capturePhotoFromCamera}
                      className="w-14 h-14 rounded-full bg-white border-4 border-indigo-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                      title="Take Snapshot"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>

                    {/* Close Camera */}
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all cursor-pointer"
                      title="Cancel Camera"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Options: Open Camera or Upload */
                <div className="space-y-3">
                  {/* Camera Button */}
                  <Button
                    type="button"
                    onClick={() => startCamera('environment')}
                    disabled={!isCategorizationComplete}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera Scanner
                  </Button>

                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or upload file</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Drag and Drop File Upload */}
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-all p-3 text-center ${
                    !isCategorizationComplete
                      ? 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed'
                      : 'border-slate-300 hover:border-indigo-500 bg-slate-50/80 hover:bg-indigo-50/30 cursor-pointer'
                  }`}>
                    <UploadCloud className="w-7 h-7 text-indigo-500 mb-1" />
                    <p className="text-xs text-slate-700 font-semibold">
                      {file ? file.name : <><span className="text-indigo-600 font-bold">Choose Image</span> or drag & drop</>}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</p>
                    <input
                      type="file"
                      disabled={!isCategorizationComplete}
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}

              {/* Hidden Canvas for Camera Captures */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Image Preview & Retake Bar */}
              {previewUrl && (
                <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Scanned Document"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Document Ready</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Ready for AI OCR Extraction</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFile(null);
                      setScannedDoc(null);
                      setEditableQuestions([]);
                    }}
                    className="text-xs rounded-xl h-8 border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retake
                  </Button>
                </div>
              )}

              {/* Validation Alert Warning if Categorization is missing */}
              {!isCategorizationComplete && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Required to unlock scanning:</span>
                    <ul className="list-disc list-inside text-[11px] mt-0.5 text-amber-700">
                      {!selectedClassId && <li>Select Class</li>}
                      {!selectedSubjectId && <li>Select Subject</li>}
                      {!selectedChapterId && !isCreatingNewChapter && <li>Select or Create Chapter Name</li>}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Execute Scan & OCR Button */}
            <CardFooter className="pt-2 pb-4">
              <Button
                onClick={handleUploadAndProcess}
                disabled={!isCategorizationComplete || !previewUrl || isUploading || isProcessing}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing Image...
                  </>
                ) : isProcessing ? (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4 animate-pulse text-cyan-300" /> Gemini AI Reading Questions...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" /> Scan & Extract with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: 3. Review & Save to Database (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[560px]">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Extracted Questions & Review
                </CardTitle>
                {/* Active Category Breadcrumb */}
                {selectedClass && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-semibold mt-1 font-mono">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      Class: {selectedClass.name}
                    </span>
                    {selectedSubject && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                        Subject: {selectedSubject.name}
                      </span>
                    )}
                    {selectedChapter && (
                      <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-100">
                        Chapter: {selectedChapter.title}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {editableQuestions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNewQuestion}
                  className="rounded-xl text-xs font-semibold h-8 border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4 pt-4">
              {/* Success Notification after Save */}
              {savedSuccessInfo && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Saved in Database Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    {savedSuccessInfo.count} questions have been saved into the Question Bank under chapter &quot;<strong>{savedSuccessInfo.chapterTitle}</strong>&quot;.
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <Link href="/question-bank">
                      <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-lg h-7 font-semibold">
                        View in Question Bank <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                    <Link href="/generate-paper">
                      <Button size="sm" variant="outline" className="text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-xs rounded-lg h-7 font-semibold">
                        <Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> Create Question Paper
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Status Bar */}
              {scannedDoc && !savedSuccessInfo && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    scannedDoc.status === 'ocr_completed' || scannedDoc.status === 'reviewed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : scannedDoc.status === 'failed'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
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
                  <span className="text-[11px] font-bold">
                    {editableQuestions.length} Questions Extracted
                  </span>
                </div>
              )}

              {/* Editable Question Cards List */}
              {editableQuestions.length > 0 ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {editableQuestions.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs transition-all space-y-3"
                    >
                      {/* Card Header: Number, Type, Marks, Delete */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </span>
                          <select
                            value={q.question_type || q.type || 'short_answer'}
                            onChange={(e) => handleUpdateQuestion(i, 'question_type', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            <option value="short_answer">Short Answer</option>
                            <option value="long_answer">Long Answer</option>
                            <option value="mcq">Multiple Choice (MCQ)</option>
                            <option value="true_false">True / False</option>
                            <option value="fill_blank">Fill in the Blanks</option>
                            <option value="match_the_following">Match the Following</option>
                          </select>

                          <select
                            value={q.difficulty || 'medium'}
                            onChange={(e) => handleUpdateQuestion(i, 'difficulty', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-slate-500">Marks:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={q.marks || 1}
                              onChange={(e) => handleUpdateQuestion(i, 'marks', parseInt(e.target.value) || 1)}
                              className="w-12 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-1.5 py-0.5 text-center text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(i)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Textarea */}
                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Question Text
                        </Label>
                        <textarea
                          rows={2}
                          value={q.question_text || ''}
                          onChange={(e) => handleUpdateQuestion(i, 'question_text', e.target.value)}
                          placeholder="Enter question text..."
                          className="w-full bg-slate-50/70 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {/* MCQ Options Editor if type is MCQ */}
                      {(q.question_type === 'mcq' || q.type === 'mcq') && (
                        <div className="space-y-1.5 pl-1">
                          <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Options (A, B, C, D)
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D']).map(
                              (opt: any, optIdx: number) => {
                                const label = String.fromCharCode(65 + optIdx);
                                const textVal = typeof opt === 'object' && opt !== null ? opt.text : opt;
                                return (
                                  <div key={optIdx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                                    <span className="font-bold text-indigo-700 text-[11px] font-mono">({label})</span>
                                    <input
                                      type="text"
                                      value={textVal || ''}
                                      onChange={(e) => handleUpdateOption(i, optIdx, e.target.value)}
                                      placeholder={`Option ${label}`}
                                      className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Answer & Explanation */}
                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Model Answer / Solution (Optional)
                        </Label>
                        <input
                          type="text"
                          value={q.answer_text || ''}
                          onChange={(e) => handleUpdateQuestion(i, 'answer_text', e.target.value)}
                          placeholder="e.g. Photosynthesis is the process..."
                          className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !previewUrl && !isProcessing ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm mb-1">No Document Scanned Yet</h3>
                  <p className="max-w-xs text-slate-500 text-[11px]">
                    Select Class, Subject & Chapter on the left, then open the camera to scan test papers.
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 text-xs py-20 text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  <p className="font-bold text-sm text-slate-800">Processing OCR with Google Gemini AI...</p>
                  <p className="text-[11px] text-slate-400">Reading Hindi, English, equations and extracting marks.</p>
                </div>
              ) : null}
            </CardContent>

            {/* Save to Database Footer */}
            {editableQuestions.length > 0 && (
              <CardFooter className="border-t border-slate-100 pt-4 bg-slate-50/50 rounded-b-2xl">
                <Button
                  onClick={handleSaveToQuestionBank}
                  disabled={isSaving || !selectedChapterId || savedSuccessInfo !== null}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving {editableQuestions.length} Questions to Database...
                    </>
                  ) : savedSuccessInfo ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Questions Saved in Database
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Save {editableQuestions.length} Questions to Database & Question Bank
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
