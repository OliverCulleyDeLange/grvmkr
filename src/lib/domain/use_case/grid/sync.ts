import type { FileRepositoryI, GridRepositoryI } from '$lib';

export async function syncGrids(fileStore: FileRepositoryI, gridStore: GridRepositoryI) {
	await fileStore.setGrids(gridStore.getGrids());
}
