
export const AUDIO_DB_NAME = "audioDb"
export const SAMPLE_STORE = "samples"

export const AUDIO_DB_VERSION = 1; // Increment when modifying stores
export const AUDIO_DB_STORES = [SAMPLE_STORE];

export const DATA_DB_NAME = "dataDb";
export const INSTRUMENT_STORE = "instruments";
export const INSTRUMENT_HIT_STORE = "hits";
export const GRID_STORE = "grid"

export const DATA_DB_VERSION = 2; // Increment when modifying stores
export const DATA_DB_STORES = [INSTRUMENT_STORE, INSTRUMENT_HIT_STORE, GRID_STORE];