import type { InstrumentId } from "$lib"

// Grid UI Events
export type InstrumentEvents = RemoveInstrument | AddInstrument | InstrumentsInitialised | MoveUp | MoveDown

export enum InstrumentEvent {
    RemoveInstrument = "RemoveInstrument",
    AddInstrument = "AddInstrument",
    MoveUp = "MoveUp",
    MoveDown = "MoveDown",
    InstrumentsInitialised = "InstrumentsInitialised"
}

export type RemoveInstrument = {
    event: InstrumentEvent.RemoveInstrument
    instrumentId: InstrumentId
}
export type AddInstrument = {
    event: InstrumentEvent.AddInstrument
}
export type MoveUp = {
    event: InstrumentEvent.MoveUp
    instrumentId: InstrumentId
}
export type MoveDown = {
    event: InstrumentEvent.MoveDown
    instrumentId: InstrumentId
}
export type InstrumentsInitialised = {
    event: InstrumentEvent.InstrumentsInitialised
}