import { type CellTools, type CellToolsRepositoryI, type GridRepositoryI, type InstrumentRepositoryI } from '$lib';

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
		const grid = gridStore.getGridOfCurrentlySelectedCell();
		if (!grid) {
			this.cellTools = this.defaultCellTools;
			return;
		}

		const currentlySelectedCells = gridStore.getCurrentlySelectedCells();
		const firstCurrentlySelectedCell = currentlySelectedCells[0];

		if (firstCurrentlySelectedCell) {
			const locator = firstCurrentlySelectedCell;
			const rowInstrument = grid.rows[locator.row]?.instrument;
			const instrument = instrumentStore.getInstrument(rowInstrument?.id);
			const currentCell = grid.rows[locator.row]?.cells[locator.cell];
			const gridCols = grid.gridCols;
			const cellsOccupied = currentCell?.cells_occupied ?? 0;
			const cellsSelected = currentlySelectedCells.length;
			if (instrument) {
				const newCellTools = this.buildCellTools({
					kind: cellsSelected > 1 ? 'multi' : 'single',
					gridId: grid.id,
					instrument,
					hits: [...(instrument?.hitTypes.values() ?? [])],
					cellsOccupied,
					isFirstCell: locator.cell == 0,
					isLastCell: gridCols ? locator.cell == gridCols - cellsOccupied : false,
					cellsCopied: this.cellsCopied,
					cellsSelected
				});
				if (JSON.stringify(this.cellTools) !== JSON.stringify(newCellTools)) {
					this.cellTools = newCellTools;
				}
			} else {
				console.error("Can't display cell tools - instrument not found");
			}
		} else {
			this.cellTools = this.defaultCellTools;
		}
	}

	private buildCellTools({ kind, gridId, instrument, hits, cellsOccupied, isFirstCell, isLastCell, cellsCopied, cellsSelected }: any): CellTools {
		if (kind === 'multi') {
			return {
				kind: 'multi',
				gridId,
				instrument,
				hits,
				cellsCopied
			};
		} else {
			return {
				kind: 'single',
				gridId,
				instrument,
				hits,
				cellsOccupied,
				isFirstCell,
				isLastCell,
				cellsCopied
			};
		}
	}
}
