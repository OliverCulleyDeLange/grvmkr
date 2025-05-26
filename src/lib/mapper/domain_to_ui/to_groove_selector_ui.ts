import type { GrvMkrFile, GrvMkrFileId } from "$lib/types/domain/file_domain";
import type { GrooveSelectorUi } from "$lib/types/ui/groove_selector";

export function mapGrvMkrFilesToGrooveSelectorUi(files: Map<GrvMkrFileId, GrvMkrFile>): GrooveSelectorUi {
    return {
        files: Array.from(files.values()).map(file => ({
            id: file.id,
            name: file.name
        })).filter(file => file.id !== "working file") // Exclude the working file
    };
}