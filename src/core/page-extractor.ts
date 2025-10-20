/**
 * Page extraction from DATEV PDFs
 * Headless, stateless extraction using form class registry
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ExtractedPage, ExtractionOptions } from '../types.js';
import { FormDetector } from './form-detector.js';

/**
 * Page extractor - headless extraction using form class delegation
 * Orchestrates detection and delegates extraction to form-specific classes
 */
export class PageExtractor {
  private readonly options: ExtractionOptions;

  constructor(options: ExtractionOptions = {}) {
    this.options = options;
  }

  /**
   * Extract all pages from a PDF buffer
   * Returns classified pages with form-specific metadata, no side effects
   *
   * @param pdfBuffer - PDF file as Buffer
   * @returns Array of extracted pages with typed metadata
   */
  async extractPages(pdfBuffer: Buffer): Promise<ExtractedPage[]> {
    this.log('Starting page extraction', 'info');

    // Load PDF with pdf.js for text extraction
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    this.log(`Total pages: ${numPages}`, 'info');

    const extractedPages: ExtractedPage[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const extractedPage = await this.extractSinglePage(page, pageNum - 1);
      extractedPages.push(extractedPage);

      this.log(
        `Page ${pageNum}: ${extractedPage.formType} (PN: ${extractedPage.personnelNumber || 'none'})`,
        'debug'
      );
    }

    // Clean up pdf.js document
    await pdfDoc.cleanup();

    this.log('Page extraction complete', 'info');

    return extractedPages;
  }

  /**
   * Extract a single page with all metadata
   * Delegates to the appropriate form class for extraction
   *
   * @param page - PDF.js page object
   * @param pageIndex - 0-based page index
   * @returns Extracted page with form-specific metadata
   */
  private async extractSinglePage(page: any, pageIndex: number): Promise<ExtractedPage> {
    // Extract text from page
    const rawText = await this.extractPageText(page);

    // Detect form type
    const formType = FormDetector.detectFormType(rawText);

    // Get appropriate form handler
    const formHandler = FormDetector.getFormHandler(formType);

    if (this.options.trace) {
      this.log(`Using ${formHandler.name} handler for ${formType}`, 'debug');
    }

    // Delegate extraction to form-specific class
    // Each form class returns its own typed metadata
    const extractedPage = formHandler.extractMetadata(rawText, pageIndex, rawText);

    return extractedPage;
  }

  /**
   * Extract text from a single PDF page using pdf.js
   *
   * @param page - PDF.js page object
   * @returns Extracted text content
   */
  private async extractPageText(page: any): Promise<string> {
    const textContent = await page.getTextContent();

    // Combine all text items into a single string
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    return text;
  }

  /**
   * Simple logging method
   */
  private log(message: string, level: 'info' | 'debug' = 'info'): void {
    if (level === 'info' && this.options.verbose) {
      console.log(`[PageExtractor] ${message}`);
    } else if (level === 'debug' && this.options.trace) {
      console.log(`[PageExtractor] ${message}`);
    }
  }
}
