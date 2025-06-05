import {
	loadFileUseCase,
	type FileRepositoryI,
	type GridRepositoryI,
	type InstrumentRepositoryI,
	type OnEvent,
	type PlaybackControllerI
} from '$lib';

export async function loadExampleFileUseCase(
	onEvent: OnEvent,
	fileRepository: FileRepositoryI,
	instrumentRepository: InstrumentRepositoryI,
	gridRepository: GridRepositoryI,
	player: PlaybackControllerI
) {
	// Use relative path for SvelteKit static asset fetch so it works at any base path (e.g., /grvmkr/)
	const url = './example.grv';

	try {
		// Fetch the file from the URL
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load file from ${url}`);
		}
		const arrayBuffer = await response.arrayBuffer();
		const file = new File([arrayBuffer], 'example.grv', {
			type: response.headers.get('Content-Type') || 'application/zip'
		});

		await loadFileUseCase(
			onEvent,
			file,
			fileRepository,
			instrumentRepository,
			gridRepository,
			player
		);
	} catch (error) {
		console.error('Error loading example file:', error);
	}
}
