import type { CellToolsRepositoryI } from '$lib/domain/interface/CellToolsRepositoryI';
import type { FileRepositoryI } from '$lib/domain/interface/FileRepositoryI';
import type { GridRepositoryI } from '$lib/domain/interface/GridRepositoryI';
import type { InstrumentRepositoryI } from '$lib/domain/interface/InstrumentRepositoryI';

export async function syncInstruments(
	fileStore: FileRepositoryI,
	gridStore: GridRepositoryI,
	instrumentStore: InstrumentRepositoryI,
	cellToolsStore: CellToolsRepositoryI
) {
	const instruments = instrumentStore.getInstruments();
	// Add or remove instrument from grids
	await gridStore.syncInstruments(instruments);
	// Replace instruments in the file store
	await fileStore.setInstruments(instruments);
	// And finally, update the cell tools
	cellToolsStore.updateCellTools(gridStore, instrumentStore);
}
