import type { CellToolsEvents, ContextMenuEvents, GridEvents, ToolbarEvents } from "$lib"
import type { InstrumentEvents } from "./instruments"

export type OnUiEvent = (event: UiEvents) => void

export type UiEvents = GridEvents | InstrumentEvents | ToolbarEvents | ContextMenuEvents | CellToolsEvents
    | Mounted 

export enum UiEvent {
    Mounted = "Mounted",
}

export type Mounted = {
    event: UiEvent.Mounted
}