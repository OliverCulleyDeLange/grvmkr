<script lang='ts'>
	import type { GridModel } from "$lib";
	import type { CellLocator} from "$lib/types";
	import GridCell from "./GridCell.svelte";

    type OnTapGridCell = (locator: CellLocator) => void
    let { grid, onTapGridCell }: { grid: GridModel, onTapGridCell: OnTapGridCell } = $props();
    let cells = $derived(grid.gridCols)
    let currentColumn = $derived(grid.currentColumn)

    $effect(() => {
        // This is jank, but i dunno how to do it better yet
        let requiredGridCols = grid.gridCols;
        let actualGridCols = grid.notationColumns();
        if (requiredGridCols != actualGridCols){
               grid.resizeGrid()
        }
    })
</script>

<style>
    .grid {
      display: grid;
      grid-template-columns: auto repeat(var(--cells), 1fr);
      gap: 2px;
    }

    .beat-indicator {
        display: grid;
        grid-column: span var(--cells) / span var(--cells);
        grid-column-start: 2;
        grid-template-columns: subgrid;
    }
    
  </style>

<div class="grid" style="--cells: {cells};">
    <!-- Beat indicator -->
    <div class="beat-indicator">
        {#each Array(cells) as _, currentCell}
            <div
                class="h-6 flex items-center justify-center border border-gray-400 {currentCell % grid.beatsPerBar == 0 ? "brightness-[0.8]" : ""}"
                    class:bg-green-300={currentCell == currentColumn}
                    class:bg-gray-300={currentCell != currentColumn}
            >
            <!-- {currentCell.text} -->
        </div>
        {/each}
    </div>
    <!-- Note grid -->
    {#each grid.rows as row, rowI}
        <!-- Name -->
        <div class="px-2">
            <div>{row.config.name}</div>
        </div>

        {#each row.notation.bars as bar, barI}
            {#each bar.beats as beat, beatI}
                {#each beat.divisions as division, divisionI}
                    <GridCell 
                    text={division.hitType} 
                    beat={divisionI == 0} 
                    selected={division.hitType != undefined}
                    onTap={() => onTapGridCell({ row: rowI, notationLocator: { bar: barI, beat: beatI, division: divisionI} })} 
                    />
                {/each}
            {/each}
        {/each}
    {/each}
</div>