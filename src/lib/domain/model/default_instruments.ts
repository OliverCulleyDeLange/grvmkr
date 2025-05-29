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
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_l.wav' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_l_muted.wav' },
		]
	},
	{
		name: 'Surdo M',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_m.wav' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_m_muted.wav' },
		]
	},
	{
		name: 'Surdo H',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_h.wav' },
			{ ...defaultHitType, key: 'm', description: 'Muted', audioFileName: 'surdo_h_muted.wav' },
		]
	},
	{
		name: 'Repinique',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Hit', audioFileName: 'repinique_hit.wav' },
			{ ...defaultHitType, key: 'r', description: 'Rim', audioFileName: 'repinique_rim.wav' },
			{ ...defaultHitType, key: 'H', description: 'Hand', audioFileName: 'repinique_hand.wav' },
			{ ...defaultHitType, key: 'D', description: 'Double', audioFileName: 'repinique_double.wav' },
			{ ...defaultHitType, key: 'R', description: 'Roll', audioFileName: 'repinique_roll.wav' }
		]
	},
	{
		name: 'Caixa',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Accent', audioFileName: 'caixa.wav' },
			{ ...defaultHitType, key: 'x', description: 'Ghost', audioFileName: 'caixa_ghost.wav' },
			{ ...defaultHitType, key: 'r', description: 'Roll', audioFileName: 'caixa_roll.wav' },
		]
	},
	{
		name: 'Tamborim',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'tamborim.wav' },
			{ ...defaultHitType, key: 'x', description: '', audioFileName: 'tamborim_ghost.wav' },
		]
	},
	{
		name: 'Agogo Bell',
		hitTypes: [
			{ ...defaultHitType, key: 'H', description: 'High', audioFileName: 'agogo_bell_high.wav' },
			{ ...defaultHitType, key: 'L', description: 'Low', audioFileName: 'agogo_bell_low.wav' },
		]
	},
	{
		name: 'Timba',
		hitTypes: [
			{ ...defaultHitType, key: 'S', description: 'Slap', audioFileName: 'timba_slap.wav' },
			{ ...defaultHitType, key: 'O', description: 'Open', audioFileName: 'timba_open.wav' }
		]
	},
	{
		name: 'Shaker',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Accent', audioFileName: 'shaker_accent.wav' },
			{ ...defaultHitType, key: 'x', description: 'Ghost', audioFileName: 'shaker_ghost.wav' }
		]
	},
	{
		name: 'Oi',
		hitTypes: [
			{ ...defaultHitType, key: 'Oi', description: '', audioFileName: 'oi.wav' },
		]
	},
	{
		name: 'Whistle',
		hitTypes: [
			{ ...defaultHitType, key: 'W', description: '', audioFileName: 'whistle.wav' },
		]
	}
];
