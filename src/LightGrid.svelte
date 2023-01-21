<script>

	import {createEventDispatcher} from "svelte";
	import {colors} from "./colors.js";
	export let lightArray = null;
	export let paintColor = 0;

	let dispatch = createEventDispatcher();

	lightArray.updateControl = function()
	{
		lightArray = lightArray;
	}

	function onMouseOver(e, light)
	{
		if(e.buttons == 1)
		{
			lightArray.setSync(true);
			light.lightOn(paintColor);
			
			dispatch("saveKeyframe");

			lightArray = lightArray;
		}
		else if(e.buttons == 2)
		{
			e.stopPropagation();
			e.preventDefault();
			paintColor = light.componentColor;
		}
	}

</script>


<main>
	
	{#each lightArray.array as outer}
		<div>
			{#each outer as light}
				<div class='light' 
					style={"background-color: " + colors[light.componentColor]}
					on:mouseover={(e) => onMouseOver(e, light)}
					on:mousedown={(e) => onMouseOver(e, light)}
					on:dragstart={(e) => e.preventDefault()}
					></div>
			{/each}
		</div>
	{/each}
</main>

<style>

	* {
		font-size: 0pt;
	}

	.light {
		height: .7in;
		width: .7in;
		background-color: #465391;

		display: inline-block;
		margin: 0px 5px 5px 0px;

		user-drag: none;
	}	
</style>