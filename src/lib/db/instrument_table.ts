import type { InstrumentDto, InstrumentDtoId } from "$lib";
import { getDataDb } from "./data_db";
import { instrumentStoreName } from "./db_config";

// Chat GPT Generated. lol. 
export class InstrumentTable {
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

    // ✅ Save or Update an Instrument
    async saveInstrument(instrument: InstrumentDto): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readwrite");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.put(instrument);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to save instrument");
        });
    }

    // ✅ Retrieve an Instrument by ID
    async getInstrument(id: InstrumentDtoId): Promise<InstrumentDto | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readonly");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject("Failed to get instrument");
        });
    }

    // ✅ Retrieve All Instruments
    async getAllInstruments(): Promise<InstrumentDto[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readonly");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to get all instruments");
        });
    }

    // ✅ Delete an Instrument
    async deleteInstrument(id: InstrumentDtoId): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readwrite");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete instrument");
        });
    }

    // ✅ Delete All Instruments
    async deleteAllInstruments(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readwrite");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete all instruments");
        });
    }
}