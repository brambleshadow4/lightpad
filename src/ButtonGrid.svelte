<script>
	import {invoke} from '@tauri-apps/api/tauri';
	import {colors} from "./colors.js";
	import {createEventDispatcher} from "svelte";

	export let selected = -1;

	let dispatch = createEventDispatcher();

	function toPadAddress(x,y)
	{
		return (9-y)*10+ 1 + x;
	}

	function onButtonPress(padAddress)
	{
		selected = padAddress;
		dispatch("change", selected);

	}

	function getClass(selected, x, y)
	{
		return 'button' + (selected==toPadAddress(x,y)?" selected":"")
	}

</script>


<main>
	
	{#each [0,1,2,3,4,5,6,7,8] as y}
		<div>
			{#each [0,1,2,3,4,5,6,7,8] as x}
				{#if !(y ==0 && x ==8)}
					<div class={getClass(selected, x, y)} on:click={() => onButtonPress(toPadAddress(x,y))}></div>
				{/if}
			{/each}
		</div>
	{/each}
</main>

<style>

	* {
		font-size: 0pt;
	}

	.button {
		height: .5in;
		width: .5in;
		background-color: #616161;

		display: inline-block;
		margin: 0px 5px 5px 0px;

		user-drag: none;
	}

	.button.selected {
		outline: solid 5px #00ffff;
	}
</style>