import type { InstrumentDto, InstrumentDtoId } from "$lib";
import { getDataDb } from "./data_db";
import { INSTRUMENT_STORE } from "./db_config";

// Chat GPT Generated. lol. 
export class InstrumentTable {

    // ✅ Save or Update an Instrument
    async saveInstrument(instrument: InstrumentDto): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(INSTRUMENT_STORE, "readwrite");
            const store = tx.objectStore(INSTRUMENT_STORE);
            const request = store.put(instrument);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to save instrument");
        });
    }

    // ✅ Retrieve an Instrument by ID
    async getInstrument(id: InstrumentDtoId): Promise<InstrumentDto | null> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(INSTRUMENT_STORE, "readonly");
            const store = tx.objectStore(INSTRUMENT_STORE);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject("Failed to get instrument");
        });
    }

    // ✅ Retrieve All Instruments
    async getAllInstruments(): Promise<InstrumentDto[]> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(INSTRUMENT_STORE, "readonly");
            const store = tx.objectStore(INSTRUMENT_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to get all instruments");
        });
    }

    // ✅ Delete an Instrument
    async deleteInstrument(id: InstrumentDtoId): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(INSTRUMENT_STORE, "readwrite");
            const store = tx.objectStore(INSTRUMENT_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete instrument");
        });
    }

    // ✅ Delete All Instruments
    async deleteAllInstruments(): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(INSTRUMENT_STORE, "readwrite");
            const store = tx.objectStore(INSTRUMENT_STORE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete all instruments");
        });
    }
}