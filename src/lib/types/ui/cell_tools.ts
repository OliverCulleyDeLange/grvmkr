import type { InstrumentHit } from '$lib';

export type CellToolsEvents = Merge | UnMerge | SelectHitOption;

export enum CellToolsEvent {
	Merge = 'CellToolsEvent.Merge',
	UnMerge = 'CellToolsEvent.UnMerge',
	SelectHitOption = 'CellToolsEvent.SelectHitOption'
}
export type Merge = {
	event: CellToolsEvent.Merge;
	side: 'left' | 'right';
};
export type UnMerge = {
	event: CellToolsEvent.UnMerge;
};
export type SelectHitOption = {
	event: CellToolsEvent.SelectHitOption;
	instrumentHits: InstrumentHit[];
};

export type CellToolsUi = {
	// Whether to show the entire UI. Only shown when cell selected
	show: boolean;
	hitOptions: Map<string, InstrumentHit[]>;
	showMergeRight: boolean;
	showMergeLeft: boolean;
	showUnMerge: boolean;
	showCopy: boolean;
	showPaste: boolean;
};
