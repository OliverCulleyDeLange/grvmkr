import type { GridDto, GridId } from '$lib';
import { getDataDb } from './data_db';
import { GRID_STORE } from './db_config';

export class GridTable {
	/** ✅ Save or update a GridDto */
	async saveGrid(grid: GridDto): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(GRID_STORE, 'readwrite');
			const store = tx.objectStore(GRID_STORE);
			const request = store.put(grid);

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to save grid');
		});
	}

	/** ✅ Retrieve a GridDto by its id */
	async getGrid(id: string): Promise<GridDto | null> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(GRID_STORE, 'readonly');
			const store = tx.objectStore(GRID_STORE);
			const request = store.get(id);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject('Failed to get grid');
		});
	}

	/** ✅ Retrieve GridDto's by their ids */
	async getGrids(ids: GridId[]): Promise<(GridDto | null)[]> {
		const db = await getDataDb();
		const tx = db.transaction(GRID_STORE, 'readonly');
		const store = tx.objectStore(GRID_STORE);

		const promises = ids.map((id) => {
			return new Promise<GridDto | null>((resolve, reject) => {
				const request = store.get(id);
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(`Failed to get grid with id ${id}`);
			});
		});

		return await Promise.all(promises);
	}

	/** ✅ Retrieve all GridDtos */
	async getAllGrids(): Promise<GridDto[]> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(GRID_STORE, 'readonly');
			const store = tx.objectStore(GRID_STORE);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject('Failed to get all grids');
		});
	}

	/** ✅ Delete a GridDto by its id */
	async deleteGrid(id: string): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(GRID_STORE, 'readwrite');
			const store = tx.objectStore(GRID_STORE);
			const request = store.delete(id);

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to delete grid');
		});
	}

	/** ✅ Delete all grids */
	async deleteAllGrids(): Promise<void> {
		const db = await getDataDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(GRID_STORE, 'readwrite');
			const store = tx.objectStore(GRID_STORE);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Failed to delete all grids');
		});
	}
}
