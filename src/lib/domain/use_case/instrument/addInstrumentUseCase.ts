import type { CellToolsRepositoryI, FileRepositoryI, GridRepositoryI, InstrumentId, InstrumentRepositoryI } from "$lib";
import { syncInstruments } from "./sync";

export async function addInstrumentUseCase(
    fileStore: FileRepositoryI,
    gridStore: GridRepositoryI,
    instrumentStore: InstrumentRepositoryI,
    cellToolsStore: CellToolsRepositoryI,
) {
    instrumentStore.addDefaultInstrument();
    // Ensure instrument changes are synced to grid, file and cell tools
    syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore)
}