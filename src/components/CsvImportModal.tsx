"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import type { CsvImportResult, CsvImportRowError } from "@/lib/types";
import styles from "../app/selectors/selectors.module.css";

// ────────────────────────────────────────────────────────────────
// CsvImportModal — Modal for importing candidates from CSV files
//
// Why a dedicated component: keeps the candidates/page.tsx focused
// on list rendering (same pattern as the existing users page with
// its AddUserModal). The modal handles file selection, client-side
// preview, upload, and result display.
// ────────────────────────────────────────────────────────────────

interface CsvImportModalProps {
  eventId: number;
  userRole: string;
  onClose: () => void;
  onImportComplete: () => void;
}

/** First 5 rows of parsed CSV for the preview table */
interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export function CsvImportModal({
  eventId,
  userRole,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !importing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [importing, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !importing) {
      onClose();
    }
  };

  const parsePreview = useCallback((csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (!text) return;
      // Strip BOM
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }

      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
        preview: 5,
      });

      if (parsed.meta.fields && parsed.data.length > 0) {
        const headers = parsed.meta.fields;
        const rows = parsed.data.map((row) =>
          headers.map((h) => row[h] ?? ""),
        );

        // Re-parse to count total rows
        const fullParse = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        setPreview({
          headers,
          rows,
          totalRows: fullParse.data.length,
        });
      }
    };
    reader.readAsText(csvFile, "UTF-8");
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setError(null);
      setResult(null);

      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setError("Seuls les fichiers .csv sont acceptés.");
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(
          `Le fichier est trop volumineux (${(selectedFile.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo.`,
        );
        return;
      }

      if (selectedFile.size === 0) {
        setError("Le fichier est vide.");
        return;
      }

      setFile(selectedFile);
      parsePreview(selectedFile);
    },
    [parsePreview],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", String(eventId));

      const res = await fetch("/api/candidates/import", {
        method: "POST",
        headers: {
          "x-user-role": userRole,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok && !data.inserted && data.inserted !== 0) {
        setError(data.error || `Erreur serveur (${res.status}).`);
        return;
      }

      setResult(data as CsvImportResult);

      if (data.inserted > 0) {
        onImportComplete();
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div
      className={styles.modalOverlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Importer des candidats depuis un fichier CSV"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Importer des candidats</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Fermer la modale"
            disabled={importing}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Template download link */}
          <a
            href="/candidates-template.csv"
            download="candidates-template.csv"
            className={styles.templateLink}
            aria-label="Télécharger le modèle CSV"
          >
            📥 Télécharger le modèle CSV
          </a>

          {/* File drop zone */}
          {!file ? (
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Cliquez ou déposez un fichier CSV"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className={styles.dropZoneIcon}>📄</div>
              <div className={styles.dropZoneText}>
                Cliquez ou glissez un fichier CSV ici
              </div>
              <div className={styles.dropZoneSubtext}>
                .csv uniquement — 5 Mo max — Séparateurs: virgule ou point-virgule
              </div>
            </div>
          ) : (
            <div className={styles.selectedFile}>
              <span>📄</span>
              <span className={styles.selectedFileName}>{file.name}</span>
              <span className={styles.selectedFileSize}>
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={removeFile}
                aria-label="Retirer le fichier"
                disabled={importing}
              >
                ✕
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {/* CSV Preview */}
          {preview && !result && (
            <div className={styles.previewSection}>
              <div className={styles.previewTitle}>
                Aperçu ({preview.totalRows} ligne{preview.totalRows > 1 ? "s" : ""} détectée{preview.totalRows > 1 ? "s" : ""})
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} title={cell}>
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.totalRows > 5 && (
                <div style={{ fontSize: "12px", color: "#8C8F8E", textAlign: "center" }}>
                  … et {preview.totalRows - 5} ligne{preview.totalRows - 5 > 1 ? "s" : ""} de plus
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "rgba(193, 51, 63, 0.06)",
                borderRadius: "10px",
                border: "1px solid rgba(193, 51, 63, 0.15)",
                color: "#7F1D1D",
                fontSize: "13px",
                fontWeight: 600,
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Import result summary */}
          {result && (
            <div className={styles.resultSummary}>
              <div className={styles.resultStats}>
                <div className={`${styles.resultStat} ${styles.resultStatInserted}`}>
                  <span className={styles.resultStatValue}>{result.inserted}</span>
                  <span className={styles.resultStatLabel}>Importés</span>
                </div>
                <div className={`${styles.resultStat} ${styles.resultStatSkipped}`}>
                  <span className={styles.resultStatValue}>{result.skipped}</span>
                  <span className={styles.resultStatLabel}>Doublons</span>
                </div>
                <div className={`${styles.resultStat} ${styles.resultStatFailed}`}>
                  <span className={styles.resultStatValue}>{result.failed}</span>
                  <span className={styles.resultStatLabel}>Échoués</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className={styles.errorList}>
                  {result.errors.map((err: CsvImportRowError, i: number) => (
                    <div key={i} className={styles.errorItem}>
                      <span className={styles.errorRow}>Ligne {err.row}</span>
                      {err.field && <span> ({err.field})</span>}
                      {" : "}
                      {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {!result ? (
            <button
              type="button"
              className={styles.importButton}
              onClick={handleImport}
              disabled={!file || importing}
              aria-label="Importer le fichier CSV"
            >
              {importing ? (
                <>
                  <span className={styles.spinner} />
                  Import en cours...
                </>
              ) : (
                "Importer"
              )}
            </button>
          ) : (
            <button
              type="button"
              className={styles.importButton}
              onClick={onClose}
              aria-label="Fermer la modale"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
