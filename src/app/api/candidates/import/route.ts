import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import type { CsvImportResult, CsvImportRowError } from "@/lib/types";

// ────────────────────────────────────────────────────────────────
// POST /api/candidates/import
//
// Accepts multipart/form-data with a "file" field containing a CSV.
// Parses the CSV, validates rows against the Candidate model,
// detects duplicates (both intra-file and against the DB), and
// inserts valid rows. Returns a detailed summary.
//
// Why "skip bad rows" instead of all-or-nothing: the use case is
// bulk-importing hundreds of candidates from an Excel export.
// Aborting everything because of one typo forces the admin to fix
// and re-upload the entire file — worse UX for this scenario.
//
// Auth: only SUPER_ADMIN can call this endpoint (checked via the
// same localStorage-based mock auth the rest of the app uses —
// passed via an X-User-Role header from the client).
// ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROW_COUNT = 5000;

/** Canonical column names (lowercase, trimmed) → Candidate model fields */
const COLUMN_MAP: Record<string, string> = {
  nom: "nom",
  prenom: "prenom",
  email: "email",
  telephone: "telephone",
  tel: "telephone",
  phone: "telephone",
  // Extra data columns (stored in the JSON `extraData` field)
  education: "education",
  formation: "education",
  bio: "bio",
  cv_url: "cvUrl",
  cv: "cvUrl",
  github_url: "githubUrl",
  github: "githubUrl",
  competences: "competences",
  skills: "competences",
};

const REQUIRED_FIELDS = ["nom", "prenom", "email"] as const;

