import type {
	CellToolsRepositoryI,
	FileRepositoryI,
	GridRepositoryI,
	InstrumentRepositoryI
} from '$lib';
import { syncInstruments } from './sync';

export async function addInstrumentUseCase(
	fileStore: FileRepositoryI,
	gridStore: GridRepositoryI,
	instrumentStore: InstrumentRepositoryI,
	cellToolsStore: CellToolsRepositoryI
) {
	await instrumentStore.addDefaultInstrument();
	// Ensure instrument changes are synced to grid, file and cell tools
	await syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore);
}
