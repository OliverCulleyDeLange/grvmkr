import type { CellTools, CellToolsRepositoryI, GridRepositoryI, InstrumentRepositoryI } from '$lib';
import type { GridStore } from './grid_store.svelte';

export class CellToolsStore implements CellToolsRepositoryI {
	private defaultCellTools: CellTools = {
		kind: 'empty'
	};

	public cellTools: CellTools = $state(this.defaultCellTools);
	public cellsCopied: boolean = $state(false);

	setCellsCopied() {
		this.cellsCopied = true;
	}

	updateCellTools(gridStore: GridRepositoryI, instrumentStore: InstrumentRepositoryI) {
		const grid = gridStore.getGridOfCurrentlySelectedCell()
		if (!grid) {
			this.cellTools = this.defaultCellTools;
			return
		}
		
		const currentlySelectedCells = gridStore.getCurrentlySelectedCells();
		// We assume that all selected cells have the same options as they're in the same row
		const firstCurrentlySelectedCell = currentlySelectedCells[0];

		if (firstCurrentlySelectedCell) {
			const locator = firstCurrentlySelectedCell;
			const rowInstrument = grid.rows[locator.row]?.instrument;
			const instrument = instrumentStore.getInstrument(rowInstrument?.id)
			const currentCell = grid.rows[locator.row]?.cells[locator.cell];
			const gridCols = grid.gridCols;
			const cellsOccupied = currentCell?.cells_occupied ?? 0;
			const cellsSelected = currentlySelectedCells.length;
			if (instrument) {
				if (cellsSelected > 1) {
					this.cellTools = {
						kind: 'multi',
						gridId: grid.id,
						instrument: instrument,
						hits: [...(instrument?.hitTypes.values() ?? [])],
						cellsCopied: this.cellsCopied
					};
				} else {
					this.cellTools = {
						kind: 'single',
						gridId: grid.id,
						instrument: instrument,
						hits: [...(instrument?.hitTypes.values() ?? [])],
						cellsOccupied,
						isFirstCell: locator.cell == 0,
						isLastCell: gridCols ? locator.cell == gridCols - cellsOccupied : false,
						cellsCopied: this.cellsCopied
					};
				}
			} else {
				console.error("Can't display cell tools - instrument not found");
			}
		} else {
			this.cellTools = this.defaultCellTools;
		}
	}
}
