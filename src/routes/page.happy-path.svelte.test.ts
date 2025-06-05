// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrvMkrPage } from './__testutils__/GrvMkrPage';
import { mockGrvFileFetch } from './__testutils__/mockGrvFetch';

describe('Without auto-closing help', async () => {
    it('Help dialog shown on first visit', async () => {
        const page = new GrvMkrPage();
        await page.render();
        await page.awaitGrids();
        page.expectHelpToBeShown();
        // Reload page and confirm help dialog not shown
        await page.render();
        page.expectHelpToBeGone();
    });

})

// This test covers the main happy path for a new user
/// <reference types="vitest" />
describe('GrvMkr happy path user flow', () => {
    let page: GrvMkrPage;
    let AudioPlayer: any;
    let audioPlayerPlaySpy: any;

    beforeEach(async () => {
        mockGrvFileFetch();
        page = new GrvMkrPage();
        await page.render();
        await page.ensureInitialised()
    });

    // FIXME times tests out when ran before the others
    it.skip('loads the example groove', async () => {
        await page.loadExampleGroove();
    });

    it.skip('triggers audio playback', async () => {
        AudioPlayer = (await import('$lib/domain/audio/audio_player')).AudioPlayer;
        audioPlayerPlaySpy = vi.spyOn(AudioPlayer.prototype, 'play');
        const playBtn = await page.playGroove();
        await waitFor(() => {
            expect(audioPlayerPlaySpy).toHaveBeenCalled();
        });
        await page.stopGroove(playBtn);
    });

    it('allows toggling instrument hits in grid cells', async () => {
        // First row is a surdo, with X or m hits
        const firstGridCell = await waitFor(() => page.clickGridCell(0, 0, 0));
        expect(firstGridCell).toHaveTextContent('X');
        await fireEvent.click(firstGridCell);
        expect(firstGridCell).toHaveTextContent('m');
        await fireEvent.click(firstGridCell);
        expect(firstGridCell).toHaveTextContent('');
        await fireEvent.click(firstGridCell);
        expect(firstGridCell).toHaveTextContent('X');
        // TODO Check this persist after a page reload
    });

    it('merges grid cells', async () => {
        const firstGridId = page.getGridIdByIndex(0);
        await page.clickGridCell(0, 0, 0);
        // await selected state of first rows cell
        await waitFor(() => {
            expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toHaveClass('outline-green-500');
        })
        // Select cells 0 - 2 (3 cells) in the first row of the first grid using shiftKey
        await page.clickGridCell(0, 0, 2, { shiftKey: true });
        // Wait for the merge button to be enabled before proceeding
        await waitFor(() => {
            const mergeBtns = screen.queryAllByRole('button', { name: /merge/i });
            console.log('Merge buttons after selection:', mergeBtns.length, mergeBtns.map(btn => (btn as HTMLButtonElement).disabled));
            const enabledMergeBtn = mergeBtns.find(btn => !(btn as HTMLButtonElement).disabled);
            expect(enabledMergeBtn).toBeTruthy();
        });
        await page.mergeCells();
        expect(screen.getByTestId(`gridcell-${firstGridId}-0-0`)).toBeInTheDocument();
        expect(screen.queryByTestId(`gridcell-${firstGridId}-0-1`)).not.toBeInTheDocument();
        expect(screen.queryByTestId(`gridcell-${firstGridId}-0-2`)).not.toBeInTheDocument();
        expect(screen.getByTestId(`gridcell-${firstGridId}-0-3`)).toBeInTheDocument();
        const mergedCell = screen.getByTestId(`gridcell-${firstGridId}-0-0`);
        expect(mergedCell.className).toMatch(/outline-green-500/);
        // TODO Check this persist after a page reload
    });

    it('adds and moves a grid', async () => {
        // log number of grids
        const initialGridCount = page.getGrids().length
        await page.addGrid();
        // Wait until grid count increments
        await waitFor(() => {
            const grids = page.getGrids();
            expect(grids.length).toBeGreaterThan(initialGridCount);
        });
        // capture order of grid ids
        const gridIds = page.getGrids().map(grid => grid.id);
        await page.openGridTools(1);
        await page.moveGridUp(1);
        // assert grid ids are reversed
        const newGridIds = page.getGrids().map(grid => grid.id);
        expect(newGridIds.length).toBe(2);
        expect(newGridIds[0]).toBe(gridIds[1]);
        expect(newGridIds[1]).toBe(gridIds[0]);

        // TODO Check this persist after a page reload
    });

    it('adds and renames an instrument & adds hits', async () => {
        const instrumentElsBefore = page.getInstrumentContainers();
        await page.addInstrument();
        await waitFor(() => {
            const instrumentElsAfter = page.getInstrumentContainers();
            expect(instrumentElsAfter.length).toBeGreaterThan(instrumentElsBefore.length);
        });
        const instrumentElsAfter = page.getInstrumentContainers();
        const newInstrument = instrumentElsAfter[instrumentElsAfter.length - 1];
        await page.renameInstrument(newInstrument, 'beeps');
        await page.addHitToInstrument(newInstrument);
        await waitFor(() => {
            const hitEls = page.getInstrumentHits(newInstrument);
            expect(hitEls.length).toBe(2);
        });
        const hitEls = page.getInstrumentHits(newInstrument);
        await page.setHitKeyAndDescription(hitEls[0], 'b', 'beep1');
        await page.setHitKeyAndDescription(hitEls[1], 'B', 'beep2');
        // TODO Check this persist after a page reload
    });

    it('uploads a sample to a hit', async () => {
        const instrumentEls = page.getInstrumentContainers();
        const lastInstrument = instrumentEls[instrumentEls.length - 1];
        await page.addHitToInstrument(lastInstrument);
        await waitFor(() => {
            const hitEls = page.getInstrumentHits(lastInstrument);
            expect(hitEls.length).toBe(2);
        });
        await page.uploadSampleToHit(lastInstrument, 1, 'beep.wav');
    });

    it.skip('saves the file and triggers download', async () => {
        await page.saveFileAndAssertDownload();
    });

    it('makes a new file and resets state', async () => {
        await page.clickNewAndAssertReset();
    });

    it.skip('loads previous file from my grooves', async () => {
        await page.openMyGroovesAndLoadExample();
    });
});
