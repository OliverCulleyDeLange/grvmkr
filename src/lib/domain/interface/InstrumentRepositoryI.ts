import type { InstrumentId, InstrumentWithId } from "$lib";

export interface InstrumentRepositoryI {
    getInstruments(): Map<InstrumentId, InstrumentWithId>;
    replaceInstruments(instruments: InstrumentWithId[]): unknown;
}