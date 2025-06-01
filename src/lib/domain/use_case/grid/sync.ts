import type { FileRepositoryI, GridRepositoryI } from "$lib";

export async function syncGrids(
    fileStore: FileRepositoryI,
    gridStore: GridRepositoryI,
) {
    fileStore.setGrids(gridStore.getGrids())
}