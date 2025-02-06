<script lang="ts">
	let {
		closeDialog
	}: {
		closeDialog: () => void;
	} = $props();
</script>

<dialog open class="modal">
	<div class="modal-box bg-gray-700 border border-gray-400 border-2">
		<h3 class="text-lg font-bold">What is this?</h3>
		<p class="py-4">This is GrvMkr (Groove Maker), a percussion grid notation tool. 
            It is designed to easily create grid notation, listen to the patterns, and print or save them as PDFs</p>
            
        <h3 class="text-lg font-bold">...but why?</h3>
		<p class="py-4">This is meant to replace Mango Drum, a discontinued old windows only software that does pretty much the same thing. 
            I have no affiliation with Mango Drum, I built this because I was asked nicely by my mother, and you must <strong>always</strong> do as your mother says.
         </p>

        <h3 class="text-lg font-bold">Issues & Feature Requests</h3>
		<p class="py-4">
            This is not a commercial product, but a hobby project.
            If you notice any issues or think of a way this could be more useful, please feel free to reach out at
            <a class="link link-primary" href="mailto:grvmkr@oliverdelange.co.uk">grvmkr@oliverdelange.co.uk</a>, and i may or may not respond 😇
         </p>
		 <p>The code is on <a class="link link-primary" href="https://github.com/OliverCulleyDeLange/grvmkr">GitHub</a></p>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
