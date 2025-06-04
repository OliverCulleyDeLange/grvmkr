import type { InstrumentHit } from '$lib';

export type CellToolsUi = {
	// Whether to show the entire UI. Only shown when cell selected
	show: boolean;
	hitOptions: Map<string, InstrumentHit[]>;
	showMerge: boolean;
	showUnMerge: boolean;
	showCopy: boolean;
	showPaste: boolean;
};
