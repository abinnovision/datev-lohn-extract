#!/usr/bin/env node

/**
 * CLI entry point for DATEV PDF Splitter
 * Minimal orchestration layer - glues together the core library components
 */

import fs from 'fs/promises';
import path from 'path';
import { program } from 'commander';
import { PageExtractor } from './core/page-extractor.js';
import { PageGrouper } from './grouping/page-grouper.js';
import { PDFWriter } from './output/pdf-writer.js';
import { CSVExporter } from './output/csv-exporter.js';

/**
 * Command-line interface
 * Minimal orchestration - connects extraction, grouping, and output
 */
async function main(): Promise<void> {
  program
    .name('datev-splitter')
    .description('Process DATEV salary statements and generate employee documents with SEPA transfers')
    .argument('<infile>', 'DATEV PDF file to process')
    .option('-o, --output <directory>', 'Output directory', '.')
    .action(async (infile: string, options: {
      output?: string;
    }) => {
      try {
        const outputDir = options.output || '.';
        const filename = path.basename(infile);

        // Create output directory
        await fs.mkdir(outputDir, { recursive: true });

        console.log(`Processing: ${filename}`);

        // Read PDF file
        const pdfBuffer = await fs.readFile(infile);

        // Extract pages (headless, no logging)
        const extractor = new PageExtractor({ verbose: false });
        const pages = await extractor.extractPages(pdfBuffer);

        // Group pages by personnel number
        const grouper = new PageGrouper();
        const result = grouper.groupByPersonnel(pages);

        // Write employee PDFs
        const writer = new PDFWriter();
        const writeOptions = {
          outputDir,
          prefix: '',
          includeFormTypeInFilename: false
        };

        for (const group of result.personnelGroups) {
          await writer.writePersonnelGroup(group, pdfBuffer, writeOptions);
        }

        console.log(`Created ${result.personnelGroups.length} employee document(s)`);

        // Write company files (grouped by month)
        if (result.companyGroups.length > 0) {
          for (const group of result.companyGroups) {
            await writer.writeCompanyGroup(group, pdfBuffer, writeOptions);
          }
          console.log(`Created ${result.companyGroups.length} company document(s)`);
        }

        // Export SEPA transfers
        const sepaPath = path.join(outputDir, 'sepa-transfers.csv');
        await new CSVExporter().exportSepaTransfers(result.personnelGroups, sepaPath);
        console.log('Exported SEPA transfers');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error:', errorMessage);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
