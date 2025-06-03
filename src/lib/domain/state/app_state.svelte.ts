import {
	CellToolsEvent,
	CellToolsStore,
	defaultHitType,
	defaultInstrumentConfig,
	ErrorStore,
	FileStore,
	GridEvent,
	InstrumentEvent,
	InstrumentStore,
	loadFileUseCase,
	newGrooveUseCase,
	PlaybackStore,
	ProblemEvent,
	removeInstrumentUseCase,
	saveFileUseCase,
	togglePlayFileFromRecentlyPlayedUseCase,
	togglePlayFileUseCase,
	togglePlayGridUseCase,
	ToolbarEvent,
	UiEvent,
	GridStore,
	type AppEvent,
	type CellLocator,
	type GrvMkrFile,
	type GrvMkrFileId,
	type StartCellSelection,
	type TappedGridCell,
	addInstrumentUseCase,
	addHitUseCase,
	moveInstrumentDownUseCase,
	syncGrids,
	maybeShowInfoForFirstTimeUseCase,
	UiStore,
	HelpEvent,
	loadExampleFileUseCase
} from '$lib';
import { moveInstrumentUpUseCase } from '../use_case/instrument/moveInstrumentUpUseCase';

export class AppStateStore {
	public instrumentStore: InstrumentStore = new InstrumentStore(this.onEvent.bind(this));
	public fileStore: FileStore = new FileStore(this.onEvent.bind(this));
	public gridStore: GridStore = new GridStore(this.onEvent.bind(this));
	public errorStore: ErrorStore = new ErrorStore();
	public playbackStore: PlaybackStore = new PlaybackStore(this.instrumentStore);
	public cellToolsStore: CellToolsStore = new CellToolsStore();
	public uiStore: UiStore = new UiStore();