/** Simple email validation — RFC 5322 simplified */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Accès refusé : seuls les administrateurs peuvent importer des candidats." },
      { status: 403 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  // ── Parse multipart form data ───────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Requête invalide : multipart/form-data attendu." },
      { status: 400 },
    );
  }

  const eventIdRaw = formData.get("eventId");
  if (!eventIdRaw || typeof eventIdRaw !== "string") {
    return NextResponse.json(
      { error: "eventId est requis." },
      { status: 400 },
    );
  }
  const eventId = Number(eventIdRaw);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json(
      { error: "eventId invalide." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier CSV fourni (champ 'file' requis)." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Le fichier est vide." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Le fichier dépasse la taille maximale de 5 Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo).` },
      { status: 413 },
    );
  }

  // ── Verify event exists ─────────────────────────────────────
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json(
      { error: `Événement #${eventId} introuvable.` },
      { status: 404 },
    );
  }

  // ── Read file text (handle BOM) ─────────────────────────────
  let text = await file.text();
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // ── Parse CSV with PapaParse ────────────────────────────────
  // Auto-detect delimiter (handles both "," and ";")
  const parseResult = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
    transform: (value: string) => value.trim(),
  });

  if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
    return NextResponse.json(
      {
        error: "Impossible de parser le fichier CSV.",
        details: parseResult.errors.map((e) => e.message),
      },
      { status: 400 },
    );
  }

  const rows = parseResult.data;
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Le fichier CSV ne contient aucune ligne de données." },
      { status: 400 },
    );
  }

  if (rows.length > MAX_ROW_COUNT) {
    return NextResponse.json(
      { error: `Le fichier contient ${rows.length} lignes (maximum : ${MAX_ROW_COUNT}).` },
      { status: 400 },
    );
  }

  // ── Map headers to canonical field names ────────────────────
  const csvHeaders = parseResult.meta.fields ?? [];
  const headerMapping: Record<string, string> = {};
  for (const header of csvHeaders) {
    const canonical = COLUMN_MAP[header];
    if (canonical) {
      headerMapping[header] = canonical;
    }
  }

  // Verify required headers exist
  const mappedFields = new Set(Object.values(headerMapping));
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedFields.has(f));
  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: `Colonnes requises manquantes : ${missingRequired.join(", ")}. ` +
          `Colonnes trouvées : ${csvHeaders.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // ── Fetch existing emails in this event (for DB duplicate check) ──
  const existingCandidates = await prisma.candidate.findMany({
    where: { eventId },
    select: { email: true },
  });
  const existingEmails = new Set(
    existingCandidates
      .map((c) => c.email?.toLowerCase())
      .filter((e): e is string => !!e),
  );

  // ── Get the current max csvRowNumber for this event ─────────
  const lastCandidate = await prisma.candidate.findFirst({
    where: { eventId },
    orderBy: { csvRowNumber: "desc" },
    select: { csvRowNumber: true },
  });
  let nextRowNumber = (lastCandidate?.csvRowNumber ?? 0) + 1;

  // ── Validate and collect rows ───────────────────────────────
  const errors: CsvImportRowError[] = [];
  const validRows: Array<{
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    extraData: Prisma.InputJsonValue;
    csvRowNumber: number;
  }> = [];
  const seenEmailsInFile = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i];
    const rowNumber = i + 2; // +2: 1-indexed + header row

    // Map raw CSV columns to canonical fields
    const mapped: Record<string, string> = {};
    for (const [csvCol, value] of Object.entries(rawRow)) {
      const field = headerMapping[csvCol];
      if (field) {
        mapped[field] = value;
      }
    }

    // Validate required fields
    let hasError = false;
    for (const field of REQUIRED_FIELDS) {
      if (!mapped[field] || mapped[field].trim().length === 0) {
        errors.push({ row: rowNumber, field, reason: `Le champ "${field}" est requis.` });
        hasError = true;
      }
    }

    // Validate email format
    const email = mapped.email?.trim().toLowerCase();
    if (email && !isValidEmail(email)) {
      errors.push({ row: rowNumber, field: "email", reason: `Email invalide : "${mapped.email}".` });
      hasError = true;
    }

    if (hasError) continue;

    // Check intra-file duplicate
    if (seenEmailsInFile.has(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        reason: `Doublon dans le fichier : "${email}" apparaît plusieurs fois.`,
      });
      continue;
    }

    // Check DB duplicate
    if (existingEmails.has(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        reason: `Candidat existant : "${email}" est déjà enregistré pour cet événement.`,
      });
      continue;
    }

    seenEmailsInFile.add(email);

    // Build extra data object for JSON column
    const extraData: Record<string, string | string[]> = {};
    if (mapped.education) extraData.education = mapped.education;
    if (mapped.bio) extraData.bio = mapped.bio;
    if (mapped.cvUrl) extraData.cvUrl = mapped.cvUrl;
    if (mapped.githubUrl) extraData.githubUrl = mapped.githubUrl;
    if (mapped.competences) {
      // Support comma-separated skills within the competences field
      extraData.competences = mapped.competences
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Store any unmapped columns in extraData too
    for (const [csvCol, value] of Object.entries(rawRow)) {
      if (!headerMapping[csvCol] && value.trim()) {
        extraData[csvCol] = value.trim();
      }
    }

    validRows.push({
      nom: mapped.nom.trim(),
      prenom: mapped.prenom.trim(),
      email: email,
      telephone: mapped.telephone?.trim() || null,
      extraData: extraData as unknown as Prisma.InputJsonValue,
      csvRowNumber: nextRowNumber++,
    });
  }

  // ── Insert valid rows in batches ────────────────────────────
  let inserted = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    try {
      const result = await prisma.candidate.createMany({
        data: batch.map((r) => ({
          eventId,
          csvRowNumber: r.csvRowNumber,
          nom: r.nom,
          prenom: r.prenom,
          email: r.email,
          telephone: r.telephone,
          extraData: r.extraData as Prisma.InputJsonValue,
        })),
        skipDuplicates: true,
      });
      inserted += result.count;
    } catch {
      // If batch insert fails, try one-by-one to isolate bad rows
      for (const row of batch) {
        try {
          await prisma.candidate.create({
            data: {
              eventId,
              csvRowNumber: row.csvRowNumber,
              nom: row.nom,
              prenom: row.prenom,
              email: row.email,
              telephone: row.telephone,
              extraData: row.extraData as Prisma.InputJsonValue,
            },
          });
          inserted++;
        } catch (innerErr: unknown) {
          errors.push({
            row: row.csvRowNumber,
            reason: innerErr instanceof Error ? innerErr.message : "Erreur d'insertion inconnue.",
          });
        }
      }
    }
  }

  const skipped = errors.filter((e) =>
    e.reason.includes("Doublon") || e.reason.includes("existant"),
  ).length;
  const failed = errors.length - skipped;

  const result: CsvImportResult = {
    inserted,
    skipped,
    failed,
    errors,
  };

  const statusCode = inserted > 0 ? 200 : errors.length > 0 ? 422 : 200;
  return NextResponse.json(result, { status: statusCode });
}
