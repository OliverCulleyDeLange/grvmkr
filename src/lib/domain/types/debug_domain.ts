
export interface PlaybackDebugMetrics {
	lastBeatTime: number;
	delta: number;
	expected: number;
	onBeat: number;
	position: {
		repetition: number;
		bar: number;
		beat: number;
		beatDivision: number;
		cell: number;
		playingCell: number;
		gridCells: number;
		gridId: string;
		gridName: string;
	};
}
