import { CellToolsEvent, CellToolsStore, createErrorStore, createPlaybackStore, FileStore, GridEvent, InstrumentStore, serialiseToSaveFileV4, ToolbarEvent, UiEvent, type CellLocator, type ErrorStore, type GridId, type GrvMkrFile, type PlaybackStore, type SaveFile, type SaveFileV1, type SaveFileV2, type SaveFileV3, type SaveFileV4, type StartCellSelection, type TappedGridCell } from "$lib";
import { defaultInstrumentConfig } from "$lib/audio/default_instruments";
import { DomainEvent } from "$lib/types/domain/event";
import type { AppEvent } from "$lib/types/event";
import { InstrumentEvent } from "$lib/types/ui/instruments";
import { GridStore } from "./grid_store.svelte";

export class AppStateStore {
    // TODO make private
    public instrumentStore: InstrumentStore = new InstrumentStore(this.onEvent.bind(this));
    public fileStore: FileStore = new FileStore(this.instrumentStore, this.onEvent.bind(this));
    public gridStore: GridStore = new GridStore(this.instrumentStore, this.onEvent.bind(this));
    public errorStore: ErrorStore = createErrorStore()
    public playbackStore: PlaybackStore = createPlaybackStore(this.instrumentStore)
    public cellToolsStore: CellToolsStore = new CellToolsStore()

    onEvent(event: AppEvent) {
        this.logEvent(event)
        switch (event.event) {
            case UiEvent.Mounted:
                this.initialise();
                break;
            case UiEvent.Copy:
                this.gridStore.copyCurrentlySelectedCells()
                this.cellToolsStore.setCellsCopied()
                break;
            case UiEvent.Paste:
                this.gridStore.pasteCells(this.instrumentStore.instruments)
                break;
            case CellToolsEvent.Merge:
                this.gridStore.mergeCurrentlySelectedCell(event.side)
                this.updateCellTools()
                break;
            case CellToolsEvent.UnMerge:
                this.gridStore.unMergeCurrentlySelectedCell()
                this.updateCellTools()
                break;
            case CellToolsEvent.SelectHitOption:
                this.gridStore.setCurrentlySelectedCellHits(event.instrumentHits)
                break;
            case ToolbarEvent.FileNameChanged:
                this.updateFile((file) => { file.name = event.fileName })
                break;
            case GridEvent.TogglePlaying:
                this.onTogglePlaying(event.playing, event.gridId);
                break;
            case GridEvent.TappedGridCell:
                this.onTapGridCell(event)
                break;
            case GridEvent.StartCellSelection:
                this.onStartCellSelection(event)
                break;
            case GridEvent.ChangeCellSelection:
                this.onChangeCellSelection(event.locator)
                break;
            case GridEvent.RemoveGrid:
                this.gridStore.removeGrid(event);
                break;
            case GridEvent.AddGrid:
                this.gridStore.addDefaultGrid(this.instrumentStore.instruments)
                break;
            case GridEvent.DuplicateGrid:
                this.gridStore.duplicateGrid()
                break;
            case GridEvent.BpmChanged:
                this.gridStore.updateBpm(event.gridId, event.bpm)
                this.playbackStore.restartInterval()
                break;
            case GridEvent.BarsChanged:
                this.gridStore.updateBars(event.gridId, event.bars)
                break;
            case GridEvent.GridSizeChanged:
                this.gridStore.updateSize(event.gridId, event.beats_per_bar, event.beat_divisions)
                break;
            case GridEvent.NameChanged:
                this.gridStore.updateName(event.gridId, event.name)
                break;
            case GridEvent.VolumeChanged:
                this.instrumentStore.onChangeVolume(event.instrumentId, event.volume, event.delta)
                break;
            case GridEvent.MuteInstrument:
                this.instrumentStore.onToggleMute(event.instrumentId)
                break;
            case GridEvent.SoloInstrument:
                this.instrumentStore.onToggleSolo(event.instrumentId)
                break;
            case InstrumentEvent.RemoveInstrument:
                this.instrumentStore.removeInstrument(event.instrumentId);
                this.syncInstruments();
                break;
            case InstrumentEvent.AddInstrument:
                this.instrumentStore.addInstrumentFromConfig(defaultInstrumentConfig);
                this.syncInstruments();
                break;
            case InstrumentEvent.MoveUp:
                this.instrumentStore.moveInstrument(event.event, event.instrumentId)
                this.syncInstruments();
                break;
            case InstrumentEvent.MoveDown:
                this.instrumentStore.moveInstrument(event.event, event.instrumentId)
                this.syncInstruments();
                break;
            case ToolbarEvent.Save:
                this.save();
                break;
            case ToolbarEvent.Load:
                this.loadFile(event.file);
                break;
            case ToolbarEvent.Reset:
                this.reset()
                break;
            case ToolbarEvent.DismissError:
                this.errorStore.dismissError(event.id)
                break;
            case DomainEvent.DatabaseError:
                this.errorStore.addError(event)
                break;
            case DomainEvent.DebugLog:
                this.errorStore.debugLog(event)
                break;
        }
    }

