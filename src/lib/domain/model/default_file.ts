import { formatDateFriendly, type GrvMkrFile } from '$lib';

export function generateFileId(): string {
	return `file_${crypto.randomUUID()}`;
}

export function defaultFile(): GrvMkrFile {
	return {
		id: generateFileId(),
		name: defaultFileName(),
		grids: new Map(),
		instruments: new Map()
	};
}

export function defaultFileName(): string {
	return `Groove from ${formatDateFriendly()}`;
}
