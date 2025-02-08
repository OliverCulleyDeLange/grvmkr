import type { ContextMenuEvents, GridEvents, ToolbarEvents } from "$lib"
import type { InstrumentEvents } from "./instruments"

export type OnUiEvent = (event: UiEvents) => void

export type UiEvents = GridEvents | InstrumentEvents | ToolbarEvents | ContextMenuEvents 
    | Mounted | DocumentClick

export enum UiEvent {
    Mounted = "Mounted",
    DocumentClick = "DocumentClick",
}

export type Mounted = {
    event: UiEvent.Mounted
}
export type DocumentClick = {
    event: UiEvent.DocumentClick
}