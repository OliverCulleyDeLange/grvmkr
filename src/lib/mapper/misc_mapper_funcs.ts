export function calculateMsPerBeatDivision(bpm: number, beatDivisions: number): number {
    return 60000 / bpm / beatDivisions;
}
