import type { FileDto, GrvMkrFile } from '$lib';

export function mapToDto(file: GrvMkrFile): FileDto {
	return {
		id: file.id,
		name: file.name,
		grids: Array.from(file.grids.keys()),
		instruments: Array.from(file.instruments.keys())
	};
}
