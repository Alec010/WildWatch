/**
 * Utility for storing large file data in IndexedDB
 * to avoid sessionStorage quota issues
 */

const DB_NAME = "WildWatchEvidence";
const STORE_NAME = "evidenceFiles";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Store file data in IndexedDB
 */
export async function storeFileData(
  id: string,
  data: string
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id, data, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store file data"));
    });
  } catch (error) {
    console.error("Error storing file data:", error);
    throw error;
  }
}

/**
 * Retrieve file data from IndexedDB
 */
export async function getFileData(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => {
        reject(new Error("Failed to retrieve file data"));
      };
    });
  } catch (error) {
    console.error("Error retrieving file data:", error);
    return null;
  }
}

/**
 * Store multiple files in IndexedDB
 */
export async function storeFiles(
  files: Array<{ id: string; data: string }>
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await Promise.all(
      files.map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const request = store.put({
              id: file.id,
              data: file.data,
              timestamp: Date.now(),
            });
            request.onsuccess = () => resolve();
            request.onerror = () =>
              reject(new Error(`Failed to store file ${file.id}`));
          })
      )
    );
  } catch (error) {
    console.error("Error storing files:", error);
    throw error;
  }
}

/**
 * Retrieve multiple files from IndexedDB
 */
export async function getFiles(
  ids: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    await Promise.all(
      ids.map(async (id) => {
        const data = await getFileData(id);
        if (data) {
          result.set(id, data);
        }
      })
    );
  } catch (error) {
    console.error("Error retrieving files:", error);
  }
  return result;
}

/**
 * Delete file data from IndexedDB
 */
export async function deleteFileData(id: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete file data"));
    });
  } catch (error) {
    console.error("Error deleting file data:", error);
    throw error;
  }
}

/**
 * Clear all evidence files from IndexedDB
 */
export async function clearAllFiles(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear files"));
    });
  } catch (error) {
    console.error("Error clearing files:", error);
    throw error;
  }
}

/**
 * Generate a unique ID for a file based on its name and size
 */
export function generateFileId(name: string, size: number): string {
  return `${name}_${size}_${Date.now()}`;
}

