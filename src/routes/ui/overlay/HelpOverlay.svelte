<script lang="ts">
	import { base } from '$app/paths';

	let {
		closeDialog,
		reset,
		debug,
		loadExample
	}: {
		closeDialog: () => void;
		reset: () => void;
		debug: () => void;
		loadExample: () => void;
	} = $props();

	const tipSections = [
		{
			title: 'Quick keyboard workflow',
			tips: [
				'Click to select a cell. Click again to cycle through sounds.',
				'Type a hit key, then use the arrow keys to move and build a pattern.',
				'Delete or Backspace clears selected cells.',
				'Use Cmd/Ctrl+C and Cmd/Ctrl+V to copy and paste cells.',
				'Hit keys are case-sensitive: X and x can be different sounds.',
				'For keys like Xx or rr, type the characters quickly.',
				'Press Space to play or stop the last grid or file.',
				'Shortcuts pause while typing in text fields.'
			]
		},
		{
			title: 'Editing grids',
			tips: [
				'Drag across cells to select a range. Or select one, then Shift-click another.',
				'Merge cells for rolls, triplets, or uneven timing. Un-Merge splits them.',
				'Grid size is beats / divisions. For example, 4 / 4 has four beats of four cells.',
				'Each grid has its own name, size, tempo, and repetitions.',
				'Use Grid Tools to duplicate, reorder, or delete grids.'
			]
		},
		{
			title: 'Playback',
			tips: [
				'Play Grid loops one grid while you work.',
				'Play File plays every grid in order, using each grid’s repetitions.',
				'Edit while playing to hear changes immediately.',
				'Each grid has its own BPM.',
				'Mute, solo, and volume control each instrument.'
			]
		},
		{
			title: 'Instruments and sounds',
			tips: [
				'Add, rename, reorder, or delete instruments.',
				'Each sound has its own key, description, and sample.',
				'Use Add Hit for another sound. Use the sample button to upload audio.',
				'Use Play beside a sound to preview it.',
				'Mute silences an instrument. Solo isolates it. Volume sets its level.'
			]
		},
		{
			title: 'Saving and sharing',
			tips: [
				'Your work saves automatically in this browser.',
				'Use My Grooves to switch grooves. Use New to start one.',
				'You cannot delete the open groove from My Grooves.',
				'Save to File exports a groove and its samples. Load File imports one as a new copy.',
				'Print / Save PDF creates a print-friendly version.',
				'Export files for backups or sharing between devices.',
				'GrvMkr supports light and dark themes and works offline after loading once.',
				'Reset deletes all local grooves and samples. Export anything important first.'
			]
		}
	];
</script>

<dialog open class="modal">
	<div class="modal-box border border-2 border-gray-400">
		<button
			class="absolute right-4 top-4 text-xl text-gray-500 hover:text-black"
			aria-label="Close"
			onclick={closeDialog}
		>
			╳
		</button>

		<h3 class="text-lg font-bold">Welcome to GrvMkr</h3>
		<p class="py-4">
			This is a tool for creating and sharing percussion grid notation. You can also listen to your
			grooves, and print or save them as PDFs.
		</p>
		<p>
			To get a feel for what you can do with this tool, try loading the example groove, and give it
			a listen!
		</p>
		<button onclick={loadExample} class={`btn btn-outline my-8`}> Load the example groove! </button>

		<h3 class="text-lg font-bold">Why does this exist?</h3>
		<p class="py-4">
			This is meant to replace Mango Drum, a discontinued old windows only software that does pretty
			much the same thing. I have no affiliation with Mango Drum, I built this because I was asked
			nicely by my mother, and you must <strong>always</strong> do as your mother says.
		</p>

		<h3 class="text-lg font-bold">Tips & Tricks</h3>
		<p class="py-2">Open a section for a quick guide to that part of GrvMkr.</p>
		<div class="mb-6 flex flex-col gap-2">
			{#each tipSections as section}
				<details class="rounded-lg border border-gray-300 bg-base-100 dark:border-gray-600">
					<summary class="cursor-pointer select-none px-4 py-3 font-bold">
						{section.title}
					</summary>
					<ul class="mx-8 mb-4 list-disc space-y-2">
						{#each section.tips as tip}
							<li>{tip}</li>
						{/each}
					</ul>
				</details>
			{/each}
		</div>

		<h3 class="text-lg font-bold">Issues & Feature Requests</h3>
		<p class="py-2">
			<span class="font-bold">⚠️ iPhone users: </span> If you can't hear anything, make sure your silent
			switch isn't enabled. There's a technical limitation around playing sounds in silent mode 😅
		</p>
		<p class="py-2">
			If you're having unresolvable problems, you can reset the app state - but this will delete
			everything, and i mean EVERYTHING. Please download your groove files to your device before
			resetting to avoid losing work.
		</p>
		<button class="btn btn-outline btn-sm my-2" onclick={reset}>Reset</button>
		<p>
			There's a fun little debug window available, mainly for me, but you might find it interesting
		</p>
		<button class="btn btn-outline btn-sm my-2" onclick={debug}>Debug</button>
		<p class="py-4">
			If you do notice any issues or think of a way this could be more useful, please feel free to
			reach out at
			<a class="link link-primary" href="mailto:grvmkr@oliverdelange.co.uk"
				>grvmkr@oliverdelange.co.uk</a
			>
		</p>
		<p>
			The code is on <a
				class="link link-primary"
				href="https://github.com/OliverCulleyDeLange/grvmkr">GitHub</a
			>
		</p>
		<a href="{base}/privacy" class="link link-primary">Privacy policy</a>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
