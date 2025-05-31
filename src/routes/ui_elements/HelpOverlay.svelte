<script lang="ts">
	let {
		closeDialog,
		reset
	}: {
		closeDialog: () => void;
		reset: () => void;
	} = $props();
</script>

<dialog open class="modal">
	<div class="modal-box border border-2 border-gray-400">

		<button
			class="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
			aria-label="Close"
			onclick={closeDialog}
		>
			╳
		</button>

		<h3 class="text-lg font-bold">What is this?</h3>
		<p class="py-4">
			This is GrvMkr (Groove Maker), a percussion grid notation tool. It is designed to easily
			create grid notation, listen to the patterns, and print or save them as PDFs
		</p>

		<h3 class="text-lg font-bold">...but why?</h3>
		<p class="py-4">
			This is meant to replace Mango Drum, a discontinued old windows only software that does pretty
			much the same thing. I have no affiliation with Mango Drum, I built this because I was asked
			nicely by my mother, and you must <strong>always</strong> do as your mother says.
		</p>

		<h3 class="text-lg font-bold">Tips & Tricks</h3>
		<p class="py-4">
			On desktop, you can multi-select cells by holding shift and clicking. Then you can copy and
			paste them with ctrl+c and ctrl+v.
		</p>
		<p class="py-4">Play and pause by pressing space.</p>

		<h3 class="text-lg font-bold">Issues & Feature Requests</h3>
		<p>
			If you're on an iPhone and can't hear anything, make sure your silent switch isn't enabled.
		</p>
		<p>
			If you're having unresolvable problems, you can reset the app state - but this will delete everything, and i mean EVERYTHING. 
		</p>
		<button class="btn btn-outline btn-sm" onclick={reset}>Reset</button>
		<p class="py-4">
			This is not a commercial product, but a hobby project. If you notice any issues or think of a
			way this could be more useful, please feel free to reach out at
			<a class="link link-primary" href="mailto:grvmkr@oliverdelange.co.uk"
				>grvmkr@oliverdelange.co.uk</a
			>, and i may or may not respond 😇
		</p>
		<p>
			The code is on <a
				class="link link-primary"
				href="https://github.com/OliverCulleyDeLange/grvmkr">GitHub</a
			>
		</p>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
