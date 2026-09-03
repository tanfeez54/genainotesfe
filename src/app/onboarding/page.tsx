'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Building, UploadCloud, ChevronRight, ChevronLeft, CheckCircle2, School } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [token, setToken] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [board, setBoard] = useState('');
  const [classesRange, setClassesRange] = useState('');
  const [numTeachers, setNumTeachers] = useState('');
  const [numStudents, setNumStudents] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : null;
    if (tokenStr) {
      setToken(tokenStr);
      // Check if they already have a school
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my-school`, {
        headers: { Authorization: `Bearer ${tokenStr}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.school) {
          // Already has school, redirect to dashboard
          router.push('/classes');
        }
      })
      .catch(console.error);
    } else {
      router.push('/login');
    }
  }, [router]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp' | 'signature') {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type}...`);
    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              base64,
              folder: `${type}s`,
              contentType: file.type || 'image/jpeg',
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed to upload ${type}`);

          if (type === 'logo') setLogoUrl(data.url);
          if (type === 'stamp') setStampUrl(data.url);
          if (type === 'signature') setSignatureUrl(data.url);

          toast.success(`${type} uploaded successfully`, { id: toastId });
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || `Failed to upload ${type}`, { id: toastId });
        } finally {
          setIsUploading(false);
        }
      };
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to upload ${type}`, { id: toastId });
      setIsUploading(false);
    }
  }

  async function handleFinish() {
    if (!name || !email) {
      toast.error('School Name and Contact Email are required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        contact_email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        board: board.trim() || null,
        classes_range: classesRange.trim() || null,
        num_teachers: numTeachers ? parseInt(numTeachers, 10) : null,
        num_students: numStudents ? parseInt(numStudents, 10) : null,
        logo_url: logoUrl || null,
        stamp_url: stampUrl || null,
        signature_url: signatureUrl || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.details?.[0]?.message || data.error || 'Failed to create school';
        throw new Error(errorMsg);
      }

      toast.success('School created successfully!');
      router.push('/classes');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-brand flex items-center justify-center shadow-lg mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to SchoolPapers AI</h1>
          <p className="text-slate-500 mt-2">Let's get your school set up in just a few steps.</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <div className={`h-2 w-12 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`} />
                <div className={`h-2 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
                <div className={`h-2 w-12 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-200'}`} />
              </div>
              <span className="text-sm font-medium text-slate-500">Step {step} of 3</span>
            </div>
            <CardTitle>
              {step === 1 && 'Basic Details'}
              {step === 2 && 'Academic Info'}
              {step === 3 && 'School Assets (Optional)'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter the primary contact information for your school.'}
              {step === 2 && 'Tell us about your classes and size.'}
              {step === 3 && 'Upload logos and stamps for official question papers.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input placeholder="e.g. St. Xavier's High School" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email *</Label>
                  <Input type="email" placeholder="admin@school.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="123 Education Lane..." value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Board of Education</Label>
                  <Input placeholder="e.g. CBSE, ICSE, State Board" value={board} onChange={e => setBoard(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Classes Range</Label>
                  <Select value={classesRange} onValueChange={(val) => setClassesRange(val || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classes range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nursery - 5">Nursery - 5</SelectItem>
                      <SelectItem value="Nursery - 8">Nursery - 8</SelectItem>
                      <SelectItem value="Nursery - 10">Nursery - 10</SelectItem>
                      <SelectItem value="Nursery - 12">Nursery - 12</SelectItem>
                      <SelectItem value="1 - 5">1 - 5</SelectItem>
                      <SelectItem value="1 - 8">1 - 8</SelectItem>
                      <SelectItem value="1 - 10">1 - 10</SelectItem>
                      <SelectItem value="1 - 12">1 - 12</SelectItem>
                      <SelectItem value="6 - 10">6 - 10</SelectItem>
                      <SelectItem value="6 - 12">6 - 12</SelectItem>
                      <SelectItem value="9 - 12">9 - 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Teachers</Label>
                    <Input type="number" placeholder="e.g. 50" value={numTeachers} onChange={e => setNumTeachers(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Students</Label>
                    <Input type="number" placeholder="e.g. 1500" value={numStudents} onChange={e => setNumStudents(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="space-y-2">
                    <Label>School Logo</Label>
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />}
                      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="max-w-[200px]" disabled={isUploading} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Official Stamp</Label>
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      {stampUrl ? <img src={stampUrl} alt="Stamp" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />}
                      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} className="max-w-[200px]" disabled={isUploading} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Principal Signature</Label>
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      {signatureUrl ? <img src={signatureUrl} alt="Signature" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />}
                      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="max-w-[200px]" disabled={isUploading} />
                    </div>
                  </div>
                  
                </div>
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800">
                  <p><strong>Note:</strong> These images will be used to automatically generate highly professional, ready-to-print Question Papers with your school's official branding.</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6 bg-slate-50/50 rounded-b-xl">
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)} 
              disabled={step === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="gradient-brand text-white">
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={isLoading || isUploading} className="gradient-brand text-white px-8">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Complete Setup
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
