import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  cor?: string;
  fundo?: string;
  logoUrl?: string | null;
  className?: string;
}

/** Gera QR code em canvas, com logo opcional no centro. */
export function QrCode({ value, size = 240, cor = '#0D0D0D', fundo = '#FFFFFF', logoUrl, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelado = false;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: cor, light: fundo },
    }).then(() => {
      if (cancelado || !logoUrl) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelado) return;
        const box = size * 0.24;
        const x = (size - box) / 2;
        ctx.fillStyle = fundo;
        ctx.fillRect(x - 6, x - 6, box + 12, box + 12);
        ctx.drawImage(img, x, x, box, box);
      };
      img.src = logoUrl;
    }).catch(() => undefined);

    return () => { cancelado = true; };
  }, [value, size, cor, fundo, logoUrl]);

  return <canvas ref={canvasRef} className={className} width={size} height={size} />;
}

export async function baixarQrPng(value: string, nome: string, cor = '#0D0D0D', fundo = '#FFFFFF') {
  const url = await QRCode.toDataURL(value, { width: 1024, margin: 2, errorCorrectionLevel: 'H', color: { dark: cor, light: fundo } });
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nome}.png`;
  a.click();
}

export async function baixarQrSvg(value: string, nome: string, cor = '#0D0D0D', fundo = '#FFFFFF') {
  const svg = await QRCode.toString(value, { type: 'svg', margin: 2, errorCorrectionLevel: 'H', color: { dark: cor, light: fundo } });
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${nome}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function useQrDataUrl(value: string, cor = '#0D0D0D', fundo = '#FFFFFF') {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    QRCode.toDataURL(value, { width: 400, margin: 2, errorCorrectionLevel: 'H', color: { dark: cor, light: fundo } })
      .then(setUrl).catch(() => setUrl(''));
  }, [value, cor, fundo]);
  return url;
}
