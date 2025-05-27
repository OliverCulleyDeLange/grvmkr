import type { InstrumentWithId } from "../types/instrument_domain";

export interface InstrumentRepositoryI {
    replaceInstruments(instruments: InstrumentWithId[]): unknown;
}