	onEvent(event: AppEvent) {
		this.logEvent(event);
		switch (event.event) {
			case UiEvent.Mounted:
				maybeShowInfoForFirstTimeUseCase(this.uiStore);
				this.initialise();
				break;
			case UiEvent.Copy:
				this.gridStore.copyCurrentlySelectedCells();
				this.cellToolsStore.setCellsCopied();
				break;
			case UiEvent.Paste:
				this.gridStore.pasteCells(this.instrumentStore.getInstruments());
				break;
			case UiEvent.PlayPause:
				togglePlayFileFromRecentlyPlayedUseCase(
					this.gridStore,
					this.instrumentStore,
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
			case GridEvent.TogglePlayingGrid:
				togglePlayGridUseCase(
					event.playing,
					event.gridId,
					this.gridStore,
					this.instrumentStore,
					this.playbackStore
				);
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
				syncGrids(this.fileStore, this.gridStore);
				break;
			case GridEvent.AddGrid:
				this.gridStore.addDefaultGrid(this.instrumentStore.getInstruments());
				syncGrids(this.fileStore, this.gridStore);
				break;
			case GridEvent.DuplicateGrid:
				this.gridStore.duplicateGrid(event.gridId).then(() => {
					syncGrids(this.fileStore, this.gridStore);
				});
				break;
			case GridEvent.RepetitionsChanged:
				this.gridStore.updateRepetitions(event.gridId, event.repetitions);
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
			case GridEvent.MoveGridDown:
				this.gridStore.moveGrid('down', event.gridId);
				break;
			case GridEvent.MoveGridUp:
				this.gridStore.moveGrid('up', event.gridId);
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
			case GridEvent.ToggleToolsExpansion:
				this.gridStore.toggleToolsExpansion(event.id);
				break;
			case GridEvent.ScrolledToGrid:
				this.gridStore.onScrolledToGrid();
				break;
			case InstrumentEvent.RemoveInstrument:
				removeInstrumentUseCase(
					event.instrumentId,
					this.fileStore,
					this.gridStore,
					this.instrumentStore,
					this.cellToolsStore
				);
				break;
			case InstrumentEvent.AddInstrument:
				addInstrumentUseCase(
					this.fileStore,
					this.gridStore,
					this.instrumentStore,
					this.cellToolsStore
				);
				break;
			case InstrumentEvent.RenameInstrument:
				this.instrumentStore.onChangeName(event.newName, event.instrumentId);
				break;
			case InstrumentEvent.AddHit:
				addHitUseCase(
					event.instrumentId,
					this.fileStore,
					this.gridStore,
					this.instrumentStore,
					this.cellToolsStore
				);
				break;
			case InstrumentEvent.MoveUp:
				moveInstrumentUpUseCase(
					event.instrumentId,
					this.fileStore,
					this.gridStore,
					this.instrumentStore,
					this.cellToolsStore
				);
				break;
			case InstrumentEvent.MoveDown:
				moveInstrumentDownUseCase(
					event.instrumentId,
					this.fileStore,
					this.gridStore,
					this.instrumentStore,
					this.cellToolsStore
				);
				break;
			case InstrumentEvent.ChangeHitKey:
				this.instrumentStore.onChangeHitKey(event.newKey, event.instrumentId, event.hitId);
				break;
			case InstrumentEvent.ChangeHitDescription:
				this.instrumentStore.onChangeHitDescription(
					event.description,
					event.instrumentId,
					event.hitId
				);
				break;
			case InstrumentEvent.ChangeSample:
				this.instrumentStore.onChangeSample(event.file, event.instrumentId, event.hitId);
				break;
			case InstrumentEvent.RemoveHit:
				this.instrumentStore.removeHit(event.instrumentId, event.hitId);
				break;
			case InstrumentEvent.PlayHit:
				this.instrumentStore.playHit(event.instrumentHit);
				break;
			case ToolbarEvent.New:
				newGrooveUseCase(this.fileStore, this.gridStore, this.instrumentStore);
				break;
			case ToolbarEvent.Save:
				saveFileUseCase(this.fileStore, this.gridStore, this.instrumentStore);
				break;
			case ToolbarEvent.LoadFile:
				loadFileUseCase(
					this.onEvent.bind(this),
					event.file,
					this.fileStore,
					this.instrumentStore,
					this.gridStore,
					this.playbackStore
				);
				break;
			case ToolbarEvent.LoadLocalGroove:
				this.loadGroove(event.id);
				break;
			case ToolbarEvent.DeleteLocalGroove:
				this.deleteGroove(event.id);
				break;
			case ToolbarEvent.DismissError:
				this.errorStore.dismissError(event.id);
				break;
			case ToolbarEvent.GrooveSelectorShown:
				this.fileStore.updateAllFiles();
				break;
			case ToolbarEvent.FileNameChanged:
				this.updateFile((file) => {
					file.name = event.fileName;
				});
				break;
			case ToolbarEvent.TogglePlayingFile:
				togglePlayFileUseCase(this.gridStore, this.instrumentStore, this.playbackStore);
				break;
			case HelpEvent.Reset:
				this.reset();
				break;
			case HelpEvent.LoadExampleFile:
				loadExampleFileUseCase(
					this.onEvent.bind(this),
					this.fileStore,
					this.instrumentStore,
					this.gridStore,
					this.playbackStore
				);
				break;
			case ProblemEvent.MissingSampleAudio:
			case ProblemEvent.DatabaseError:
			case ProblemEvent.LoadedNonGrooveFile:
				this.errorStore.addError(event);
				break;
			case ProblemEvent.DebugLog:
				this.errorStore.debugLog(event);
				break;
		}
	}

	// TODO Extract these below into use cases

	updateCellTools() {
		this.cellToolsStore.updateCellTools(this.gridStore, this.instrumentStore);
	}

	// Filters chatty events, and logs
	private logEvent(event: AppEvent) {
		console.log('Event:', event?.event, event);
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
		await this.gridStore.replaceGrids(Array.from(newWorkingFile.grids.values()), false);
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
		localStorage.clear();
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