    syncInstruments() {
        this.gridStore.syncInstruments(this.instrumentStore.instruments);
    }

    updateCellTools() {
        this.cellToolsStore.updateCellTools(this.gridStore)
    }

    // Filters chatty events, and logs
    private logEvent(event: AppEvent) {
        console.log('Event:', event.event, event);
    }

    async onTogglePlaying(newPlaying: boolean, gridId: GridId): Promise<void> {
        this.gridStore.updatePlaying(newPlaying, gridId)

        if (newPlaying) {
            await this.instrumentStore.ensureInstrumentsInitialised();
            this.playbackStore.stop()
            const currentlyPlaying = this.gridStore.currentlyPlayingGrid
            if (currentlyPlaying) {
                this.playbackStore.play(currentlyPlaying)
            }
        } else {
            this.playbackStore.stop()
        }
    }

    // Combined all actions to be complete when a cell is clicked:
    // - Toggle the hit
    // - Play the new hit
    // - Update the selected state
    // - Update cell tools
    onTapGridCell(event: TappedGridCell) {
        if (event.shiftHeld) {
            this.gridStore.selectUpTo(event.locator)
        } else {
            this.gridStore.onTapGridCell(event.locator)
            const hit = this.gridStore.getHitAt(event.locator)
            this.instrumentStore?.playHit(hit);
            this.updateCellTools()
        }
    }

    onStartCellSelection(event: StartCellSelection) {
        if (!event.shiftHeld) {
            this.gridStore.onStartCellSelection(event.locator)
        }
        this.updateCellTools()
    }

    onChangeCellSelection(locator: CellLocator) {
        this.gridStore.selectUpTo(locator)
        this.updateCellTools()
    }

    save() {
        let saveFile: SaveFileV4 = serialiseToSaveFileV4(
            this.fileStore.file.name,
            Array.from(this.gridStore.grids.values()),
            Array.from(this.instrumentStore.instruments.values())
        );
        const text = JSON.stringify(saveFile);
        const blob = new Blob([text], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `GrvMkr_v${saveFile.version}-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async loadFile(file: File) {
        this.playbackStore.stop()
        let fileText = await file.text()
        let saveFileBase: SaveFile = JSON.parse(fileText)
        switch (saveFileBase.version) {
            case 1:
                this.loadSaveFileV1(fileText)
                break;
            case 2:
                this.loadSaveFileV2(fileText)
                break;
            case 3:
                this.loadSaveFileV3(fileText)
                break;
            case 4:
                this.loadSaveFileV4(fileText)
                break;
        }
    }

    async loadSaveFileV1(saveFileContent: string) {
        let saveFile: SaveFileV1 = JSON.parse(saveFileContent);
        await this.instrumentStore.replaceInstrumentsV1(saveFile.instruments);
        this.gridStore.loadSaveFileV1(saveFile, this.instrumentStore)
    }

    async loadSaveFileV2(saveFileContent: string) {
        let saveFile: SaveFileV2 = JSON.parse(saveFileContent);
        await this.instrumentStore.replaceInstrumentsV1(saveFile.instruments);
        this.gridStore.loadSaveFileV2(saveFile, this.instrumentStore)
        this.fileStore.loadFileV2(saveFile)
    }

    async loadSaveFileV3(saveFileContent: string) {
        let saveFile: SaveFileV3 = JSON.parse(saveFileContent);
        await this.instrumentStore.replaceInstrumentsV3(saveFile.instruments);
        this.gridStore.loadSaveFileV3(saveFile.grids, this.instrumentStore)
        this.fileStore.loadFileV3(saveFile)
    }

    async loadSaveFileV4(saveFileContent: string) {
        let saveFile: SaveFileV4 = JSON.parse(saveFileContent);
        await this.instrumentStore.replaceInstrumentsV4(saveFile.instruments);
        this.gridStore.loadSaveFileV3(saveFile.grids, this.instrumentStore)
        this.fileStore.loadFileV4(saveFile)

    }

    // Clears the DBs and refreshes
    async reset() {
        // Clear DBs (except sounds db)
        await this.gridStore.reset()
        await this.fileStore.reset()
        await this.instrumentStore.reset()

        window.location.reload();
    }

    // Initialises the app 
    async initialise() {
        await this.instrumentStore.initialise()
        await this.fileStore.initialise()
        await this.gridStore.initialise(this.instrumentStore.instruments)
    }

    // Updates grid in state and DB
    updateFile(withFile: (file: GrvMkrFile) => void) {
        withFile(this.fileStore.file);
        this.fileStore.trySaveFile()
    }
}
