import type { GridEvents } from "$lib"
import type { InstrumentEvents } from "./instruments"

export type OnEvent = (event: UiEvent) => void

export type UiEvent = GridEvents | InstrumentEvents