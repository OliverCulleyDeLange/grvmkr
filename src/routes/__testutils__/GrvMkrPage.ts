import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Page from '../+page.svelte';
import { expect, vi } from 'vitest';

export class GrvMkrPage {
    expectHelpToBeShown() {
        expect(screen.getByText(/Welcome to GrvMkr/i)).toBeInTheDocument()
    }
    expectHelpToBeGone() {
        expect(screen.getByText(/Welcome to GrvMkr/i)).toBeInTheDocument()
    }
    async render() {
        render(Page);
    }

    async loadExampleGroove() {
        // Try to find the button; if not present, open help popover
        let loadExampleBtn = screen.queryByRole('button', { name: /load the example groove/i });
        if (!loadExampleBtn) {
            // Try to find the help button (usually labeled with '?')
            const helpBtn =
                screen.queryByRole('button', { name: /\?/i }) || screen.queryByLabelText(/help/i);
            if (helpBtn) {
                await fireEvent.click(helpBtn);
                // Wait for the help dialog to appear
                await waitFor(() => expect(screen.getByText(/Welcome to GrvMkr/i)).toBeInTheDocument());
                // Now the load example button should be present
                loadExampleBtn = await waitFor(() =>
                    screen.getByRole('button', { name: /load the example groove/i })
                );
            } else {
                throw new Error('Help button not found, cannot reveal Load the example groove button');
            }
        }
        await fireEvent.click(loadExampleBtn!);
        await waitFor(() => expect(screen.queryByText(/Welcome to GrvMkr/i)).not.toBeInTheDocument());
        // wait for there to be 8 grids
        await waitFor(() => {
            expect(this.getGrids().length).toBeGreaterThanOrEqual(8);
        });
    }

    async playGroove() {
        const playBtn = screen.getByRole('button', { name: /Play File/i });
        await fireEvent.click(playBtn);
        return playBtn;
    }

    async stopGroove(playBtn: HTMLElement) {
        await fireEvent.click(playBtn);
    }

    async clickGridCell(
        gridIndexOrId: number | string,
        row: number,
        col: number,
        options?: { shiftKey?: boolean }
    ) {
        let gridId: string;
        if (typeof gridIndexOrId === 'number') {
            gridId = this.getGridIdByIndex(gridIndexOrId);
        } else {
            gridId = gridIndexOrId;
        }
        const cell = await waitFor(() => screen.getByTestId(`gridcell-${gridId}-${row}-${col}`));
        await fireEvent.click(cell, { shiftKey: options?.shiftKey });
        return cell;
    }

    async shiftClickGridCell(gridIndexOrId: number | string, row: number, col: number) {
        let gridId: string;
        if (typeof gridIndexOrId === 'number') {
            gridId = this.getGridIdByIndex(gridIndexOrId);
        } else {
            gridId = gridIndexOrId;
        }
        const cell = await waitFor(() => screen.getByTestId(`gridcell-${gridId}-${row}-${col}`));
        await fireEvent.click(cell, { shiftKey: true });
        return cell;
    }

    async pointerDownGridCell(
        gridIndexOrId: number | string,
        row: number,
        col: number,
        options?: { shiftKey?: boolean }
    ) {
        let gridId: string;
        if (typeof gridIndexOrId === 'number') {
            gridId = this.getGridIdByIndex(gridIndexOrId);
        } else {
            gridId = gridIndexOrId;
        }
        const cell = await waitFor(() => screen.getByTestId(`gridcell-${gridId}-${row}-${col}`));
        await fireEvent.pointerDown(cell, { shiftKey: options?.shiftKey });
        await fireEvent.pointerUp(cell, { shiftKey: options?.shiftKey });
        return cell;
    }

    async addGrid() {
        const addGridBtn = screen.getByRole('button', { name: /add grid/i });
        await fireEvent.click(addGridBtn);
    }

    async openGridTools(gridIdx: number) {
        const gridTools = this.getGridTools();
        const grid = gridTools[gridIdx];
        // Select the button with text 'Tools' within the grid-tools container
        const toolsBtn = Array.from(grid.querySelectorAll('button')).find(
            (btn) => btn.textContent?.trim() === 'Tools'
        ) as HTMLElement;
        expect(toolsBtn).toBeTruthy();
        await fireEvent.click(toolsBtn);
    }

