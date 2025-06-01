import { type CellToolsRepositoryI, type FileRepositoryI, type GridRepositoryI, type InstrumentId, type InstrumentRepositoryI } from "$lib";
import { syncInstruments } from "./sync";

export async function moveInstrumentDownUseCase(
    instrumentId: InstrumentId,
    fileStore: FileRepositoryI,
    gridStore: GridRepositoryI,
    instrumentStore: InstrumentRepositoryI,
    cellToolsStore: CellToolsRepositoryI,
) {
    instrumentStore.moveInstrument("down", instrumentId);
    syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore);
}