// Utility for measuring and logging performance of a function
export function measurePerf<T>(label: string, fn: () => T): T {
	performance.mark(label + '-start');
	const result = fn();
	performance.mark(label + '-end');
	performance.measure(label, label + '-start', label + '-end');
	performance.clearMarks(label + '-start');
	performance.clearMarks(label + '-end');
	performance.clearMeasures(label);
	return result;
}

export function measurePaint(callback: (i: number) => void = () => {}): void {
	const start = performance.now();
	requestAnimationFrame(() => {
		const end = performance.now();
		if (callback) callback(end - start);
	});
}
