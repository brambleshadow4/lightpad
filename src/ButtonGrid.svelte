<script>
	import {invoke} from '@tauri-apps/api/tauri';
	import {colors} from "./colors.js";
	import {createEventDispatcher} from "svelte";

	export let selected = -1;
	export let clips = [];

	console.log(clips);

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

	function hasLightClip(clips, x, y)
	{
		let addr = toPadAddress(x,y);
		return clips[addr] && clips[addr].attack
	}

	function hasAudio(clips, x, y)
	{
		let addr = toPadAddress(x,y);
		return clips[addr] && clips[addr].audio
	}

</script>


<main>
	
	{#each [0,1,2,3,4,5,6,7,8] as y}
		<div>
			{#each [0,1,2,3,4,5,6,7,8] as x}
				{#if !(y ==0 && x ==8)}
					<div class={getClass(selected, x, y)} on:click={() => onButtonPress(toPadAddress(x,y))}>
						{#if hasAudio(clips,x,y)}
							<div class='loaded-audio'></div>
						{/if}
						{#if hasLightClip(clips,x,y)}
							<div class='loaded-light'></div>
						{/if}
					</div>
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
		overflow: hidden;
		position: relative;
	}

	.button.selected {
		outline: solid 5px #00ffff;
	}

	.loaded-light {
		
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-right: .5in solid #FFAAAA; 
	}

	.loaded-audio {
		
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-left: .5in solid #AAAAFF; 
		position: absolute;
		top:-.5in;

	}
</style>