import { NextRequest, NextResponse } from 'next/server';
import { CymasphereQuickstartPDF } from '../../../utils/pdfGenerator';

/** In-memory cache for the quickstart PDF (1 hour TTL). Skipped in development. */
const CACHE_TTL_MS = 60 * 60 * 1000;
let pdfCache: { buffer: Buffer; cachedAt: number } | null = null;

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const useCache = process.env.NODE_ENV !== 'development' && pdfCache && now - pdfCache.cachedAt < CACHE_TTL_MS;

    let pdfBuffer: Buffer;
    if (useCache && pdfCache) {
      pdfBuffer = pdfCache.buffer;
    } else {
      const pdfGenerator = new CymasphereQuickstartPDF();
      pdfBuffer = await pdfGenerator.generateQuickstartGuide();
      if (process.env.NODE_ENV !== 'development') {
        pdfCache = { buffer: pdfBuffer, cachedAt: now };
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline; filename="Cymasphere-QuickStart-Guide.pdf"');
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Pragma', 'public');
    headers.set('Expires', new Date(now + 3600 * 1000).toUTCString());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating quickstart guide PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 