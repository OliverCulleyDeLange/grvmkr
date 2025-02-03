import type { CellLocator } from "./types";

export type NotationGridRowUi = {
    instrumentName: string
    gridCells: GridCellUi[]
};

export type GridCellUi = {
    darken: boolean
    content: string
    locator: CellLocator
}