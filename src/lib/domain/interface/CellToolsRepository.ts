import type { GridRepositoryI } from "./GridRepositoryI";

export interface CellToolsRepositoryI {
    updateCellTools(gridStore: GridRepositoryI): void;
}