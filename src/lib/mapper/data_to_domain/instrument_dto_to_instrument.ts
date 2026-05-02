import type { HitDto, HitTypeWithId, InstrumentDto, InstrumentWithId } from '$lib';
import { SvelteMap } from 'svelte/reactivity';

export function mapInstrumentDtoToInstrumentWithId(
	instrumentDto: InstrumentDto,
	hitTypes: HitTypeWithId[],
): InstrumentWithId {
	return {
		id: instrumentDto.id,
		gridIndex: instrumentDto.gridIndex,
		name: instrumentDto.name,
		hitTypes: new SvelteMap(hitTypes.map((hitType) => [hitType.id, hitType])),
		muted: false,
		soloed: false,
	};
}

export function mapHitDtoToHitTypeWithId(dto: HitDto): HitTypeWithId {
	return {
		id: dto.id,
		key: dto.key ?? 'err',
		description: dto.description,
		audioFileName: dto.audioFileName,
	};
}
