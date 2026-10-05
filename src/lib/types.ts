// ────────────────────────────────────────────────────────────────
// Shared types used across API routes and frontend components
// ────────────────────────────────────────────────────────────────

/** A single row-level error from the CSV import process */
export interface CsvImportRowError {
  row: number;
  field?: string;
  reason: string;
}

/** Response shape from POST /api/candidates/import */
export interface CsvImportResult {
  inserted: number;
  skipped: number;
  failed: number;
  errors: CsvImportRowError[];
}

/** A selector's progress data for the Selecteur page */
export interface SelectorViewModel {
  id: number;
  name: string;
  email: string;
  roleType: "RH" | "Technique";
  selected: number;
  total: number;
  progressPercent: number;
  status: "termine" | "en_cours";
}

/** Response shape from GET /api/selectors */
export interface SelectorsApiResponse {
  selectors: SelectorViewModel[];
  total: number;
}
