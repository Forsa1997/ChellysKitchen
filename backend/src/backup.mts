import { deserializeState, serializeState, type PersistableState, type SerializedState } from './persistence.mts';
import { MAX_UPLOAD_BYTES } from './uploads.mts';
import type { Category, Rating, Recipe, User, WeekPlan } from './types.mts';

export const BACKUP_TYPE = 'chellys-kitchen-backup';
export const BACKUP_VERSION = 1;

// Uploaded files are named `<hex>.<ext>`; anything else (especially path
// separators) is not something we ever wrote and gets dropped on import.
const SAFE_FILE_NAME = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

/** Uploaded image in a backup document: base64-encoded bytes. */
export interface BackupUploadEntry {
  fileName: string;
  data: string;
}

export interface BackupPayload {
  type: typeof BACKUP_TYPE;
  version: number;
  exportedAt: string;
  users: User[];
  recipeStore: Recipe[];
  ratingsStore: SerializedState['ratingsStore'];
  categoriesStore: Category[];
  favoritesStore: SerializedState['favoritesStore'];
  weekPlanStore: Partial<WeekPlan>;
  uploads: BackupUploadEntry[];
}

/**
 * Build the downloadable backup document from the in-memory server state.
 * Sessions are deliberately excluded: they are short-lived secrets and a
 * restored backup should not revive old tokens.
 *
 * `uploads` is a list of `{ fileName, data }` entries with base64-encoded
 * image bytes so the backup also covers uploaded recipe photos.
 */
export function createExportPayload(state: PersistableState, uploads: BackupUploadEntry[] = []): BackupPayload {
  const serialized = serializeState({
    ...state,
    sessions: new Map(),
    refreshSessions: new Map(),
  });

  return {
    type: BACKUP_TYPE,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    users: serialized.users,
    recipeStore: serialized.recipeStore,
    ratingsStore: serialized.ratingsStore,
    categoriesStore: serialized.categoriesStore,
    favoritesStore: serialized.favoritesStore,
    weekPlanStore: serialized.weekPlanStore,
    uploads,
  };
}

export interface ParsedBackup {
  users: Map<string, User>;
  recipeStore: Recipe[];
  ratingsStore: Map<string, Map<string, Rating>>;
  categoriesStore: Category[];
  favoritesStore: Map<string, Set<string>>;
  weekPlanStore: WeekPlan;
  uploads: Array<{ fileName: string; buffer: Buffer }>;
}

/**
 * Validate an uploaded backup document and convert it back into in-memory
 * structures. Throws with a user-facing German message when the file is not
 * a backup we produced. Returns `{ users, recipeStore, ratingsStore,
 * categoriesStore, uploads }` where uploads carry decoded Buffers.
 */
export function parseImportPayload(payload: unknown): ParsedBackup {
  const doc = payload as Partial<BackupPayload> | null | undefined;
  if (!doc || typeof doc !== 'object' || doc.type !== BACKUP_TYPE) {
    throw new Error('Die Datei ist kein Chellys-Kitchen-Backup.');
  }

  if (doc.version !== BACKUP_VERSION) {
    throw new Error('Diese Backup-Version wird nicht unterstützt.');
  }

  if (!Array.isArray(doc.users) || !Array.isArray(doc.recipeStore)) {
    throw new Error('Das Backup ist unvollständig oder beschädigt.');
  }

  const state = deserializeState(doc);

  const uploads: Array<{ fileName: string; buffer: Buffer }> = [];
  for (const entry of Array.isArray(doc.uploads) ? doc.uploads : []) {
    const fileName = String(entry?.fileName ?? '');
    if (!SAFE_FILE_NAME.test(fileName)) {
      continue;
    }

    const buffer = Buffer.from(String(entry?.data ?? ''), 'base64');
    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      continue;
    }

    uploads.push({ fileName, buffer });
  }

  return {
    users: state.users,
    recipeStore: state.recipeStore,
    ratingsStore: state.ratingsStore,
    categoriesStore: state.categoriesStore,
    favoritesStore: state.favoritesStore,
    weekPlanStore: state.weekPlanStore,
    uploads,
  };
}
