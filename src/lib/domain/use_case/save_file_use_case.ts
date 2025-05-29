import JSZip from 'jszip';
import {
    AudioDb,
    FileStore,
    InstrumentStore,
    serialiseToSaveFileV4,
    type SaveFileV4
} from '$lib';
import type { GridStore } from '../state/grid_store.svelte';

export async function saveFileUseCase(
    fileStore: FileStore,
    gridStore: GridStore,
    instrumentStore: InstrumentStore
) {
    const audioDb = new AudioDb()
    const saveFile: SaveFileV4 = serialiseToSaveFileV4(
        fileStore.file.name,
        Array.from(gridStore.grids.values()),
        Array.from(instrumentStore.instruments.values())
    );

    const zip = new JSZip();

    // Add metadata.json
    zip.file('groovefile.json', JSON.stringify(saveFile, null, 2));

    // Add audio files from instruments
    const audioFolder = zip.folder('audio');
    for (const instrument of instrumentStore.instruments.values()) {
        if (!instrument.hitTypes || !instrument.name) continue;
        const instrumentFolder = audioFolder?.folder(instrument.name);

        for (const hit of instrument.hitTypes.values()) {
            if (!hit.audioFileName) continue;

            const audioFileUrl = await audioDb.loadAudioFileUrl(hit.audioFileName);
            if (audioFileUrl) {
                const response = await fetch(audioFileUrl);
                const blob = await response.blob();

                instrumentFolder?.file(hit.audioFileName, blob);
            }
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' });

    const filename = `GrvMkr_${fileStore.file.name}_${new Date().toISOString()}.grv`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
