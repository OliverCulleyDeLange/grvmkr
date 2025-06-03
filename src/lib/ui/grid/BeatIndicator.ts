// The top row, indicating which beat is playing

export type BeatIndicatorUi = {
	playing: boolean;
	isBeat: boolean;
	isFirstBeatOfBar: boolean;
	text: string;
};
