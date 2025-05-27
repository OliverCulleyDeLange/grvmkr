import { generateFileId, mapSavedGridV1ToGrid, mapSavedGridV2ToGrid, mapSavedGridV3ToGrid, mapSavedInstrumentsV4ToInstrumentWithIds, type Grid, type GrvMkrFile, type InstrumentId, type InstrumentWithId, type SaveFile, type SaveFileV1, type SaveFileV2, type SaveFileV3, type SaveFileV4 } from "$lib";
import { mapSavedInstrumentsV1ToInstrumentWithIds } from "../../mapper/data_to_domain/SavedInstrumentV1_to_InstrumentWithId";
import { mapSavedInstrumentsV3ToInstrumentWithIds } from "../../mapper/data_to_domain/SavedInstrumentV3_to_InstrumentWithId";
import type { FileRepositoryI } from "../interface/FileRepositoryI";
import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { InstrumentRepositoryI } from "../interface/InstrumentRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";

// Loads groove files, of any version
export async function loadFileUseCase(
    file: File,
    fileRepository: FileRepositoryI,
    instrumentRepository: InstrumentRepositoryI,
    gridRepository: GridRepositoryI,
    player: PlaybackControllerI,
) {
    player.stop();

    let fileText = await file.text();
    let saveFileBase: SaveFile = JSON.parse(fileText);
    let instruments: InstrumentWithId[] = []
    let keyedInstruments: Map<InstrumentId, InstrumentWithId> = new Map()
    let grids: Grid[] = []
    // Default to the file name. V1 doesn't have a name field. 
    let fileName: string = file.name

    switch (saveFileBase.version) {
        case 1:
            let saveFileV1: SaveFileV1 = JSON.parse(fileText);
            instruments = mapSavedInstrumentsV1ToInstrumentWithIds(saveFileV1.instruments)
            keyedInstruments = new Map(instruments.map(instrument => [instrument.id, instrument]))
            grids = saveFileV1.grids.map((grid) => mapSavedGridV1ToGrid(grid, keyedInstruments))
            break;
        case 2:
            let saveFileV2: SaveFileV2 = JSON.parse(fileText);
            fileName = saveFileV2.name
            instruments = mapSavedInstrumentsV1ToInstrumentWithIds(saveFileV2.instruments)
            keyedInstruments = new Map(instruments.map(instrument => [instrument.id, instrument]))
            grids = saveFileV2.grids.map((grid) => mapSavedGridV2ToGrid(grid, keyedInstruments))
            break;
        case 3:
            let saveFileV3: SaveFileV3 = JSON.parse(fileText);
            fileName = saveFileV3.name
            instruments = mapSavedInstrumentsV3ToInstrumentWithIds(saveFileV3.instruments)
            keyedInstruments = new Map(instruments.map(instrument => [instrument.id, instrument]))
            grids = saveFileV3.grids.map((grid) => mapSavedGridV3ToGrid(grid, keyedInstruments))
            break;
        case 4:
            let saveFileV4: SaveFileV4 = JSON.parse(fileText);
            fileName = saveFileV4.name
            instruments = mapSavedInstrumentsV4ToInstrumentWithIds(saveFileV4.instruments)
            keyedInstruments = new Map(instruments.map(instrument => [instrument.id, instrument]))
            grids = saveFileV4.grids.map((grid) => mapSavedGridV3ToGrid(grid, keyedInstruments))
            break;
    }

    let grvMkrFile: GrvMkrFile = {
        id: generateFileId(),
        name: fileName,
        grids: new Map(grids.map(grid => [grid.id, grid])),
        instruments: keyedInstruments,
    }
    await instrumentRepository.replaceInstruments(instruments)
    await gridRepository.replaceGrids(grids, true)
    await fileRepository.loadFile(grvMkrFile)
}

