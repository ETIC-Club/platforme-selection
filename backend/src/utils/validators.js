import { badRequest } from './AppError.js';

export function parseId(value, name = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`Identifiant invalide : ${name}.`, { [name]: 'doit être un entier positif' });
  }
  return n;
}

export function oneOf(value, allowed, name, { optional = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return undefined;
    throw badRequest(`Le champ ${name} est obligatoire.`, { [name]: 'obligatoire' });
  }
  if (!allowed.includes(value)) {
    throw badRequest(`Valeur invalide pour ${name}.`, { [name]: `valeurs possibles : ${allowed.join(', ')}` });
  }
  return value;
}

export function optionalText(value, name, maxLength = 200) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (text.length > maxLength) {
    throw badRequest(`${name} est trop long (max ${maxLength} caractères).`, { [name]: 'trop long' });
  }
  return text || undefined;
}

export function parsePagination(query, { defaultSize = 20, maxSize = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, parseInt(query.pageSize, 10) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export const buildPagination = ({ page, pageSize }, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

/** Échappe % _ \ pour un ILIKE (recherche littérale). */
export const likePattern = (text) => `%${String(text).replace(/[\\%_]/g, '\\$&')}%`;

export const percent = (done, required) => (required > 0 ? Math.round((done * 100) / required) : 0);
