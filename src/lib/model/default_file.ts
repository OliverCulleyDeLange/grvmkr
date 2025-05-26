import { formatDateYYYYMMMDD } from "$lib/state/date";
import type { GrvMkrFile, GrvMkrFileId } from "$lib/types/domain/file_domain";

export function defaultFile(): GrvMkrFile {
    return {
        id: `file_${crypto.randomUUID()}`,
        name: defaultFileName(),
        grids: new Map(),
        instruments: new Map()
    }
}

export function defaultFileName(): string {
    return `Groove from ${formatDateYYYYMMMDD()}`;
}