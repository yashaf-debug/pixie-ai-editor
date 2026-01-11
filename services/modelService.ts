/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const DB_NAME = 'PixshopModelsDB';
const DB_VERSION = 1;
const STORE_NAME = 'savedModels';

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;

      // Handle connection closing unexpectedly
      db.onversionchange = () => {
        if (db) {
          db.close();
          db = null;
        }
      };

      db.onclose = () => {
        db = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const saveModel = async (file: File): Promise<number> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ file, timestamp: new Date() });

        request.onsuccess = () => {
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error('Error saving model:', request.error);
            reject('Could not save model to library.');
        };
    });
};

export interface SavedModel {
    id: number;
    file: File;
    timestamp: Date;
}

export const getModels = async (): Promise<SavedModel[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by timestamp descending to show newest first
            const sortedResults = request.result.sort((a, b) => b.timestamp - a.timestamp);
            resolve(sortedResults as SavedModel[]);
        };

        request.onerror = () => {
            console.error('Error fetching models:', request.error);
            reject('Could not fetch models from library.');
        };
    });
};

export const deleteModel = async (id: number): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error deleting model:', request.error);
            reject('Could not delete model from library.');
        };
    });
};
