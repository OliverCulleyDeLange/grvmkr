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
		name: 'Hi Hat',
		hitTypes: [
			{ ...defaultHitType, key: 'C', description: 'Closed', audioFileName: 'hat_closed.wav' },
			{
				...defaultHitType,
				key: 'O',
				description: 'Open',
				audioFileName: 'hat_open.wav',
				volume: defaultVolume
			}
		]
	},
	{
		name: 'Snare',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'snare.wav' }]
	},
	{
		name: 'Kick',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'kick.wav' }]
	},
	{
		name: 'Surdo L',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_l.wav' }]
	},
	{
		name: 'Surdo M',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_m.wav' }]
	},
	{
		name: 'Surdo H',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'surdo_h.wav' }]
	},
	{
		name: 'Repinique',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Hit', audioFileName: 'repinique_hit.wav' },
			{ ...defaultHitType, key: 'r', description: 'Rim', audioFileName: 'repinique_rim.wav' },
			{ ...defaultHitType, key: 'H', description: 'Hand', audioFileName: 'repinique_hand.wav' }
		]
	},
	{
		name: 'Caixa',
		hitTypes: [
			{ ...defaultHitType, key: 'X', description: 'Accent', audioFileName: 'caixa.wav' },
			{ ...defaultHitType, key: 'x', description: 'Ghost', audioFileName: 'caixa_ghost.wav' }
		]
	},
	{
		name: 'Tamborim',
		hitTypes: [{ ...defaultHitType, key: 'X', description: '', audioFileName: 'tamborim.wav' }]
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
			{ ...defaultHitType, key: 'X', description: '', audioFileName: 'shaker_a.wav' },
			{ ...defaultHitType, key: 'x', description: '', audioFileName: 'shaker_g.wav' }
		]
	}
];
