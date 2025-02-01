<script lang='ts'>
    let { text, selected, onTap} = $props();
</script>

<button onclick={onTap} class="w-8 h-8 {selected ? "bg-green-300" : "bg-gray-300"} flex items-center justify-center border border-gray-400">
   {text}
</button>