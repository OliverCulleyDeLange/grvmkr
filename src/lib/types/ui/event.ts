import type { GridEvents, ToolbarEvents } from "$lib"
import type { InstrumentEvents } from "./instruments"

export type OnUiEvent = (event: UiEvents) => void

export type UiEvents = GridEvents | InstrumentEvents | ToolbarEvents