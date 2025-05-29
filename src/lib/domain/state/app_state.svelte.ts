import {
	CellToolsEvent,
	CellToolsStore,
	ErrorStore,
	FileStore,
	GridEvent,
	InstrumentStore,
	loadFileUseCase,
	newGrooveUseCase,
	PlaybackStore,
	ProblemEvent,
	togglePlayRecentlyPlayedUseCase,
	togglePlaySpecificGridUseCase,
	ToolbarEvent,
	UiEvent,
	type CellLocator,
	type GridId,
	type GrvMkrFile,
	type GrvMkrFileId,
	type StartCellSelection,
	type TappedGridCell
} from '$lib';
import type { AppEvent } from '$lib/domain/event';
import { defaultInstrumentConfig } from '$lib/domain/model/default_instruments';
import { InstrumentEvent } from '$lib/ui/instrument/instrument_events';
import { saveFileUseCase } from '../use_case/save_file_use_case';
import { GridStore } from './grid_store.svelte';

export class AppStateStore {
	public instrumentStore: InstrumentStore = new InstrumentStore(this.onEvent.bind(this));
	public fileStore: FileStore = new FileStore(this.onEvent.bind(this));
	public gridStore: GridStore = new GridStore(this.onEvent.bind(this));
	public errorStore: ErrorStore = new ErrorStore();
	public playbackStore: PlaybackStore = new PlaybackStore(this.instrumentStore);
	public cellToolsStore: CellToolsStore = new CellToolsStore();

	onEvent(event: AppEvent) {
		this.logEvent(event);
		switch (event.event) {
			case UiEvent.Mounted:
				this.initialise();
				break;
			case UiEvent.Copy:
				this.gridStore.copyCurrentlySelectedCells();
				this.cellToolsStore.setCellsCopied();
				break;
			case UiEvent.Paste:
				this.gridStore.pasteCells(this.instrumentStore.instruments);
				break;
			case UiEvent.PlayPause:
				togglePlayRecentlyPlayedUseCase(
					this.gridStore,
					this.playbackStore
				);
				break;
			case CellToolsEvent.Merge:
				this.gridStore.mergeCurrentlySelectedCell(event.side);
				this.updateCellTools();
				break;
			case CellToolsEvent.UnMerge:
				this.gridStore.unMergeCurrentlySelectedCell();
				this.updateCellTools();
				break;
			case CellToolsEvent.SelectHitOption:
				this.gridStore.setCurrentlySelectedCellHits(event.instrumentHits);
				break;
			case ToolbarEvent.FileNameChanged:
				this.updateFile((file) => {
					file.name = event.fileName;
				});
				break;
			case GridEvent.TogglePlaying:
				togglePlaySpecificGridUseCase(event.playing, event.gridId, this.gridStore, this.instrumentStore, this.playbackStore)
				break;
			case GridEvent.TappedGridCell:
				this.onTapGridCell(event);
				break;
			case GridEvent.StartCellSelection:
				this.onStartCellSelection(event);
				break;
			case GridEvent.ChangeCellSelection:
				this.onChangeCellSelection(event.locator);
				break;
			case GridEvent.RemoveGrid:
				this.gridStore.removeGrid(event);
				this.syncGrids()
				break;
			case GridEvent.AddGrid:
				this.gridStore.addDefaultGrid(this.instrumentStore.instruments);
				this.syncGrids()
				break;
			case GridEvent.DuplicateGrid:
				this.gridStore.duplicateGrid();
				this.syncGrids()
				break;
			case GridEvent.BpmChanged:
				this.gridStore.updateBpm(event.gridId, event.bpm);
				this.playbackStore.restartInterval();
				break;
			case GridEvent.BarsChanged:
				this.gridStore.updateBars(event.gridId, event.bars);
				break;
			case GridEvent.GridSizeChanged:
				this.gridStore.updateSize(event.gridId, event.beats_per_bar, event.beat_divisions);
				break;
			case GridEvent.NameChanged:
				this.gridStore.updateName(event.gridId, event.name);
				break;
			case GridEvent.VolumeChanged:
				this.instrumentStore.onChangeVolume(event.instrumentId, event.volume, event.delta);
				break;
			case GridEvent.MuteInstrument:
				this.instrumentStore.onToggleMute(event.instrumentId);
				break;
			case GridEvent.SoloInstrument:
				this.instrumentStore.onToggleSolo(event.instrumentId);
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
				this.instrumentStore.moveInstrument(event.event, event.instrumentId);
				this.syncInstruments();
				break;
			case InstrumentEvent.MoveDown:
				this.instrumentStore.moveInstrument(event.event, event.instrumentId);
				this.syncInstruments();
				break;
			case ToolbarEvent.New:
				newGrooveUseCase(
					this.fileStore,
					this.gridStore,
					this.instrumentStore
				)
				break;
			case ToolbarEvent.Save:
				saveFileUseCase(
					this.fileStore,
					this.gridStore,
					this.instrumentStore
				)
				break;
			case ToolbarEvent.LoadFile:
				loadFileUseCase(event.file,
					this.fileStore,
					this.instrumentStore,
					this.gridStore,
					this.playbackStore,
				);
				break;
			case ToolbarEvent.LoadLocalGroove:
				this.loadGroove(event.id);
				break;
			case ToolbarEvent.DeleteLocalGroove:
				this.deleteGroove(event.id);
				break;
			case ToolbarEvent.Reset:
				this.reset();
				break;
			case ToolbarEvent.DismissError:
				this.errorStore.dismissError(event.id);
				break;
			case ToolbarEvent.GrooveSelectorShown:
				this.fileStore.updateAllFiles();
				break;
			case ProblemEvent.MissingSampleAudio:
				this.errorStore.addError(event);
				break;
			case ProblemEvent.DatabaseError:
				this.errorStore.addError(event);
				break;
			case ProblemEvent.DebugLog:
				this.errorStore.debugLog(event);
				break;
		}
	}

