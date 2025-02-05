import type { HitDto, HitDtoId } from "$lib";
import { getDataDb } from "./data_db";
import { dataDbName, instrumentHitStoreName } from "./db_config";

// ChatGPT Generated :)
export class HitTable {
    private db: IDBDatabase | null = null;

    private getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) resolve(this.db);
            else getDataDb().then((db) => { 
                this.db = db
                resolve(this.db!)
             }).catch(reject);
        });
    }

    // ✅ Save or Update a Hit
    async saveHit(hit: HitDto & { id: HitDtoId }): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentHitStoreName, "readwrite");
            const store = tx.objectStore(instrumentHitStoreName);
            const request = store.put(hit);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to save hit");
        });
    }

    // ✅ Retrieve a Hit by ID
    async getHit(id: HitDtoId): Promise<HitDto | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentHitStoreName, "readonly");
            const store = tx.objectStore(instrumentHitStoreName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject("Failed to get hit");
        });
    }

    // ✅ Retrieve All Hits
    async getAllHits(): Promise<HitDto[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentHitStoreName, "readonly");
            const store = tx.objectStore(instrumentHitStoreName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to get all hits");
        });
    }

    // ✅ Delete a Hit
    async deleteHit(id: HitDtoId): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentHitStoreName, "readwrite");
            const store = tx.objectStore(instrumentHitStoreName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete hit");
        });
    }

    // ✅ Delete All Hits
    async deleteAllHits(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentHitStoreName, "readwrite");
            const store = tx.objectStore(instrumentHitStoreName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete all hits");
        });
    }
}
