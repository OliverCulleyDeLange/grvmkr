import type { GrvMkrFile } from "$lib";

export interface FileRepositoryI {
    saveWorkingFileInStateAndDB(file: GrvMkrFile): void;
    loadFile(file: GrvMkrFile): void;
}