// ========================================
// IndexedDB Storage Service — WriteAI
// Documents stored locally for privacy
// ========================================
import { openDB } from 'idb';

const DB_NAME = 'writeai-db';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

/**
 * Initialize IndexedDB
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('isDeleted', 'isDeleted');
        store.createIndex('isFavorite', 'isFavorite');
        store.createIndex('title', 'title');
      }
    },
  });
}

/**
 * Generate UUID
 */
function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => 
      Math.floor(Math.random() * 16).toString(16)
    );
}

/**
 * Extract plain text from HTML content
 */
function htmlToPlainText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Create a new document
 */
export async function createDocument(title = 'Untitled', content = '') {
  const db = await getDB();
  const now = new Date().toISOString();
  const plainText = htmlToPlainText(content);
  
  const doc = {
    id: generateId(),
    title,
    content,
    plainText,
    wordCount: plainText.split(/\s+/).filter(Boolean).length,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    tags: [],
  };

  await db.put(STORE_NAME, doc);
  return doc;
}

/**
 * Update a document
 */
export async function updateDocument(id, data) {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) throw new Error('Document not found');

  const updated = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // Update plainText and wordCount if content changed
  if (data.content !== undefined) {
    updated.plainText = htmlToPlainText(data.content);
    updated.wordCount = updated.plainText.split(/\s+/).filter(Boolean).length;
  }

  await db.put(STORE_NAME, updated);
  return updated;
}

/**
 * Get a single document
 */
export async function getDocument(id) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

/**
 * Get all active documents (not deleted), sorted by updatedAt desc
 */
export async function getAllDocuments() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .filter(d => !d.isDeleted)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Get deleted documents (trash)
 */
export async function getDeletedDocuments() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .filter(d => d.isDeleted)
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

/**
 * Get favorite documents
 */
export async function getFavoriteDocuments() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .filter(d => d.isFavorite && !d.isDeleted)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Search documents by title or content
 */
export async function searchDocuments(query) {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const lower = query.toLowerCase();
  return all
    .filter(d => !d.isDeleted && (
      d.title.toLowerCase().includes(lower) ||
      d.plainText.toLowerCase().includes(lower)
    ))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Soft delete (move to trash)
 */
export async function softDeleteDocument(id) {
  return updateDocument(id, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
  });
}

/**
 * Restore from trash
 */
export async function restoreDocument(id) {
  return updateDocument(id, {
    isDeleted: false,
    deletedAt: null,
  });
}

/**
 * Permanently delete
 */
export async function permanentlyDeleteDocument(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(id) {
  const db = await getDB();
  const doc = await db.get(STORE_NAME, id);
  if (!doc) throw new Error('Document not found');
  return updateDocument(id, { isFavorite: !doc.isFavorite });
}

/**
 * Rename document
 */
export async function renameDocument(id, newTitle) {
  return updateDocument(id, { title: newTitle });
}

/**
 * Get document count
 */
export async function getDocumentCount() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return {
    total: all.filter(d => !d.isDeleted).length,
    favorites: all.filter(d => d.isFavorite && !d.isDeleted).length,
    trash: all.filter(d => d.isDeleted).length,
  };
}

/**
 * Empty trash (permanently delete all trashed documents)
 */
export async function emptyTrash() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const trashed = all.filter(d => d.isDeleted);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const doc of trashed) {
    tx.store.delete(doc.id);
  }
  await tx.done;
}
