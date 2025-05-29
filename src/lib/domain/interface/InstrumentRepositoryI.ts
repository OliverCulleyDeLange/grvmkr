import type { InstrumentId, InstrumentWithId } from "$lib";

export interface InstrumentRepositoryI {
    ensureInstrumentsInitialised(): void;
    getInstruments(): Map<InstrumentId, InstrumentWithId>;
    replaceInstruments(instruments: InstrumentWithId[]): unknown;
}