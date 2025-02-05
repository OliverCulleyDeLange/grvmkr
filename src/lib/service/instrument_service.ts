import type { InstrumentWithId, HitTypeWithId } from "$lib";
import type { InstrumentDto, HitDto } from "$lib";
import { InstrumentTable } from "$lib";
import { HitTable } from "$lib";
import { SvelteMap } from "svelte/reactivity";

export class InstrumentService {
    private instrumentTable = new InstrumentTable();
    private hitTable = new HitTable();

    // ✅ Save an instrument and its hits
    async saveInstrument(instrument: InstrumentWithId): Promise<void> {
        const hitDtos: HitDto[] = [];
        const hitIds: string[] = [];

        instrument.hitTypes.forEach((hitType, hitId) => {
            hitDtos.push({
                id: hitId,
                key: hitType.key,
                description: hitType.description,
                audioFileName: hitType.audioFileName
            });
            hitIds.push(hitId);
        });

        // Save all hit DTOs
        await Promise.all(hitDtos.map(hit => this.hitTable.saveHit(hit)));

        // Convert instrument to DTO and store it
        const instrumentDto: InstrumentDto = {
            id: instrument.id,
            gridIndex: instrument.gridIndex,
            name: instrument.name,
            hitTypes: hitIds // Store only the hit IDs
        };

        await this.instrumentTable.saveInstrument(instrumentDto);
    }

    // ✅ Get an instrument by ID (with hitTypes mapped back)
    async getInstrument(id: string): Promise<InstrumentWithId | null> {
        const instrumentDto = await this.instrumentTable.getInstrument(id);
        if (!instrumentDto) return null;

        // Fetch all hitTypes associated with the instrument
        const hitTypeEntries = await Promise.all(
            instrumentDto.hitTypes.map(async (hitId) => {
                const hitDto = await this.hitTable.getHit(hitId);
                return hitDto ? [hitId, hitDto] : null;
            })
        );

        // Filter out nulls and convert array to a Map
        const hitTypes = new Map(hitTypeEntries.filter((entry): entry is [string, HitDto] => entry !== null));

        // Map back to domain model
        return {
            id: instrumentDto.id,
            gridIndex: instrumentDto.gridIndex,
            name: instrumentDto.name,
            hitTypes: new Map(
                Array.from(hitTypes.entries()).map(([hitId, hit]) => [
                    hitId,
                    { id: hitId, key: hit.key, description: hit.description, audioFileName: hit.audioFileName }
                ])
            )
        };
    }

    // ✅ Get all instruments
    async getAllInstruments(): Promise<InstrumentWithId[]> {
        const instrumentDtos = await this.instrumentTable.getAllInstruments();

        return Promise.all(
            instrumentDtos.map(async (instrumentDto) => {
                const hitTypeEntries = await Promise.all(
                    instrumentDto.hitTypes.map(async (hitId) => {
                        const hitDto = await this.hitTable.getHit(hitId);
                        return hitDto ? [hitId, hitDto] : null;
                    })
                );
                const removedNulls = hitTypeEntries.filter((entry): entry is [string, HitDto] => entry !== null)
                const hitTypes = new SvelteMap(removedNulls);

                let reactiveHitTypes = new SvelteMap(
                    Array.from(hitTypes.entries()).map(([hitId, hit]) => {
                        let hitWithId: HitTypeWithId = {
                            id: hitId,
                            key: hit.key,
                            description: hit.description,
                            audioFileName: hit.audioFileName
                        };
                        return [hitId, hitWithId]
                    })
                )
                let instrumentWithId: InstrumentWithId = {
                    id: instrumentDto.id,
                    gridIndex: instrumentDto.gridIndex,
                    name: instrumentDto.name,
                    hitTypes: reactiveHitTypes
                };
                return instrumentWithId
            })
        );
    }

    // ✅ Delete an instrument and its associated hits
    async deleteInstrument(id: string): Promise<void> {
        const instrument = await this.getInstrument(id);
        if (!instrument) return;

        // Delete associated hits
        await Promise.all(Array.from(instrument.hitTypes.keys()).map(hitId => this.hitTable.deleteHit(hitId)));

        // Delete instrument
        await this.instrumentTable.deleteInstrument(id);
    }

    // ✅ Delete all instruments and all hits
    async deleteAllInstruments(): Promise<void> {
        await this.instrumentTable.deleteAllInstruments();
        await this.hitTable.deleteAllHits();
    }
}
