import { loadFileUseCase, type FileRepositoryI, type GridRepositoryI, type InstrumentRepositoryI, type PlaybackControllerI } from "$lib";

export async function loadExampleFileUseCase(
    fileRepository: FileRepositoryI,
    instrumentRepository: InstrumentRepositoryI,
    gridRepository: GridRepositoryI,
    player: PlaybackControllerI
) {
    const url = '/example.grv';

    try {
        // Fetch the file from the URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load file from ${url}`);
        }
        const blob = await response.blob()
        const file = new File([blob], 'example.grv', { type: blob.type });
        
        loadFileUseCase(file, fileRepository, instrumentRepository, gridRepository, player)
    } catch (error) {
        console.error('Error loading example file:', error);
    }
}
