import type { GrvMkrFile, GrvMkrFileId } from '$lib';
import type { GrooveSelectorUi } from '$lib/ui/groove_selector/GrooveSelectorUi';

export function mapGrvMkrFilesToGrooveSelectorUi(
	files: Map<GrvMkrFileId, GrvMkrFile>,
	workingFileId: GrvMkrFileId | undefined
): GrooveSelectorUi {
	return {
		files: Array.from(files.values())
			.map((file) => ({
				id: file.id,
				name: file.name
			}))
			.filter((file) => file.id !== workingFileId) // Exclude the working file
	};
}
