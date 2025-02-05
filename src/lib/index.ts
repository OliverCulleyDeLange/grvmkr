import { InstrumentTable } from "./db/instrument_table"

// place files you want to import through the `$lib` alias in this folder.
export { defaultInstruments} from "./audio/default_instruments"
export { AudioPlayer } from "./audio/audio_player"
export { AudioManager } from "./manager/audio_manager"
export { InstrumentManager } from "./manager/instrument_manager.svelte"
export { GridModel } from "./model/grid_model.svelte"

// Service layer
export { InstrumentService } from "./service/instrument_service"

// Data layer
export { AudioDb } from "./db/audio_db"
export { InstrumentTable } from "./db/instrument_table"
export { HitTable } from "./db/hit_table"

export * from "./types/data/instrument_data"
export * from "./types/domain/grid_domain"
export * from "./types/domain/instrument_domain"
export * from "./types/ui/grid_ui"
export * from "./types/ui/legend_ui"
export * from "./types/serialisation/savefile_v1"

export { serialiseToJsonV1 } from "./serialisation/json"
export { mapSavedInstrumentToInstrumentConfig } from "./mapper/instrument_mapper"
export { mapSavedGridToGridModel } from "./mapper/saved_grid_mapper"
export { mapRowsToGridUi } from "./mapper/grid_ui_mapper"