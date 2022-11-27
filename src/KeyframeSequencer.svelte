<script>


export let keyframes = [];
export let currentKeyframe = 0;

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

let useExpanded = false;

let beats = "1\u00A0e\u00A0+\u00A0a\u00A02\u00A0e\u00A0+\u00A0a\u00A03\u00A0e\u00A0+\u00A0a\u00A04\u00A0e\u00A0+\u00A0a\u00A0";
let expandedBeat = "1\u00A0\u00A0.\u00A0\u00A0e\u00A0\u00A0.\u00A0\u00A0+\u00A0\u00A0.\u00A0\u00A0a\u00A0\u00A0.\u00A0\u00A02\u00A0\u00A0.\u00A0\u00A0e\u00A0\u00A0.\u00A0\u00A0+\u00A0\u00A0.\u00A0\u00A0a\u00A0\u00A0.\u00A0\u00A03\u00A0\u00A0.\u00A0\u00A0e\u00A0\u00A0.\u00A0\u00A0+\u00A0\u00A0.\u00A0\u00A0a\u00A0\u00A0.\u00A0\u00A04\u00A0\u00A0.\u00A0\u00A0e\u00A0\u00A0.\u00A0\u00A0+\u00A0\u00A0.\u00A0\u00A0a\u00A0\u00A0.\u00A0\u00A0"

$: allBeats = useExpanded ? expandedBeat + expandedBeat + expandedBeat: beats + beats +beats;

var div;

var scroll = 0;

function openKeyframe(no)
{
	dispatch('openKeyframe', no)	
}

function toggleExpanded()
{
	if(useExpanded)
		scroll = scroll/3;
	else
		scroll = scroll*3;
	useExpanded = !useExpanded;
}

function keyframeSymbol(no, keyframes, currentKeyframe)
{
	if(no == currentKeyframe)
		return "O";
	if(keyframes.indexOf(no) > -1)
		return "x";
	return "_"
}

function handleScroll(e)
{
	scroll = scroll + e.wheelDelta/4;
	scroll = Math.min(0, scroll);

	addLengthToTimeline();

	e.preventDefault();
}

function addLengthToTimeline()
{
	let prop = div.style.left || "0px";

	if(div.scrollWidth - 500 + scroll < 0)
	{
		allBeats += useExpanded ? expandedBeat : beats;
		//setTimeout(addLengthToTimeline, 10);
	}
}

</script>

<main>
	<div bind:this={div} style={`left: ${scroll}px`} on:wheel={handleScroll}>
		{#each allBeats as char,i}
			<span class='vert'>
				<span class='char' on:click={()=>openKeyframe(i*(useExpanded ? 2 : 6))}>{keyframeSymbol(i*(useExpanded ? 2 : 6), keyframes, currentKeyframe)}</span><br><span class='char'>{char}</span>
			</span>
		{/each}
	</div>
</main>
<button on:click={toggleExpanded}>{useExpanded ? "E" : "N"}</button>


<style>

	main {
		display: inline-block;
		vertical-align: middle;
		white-space: nowrap;
		width: 500px;
		overflow-x: hidden;

		position: relative;

		padding:20px;
		padding-right:0px;


	}

	main > div {
		position: relative;
		display: inline-block;

		transition-property: left;
  		transition-duration: .05s;
	}

	.vert {
		display: inline-block;
		cursor:pointer;
	}

	.char {
		display: inline-block;
		width:15px;
		text-align: center;
	}
</style>
