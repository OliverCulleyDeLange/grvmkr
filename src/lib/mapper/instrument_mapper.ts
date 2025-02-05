import type { HitType, InstrumentConfig, SavedInstrumentV1 } from "$lib"

// When loading from a file, map the save file content into InstrumentConfig to load into the instrument manager
export function mapSavedInstrumentToInstrumentConfig(instrument: SavedInstrumentV1, index: number): InstrumentConfig {
    let config: InstrumentConfig = {
        hitTypes: instrument.hits.map((hit) => {
            let hitType: HitType = {
                key: hit.key,
                description: hit.description,
                audioFileName: hit.audio_file_name
            }
            return hitType
        }),
        gridIndex: index,
        name: instrument.name
    }
    return config
}
