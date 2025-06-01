import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { InstrumentRepositoryI } from "../interface/InstrumentRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";
import type { GridId, Grid } from "$lib";

// Loops a single grid
export async function togglePlayGridUseCase(
    newPlaying: boolean,
    gridId: GridId,
    gridRepo: GridRepositoryI,
    instrumentRepo: InstrumentRepositoryI,
    player: PlaybackControllerI
) {
    await gridRepo.updatePlaying(newPlaying, gridId);

    if (newPlaying) {
        await instrumentRepo.ensureInstrumentsInitialised();
        player.stop();
        const gridToPlay = gridRepo.getGrid(gridId);
        if (gridToPlay) {
            player.play(gridToPlay, 0, (grid: Grid)=> {
                gridRepo.updatePlaying(!grid.playing, grid.id)
            });
        }
    } else {
        player.stop();
    }
}
