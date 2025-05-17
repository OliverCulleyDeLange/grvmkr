import type { CellToolsEvents, GridEvents, ToolbarEvents } from "$lib"
import type { InstrumentEvents } from "./instruments"

export type OnUiEvent = (event: UiEvents) => void

export type UiEvents = GridEvents | InstrumentEvents | ToolbarEvents  | CellToolsEvents
    | Mounted | Copy | Paste

export enum UiEvent {
    Mounted = "Mounted",
    Copy = "Copy",
    Paste = "Paste",
}

export type Mounted = {
    event: UiEvent.Mounted
}
export type Copy = {
    event: UiEvent.Copy
}
export type Paste = {
    event: UiEvent.Paste
}