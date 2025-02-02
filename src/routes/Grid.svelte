<script lang='ts'>
	import type { GridModel } from "$lib";
	import type { CellLocator } from "$lib/types";
	import GridCell from "./GridCell.svelte";

    type OnTapGridCell = (locator: CellLocator) => void
    let { grid, onTapGridCell }: { grid: GridModel, onTapGridCell: OnTapGridCell } = $props();
    let cells = $derived(grid.gridCells)
    let gridCell = $derived(grid.currentCell)
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
                class="h-6 flex items-center justify-center border border-gray-400"
                    class:bg-green-300={currentCell == gridCell}
                    class:bg-gray-300={currentCell != gridCell}
            >
            <!-- {currentCell.text} -->
        </div>
        {/each}
    </div>
    <!-- Note grid -->
    {#each grid.rows as row, rowI}
        <!-- Name -->
        <div class="instrument-name">
            <div>{row.config.name}</div>
        </div>

        {#each row.notation.bars as bar, barI}
            {#each bar.beats as beat, beatI}
                {#each beat.divisions as division, divisionI}
                    <GridCell text={division.hitType} selected={division.hitType != undefined} onTap={() => onTapGridCell({ row: rowI, notationLocator: { bar: barI, beat: beatI, division: divisionI} })} />
                {/each}
            {/each}
        {/each}
    {/each}
</div>