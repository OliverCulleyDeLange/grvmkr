import { DATA_DB_STORES, DATA_DB_VERSION, DATA_DB_NAME } from "./db_config";

export function getDataDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATA_DB_NAME, DATA_DB_VERSION);

        request.onupgradeneeded = (event) => {
            console.log(`Upgrading ${DATA_DB_NAME}`);
            const db = (event.target as IDBOpenDBRequest).result;
            DATA_DB_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id" });
                    console.log(`Upgrading: created object store [${storeName}]`);
                }
            });
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (e: Event) => reject(e);
    });
}