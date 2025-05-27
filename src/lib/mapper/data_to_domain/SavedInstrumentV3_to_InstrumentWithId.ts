import type { SavedInstrumentV3 } from "$lib/data/types/serialisation/savefile_v3";
import { mapSavedInstrumentV4ToInstrumentWithId } from "$lib/mapper/data_to_domain/SavedInstrumentV4_to_InstrumentWithId";
import { defaultVolume } from "../../domain/model/default_instruments";
import type { InstrumentWithId } from "../../domain/types/instrument_domain";

// Adds default values for missing fields
export function mapSavedInstrumentsV3ToInstrumentWithIds(instruments: SavedInstrumentV3[]): InstrumentWithId[] {
    return instruments.map((i) => mapSavedInstrumentV4ToInstrumentWithId(
        { ...i, version: 4, volume: defaultVolume }
    ));
}
