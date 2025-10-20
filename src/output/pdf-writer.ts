/**
 * PDF file writer for DATEV documents
 * Writes grouped pages to individual PDF files
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import type {
  PersonnelGroup,
  CompanyGroup,
  WrittenFile,
  WriteOptions
} from '../types.js';

/**
 * PDF writer - creates PDF files from grouped pages
 */
export class PDFWriter {
  /**
   * Write a personnel group to a PDF file
   *
   * @param group - Personnel group to write
   * @param sourcePdfBuffer - Original PDF buffer
   * @param options - Write options
   * @returns Information about the written file
   */
  async writePersonnelGroup(
    group: PersonnelGroup,
    sourcePdfBuffer: Buffer,
    options: WriteOptions
  ): Promise<WrittenFile> {
    // Load source PDF
    const sourcePdf = await PDFDocument.load(sourcePdfBuffer);

    // Create new PDF
    const newPdf = await PDFDocument.create();

    // Get page indices to copy
    const pageIndices = group.pages.map(p => p.pageIndex);

    // Copy pages
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    // Generate filename
    const filename = this.generatePersonnelFilename(group, options);
    const outputPath = path.join(options.outputDir, filename);

    // Save PDF
    const pdfBytes = await newPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return {
      path: outputPath,
      pageCount: pageIndices.length,
      formTypes: Array.from(group.formTypes),
      personnelNumber: group.personnelNumber,
      employeeName: group.employeeName
    };
  }

  /**
   * Write company group to a PDF file
   *
   * @param group - Company group to write
   * @param sourcePdfBuffer - Original PDF buffer
   * @param options - Write options
   * @returns Information about the written file
   */
  async writeCompanyGroup(
    group: CompanyGroup,
    sourcePdfBuffer: Buffer,
    options: WriteOptions
  ): Promise<WrittenFile> {
    // Load source PDF
    const sourcePdf = await PDFDocument.load(sourcePdfBuffer);

    // Create new PDF
    const newPdf = await PDFDocument.create();

    // Get page indices to copy
    const pageIndices = group.pages.map(p => p.pageIndex);

    // Copy pages
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    // Generate filename
    const filename = this.generateCompanyFilename(group, options);
    const outputPath = path.join(options.outputDir, filename);

    // Save PDF
    const pdfBytes = await newPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return {
      path: outputPath,
      pageCount: pageIndices.length,
      formTypes: Array.from(group.formTypes)
    };
  }

  /**
   * Generate filename for personnel group
   */
  private generatePersonnelFilename(
    group: PersonnelGroup,
    options: WriteOptions
  ): string {
    const parts: string[] = [];

    if (options.prefix) {
      parts.push(options.prefix);
    }

    parts.push(group.personnelNumber);

    // Add date info
    if (group.dateInfo.year && group.dateInfo.month) {
      parts.push(group.dateInfo.year, group.dateInfo.month);
    } else if (group.dateInfo.year) {
      parts.push(group.dateInfo.year);
    }

    // No form types in filename - keep it simple
    return parts.join('-') + '.pdf';
  }

  /**
   * Generate filename for company group
   * Includes date information when available
   */
  private generateCompanyFilename(
    group: CompanyGroup,
    options: WriteOptions
  ): string {
    const parts: string[] = [];

    if (options.prefix) {
      parts.push(options.prefix);
    }

    parts.push('COMPANY');

    // Add date info if available
    if (group.dateInfo) {
      if (group.dateInfo.year && group.dateInfo.month) {
        parts.push(group.dateInfo.year, group.dateInfo.month);
      } else if (group.dateInfo.year) {
        parts.push(group.dateInfo.year);
      }
    }

    return parts.join('-') + '.pdf';
  }
}
