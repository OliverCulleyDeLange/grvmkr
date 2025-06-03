<script lang="ts">
	let {
		closeDialog,
		reset,
		loadExample
	}: {
		closeDialog: () => void;
		reset: () => void;
		loadExample: () => void;
	} = $props();
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
		<ul class="ml-8 list-disc">
			<li>
				<p class="py-2">
					Select multiple grid cells by dragging cells across a row. On desktop, you can
					multi-select cells by holding shift and clicking. Then you can copy and paste them with
					ctrl+c and ctrl+v.
				</p>
			</li>
			<li>
				<p class="py-2">Play and pause by pressing space.</p>
			</li>
		</ul>

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
		<a href="/privacy" class="link link-primary">Privacy policy</a>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
