<script>
	import {invoke} from '@tauri-apps/api/tauri';
	import {colors} from "./colors.js";
	import {createEventDispatcher} from "svelte";

	export let selected = -1;
	export let clips = [];
	export let page = 0;

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

	function hasSequence(clips, x, y)
	{
		let addr = toPadAddress(x,y);
		return clips[addr] && clips[addr].sequence
	}

	function hasPattern(clips, x, y)
	{
		let addr = toPadAddress(x,y);
		return clips[addr] && clips[addr].pattern
	}

	function hasAudio(clips, x, y)
	{
		let addr = toPadAddress(x,y);
		return clips[addr] && clips[addr].audio
	}

	function changePage(e)
	{
		let value = e.value != undefined ? e.value : e.target.value;

		dispatch("changePage", value);
	}

</script>


<main>
	
	{#each [0,1,2,3,4,5,6,7,8] as y}
		<div>
			{#each [0,1,2,3,4,5,6,7,8] as x}
				{#if !(y ==0 && x ==8)}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div class={getClass(selected, x, y)} on:click={() => onButtonPress(toPadAddress(x,y))}>
						{#if hasAudio(clips,x,y)}
							<div class='loaded-audio'></div>
						{/if}
						{#if hasLightClip(clips,x,y)}
							<div class='loaded-light'></div>
						{/if}
						{#if hasSequence(clips,x,y)}
							<div class='loaded-sequence'></div>
						{/if}
						{#if hasPattern(clips,x,y)}
							<div class='loaded-pattern'></div>
						{/if}
					</div>
				{:else}
					<div class={"control-square"}>
						<input value={page} on:change={changePage} /><br>
						
						<button on:click={()=>changePage({value:(Math.max(page-1,0))})}>-</button><button on:click={()=>changePage({value:(page+1)})}>+</button>
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

	.control-square {
		height: .5in;
		width: .5in;
		display: inline-block;
		margin: 0px 5px 5px 0px;
		vertical-align: top;
	}

	.button.selected {
		outline: solid 5px #00ffff;
	}

	.loaded-light {
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-right: .5in solid #FFAAAA; 
	}

	.loaded-sequence {
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-right: .5in solid #ffff66; 
	}

	.loaded-pattern {
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-right: .5in solid #73ff8a; 
	}

	.loaded-audio {
		
		border-top: .5in solid transparent;
		border-bottom: .5in solid transparent; 
		border-left: .5in solid #AAAAFF; 
		position: absolute;
		top:-.5in;
	}

	input 
	{
		font-size: 8pt;
		vertical-align: top;
		width: .4in;
		margin: 0;
	}
	button {
		font-size: 8pt;
		vertical-align: top;
		margin:0;
	}
</style>