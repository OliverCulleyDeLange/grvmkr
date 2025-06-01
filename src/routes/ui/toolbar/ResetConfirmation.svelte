<script lang="ts">
	
	let {
		reset,
		close
	}: {
		reset: () => void;
		close: () => void;
	} = $props();

</script>

<dialog open class="modal">
	<div class="modal-box border border-2 border-gray-400">
		<h3 class="text-lg font-bold">This will reset and delete EVERYTHING</h3>
		<p class="py-4">Are you sure?</p>
		<button onclick={reset} class={`btn btn-outline m-2`}> Yes, reset and delete everything</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={close}>close</button>
	</form>
</dialog>
