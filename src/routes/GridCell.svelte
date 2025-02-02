<script lang='ts'>
    let { text, selected, onTap} = $props();
</script>

<button onclick={onTap} class="h-8 flex items-center justify-center border border-gray-400"
    class:bg-green-300={selected}
    class:bg-gray-300={!selected}
>
   {text}
</button>