'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Building, Loader2, UploadCloud } from 'lucide-react';

// Form schemas
const schoolSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact_email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  board: z.string().optional(),
  address: z.string().optional(),
  classes_range: z.string().optional(),
  num_teachers: z.any().optional(),
  num_students: z.any().optional(),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['school_admin', 'teacher', 'data_entry']),
  full_name: z.string().min(2, 'Name is required'),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;
type InviteFormValues = z.infer<typeof inviteSchema>;

export default function SchoolSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Image URLs
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const schoolForm = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      contact_email: '',
      phone: '',
      board: '',
      address: '',
      classes_range: '',
      num_teachers: undefined,
      num_students: undefined,
    },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'teacher',
      full_name: '',
    },
  });

  useEffect(() => {
    async function loadSchoolData() {
      try {
        const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
        const token = tokenMatch ? tokenMatch[2] : null;
        if (!token) return;
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my-school`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.school) {
              setSchoolId(data.school.id);
              setLogoUrl(data.school.logo_url || null);
              setStampUrl(data.school.stamp_url || null);
              setSignatureUrl(data.school.signature_url || null);
              
              schoolForm.reset({
                name: data.school.name,
                contact_email: data.school.contact_email,
                phone: data.school.phone || '',
                board: data.school.board || '',
                address: data.school.address || '',
                classes_range: data.school.classes_range || '',
                num_teachers: data.school.num_teachers || '',
                num_students: data.school.num_students || '',
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      } catch (error) {
        console.error('Error loading school data', error);
      }
    }
    loadSchoolData();
  }, [schoolForm]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp' | 'signature') {
    const file = e.target.files?.[0];
    if (!file) return;

    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const token = tokenMatch ? tokenMatch[2] : null;
    
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
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
        }
      };
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${type}`, { id: toastId });
    }
  }

  async function onUpdateSchool(data: SchoolFormValues) {
    setIsLoading(true);
    try {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;
      
      const payload = {
        ...data,
        logo_url: logoUrl,
        stamp_url: stampUrl,
        signature_url: signatureUrl
      };

      if (schoolId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update school');
        toast.success('School profile updated');
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create school');
        
        const result = await response.json();
        setSchoolId(result.school.id);
        toast.success('School created successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save school details');
    } finally {
      setIsLoading(false);
    }
  }

  async function onInviteUser(data: InviteFormValues) {
    if (!schoolId) {
      toast.error('Please create or select a school first');
      return;
    }

    setIsInviting(true);
    try {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }

      toast.success(`Invite sent to ${data.email}`);
      inviteForm.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your school profile and invite teachers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* School Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              School Profile
            </CardTitle>
            <CardDescription>
              {schoolId ? 'Update your school details.' : 'Onboard your school to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={schoolForm.handleSubmit(onUpdateSchool)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input id="name" placeholder="e.g. Springfield High" {...schoolForm.register('name')} />
                {schoolForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{schoolForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" type="email" placeholder="admin@school.com" {...schoolForm.register('contact_email')} />
                {schoolForm.formState.errors.contact_email && (
                  <p className="text-sm text-red-500">{schoolForm.formState.errors.contact_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input id="address" {...schoolForm.register('address')} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classes Range</Label>
                  <Input {...schoolForm.register('classes_range')} placeholder="e.g. Nursery - 10th" />
                  {schoolForm.formState.errors.classes_range && <p className="text-sm text-destructive">{schoolForm.formState.errors.classes_range.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Board of Education</Label>
                  <Input {...schoolForm.register('board')} placeholder="e.g. CBSE, ICSE, State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Teachers</Label>
                  <Input type="number" {...schoolForm.register('num_teachers')} placeholder="e.g. 50" />
                </div>
                <div className="space-y-2">
                  <Label>Total Students</Label>
                  <Input type="number" {...schoolForm.register('num_students')} placeholder="e.g. 1500" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 pt-4 border-t mt-4">
                <div className="space-y-2">
                  <Label>School Logo</Label>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="max-w-[200px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Official Stamp</Label>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                    {stampUrl ? <img src={stampUrl} alt="Stamp" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} className="max-w-[200px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Principal Signature</Label>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                    {signatureUrl ? <img src={signatureUrl} alt="Signature" className="max-h-24 mb-2 object-contain" /> : <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="max-w-[200px]" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {schoolId ? 'Save Changes' : 'Create School'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Users Card (Only show if school exists) */}
        {schoolId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Staff
              </CardTitle>
              <CardDescription>
                Send an email invite to teachers or data entry staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={inviteForm.handleSubmit(onInviteUser)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite_name">Full Name</Label>
                  <Input id="invite_name" placeholder="John Doe" {...inviteForm.register('full_name')} />
                  {inviteForm.formState.errors.full_name && (
                    <p className="text-sm text-red-500">{inviteForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite_email">Email Address</Label>
                  <Input id="invite_email" type="email" placeholder="teacher@school.com" {...inviteForm.register('email')} />
                  {inviteForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{inviteForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select 
                    id="role" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...inviteForm.register('role')}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="data_entry">Data Entry</option>
                    <option value="school_admin">School Admin</option>
                  </select>
                </div>

                <Button type="submit" disabled={isInviting} variant="secondary" className="w-full">
                  {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite Link
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
