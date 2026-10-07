// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { GridStore } from '$lib/domain/state/grid_store.svelte';
import type { Grid, InstrumentWithId } from '$lib';

// ── helpers ────────────────────────────────────────────────────────────────

function makeInstrument(id: string, hits: { id: string; key: string }[]): InstrumentWithId {
	return {
		id,
		name: 'Test Instrument',
		gridIndex: 0,
		muted: false,
		soloed: false,
		hitTypes: new SvelteMap(
			hits.map((h) => [h.id, { id: h.id, key: h.key, description: '', audioFileName: '' }])
		)
	};
}

function makeGrid(id: string, instrument: InstrumentWithId, cellCount = 4): Grid {
	return {
		id,
		index: 0,
		config: {
			name: 'Test Grid',
			bpm: 80,
			bars: 1,
			beatsPerBar: cellCount,
			beatDivisions: 1,
			repetitions: 1
		},
		toolsExpanded: false,
		rows: [
			{
				instrument,
				cells: Array.from({ length: cellCount }, () => ({ hits: [], cells_occupied: 1 }))
			}
		],
		msPerBeatDivision: 750,
		gridCols: cellCount
	};
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('GridStore.setCurrentlySelectedCellHitsByKey', () => {
	let store: GridStore;

	beforeEach(() => {
		store = new GridStore(() => {});
	});

	it('sets the matching hit on a single selected cell', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-x', key: 'X' },
			{ id: 'hit-m', key: 'm' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('X');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-x' }
		]);
	});

	it('distinguishes lower-case and upper-case keys', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-X', key: 'X' },
			{ id: 'hit-x', key: 'x' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('x');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-x' }
		]);
	});

	it('sets a different hit when a different key is typed', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-x', key: 'X' },
			{ id: 'hit-m', key: 'm' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('m');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-m' }
		]);
	});

	it('supports multi-character hit keys (e.g. "Xx")', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-X', key: 'X' },
			{ id: 'hit-Xx', key: 'Xx' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('Xx');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-Xx' }
		]);
	});

	it('supports two-character hit keys like "rr"', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-r', key: 'r' },
			{ id: 'hit-rr', key: 'rr' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('rr');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-rr' }
		]);
	});

	it('leaves the cell unchanged when the key matches no hit', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.setCurrentlySelectedCellHitsByKey('Z');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([]);
	});

	it('applies the hit to all selected cells in the same row', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([
			{ grid: 'grid-1', row: 0, cell: 0 },
			{ grid: 'grid-1', row: 0, cell: 1 },
			{ grid: 'grid-1', row: 0, cell: 2 }
		]);

		store.setCurrentlySelectedCellHitsByKey('X');

		for (let i = 0; i < 3; i++) {
			expect(store.getCell({ grid: 'grid-1', row: 0, cell: i })?.hits).toEqual([
				{ instrumentId: 'inst-1', hitId: 'hit-x' }
			]);
		}
		// Cell 3 was not selected – should remain empty
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 3 })?.hits).toEqual([]);
	});

	it('applies per-instrument hit when cells span multiple rows', async () => {
		const inst1 = makeInstrument('inst-1', [{ id: 'hit-1-X', key: 'X' }]);
		const inst2 = makeInstrument('inst-2', [{ id: 'hit-2-X', key: 'X' }]);
		const grid: Grid = {
			id: 'grid-1',
			index: 0,
			config: { name: 'Test', bpm: 80, bars: 1, beatsPerBar: 4, beatDivisions: 1, repetitions: 1 },
			toolsExpanded: false,
			rows: [
				{ instrument: inst1, cells: [{ hits: [], cells_occupied: 1 }] },
				{ instrument: inst2, cells: [{ hits: [], cells_occupied: 1 }] }
			],
			msPerBeatDivision: 750,
			gridCols: 1
		};
		await store.addGrid(grid, false);
		store.setCurrentlySelectedCells([
			{ grid: 'grid-1', row: 0, cell: 0 },
			{ grid: 'grid-1', row: 1, cell: 0 }
		]);

		store.setCurrentlySelectedCellHitsByKey('X');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-1-X' }
		]);
		expect(store.getCell({ grid: 'grid-1', row: 1, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-2', hitId: 'hit-2-X' }
		]);
	});

	it('returns the applied InstrumentHit values', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([
			{ grid: 'grid-1', row: 0, cell: 0 },
			{ grid: 'grid-1', row: 0, cell: 1 }
		]);

		const applied = store.setCurrentlySelectedCellHitsByKey('X');

		expect(applied).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-x' },
			{ instrumentId: 'inst-1', hitId: 'hit-x' }
		]);
	});

	it('returns an empty array when no cells are selected', () => {
		const applied = store.setCurrentlySelectedCellHitsByKey('X');
		expect(applied).toEqual([]);
	});

	it('returns an empty array when key matches no hit in selected cells', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		const applied = store.setCurrentlySelectedCellHitsByKey('Z');
		expect(applied).toEqual([]);
	});

	it('overwrites an existing hit when a new key is typed', async () => {
		const inst = makeInstrument('inst-1', [
			{ id: 'hit-x', key: 'X' },
			{ id: 'hit-m', key: 'm' }
		]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);
		store.setCurrentlySelectedCellHitsByKey('X');

		store.setCurrentlySelectedCellHitsByKey('m');

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-m' }
		]);
	});
});