	syncInstruments() {
		this.gridStore.syncInstruments(this.instrumentStore.instruments);
		this.fileStore.setInstruments(this.instrumentStore.instruments)
	}

	syncGrids() {
		this.fileStore.setGrids(this.gridStore.grids)
	}

	updateCellTools() {
		this.cellToolsStore.updateCellTools(this.gridStore);
	}

	// Filters chatty events, and logs
	private logEvent(event: AppEvent) {
		console.log('Event:', event.event, event);
	}

	// Combined all actions to be complete when a cell is clicked:
	// - Toggle the hit
	// - Play the new hit
	// - Update the selected state
	// - Update cell tools
	onTapGridCell(event: TappedGridCell) {
		if (event.shiftHeld) {
			this.gridStore.selectUpTo(event.locator);
		} else {
			this.gridStore.onTapGridCell(event.locator);
			const hit = this.gridStore.getHitAt(event.locator);
			this.instrumentStore?.playHit(hit);
			this.updateCellTools();
		}
	}

	onStartCellSelection(event: StartCellSelection) {
		if (!event.shiftHeld) {
			this.gridStore.onStartCellSelection(event.locator);
		}
		this.updateCellTools();
	}

	onChangeCellSelection(locator: CellLocator) {
		this.gridStore.selectUpTo(locator);
		this.updateCellTools();
	}

	async loadGroove(id: GrvMkrFileId) {
		this.playbackStore.stop();
		const newWorkingFile = await this.fileStore.loadGroove(id);
		console.log('Loaded file:', newWorkingFile);
		await this.gridStore.replaceGrids(
			Array.from(newWorkingFile.grids.values()),
			false
		);
		await this.instrumentStore.replaceInstruments(Array.from(newWorkingFile.instruments.values()));
	}

	async deleteGroove(id: GrvMkrFileId) {
		await this.fileStore.deleteGroove(id);
	}

	// Clears the DBs and refreshes
	async reset() {
		// Clear Stores
		await this.gridStore.reset();
		await this.fileStore.reset();
		await this.instrumentStore.reset();

		window.location.reload();
	}

	// Gets the working file's instruments and grids, and initialises the stores.
	async initialise() {
		const workingFile = await this.fileStore.initialise();
		console.log('Working file:', $state.snapshot(workingFile));

		const instruments = await this.instrumentStore.initialise(workingFile.instruments);
		await this.fileStore.setInstruments(instruments);

		const grids = await this.gridStore.initialise(workingFile.grids, instruments);
		await this.fileStore.setGrids(grids);
	}

	// Updates grid in state and DB
	updateFile(withFile: (file: GrvMkrFile) => void) {
		withFile(this.fileStore.file);
		this.fileStore.trySaveFile();
	}
}