    async moveGridUp(gridIdx: number) {
        // Find the grid-tools container for the given grid index
        const gridTools = this.getGridTools();
        const grid = gridTools[gridIdx];
        // Find the Move Up button within this grid
        const moveUpBtn = Array.from(grid.querySelectorAll('button')).find((btn) =>
            btn.textContent?.toLowerCase().includes('move up')
        ) as HTMLElement;
        expect(moveUpBtn).toBeTruthy();
        await fireEvent.click(moveUpBtn);
    }

    getInstrumentContainers() {
        return screen.getAllByTestId(/^instrument-container/);
    }

    async addInstrument() {
        const addInstrumentBtn = screen.getByRole('button', { name: /add instrument/i });
        await fireEvent.click(addInstrumentBtn);
    }

    async renameInstrument(instrumentEl: HTMLElement, name: string) {
        const nameInput = instrumentEl.querySelector('input[type="text"]') as HTMLInputElement;
        expect(nameInput).toBeTruthy();
        await fireEvent.input(nameInput, { target: { value: name } });
        expect(nameInput.value).toBe(name);
    }

    async addHitToInstrument(instrumentEl: HTMLElement) {
        console.log('Adding hit to instrument:', instrumentEl);
        // Match button with partial text (case-insensitive, allows for e.g. 'Add Hit', 'Add New Hit', etc.)
        const addHitBtn = Array.from(instrumentEl.querySelectorAll('button')).find((btn: Element) =>
            btn.textContent?.toLowerCase().includes('add hit')
        ) as HTMLElement;
        expect(addHitBtn).toBeTruthy();
        await fireEvent.click(addHitBtn);
    }

    getInstrumentHits(instrumentEl: HTMLElement): HTMLElement[] {
        return Array.from(instrumentEl.querySelectorAll('[data-testid^="instrument-hit-"]')).map(
            (el) => el as HTMLElement
        );
    }

    async setHitKeyAndDescription(hitEl: HTMLElement, key: string, desc: string) {
        const keyInput = hitEl.querySelector('input[type="text"]') as HTMLInputElement;
        expect(keyInput).toBeTruthy();
        await fireEvent.input(keyInput, { target: { value: key } });
        expect(keyInput.value).toBe(key);
        const descInput = hitEl.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
        expect(descInput).toBeTruthy();
        await fireEvent.input(descInput, { target: { value: desc } });
        expect(descInput.value).toBe(desc);
    }

    async uploadSampleToHit(instrumentEl: HTMLElement, hitIndex: number, fileName: string) {
        const hits = this.getInstrumentHits(instrumentEl);
        const hit = hits[hitIndex];
        const uploadBtn = Array.from(hit.querySelectorAll('button')).find((btn: Element) => {
            console.log("ABC", btn.textContent);
            return btn.textContent?.toLowerCase().includes('upload sample')
        }
        ) as HTMLButtonElement;
        expect(uploadBtn).toBeTruthy();
        const fileInput = instrumentEl.querySelector(
            `#hidden-file-input-${hit.getAttribute('data-testid')?.replace('instrument-hit-', '')}`
        ) as HTMLInputElement;
        expect(fileInput).toBeTruthy();
        const testFile = new File(['dummy content'], fileName, { type: 'audio/wav' });
        await fireEvent.click(uploadBtn);
        await fireEvent.change(fileInput, { target: { files: [testFile] } });
        await waitFor(() => {
            expect(uploadBtn.textContent).toMatch(new RegExp(fileName, 'i'));
        });
    }

