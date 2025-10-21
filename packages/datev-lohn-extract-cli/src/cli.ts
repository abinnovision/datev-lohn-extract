#!/usr/bin/env node

import {
	PageExtractor,
	PageGrouper,
	PdfGenerator,
	SepaTransfersGenerator,
} from "@internal/datev-lohn-extract-core";
import { program } from "commander";
import fs from "fs/promises";
import path from "path";

/**
 * Generate filename from PDF metadata
 */
function generateFilename(
	personnelNumber: string,
	year: string | null,
	month: string | null,
): string {
	const parts = ["PERSONNEL"];
	if (year && month) {
		parts.push(year, month);
	} else if (year) {
		parts.push(year);
	}
	parts.push(personnelNumber);
	return parts.join("-") + ".pdf";
}

/**
 * Generate filename for company PDFs
 */
function generateCompanyFilename(
	year: string | null,
	month: string | null,
): string {
	const parts = ["COMPANY"];
	if (year && month) {
		parts.push(year, month);
	} else if (year) {
		parts.push(year);
	}
	return parts.join("-") + ".pdf";
}

// Create a new PageExtractor instance.
const pageExtractor = new PageExtractor();
const pageGrouper = new PageGrouper();
const pdfGenerator = new PdfGenerator();
const sepaTransfersGenerator = new SepaTransfersGenerator();

/**
 * Command-line interface
 */
async function main(): Promise<void> {
	program
		.name("datev-splitter")
		.description(
			"Process DATEV salary statements and generate employee documents with SEPA transfers",
		)
		.argument("<infile>", "DATEV PDF file to process")
		.option("-o, --output <directory>", "Output directory", ".")
		.action(async (infile: string, options: { output?: string }) => {
			try {
				const outputDir = options.output || ".";
				const filename = path.basename(infile);

				// Create output directory
				await fs.mkdir(outputDir, { recursive: true });

				// Read PDF file
				const pdfBuffer = await fs.readFile(infile);

				const extractedPages = await pageExtractor.extractPages(pdfBuffer);
				const groupedPages = pageGrouper.groupByPersonnel(extractedPages);

				// Save personnel PDFs
				for (const pdf of groupedPages.personnelGroups) {
					const generatedPdf = await pdfGenerator.generatePersonnelPdf(
						pdf,
						pdfBuffer,
					);

					const pdfFilename = generateFilename(
						pdf.personnelNumber,
						pdf.dateInfo.year,
						pdf.dateInfo.month,
					);

					const pdfPath = path.join(outputDir, pdfFilename);
					await fs.writeFile(pdfPath, generatedPdf.data);
				}

				// Save company PDFs
				if (groupedPages.companyGroups.length > 0) {
					for (const pdf of groupedPages.companyGroups) {
						const generatedPdf = await pdfGenerator.generateCompanyPdf(
							pdf,
							pdfBuffer,
						);

						const pdfFilename = generateCompanyFilename(
							pdf.dateInfo?.year ?? null,
							pdf.dateInfo?.month ?? null,
						);
						const pdfPath = path.join(outputDir, pdfFilename);
						await fs.writeFile(pdfPath, generatedPdf.data);
					}
				}

				// Save SEPA transfers CSV
				const sepaPath = path.join(outputDir, "sepa-transfers.csv");
				await fs.writeFile(
					sepaPath,
					sepaTransfersGenerator.generateSepaTransfersCsv(
						groupedPages.personnelGroups,
					),
					"utf-8",
				);

				console.log(`Processed ${filename} -> ${outputDir}`);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				console.error("Error:", errorMessage);
				process.exit(1);
			}
		});

	await program.parseAsync(process.argv);
}

// Run the CLI
main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});
