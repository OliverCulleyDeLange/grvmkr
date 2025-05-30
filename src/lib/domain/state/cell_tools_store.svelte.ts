import type { CellTools } from '$lib';
import type { GridStore } from './grid_store.svelte';

export class CellToolsStore {
	private defaultCellTools: CellTools = {
		kind: 'empty'
	};

	public cellTools: CellTools = $state(this.defaultCellTools);
	public cellsCopied: boolean = $state(false);

	setCellsCopied() {
		this.cellsCopied = true;
	}

	updateCellTools(gridStore: GridStore) {
		const currentlySelectedCell = gridStore.currentlySelectedCells[0];
		const grid = currentlySelectedCell
			? gridStore.grids.get(currentlySelectedCell.grid)
			: undefined;

		if (currentlySelectedCell) {
			const locator = currentlySelectedCell;
			const instrument = grid?.rows[locator.row].instrument;
			const currentCell = grid?.rows[locator.row]?.cells[locator.cell];
			const gridCols = grid?.gridCols;
			const cellsOccupied = currentCell?.cells_occupied ?? 0;
			const cellsSelected = gridStore.currentlySelectedCells.length;
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
