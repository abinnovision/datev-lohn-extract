export * from "./errors.js";
export * from "./type-guards.js";

export * from "./core/index.js";
export * from "./grouping/index.js";
export * from "./output/index.js";

export type {
	// Core types
	FormType,
	DateInfo,

	// Form-specific page types (discriminated union)
	LOGN17Page,
	LOMS05Page,
	UnknownPage,

	// Extraction types
	ExtractedPage, // Union of all page types

	// Grouping types
	PersonnelGroup,
	CompanyGroup,

	// Output types
	GeneratedPersonnelPdf,
	GeneratedCompanyPdf,
} from "./types.js";
