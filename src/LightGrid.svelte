<script lang="ts">

	import {createEventDispatcher} from "svelte";
	import {colors} from "./colors.js";
    import LightArray from "./LightArray";
	export let lightArray: LightArray | null = null;
	export let paintColor = 0;
	export let relativePadPosition = 0;

	export let mode: "one-to-one" | "pattern" = "one-to-one";


	$: buttons = mode == "pattern" ? lightArray.patternArray : lightArray.array;

	let dispatch = createEventDispatcher();

	lightArray.updateControl = function()
	{
		lightArray = lightArray;
	}

	function onMouseOver(e:MouseEvent, light)
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

	function determineClasses(i,j)
	{
		if(i == 7 && j == 7 && mode == "pattern")
		{
			return "light middle";
		}
		return "light";
	}

</script>


<main class={mode}>

	{#each buttons as outer,i}
		<div>
			{#each outer as light,j}
				<!-- svelte-ignore a11y-mouse-events-have-key-events -->
				<div class={determineClasses(i,j)}
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
		height: 6vh;
		width: 6vh;
		background-color: #465391;

		display: inline-block;
		margin: 0px 5px 5px 0px;

		user-drag: none;
	}	

	.pattern .light {

		height: 3.4vh;
		width: 3.4vh;
		margin: 0px 2px 2px 0px;

	}

	.pattern .light.middle {

		border: solid 2px red;
		box-sizing: border-box;

	}
</style>