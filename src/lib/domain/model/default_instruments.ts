import { type HitType, type InstrumentConfig } from '$lib';

export const defaultVolume = 0.8;

export const defaultHitType: HitType = {
	key: 'X',
	description: '',
	audioFileName: '',
	volume: defaultVolume
};

export const defaultInstrumentConfig: InstrumentConfig = {
	name: 'Instrument',
	hitTypes: [defaultHitType]
};

export const defaultInstruments: Array<InstrumentConfig> = [
	{
		name: 'Surdo L',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_l.mp3' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_l_muted.mp3' },
		]
	},
	{
		name: 'Surdo M',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_m.mp3' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_m_muted.mp3' },
		]
	},
	{
		name: 'Surdo H',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_h.mp3' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_h_muted.mp3' },
		]
	},
	{
		name: 'Repinique',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Hit', audioFileName: 'repinique_hit.mp3' },
			{ ...defaultHitType, key: 'Xx', description: 'Hit', audioFileName: 'repinique_hit_roll.mp3' },
			{ ...defaultHitType, key: 'r', description: 'Rim', audioFileName: 'repinique_rim.mp3' },
			{ ...defaultHitType, key: 'rr', description: 'Rim Double', audioFileName: 'repinique_rim_double.mp3' },
			{ ...defaultHitType, key: 'H', description: 'Hand', audioFileName: 'repinique_hand.mp3' },
			{ ...defaultHitType, key: 'h', description: 'Hand ghost', audioFileName: 'repinique_hand_ghost.mp3' },
		]
	},
	{
		name: 'Caixa',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Accent', audioFileName: 'caixa.mp3' },
			{ ...defaultHitType, key: 'x', description: 'Ghost', audioFileName: 'caixa_ghost.mp3' },
			{ ...defaultHitType, key: 'R', description: 'Rim', audioFileName: 'caixa_rim.mp3' },
			{ ...defaultHitType, key: 'r', description: 'Roll', audioFileName: 'caixa_roll.mp3' },
		]
	},
	{
		name: 'Tamborim',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'tamborim.mp3' },
			{ ...defaultHitType, key: 'x', description: '', audioFileName: 'tamborim_ghost.mp3' },
		]
	},
	{
		name: 'Agogo Bell',
		hitTypes: [
			{ ...defaultHitType, key: 'H', description: 'High', audioFileName: 'agogo_bell_high.mp3' },
			{ ...defaultHitType, key: 'L', description: 'Low', audioFileName: 'agogo_bell_low.mp3' },
		]
	},
	{
		name: 'Timba',
		hitTypes: [
			{ ...defaultHitType, key: 'S', description: 'Slap', audioFileName: 'timba_slap.mp3' },
			{ ...defaultHitType, key: 'O', description: 'Open', audioFileName: 'timba_open.mp3' }
		]
	},
	{
		name: 'Shaker',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Accent', audioFileName: 'shaker_accent.mp3' },
			{ ...defaultHitType, key: 'x', description: 'Ghost', audioFileName: 'shaker_ghost.mp3' }
		]
	},
	{
		name: 'Oi',
		hitTypes: [
			{ ...defaultHitType, key: 'Oi', description: '', audioFileName: 'oi.mp3' },
		]
	},
	{
		name: 'Whistle',
		hitTypes: [
			{ ...defaultHitType, key: 'W', description: '', audioFileName: 'whistle.mp3' },
		]
	}
];
