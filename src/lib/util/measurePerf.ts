// Utility for measuring and logging performance of a function
export function measurePerf<T>(label: string, fn: () => T): T {
	performance.mark(label + '-start');
	const result = fn();
	performance.mark(label + '-end');
	performance.measure(label, label + '-start', label + '-end');
	const measures = performance.getEntriesByName(label, 'measure');
	const lastMeasure = measures[measures.length - 1];
	console.log(`[PERF] ${label} measure:`, lastMeasure ? lastMeasure.duration.toFixed(2) + 'ms' : 'n/a');
	// Optionally clear marks/measures if you don't want history:
	// performance.clearMarks(label + '-start');
	// performance.clearMarks(label + '-end');
	// performance.clearMeasures(label);
	return result;
}

export function measurePaint(
	threshold: number = 5,
	callback: (i: number) => void = () => { },
): void {
	const start = performance.now();
	requestAnimationFrame(() => {
		const end = performance.now();
		if (callback) callback(end - start);
		if (end - start > threshold) {
			console.log('Time to next paint:', end - start, 'ms');
		}
	});
}