'use server';

import fs from 'fs';
import { join } from 'path';
import { log } from '../logger';
import { FavoriteInput, FavoriteUpdateInput, SavedQueryInput } from '../schemas';

export type Favorite = {
  id: number;
  name: string;
  path: string;
  environment: string;
  region: string;
};

export type SavedQuery = {
  id: number;
  name: string;
  query: string;
  logGroups: string;
};

type DbData = { favorites: Favorite[]; savedQueries?: SavedQuery[] };

const DB_PATH = join(process.cwd(), 'config', 'db.json');
const DEFAULT_DATA: DbData = { favorites: [] };

// Simple promise-serialized write to avoid races
let writeQueue: Promise<void> = Promise.resolve();

function readDb(): DbData {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    return { ...DEFAULT_DATA, favorites: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbData;
}

function writeDb(data: DbData): Promise<void> {
  writeQueue = writeQueue.then(
    () =>
      new Promise<void>((resolve, reject) => {
        fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), (err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
  );
  return writeQueue;
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, f) => (f.id > max ? f.id : max), 0) + 1;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<Favorite[]> {
  return readDb().favorites;
}

export async function getFavoriteById(id: number): Promise<Favorite | null> {
  return readDb().favorites.find((f) => f.id === id) ?? null;
}

export async function getFavoriteByPath(
  path: string,
  environment: string,
  region: string,
): Promise<Favorite | null> {
  return (
    readDb().favorites.find(
      (f) => f.path === path && f.environment === environment && f.region === region,
    ) ?? null
  );
}

export async function toggleFavorite(
  name: string,
  path: string,
  environment: string,
  region: string,
): Promise<{ added: boolean; id?: number }> {
  const db = readDb();
  const existing = db.favorites.find(
    (f) => f.path === path && f.environment === environment && f.region === region,
  );

  if (existing) {
    db.favorites = db.favorites.filter((f) => f.id !== existing.id);
    await writeDb(db);
    log.info({ id: existing.id }, 'favorites.remove');
    return { added: false };
  }

  const favorite: Favorite = { id: nextId(db.favorites), name, path, environment, region };
  db.favorites.push(favorite);
  await writeDb(db);
  log.info({ id: favorite.id, name }, 'favorites.add');
  return { added: true, id: favorite.id };
}

export async function createFavorite(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: boolean; errors: Record<string, string>; favorite?: Favorite }> {
  const raw = {
    name: formData.get('name'),
    path: formData.get('path'),
    environment: formData.get('environment'),
    region: formData.get('region'),
  };

  const result = FavoriteInput.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, errors };
  }

  const db = readDb();
  const favorite: Favorite = { id: nextId(db.favorites), ...result.data };
  db.favorites.push(favorite);
  await writeDb(db);
  log.info({ id: favorite.id, name: favorite.name }, 'favorites.create');
  return { ok: true, errors: {}, favorite };
}

export async function updateFavorite(
  id: number,
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: boolean; errors: Record<string, string>; favorite?: Favorite }> {
  const raw: Record<string, string | null> = {};
  for (const [key, value] of formData.entries()) raw[key] = value as string;

  const result = FavoriteUpdateInput.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, errors };
  }

  const db = readDb();
  const idx = db.favorites.findIndex((f) => f.id === id);
  if (idx === -1) return { ok: false, errors: { _: 'Favorite not found' } };

  const updated: Favorite = { ...db.favorites[idx], ...result.data, id };
  db.favorites[idx] = updated;
  await writeDb(db);
  log.info({ id }, 'favorites.update');
  return { ok: true, errors: {}, favorite: updated };
}

export async function deleteFavorite(id: number): Promise<{ ok: boolean }> {
  const db = readDb();
  const idx = db.favorites.findIndex((f) => f.id === id);
  if (idx === -1) return { ok: false };

  db.favorites.splice(idx, 1);
  await writeDb(db);
  log.info({ id }, 'favorites.delete');
  return { ok: true };
}

// ── Saved Queries ──────────────────────────────────────────────────────────────

export async function getSavedQueries(): Promise<SavedQuery[]> {
  return readDb().savedQueries ?? [];
}

export async function getSavedQueryById(id: number): Promise<SavedQuery | null> {
  return (readDb().savedQueries ?? []).find((q) => q.id === id) ?? null;
}

export async function createSavedQuery(
  input: SavedQueryInput,
): Promise<{ ok: boolean; errors: Record<string, string>; query?: SavedQuery }> {
  const result = SavedQueryInput.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, errors };
  }
  const db = readDb();
  const queries = db.savedQueries ?? [];
  const entry: SavedQuery = { id: nextId(queries), ...result.data };
  db.savedQueries = [...queries, entry];
  await writeDb(db);
  log.info({ id: entry.id, name: entry.name }, 'savedQueries.create');
  return { ok: true, errors: {}, query: entry };
}

export async function updateSavedQuery(
  id: number,
  input: SavedQueryInput,
): Promise<{ ok: boolean; errors: Record<string, string>; query?: SavedQuery }> {
  const result = SavedQueryInput.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, errors };
  }
  const db = readDb();
  const queries = db.savedQueries ?? [];
  const idx = queries.findIndex((q) => q.id === id);
  if (idx === -1) return { ok: false, errors: { _: 'Query not found' } };

  const updated: SavedQuery = { ...queries[idx], ...result.data, id };
  db.savedQueries = [...queries.slice(0, idx), updated, ...queries.slice(idx + 1)];
  await writeDb(db);
  log.info({ id }, 'savedQueries.update');
  return { ok: true, errors: {}, query: updated };
}

export async function deleteSavedQuery(id: number): Promise<{ ok: boolean }> {
  const db = readDb();
  const queries = db.savedQueries ?? [];
  const idx = queries.findIndex((q) => q.id === id);
  if (idx === -1) return { ok: false };

  db.savedQueries = queries.filter((q) => q.id !== id);
  await writeDb(db);
  log.info({ id }, 'savedQueries.delete');
  return { ok: true };
}
