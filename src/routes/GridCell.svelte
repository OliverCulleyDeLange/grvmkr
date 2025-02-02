<script lang='ts'>
    let { text, beat, selected, onTap} = $props();
</script>

<button onclick={onTap} class="h-8 bg-gray-300 flex items-center justify-center border border-gray-400 {beat ? "brightness-[0.8]" : ""}">
   {text}
</button>