    async saveFileAndAssertDownload() {
        const createObjectURLSpy = vi
            .spyOn(URL, 'createObjectURL')
            .mockImplementation(() => 'blob:mock');
        let downloadHref = '';
        let downloadName = '';
        const anchor = document.createElement('a');
        vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
            if (tag === 'a') return anchor;
            // @ts-ignore
            return document.createElement.wrappedMethod(tag);
        });
        vi.spyOn(anchor, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            downloadHref = this.href;
            downloadName = this.download;
        });
        const saveBtn = screen.getByRole('button', { name: /save to file/i });
        await fireEvent.click(saveBtn);
        expect(downloadHref).toMatch(/^blob:/);
        expect(downloadName).toMatch(/\.grv$/i);
    }

    async clickNewAndAssertReset() {
        const newBtn = screen.getByRole('button', { name: /new/i });
        await fireEvent.click(newBtn);
        const gridsAfterNew = this.getGrids();
        expect(gridsAfterNew.length).toBe(1);
        const allCells = screen.getAllByTestId(/gridcell-/);
        for (const cell of allCells) {
            expect(cell).toHaveTextContent('');
        }
    }

    async openMyGroovesAndLoadExample() {
        const myGroovesBtn = screen.getByRole('button', { name: /my grooves/i });
        await fireEvent.click(myGroovesBtn);
        const exampleGrooveBtn = await waitFor(() =>
            screen.getByRole('button', { name: /example groove/i })
        );
        expect(exampleGrooveBtn).toBeInTheDocument();
        await fireEvent.click(exampleGrooveBtn);
        const gridsAfterLoad = await waitFor(() => this.getGrids());
        expect(gridsAfterLoad.length).toBeGreaterThan(1);
        const firstGridCells = gridsAfterLoad[0].querySelectorAll('[data-testid^="gridcell-"]');
        const hasNonEmptyCell = Array.from(firstGridCells).some(
            (cell) => cell.textContent && cell.textContent.trim() !== ''
        );
        expect(hasNonEmptyCell).toBe(true);
    }

    /**
     * Wait for the initial grid(s) to appear and close the help screen if open.
     */
    async ensureInitialised(autoCloseWelcome: boolean = true) {
        // If the help dialog is open, close it
        const helpDialog = screen.queryByText(/Welcome to GrvMkr/i);
        if (helpDialog && autoCloseWelcome) {
            // Try to find a close button by aria-label 'Close'
            const closeBtn = screen.queryByLabelText('Close');
            if (closeBtn) {
                await fireEvent.click(closeBtn);
                await waitFor(() =>
                    expect(screen.queryByText(/Welcome to GrvMkr/i)).not.toBeInTheDocument()
                );
            }
        }
        // Wait for at least one grid to be present
        await this.awaitGrids();
    }

    async awaitGrids() {
        await waitFor(() => {
            expect(this.getGrids().length).toBeGreaterThan(0);
        });
    }

    getGridIdByIndex(gridIndex: number): string {
        const grid = this.getGrids()[gridIndex];
        const gridIdMatch = grid.getAttribute('data-testid')?.match(/^gridsection-(.+)-\d+-\d+$/);
        return gridIdMatch ? gridIdMatch[1] : '';
    }

    getEnabledMergeButton() {
        const mergeBtns = screen.getAllByRole('button', { name: /merge/i });
        return mergeBtns.find((btn) => !(btn as HTMLButtonElement).disabled) as
            | HTMLButtonElement
            | undefined;
    }

    async mergeCells() {
        // Wait for the merge button to be enabled and present
        await waitFor(() => {
            const mergeBtns = screen.getAllByRole('button', { name: /merge/i });
            const enabledMergeBtn = mergeBtns.find((btn) => !(btn as HTMLButtonElement).disabled);
            expect(enabledMergeBtn).toBeTruthy();
        });
        const enabledMergeBtn = this.getEnabledMergeButton();
        await fireEvent.click(enabledMergeBtn!);
    }

    async unMergeCells() {
        const unmergeBtns = screen.getAllByRole('button', { name: /unmerge/i });
        const enabledUnmergeBtn = unmergeBtns.find((btn) => !(btn as HTMLButtonElement).disabled) as
            | HTMLButtonElement
            | undefined;
        expect(enabledUnmergeBtn).toBeTruthy();
        await fireEvent.click(enabledUnmergeBtn!);
    }

    getGrids() {
        return screen.queryAllByTestId(/^gridsection-/);
    }
    getGridTools() {
        return screen.queryAllByTestId(/^gridtools-/);
    }
}
