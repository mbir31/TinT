/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IndexedDB Storage Engine for TinT
 * Provides durable offline storage for structured match history, player stats,
 * and active local games with transparent fallback to localStorage.
 */

const DB_NAME = 'tint_game_db';
const DB_VERSION = 1;

export interface MatchRecord {
  id: string;
  gameType: 'tictactoe' | 'dotsboxes' | 'connectfour';
  mode: 'local' | 'ai' | 'online';
  boardInfo: string;
  winnerName: string | null;
  winnerColor: string;
  status: 'won' | 'draw';
  moveCount: number;
  durationMs: number;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;
let isOpening = false;
const openCallbacks: Array<(db: IDBDatabase | null) => void> = [];

/**
 * Open or retrieve the IndexedDB connection
 */
function getDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (isOpening) {
    return new Promise((resolve) => {
      openCallbacks.push(resolve);
    });
  }

  isOpening = true;

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 1. Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 2. Active Local Games Store
        if (!db.objectStoreNames.contains('active_games')) {
          db.createObjectStore('active_games', { keyPath: 'gameType' });
        }

        // 3. Match History Store
        if (!db.objectStoreNames.contains('match_history')) {
          const matchStore = db.createObjectStore('match_history', { keyPath: 'id' });
          matchStore.createIndex('by_timestamp', 'timestamp', { unique: false });
          matchStore.createIndex('by_gameType', 'gameType', { unique: false });
        }

        // 4. Stats Store
        if (!db.objectStoreNames.contains('player_stats')) {
          db.createObjectStore('player_stats', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        isOpening = false;
        resolve(dbInstance);
        openCallbacks.forEach((cb) => cb(dbInstance));
        openCallbacks.length = 0;

        // Handle abrupt closure
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
        };
      };

      request.onerror = (err) => {
        console.warn('[TinT DB] IndexedDB unavailable, using fallback:', err);
        isOpening = false;
        resolve(null);
        openCallbacks.forEach((cb) => cb(null));
        openCallbacks.length = 0;
      };
    } catch (err) {
      console.warn('[TinT DB] IndexedDB open error:', err);
      isOpening = false;
      resolve(null);
    }
  });
}

/**
 * Generic write to an object store
 */
export async function idbSet<T>(storeName: string, keyOrItem: T): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(keyOrItem);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Generic read from an object store by key
 */
export async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generic delete from an object store
 */
export async function idbDelete(storeName: string, key: IDBValidKey): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Record a completed match into IndexedDB history
 */
export async function recordMatchHistory(match: MatchRecord): Promise<void> {
  try {
    await idbSet('match_history', match);
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Load recent match records (up to limit)
 */
export async function loadRecentMatches(limit = 20): Promise<MatchRecord[]> {
  const db = await getDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(['match_history'], 'readonly');
      const store = transaction.objectStore('match_history');
      const index = store.index('by_timestamp');
      const request = index.openCursor(null, 'prev');
      const results: MatchRecord[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}
