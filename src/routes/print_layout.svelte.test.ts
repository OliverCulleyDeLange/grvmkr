// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { GrvMkrPage } from './__testutils__/GrvMkrPage';
import { mockGrvFileFetch } from './__testutils__/mockGrvFetch';

describe('print layout', () => {
	let page: GrvMkrPage;

	beforeEach(async () => {
		mockGrvFileFetch();
		page = new GrvMkrPage();
		await page.render();
		await page.ensureInitialised();
	});

	it('synchronously replaces the web UI with every grid before printing', async () => {
		for (let gridCount = 2; gridCount <= 3; gridCount += 1) {
			await page.addGrid();
			await waitFor(() => expect(page.getGrids()).toHaveLength(gridCount));
		}

		window.dispatchEvent(new Event('beforeprint'));

		expect(screen.queryByRole('button', { name: /print \/ save pdf/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: /instruments/i })).not.toBeInTheDocument();
		expect(page.getGrids()).toHaveLength(3);

		window.dispatchEvent(new Event('afterprint'));

		expect(screen.getByRole('button', { name: /print \/ save pdf/i })).toBeInTheDocument();
	});
});
