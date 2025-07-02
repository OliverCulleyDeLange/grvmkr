import type { CellToolsUi, GridId, GridUis } from '$lib';
import { measurePerf } from '../../../lib/util/measurePerf';
import { mapGridUi } from '../../mapper/domain_to_ui/grid_to_grid_ui';
import { mapInstrumentsUi } from '../../mapper/domain_to_ui/instruments_to_instruments_ui';
import { mapCellToolsUi } from '../../mapper/domain_to_ui/to_cell_tools_ui';
import { mapGrvMkrFilesToGrooveSelectorUi } from '../../mapper/domain_to_ui/to_groove_selector_ui';
import { mapToolbarUi } from '../../mapper/domain_to_ui/to_toolbar_ui';
import { mapBeatIndicatorUi } from '../../mapper/ui_to_ui/grid_ui_to_beat_indicator_ui';
import type { PlaybackControllerI } from '../interface/PlaybackControllerI';
import type { CellToolsStore } from './cell_tools_store.svelte';
import type { ErrorStore } from './error_store';
import type { FileStore } from './file_store.svelte';
import type { GridStore } from './grid_store.svelte';
import type { InstrumentStore } from './instrument_store.svelte';

export class UiStore {
	public darkMode = $state(true);
	public shouldShowHelpOverlay: boolean = $state(false);
	public shouldShowDebugOverlay: boolean = $state(false);
	public showGrooveSelector: boolean = $state(false);
	public showResetConfirmation: boolean = $state(false);
	public screenWidth: number = $state(1024); // Safe default for SSR

	// Store references
	private gridStore: GridStore;
	private instrumentStore: InstrumentStore;
	private fileStore: FileStore;
	private errorStore: ErrorStore;
	private playbackStore: PlaybackControllerI;
	private cellToolsStore: CellToolsStore;


	// Initialize the store with dependencies
	constructor(
		gridStore: GridStore,
		instrumentStore: InstrumentStore,
		fileStore: FileStore,
		errorStore: ErrorStore,
		playbackStore: PlaybackControllerI,
		cellToolsStore: CellToolsStore
	) {
		this.gridStore = gridStore;
		this.instrumentStore = instrumentStore;
		this.fileStore = fileStore;
		this.errorStore = errorStore;
		this.playbackStore = playbackStore;
		this.cellToolsStore = cellToolsStore;
	}

	// Derived UI state
	public readonly toolbarUi = $derived.by(() => {
		return measurePerf('mapToolbarUi', () =>
			mapToolbarUi(
				this.fileStore.file.name,
				this.errorStore.errors,
				this.darkMode,
				this.playbackStore.isPlayingFile()
			)
		);
	});

	public readonly beatIndicatorUi = $derived.by(() => {
		return measurePerf('mapBeatIndicatorUi', () => mapBeatIndicatorUi(this.gridsUi));
	});

	public readonly gridsUi = $derived.by(() => {
		if (this.gridStore.getGrids().size === 0 ||
			this.instrumentStore.getInstruments().size === 0) {
			return { grids: [] };
		}
		return measurePerf('mapGridUi', () =>
			mapGridUi(
				this.gridStore.getGrids(),
				this.instrumentStore.getInstruments(),
				this.screenWidth
			)
		);
	});

	public readonly instrumentsUi = $derived.by(() => {
		return measurePerf('mapInstrumentsUi', () =>
			mapInstrumentsUi(this.instrumentStore.getInstruments())
		);
	});

	public readonly grooveSelectorUi = $derived.by(() => {
		return measurePerf('mapGrooveSelectorUi', () =>
			mapGrvMkrFilesToGrooveSelectorUi(
				this.fileStore.files,
				this.fileStore.file.id
			)
		);
	});

	public readonly cellToolsUiMap = $derived.by(() => {
		return measurePerf('mapCellToolsUi', () => {
			const result = new Map<GridId, CellToolsUi>();
			for (const gridUi of this.gridsUi.grids) {
				result.set(gridUi.id, mapCellToolsUi(this.cellToolsStore.cellTools, gridUi.id));
			}
			return result;
		});
	});

	setScreenWidth(width: number): void {
		this.screenWidth = width;
		// gridsUi will automatically update via $derived.by when screenWidth changes
	}

	getScreenWidth(): number {
		return this.screenWidth;
	}

	showHelpOverlay() {
		this.shouldShowHelpOverlay = true;
	}

	hideHelpOverlay() {
		this.shouldShowHelpOverlay = false;
	}

	toggleShowHelp() {
		this.shouldShowHelpOverlay = !this.shouldShowHelpOverlay;
	}

	toggleShowDebug() {
		this.shouldShowDebugOverlay = !this.shouldShowDebugOverlay;
	}

	toggleShowGrooveSelector() {
		this.showGrooveSelector = !this.showGrooveSelector;
	}

	hideResetConfirmation() {
		this.showResetConfirmation = false;
	}

	setDarkMode(v: boolean): void {
		this.darkMode = v;
	}
}
