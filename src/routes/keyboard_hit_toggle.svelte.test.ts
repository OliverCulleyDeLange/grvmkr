// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GrvMkrPage } from './__testutils__/GrvMkrPage';
import { mockGrvFileFetch } from './__testutils__/mockGrvFetch';
import { HIT_KEY_WINDOW_MS } from '$lib/util/keyboard_shortcuts';

/**
 * Integration tests for the keyboard hit-toggle feature.
 *
 * Selecting one or more grid cells and then typing a hit key (e.g. 'X', 'm', 'Xx')
 * should set that hit on every selected cell after the composition time window elapses.
 */
describe('Keyboard hit toggle', () => {
	let page: GrvMkrPage;

	beforeEach(async () => {
		mockGrvFileFetch();
		page = new GrvMkrPage();
		await page.render();
		await page.ensureInitialised();
		// Switch to fake timers AFTER initialisation so async IO is unaffected.
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	function keydown(key: string, options: Partial<KeyboardEventInit> = {}) {
		window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
	}

	it('typing "m" on a selected cell sets the muted hit', async () => {
		// First row is Surdo L (hits: X, m). Click to select cell 0-0.
		const cell = await page.clickGridCell(0, 0, 0);
		const firstGridId = page.getGridIdByIndex(0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});

		// Cell starts with 'X' after first click
		expect(cell).toHaveTextContent('X');

		// Type 'm' and advance past the composition window
		keydown('m');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveTextContent('m');
		});
	});

	it('typing "X" on a cell that already has "m" changes it to "X"', async () => {
		const firstGridId = page.getGridIdByIndex(0);
		// Click twice to reach 'm'
		await page.clickGridCell(0, 0, 0);
		await page.clickGridCell(0, 0, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveTextContent('m');
		});

		// Now type 'X'
		keydown('X');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveTextContent('X');
		});
	});

	it('typing a key that does not match any hit leaves the cell unchanged', async () => {
		await page.clickGridCell(0, 0, 0);
		const firstGridId = page.getGridIdByIndex(0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});
		const before = screen.getByTestId(`gridcell-${firstGridId}-0-0`).textContent;

		keydown('Z'); // no hit with key 'Z' on Surdo L
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`).textContent).toBe(before);
		});
	});

	it('applies the hit to every cell in a multi-cell selection', async () => {
		const firstGridId = page.getGridIdByIndex(0);

		// Click cell 0 to start selection
		await page.clickGridCell(0, 0, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});
		// Shift-click cell 2 to extend selection
		await page.clickGridCell(0, 0, 2, { shiftKey: true });

		// Type 'm'
		keydown('m');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			for (let i = 0; i <= 2; i++) {
				expect(screen.getByTestId(`gridcell-${firstGridId}-0-${i}`)).toHaveTextContent('m');
			}
		});
	});

	it('composing "Xx" dispatches a single TypeHitKey with "Xx"', async () => {
		// This test verifies that the time window composition works end-to-end.
		// The Repinique instrument has an 'Xx' hit key.
		// Find the row index for Repinique (row 3 in default instruments: Surdo L=0, Surdo M=1, Surdo H=2, Repinique=3)
		const firstGridId = page.getGridIdByIndex(0);

		// Select a Repinique cell (row 3 = index 3)
		await page.clickGridCell(0, 3, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-3-0`)).toHaveClass('outline-green-500');
		});

		// Type 'X' then 'x' within the window – should compose to 'Xx'
		keydown('X');
		keydown('x');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-3-0`)).toHaveTextContent('Xx');
		});
	});

	it('pressing Delete clears the selected cell', async () => {
		const firstGridId = page.getGridIdByIndex(0);
		await page.clickGridCell(0, 0, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});
		// Type 'X' to give the cell a known non-empty state.
		keydown('X');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveTextContent('X');
		});

		keydown('Delete');

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`).textContent?.trim()).toBe('');
		});
	});

	it('pressing Backspace clears every cell in a multi-cell selection', async () => {
		const firstGridId = page.getGridIdByIndex(0);
		await page.clickGridCell(0, 0, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});
		await page.clickGridCell(0, 0, 2, { shiftKey: true });
		keydown('X');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		await waitFor(() => {
			for (let i = 0; i <= 2; i++) {
				expect(screen.getByTestId(`gridcell-${firstGridId}-0-${i}`)).toHaveTextContent('X');
			}
		});

		keydown('Backspace');

		await waitFor(() => {
			for (let i = 0; i <= 2; i++) {
				expect(screen.getByTestId(`gridcell-${firstGridId}-0-${i}`).textContent?.trim()).toBe('');
			}
		});
	});

	it('does not set hits when typing in an input field', async () => {
		const firstGridId = page.getGridIdByIndex(0);
		await page.clickGridCell(0, 0, 0);
		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
		});
		const before = screen.getByTestId(`gridcell-${firstGridId}-0-0`).textContent;

		// Find any input field on the page and dispatch the key from it
		const inputs = document.querySelectorAll('input');
		expect(inputs.length).toBeGreaterThan(0);
		const input = inputs[0];
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);

		await waitFor(() => {
			expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`).textContent).toBe(before);
		});
	});
});
