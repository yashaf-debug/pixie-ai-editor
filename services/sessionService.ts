/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const DB_NAME = 'PixshopSessionDB';
const DB_VERSION = 1;
const STORE_NAME = 'editorSession';
const SESSION_KEY = 1; // We only ever store one session object

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening session database');
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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveSession = async (sessionData: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: SESSION_KEY, data: sessionData });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving session:', request.error);
        reject('Could not save session.');
      };
    } catch (e) {
        reject(e);
    }
  });
};


export const getSession = async (): Promise<any | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(SESSION_KEY);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      console.error('Error fetching session:', request.error);
      reject('Could not fetch session.');
    };
  });
};

export const deleteSession = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(SESSION_KEY);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error('Error deleting session:', request.error);
      reject('Could not delete session.');
    };
  });
};
