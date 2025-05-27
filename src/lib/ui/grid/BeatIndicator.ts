// The top row, indicating which beat is playing

export type BeatIndicator = {
	playing: boolean;
	isBeat: boolean;
	isFirstBeatOfBar: boolean;
	text: string;
};
