import type { InstrumentId, InstrumentWithId, HitId, HitTypeWithId } from "$lib";
import { dataDbName, instrumentStoreName, instrumentHitStoreName } from "./db_config";

// Chat GPT Generated. lol. 
export class InstrumentDb {
    private db: IDBDatabase | null = null;

    constructor() {
        this.init();
    }

    private init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dataDbName, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(instrumentStoreName)) {
                    db.createObjectStore(instrumentStoreName, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(instrumentHitStoreName)) {
                    db.createObjectStore(instrumentHitStoreName, { keyPath: "id" });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = () => reject("Failed to open IndexedDB");
        });
    }

    private getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) resolve(this.db);
            else this.init().then(() => resolve(this.db!)).catch(reject);
        });
    }

    // ✅ Save an Instrument and Store HitTypes Separately
    async saveInstrument(instrument: InstrumentWithId): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([instrumentStoreName, instrumentHitStoreName], "readwrite");
            const instrumentStore = tx.objectStore(instrumentStoreName);
            const hitTypeStore = tx.objectStore(instrumentHitStoreName);

            // Save instrument without hitTypes
            const instrumentData = { ...instrument, hitTypes: Array.from(instrument.hitTypes.keys()) };
            instrumentStore.put(instrumentData);

            // Save each hitType separately
            instrument.hitTypes.forEach((hitType, hitId) => {
                hitTypeStore.put({ ...hitType, id: hitId });
            });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject("Failed to save instrument and hit types");
        });
    }

    // ✅ Retrieve an Instrument with Joined HitTypes
    async getInstrument(id: InstrumentId): Promise<InstrumentWithId | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([instrumentStoreName, instrumentHitStoreName], "readonly");
            const instrumentStore = tx.objectStore(instrumentStoreName);
            const hitTypeStore = tx.objectStore(instrumentHitStoreName);

            const request = instrumentStore.get(id);
            request.onsuccess = async () => {
                const instrument = request.result;
                if (!instrument) return resolve(null);

                // Fetch hitTypes for this instrument
                const hitTypes = new Map<HitId, HitTypeWithId>();
                await Promise.all(
                    instrument.hitTypes.map((hitId: HitId) =>
                        new Promise<void>((res) => {
                            const hitRequest = hitTypeStore.get(hitId);
                            hitRequest.onsuccess = () => {
                                if (hitRequest.result) {
                                    hitTypes.set(hitId, hitRequest.result);
                                }
                                res();
                            };
                        })
                    )
                );

                resolve({ ...instrument, hitTypes });
            };

            request.onerror = () => reject("Failed to get instrument");
        });
    }

    // ✅ Get All Instruments with HitTypes Joined
    async getAllInstruments(): Promise<InstrumentWithId[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([instrumentStoreName, instrumentHitStoreName], "readonly");
            const instrumentStore = tx.objectStore(instrumentStoreName);
            const hitTypeStore = tx.objectStore(instrumentHitStoreName);

            const request = instrumentStore.getAll();
            request.onsuccess = async () => {
                const instruments = request.result as InstrumentWithId[];
                const instrumentMap = new Map<InstrumentId, InstrumentWithId>();

                // Fetch and attach hitTypes
                await Promise.all(
                    instruments.map((instrument) =>
                        new Promise<void>((res) => {
                            const hitTypes = new Map<HitId, HitTypeWithId>();
                            let remaining = instrument.hitTypes.size;

                            if (remaining === 0) {
                                instrumentMap.set(instrument.id, { ...instrument, hitTypes });
                                return res();
                            }

                            instrument.hitTypes.forEach((hit: HitTypeWithId) => {
                                const hitRequest = hitTypeStore.get(hit.id);
                                hitRequest.onsuccess = () => {
                                    if (hitRequest.result) hitTypes.set(hit.id, hitRequest.result);
                                    remaining--;
                                    if (remaining === 0) {
                                        instrumentMap.set(instrument.id, { ...instrument, hitTypes });
                                        res();
                                    }
                                };
                            });
                        })
                    )
                );

                resolve(Array.from(instrumentMap.values()));
            };

            request.onerror = () => reject("Failed to get all instruments");
        });
    }

    // ✅ Delete an Instrument and its HitTypes
    async deleteInstrument(id: InstrumentId): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([instrumentStoreName, instrumentHitStoreName], "readwrite");
            const instrumentStore = tx.objectStore(instrumentStoreName);
            const hitTypeStore = tx.objectStore(instrumentHitStoreName);

            const request = instrumentStore.get(id);
            request.onsuccess = () => {
                const instrument = request.result;
                if (!instrument) return resolve();

                // Delete associated hitTypes
                instrument.hitTypes.forEach((hitId: HitId) => {
                    hitTypeStore.delete(hitId);
                });

                // Delete the instrument
                instrumentStore.delete(id);

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject("Failed to delete instrument and hit types");
            };

            request.onerror = () => reject("Failed to fetch instrument before deletion");
        });
    }

    // ✅ Delete all Instruments and their associated HitTypes
    async deleteAllInstruments(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([instrumentStoreName, instrumentHitStoreName], "readwrite");
            const instrumentStore = tx.objectStore(instrumentStoreName);
            const hitTypeStore = tx.objectStore(instrumentHitStoreName);

            // Clear both stores
            instrumentStore.clear();
            hitTypeStore.clear();

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject("Failed to delete all instruments and hit types");
        });
    }


    // ✅ Check if an Instrument Exists
    async instrumentExists(id: InstrumentId): Promise<boolean> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(instrumentStoreName, "readonly");
            const store = tx.objectStore(instrumentStoreName);
            const request = store.count(id);

            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => reject("Failed to check existence");
        });
    }
}
