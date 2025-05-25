import { defaultFile, DomainEvent, FileRepository, InstrumentStore, type GrvMkrFile, type OnEvent, type SaveFileV2, type SaveFileV3, type SaveFileV4 } from "$lib";

// Responsible for storing, and modifying grids
export class FileStore {
    private onEvent: OnEvent
    private fileRepository: FileRepository

    // Main state
    public file: GrvMkrFile = $state(defaultFile)


    constructor(instrumentStore: InstrumentStore, onEvent: OnEvent) {
        this.fileRepository = new FileRepository(instrumentStore)
        this.onEvent = onEvent
    }

    async initialise() {
        try {
            let file = await this.fileRepository.getFile('default file')
            if (file) {
                this.file.name = file.name
            }
        } catch (e: any) {
            console.error("Error getting file", e)
            this.onEvent({
                event: DomainEvent.DatabaseError,
                doingWhat: "initialising file name",
                error: e.target.error
            })
        }
    }

    loadFileV2(saveFile: SaveFileV2) {
        this.file.name = saveFile.name
        this.trySaveFile()
    }

    loadFileV3(saveFile: SaveFileV3) {
        this.file.name = saveFile.name
        this.trySaveFile()
    }

    loadFileV4(saveFile: SaveFileV4) {
        this.file.name = saveFile.name
        this.trySaveFile()
    }

    trySaveFile() {
        this.fileRepository.saveFile(this.file)
            .catch((e) => {
                console.error(`Error saving file. Error: [${e}]`, this.file)
                let error = e.target.error
                this.onEvent({
                    event: DomainEvent.DatabaseError,
                    doingWhat: "saving file to database",
                    error
                })
            });
    }

    async reset() {
        await this.fileRepository.deleteFile('default file')
    }
}
