
<script>
	import {colors} from "./colors.ts";
	import {createEventDispatcher} from "svelte";

	let dispatch = createEventDispatcher();

	let octals = [0,1,2,3,4,5,6,7];
	let open = false;

	export let value = 0;

	function changeColor(newColor)
	{
		value = newColor;
		open = false;
		dispatch("change", newColor)
	}


</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class='square' on:click={() => {open = true;}} style={"background-color: " + colors[value]}></div>

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<main class='pinned' on:click={() => {open = false;}}>
		<div>
			{#each octals as y}
				<div>
					{#each octals as x}
						<div class='square' 
							style={"background-color: " + colors[y*8+x]}
							on:click={() => changeColor(y*8+x)}
							></div>
					{/each}
					{#each octals as x}
						<div class='square' 
							style={"background-color: " + colors[y*8+x+64]}
							on:click={() => changeColor(y*8+x)}
							></div>
					{/each}
				</div>
			{/each}
			
		</div>
	</main>
{/if}

<style>
	.square {
		width: .5in;
		height:.5in;
		margin: 0;
		display: inline-block;
	}
	main
	{
		position: fixed;
		top:0px;
		bottom:0px;
		left:0px;
		right:0px;
		background-color: rgba(0,0,0,.5);
	}

	main > div {
		position: absolute;
		right:20px;
		top:20px;
		
	}
</style>