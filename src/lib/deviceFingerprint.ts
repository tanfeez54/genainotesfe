'use client';

// Lightweight, resilient device fingerprinting & persistent identification
// Prevents repeat trial abuse from the same machine even across Incognito or multiple accounts

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 730) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function generateRandomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'did_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const localId = localStorage.getItem('notegen_device_id');
  const cookieId = getCookie('notegen_device_id');

  const chosenId = localId || cookieId || generateRandomUUID();

  // Sync to both localStorage and cookie for persistence
  try {
    localStorage.setItem('notegen_device_id', chosenId);
  } catch {
    // Local storage might be blocked in strict private mode
  }
  setCookie('notegen_device_id', chosenId, 730);

  return chosenId;
}

function getCanvasFingerprint(): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('NoteGen Academic, SchoolPapers <canvas> 1.0', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('NoteGen Academic, SchoolPapers <canvas> 1.0', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getWebGLRenderer(): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return '';

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';

    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}::${renderer}`;
  } catch {
    return '';
  }
}

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Simple string hash fallback
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

export async function getDeviceFingerprint(): Promise<{
  deviceId: string;
  fingerprint: string;
}> {
  if (typeof window === 'undefined') {
    return { deviceId: '', fingerprint: '' };
  }

  const deviceId = getOrCreateDeviceId();

  const components = [
    `screen:${window.screen?.width}x${window.screen?.height}x${window.screen?.colorDepth}@${window.devicePixelRatio || 1}`,
    `cores:${navigator.hardwareConcurrency || 4}`,
    `platform:${navigator.platform || ''}`,
    `tz:${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`,
    `lang:${navigator.language || ''}`,
    `canvas:${getCanvasFingerprint()}`,
    `webgl:${getWebGLRenderer()}`,
  ];

  const fingerprint = await sha256(components.join('###'));

  return { deviceId, fingerprint };
}

export async function getDeviceHeaders(): Promise<Record<string, string>> {
  const { deviceId, fingerprint } = await getDeviceFingerprint();
  return {
    'x-device-id': deviceId,
    'x-device-fingerprint': fingerprint,
  };
}
