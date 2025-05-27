import type { HitDto, HitDtoId } from '$lib';
import { getDataDb } from './data_db';
import { DATA_DB_NAME, INSTRUMENT_HIT_STORE } from './db_config';

// ChatGPT Generated :)
export class HitTable {
	// ✅ Save or Update a Hit
	async saveHit(hit: HitDto): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(INSTRUMENT_HIT_STORE, 'readwrite');
			const store = tx.objectStore(INSTRUMENT_HIT_STORE);
			const request = store.put(hit);

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to save hit');
		});
	}

	// ✅ Retrieve a Hit by ID
	async getHit(id: HitDtoId): Promise<HitDto | null> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(INSTRUMENT_HIT_STORE, 'readonly');
			const store = tx.objectStore(INSTRUMENT_HIT_STORE);
			const request = store.get(id);

			request.onsuccess = () => resolve(request.result ?? null);
			request.onerror = () => reject('Failed to get hit');
		});
	}

	// ✅ Retrieve All Hits
	async getAllHits(): Promise<HitDto[]> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(INSTRUMENT_HIT_STORE, 'readonly');
			const store = tx.objectStore(INSTRUMENT_HIT_STORE);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject('Failed to get all hits');
		});
	}

	// ✅ Delete a Hit
	async deleteHit(id: HitDtoId): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(INSTRUMENT_HIT_STORE, 'readwrite');
			const store = tx.objectStore(INSTRUMENT_HIT_STORE);
			const request = store.delete(id);

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to delete hit');
		});
	}

	// ✅ Delete All Hits
	async deleteAllHits(): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(INSTRUMENT_HIT_STORE, 'readwrite');
			const store = tx.objectStore(INSTRUMENT_HIT_STORE);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to delete all hits');
		});
	}
}
