/**
 * OCR layer. FREE TIER: Tesseract.js (open-source, runs locally — no API
 * key, no per-page cost, works fully offline). This is the default engine
 * for the MVP. When document volume grows and accuracy on messy phone
 * photos of receipts becomes the bottleneck, swap in a paid OCR API
 * (Google Cloud Vision, AWS Textract, Azure Document Intelligence) behind
 * this same interface — see docs/COST_STRATEGY.md.
 */

export type OcrResult = {
  text: string;
  confidence: number; // 0..100, Tesseract's mean confidence
  engine: "tesseract-local" | "mock";
};

export interface OcrEngine {
  recognize(input: Buffer | string): Promise<OcrResult>;
}

export class TesseractOcrEngine implements OcrEngine {
  async recognize(input: Buffer | string): Promise<OcrResult> {
    // Lazy import so environments that never touch OCR (e.g. tests of
    // pure tax math) don't pay the startup cost of loading tesseract.js.
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(input);
      return { text: data.text, confidence: data.confidence, engine: "tesseract-local" };
    } finally {
      await worker.terminate();
    }
  }
}

/**
 * Deterministic OCR stand-in for local development and automated tests,
 * so the whole upload → extract → categorize pipeline can be exercised
 * without shipping image binaries through a real OCR pass every test run.
 */
export class MockOcrEngine implements OcrEngine {
  constructor(private readonly canned: string) {}
  async recognize(): Promise<OcrResult> {
    return { text: this.canned, confidence: 95, engine: "mock" };
  }
}
