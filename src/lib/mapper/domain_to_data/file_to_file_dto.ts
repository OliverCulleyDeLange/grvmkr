import type { FileDto, File } from "$lib";

export function mapToDto(file: File): FileDto {
    return {
        id: file.id,
        name: file.name,
        grids: Array.from(file.grids.keys())
    };
}