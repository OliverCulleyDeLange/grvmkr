import type { GrvMkrFile } from "$lib";

export interface FileRepositoryI {
    loadFile(file: GrvMkrFile): unknown;
}