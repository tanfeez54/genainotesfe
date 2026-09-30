'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DocumentViewerContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  if (!url) return <div className="text-white p-4">No URL provided</div>;

  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden m-0 p-0">
      {isPdf ? (
        <iframe
          src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
          title="PDF Document"
          className="w-full h-full border-none bg-white"
        />
      ) : (
        <img
          src={url}
          alt="Document Preview"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

export default function DocumentViewerPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-white">Loading document...</div>}>
      <DocumentViewerContent />
    </Suspense>
  );
}
