import { defaultFile, type FileRepositoryI, type GridRepositoryI, type InstrumentRepositoryI } from "$lib";

// Creates a new empty groove
export async function newGrooveUseCase(
    fileRepository: FileRepositoryI,
    gridRepository: GridRepositoryI,
    instrumentRepository: InstrumentRepositoryI,
) {
    const newFile = defaultFile()
    // Currently just uses the same instruments as the current file
    const instruments = instrumentRepository.getInstruments()
    newFile.instruments = instruments

    const newGrids = await gridRepository.initialise(new Map(), instruments)
    newFile.grids = newGrids
    fileRepository.saveWorkingFileInStateAndDB(newFile)
}

