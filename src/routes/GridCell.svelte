<script lang='ts'>
    let { text, darken, onTap} = $props();
</script>

<button onclick={onTap} class="h-8 bg-gray-300 flex items-center justify-center border border-gray-400 {darken ? "brightness-[0.8]" : ""}">
   {text}
</button>