describe('GridStore.clearCurrentlySelectedCellHits', () => {
	let store: GridStore;

	beforeEach(() => {
		store = new GridStore(() => {});
	});

	it('clears hits from a single selected cell', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);
		store.setCurrentlySelectedCellHitsByKey('X');

		const cleared = store.clearCurrentlySelectedCellHits();

		expect(cleared).toBe(1);
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([]);
	});

	it('clears hits from every selected cell in a multi-cell selection', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([
			{ grid: 'grid-1', row: 0, cell: 0 },
			{ grid: 'grid-1', row: 0, cell: 1 },
			{ grid: 'grid-1', row: 0, cell: 2 }
		]);
		store.setCurrentlySelectedCellHitsByKey('X');

		const cleared = store.clearCurrentlySelectedCellHits();

		expect(cleared).toBe(3);
		for (let i = 0; i < 3; i++) {
			expect(store.getCell({ grid: 'grid-1', row: 0, cell: i })?.hits).toEqual([]);
		}
	});

	it('leaves unselected cells alone', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		// Set hits on cells 0 and 3, then only select cell 0 and clear.
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);
		store.setCurrentlySelectedCellHitsByKey('X');
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 3 }]);
		store.setCurrentlySelectedCellHitsByKey('X');

		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);
		store.clearCurrentlySelectedCellHits();

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([]);
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 3 })?.hits).toEqual([
			{ instrumentId: 'inst-1', hitId: 'hit-x' }
		]);
	});

	it('returns 0 when no cells are selected', () => {
		expect(store.clearCurrentlySelectedCellHits()).toBe(0);
	});

	it('is a no-op on an already empty cell', async () => {
		const inst = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', inst, 4), false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		const cleared = store.clearCurrentlySelectedCellHits();

		expect(cleared).toBe(1);
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([]);
	});
});

describe('GridStore.moveCellSelection', () => {
	it('moves in all four directions and stops at grid boundaries', async () => {
		const store = new GridStore(() => {});
		const first = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		const second = makeInstrument('inst-2', [{ id: 'hit-x2', key: 'X' }]);
		const grid = makeGrid('grid-1', first, 4);
		grid.rows.push({
			instrument: second,
			cells: Array.from({ length: 4 }, () => ({ hits: [], cells_occupied: 1 }))
		});
		await store.addGrid(grid, false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		expect(store.moveCellSelection('left')).toBe(false);
		expect(store.moveCellSelection('up')).toBe(false);
		expect(store.moveCellSelection('right')).toBe(true);
		expect(store.getCurrentlySelectedCells()).toEqual([{ grid: 'grid-1', row: 0, cell: 1 }]);
		expect(store.moveCellSelection('down')).toBe(true);
		expect(store.getCurrentlySelectedCells()).toEqual([{ grid: 'grid-1', row: 1, cell: 1 }]);
		expect(store.moveCellSelection('down')).toBe(false);
	});

	it('skips cells hidden by a merged cell', async () => {
		const store = new GridStore(() => {});
		const instrument = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		const grid = makeGrid('grid-1', instrument, 4);
		grid.rows[0].cells[0].cells_occupied = 2;
		grid.rows[0].cells[1].cells_occupied = 0;
		await store.addGrid(grid, false);
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 0 }]);

		store.moveCellSelection('right');
		expect(store.getCurrentlySelectedCells()).toEqual([{ grid: 'grid-1', row: 0, cell: 2 }]);
		store.moveCellSelection('left');
		expect(store.getCurrentlySelectedCells()).toEqual([{ grid: 'grid-1', row: 0, cell: 0 }]);
	});
});

describe('GridStore editing regressions', () => {
	it('creates independent cells when a grid is expanded', async () => {
		const store = new GridStore(() => {});
		const instrument = makeInstrument('inst-1', [{ id: 'hit-x', key: 'X' }]);
		await store.addGrid(makeGrid('grid-1', instrument, 2), false);

		store.updateBars('grid-1', 2);
		store.updateGridCell(
			{ grid: 'grid-1', row: 0, cell: 2 },
			(cell) => (cell.hits = [{ instrumentId: 'inst-1', hitId: 'hit-x' }]),
			false
		);

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 2 })?.hits).toHaveLength(1);
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 3 })?.hits).toEqual([]);
	});

	it('preserves later clipboard entries during an overlapping paste', async () => {
		const store = new GridStore(() => {});
		const instrument = makeInstrument('inst-1', [
			{ id: 'hit-x', key: 'X' },
			{ id: 'hit-m', key: 'm' }
		]);
		await store.addGrid(makeGrid('grid-1', instrument, 4), false);
		store.updateGridCell(
			{ grid: 'grid-1', row: 0, cell: 0 },
			(cell) => (cell.hits = [{ instrumentId: 'inst-1', hitId: 'hit-x' }]),
			false
		);
		store.updateGridCell(
			{ grid: 'grid-1', row: 0, cell: 1 },
			(cell) => (cell.hits = [{ instrumentId: 'inst-1', hitId: 'hit-m' }]),
			false
		);
		store.setCurrentlySelectedCells([
			{ grid: 'grid-1', row: 0, cell: 0 },
			{ grid: 'grid-1', row: 0, cell: 1 }
		]);
		store.copyCurrentlySelectedCells();
		store.setCurrentlySelectedCells([{ grid: 'grid-1', row: 0, cell: 1 }]);

		store.pasteCells(new Map([[instrument.id, instrument]]));

		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 1 })?.hits[0]?.hitId).toBe('hit-x');
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 2 })?.hits[0]?.hitId).toBe('hit-m');
	});

	it('does not throw when an instrument has no hits', async () => {
		const store = new GridStore(() => {});
		const instrument = makeInstrument('inst-1', []);
		await store.addGrid(makeGrid('grid-1', instrument, 2), false);

		expect(() => store.toggleGridHit({ grid: 'grid-1', row: 0, cell: 0 })).not.toThrow();
		expect(store.getCell({ grid: 'grid-1', row: 0, cell: 0 })?.hits).toEqual([]);
	});
});
