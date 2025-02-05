import { dataDbName, instrumentStoreName, instrumentHitStoreName } from "./db_config";

export function getDataDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dataDbName, 1);

        request.onupgradeneeded = (event) => {
            console.log(`Upgrading ${dataDbName}`);
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(instrumentStoreName)) {
                db.createObjectStore(instrumentStoreName, { keyPath: "id" });
                console.log(`Upgrading: created object store [${instrumentStoreName}]`);
            }
            if (!db.objectStoreNames.contains(instrumentHitStoreName)) {
                db.createObjectStore(instrumentHitStoreName, { keyPath: "id" });
                console.log(`Upgrading: created object store [${instrumentHitStoreName}]`);
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => reject(`Failed to open ${dataDbName}`);
    });
}