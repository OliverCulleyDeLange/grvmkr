import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { InstrumentRepositoryI } from "../interface/InstrumentRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";

// 'Play File' button in toolbar should play all grids, starting with the first grid
export async function togglePlayFileUseCase(
    gridRepo: GridRepositoryI,
    instrumentRepo: InstrumentRepositoryI,
    player: PlaybackControllerI
) {
    const newPlaying = !player.isPlayingFile()
    if (newPlaying) {
        await instrumentRepo.ensureInstrumentsInitialised();
        player.stop();

        const gridsToPlay = gridRepo.getGrids();
        await player.playGridsInSequence(gridsToPlay,
            (grid) => { gridRepo.updatePlaying(true, grid.id); },
            (grid) => { gridRepo.updatePlaying(false, grid.id); }
        );
    } else {
        player.stop();
        gridRepo.stopPlayingGrid()
    }
}


