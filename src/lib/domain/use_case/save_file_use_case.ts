import { FileStore, InstrumentStore, serialiseToSaveFileV4, type SaveFileV4 } from "$lib";
import type { GridStore } from "../state/grid_store.svelte";

// This use case doesn't rely on interfaces.
// It could, as they exist, but i'm curious to see how this pans out. 
export async function saveFileUseCase(
    fileStore: FileStore,
    gridStore: GridStore,
    instrumentStore: InstrumentStore
) {
    const saveFile: SaveFileV4 = serialiseToSaveFileV4(
        fileStore.file.name,
        Array.from(gridStore.grids.values()),
        Array.from(instrumentStore.instruments.values())
    );

    const text = JSON.stringify(saveFile);
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `GrvMkr_v${saveFile.version}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}
