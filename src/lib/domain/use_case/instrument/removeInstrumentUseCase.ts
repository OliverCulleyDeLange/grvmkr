import type {
	CellToolsRepositoryI,
	FileRepositoryI,
	GridRepositoryI,
	InstrumentId,
	InstrumentRepositoryI
} from '$lib';
import { syncInstruments } from './sync';

export async function removeInstrumentUseCase(
	instrumentId: InstrumentId,
	fileStore: FileRepositoryI,
	gridStore: GridRepositoryI,
	instrumentStore: InstrumentRepositoryI,
	cellToolsStore: CellToolsRepositoryI
) {
	await instrumentStore.removeInstrument(instrumentId);
	// After removing from the instrument store and db,
	// Ensure instrument changes are synced to grid, file and cell tools
	syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore);
}
