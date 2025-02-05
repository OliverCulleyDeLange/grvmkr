import type { CellLocator } from "$lib";

export type NotationGridRowUi = {
    index: number,
    instrumentName: string
    gridCells: GridCellUi[]
};

export type GridCellUi = {
    darken: boolean
    content: string
    locator: CellLocator
}

