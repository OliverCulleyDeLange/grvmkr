<script lang='ts'>
	import GridCell from "./GridCell.svelte";

    let { grid = Array<Array<Boolean>>, beatsPerBar, beatDivision, gridCell, instruments, onTapGridCell } = $props();
    let cells = $derived(grid[0].length)
</script>

<style>
    .grid {
      display: grid;
      grid-template-columns: repeat(calc(var(--cells) + 1), 1fr);
      gap: 2px;
    }

    .beat-indicator {
        display: grid;
        grid-column: span var(--cells) / span var(--cells);
        grid-column-start: 2;
        grid-template-columns: subgrid;
    }

    .instrument-name {
        grid-template-columns: max-content 1fr;
    }
  </style>

<div class="grid" style="--cells: {cells};">
    <!-- Beat indicator -->
    <div class="beat-indicator">
        {#each Array(cells) as _, currentCell}
            <div
                class="h-2 flex items-center justify-center border border-gray-400"
                    class:bg-green-300={currentCell == gridCell}
                    class:bg-gray-300={currentCell != gridCell}
            >
        </div>
        {/each}
    </div>
    <!-- Note grid -->
    {#each Array(instruments.length) as _, row}
        <!-- Name -->
        <div class="instrument-name">
            <div>{instruments[row].config.audioPath}</div>
        </div>

        {#each Array(cells) as _, col}
            <GridCell text={col + 1} selected={grid[row][col]} onTap={() => onTapGridCell(row, col)} />
        {/each}
    {/each}
</div>