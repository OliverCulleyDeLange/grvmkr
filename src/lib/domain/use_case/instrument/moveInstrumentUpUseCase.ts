import { type CellToolsRepositoryI, type FileRepositoryI, type GridRepositoryI, type InstrumentId, type InstrumentRepositoryI } from "$lib";
import { syncInstruments } from "./sync";

export async function moveInstrumentUpUseCase(
    instrumentId: InstrumentId,
    fileStore: FileRepositoryI,
    gridStore: GridRepositoryI,
    instrumentStore: InstrumentRepositoryI,
    cellToolsStore: CellToolsRepositoryI,
) {
    instrumentStore.moveInstrument("up", instrumentId);
    syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore);
}