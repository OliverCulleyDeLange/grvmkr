<script lang="ts">
	import { ToolbarEvent, type AppErrorUi, type OnUiEvent } from '$lib';

	let {
		errorsUi,
		onEvent
	}: {
		errorsUi: AppErrorUi[];
		onEvent: OnUiEvent;
	} = $props();
</script>

{#if errorsUi.length > 0}
	<div class="my-4 flex flex-col gap-2">
		{#each errorsUi as error}
			<div class="alert alert-error flex items-start justify-between gap-4">
				<span>{error.message}</span>
				<button
					class="btn btn-circle btn-ghost btn-xs"
					onclick={() => onEvent({ event: ToolbarEvent.DismissError, id: error.id })}
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}
