import type { CellLocator } from "$lib";

export type OnTapGridCell = (locator: CellLocator) => void;
export type OnRemoveGrid = () => void;