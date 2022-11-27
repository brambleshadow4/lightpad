<script>
	import { onMount, createEventDispatcher } from 'svelte';
	export let selectedClip = undefined;
	export let clips = [[],[],[],[]];

	const dispatch = createEventDispatcher();

	let position = 0;
	let zoom = 1;

	export let playbackHead = 0;

	var sequencer;

	$:trackCount = clips.length;

	const MEASURE_WIDTH = 200;

	let horizontalScroll = 0;

	let measures = [1,2,3,4];
	let measureOffset = 0;

	let resizeClipEnd = false;
	let resizeClipStart = false;
	let moveClipX = -1;
	let moveClipY = -1;

	let targetClip = undefined;

	$:viewWidth = sequencer ? sequencer.clientWidth:0;

	$:totalScrollPx = Math.max(horizontalScroll, 200*Math.ceil(totalMeasures(clips)))+viewWidth
	$:scrollBarWidth = Math.floor(viewWidth/totalScrollPx*100,100);
	$:scrollBarPosition = horizontalScroll/totalScrollPx*100;

	function totalMeasures(clips)
	{
		let lastMeasureFromEachTrack = clips.map(x => x[x.length-1] ? x[x.length-1].end : 0);
		return Math.ceil(Math.max(...lastMeasureFromEachTrack));
	}


	var copiedClip;

	onMount(function(){

		lineMeasurements();

		addEventListener('copy', (e) => { 
			copiedClip = selectedClip;
		});

		addEventListener('paste', (e) => { 

			let start = copiedClip.end;
			let end = copiedClip.end*2 - copiedClip.start;

			let newClip = {
				start,
				end,
				track: copiedClip.track,
				keyframes: JSON.parse(JSON.stringify(copiedClip.keyframes))
			}

			while(doesClipOverlap(undefined, newClip))
			{
				newClip.start += .25;
				newClip.end += .25;
			}

			insertClip(newClip);
			
		});
	});

	function lineMeasurements()
	{
		sequencer.style.height = trackCount * 100 + 23 + "px";

		let measureCount = Math.ceil(sequencer.clientWidth / MEASURE_WIDTH)+2; // not just plus 1 because if 5 measure fit, you need +1 for the last measure, and then +1 to get you off the screen

		let startMeasure = Math.floor(horizontalScroll / MEASURE_WIDTH) + 1;

		let newMeasures = [];

		for(let i=0; i<measureCount; i++)
		{
			newMeasures.push(i+startMeasure);
		}

		measureOffset = ((horizontalScroll % MEASURE_WIDTH) + MEASURE_WIDTH) % MEASURE_WIDTH;

		measures = newMeasures;
	}

	function handleScroll(e)
	{
		e.preventDefault();
		horizontalScroll = Math.max(0, horizontalScroll - e.wheelDelta/2);

		lineMeasurements();
	}

	function onSequencerMousedown(e)
	{
		let track = Math.floor((e.offsetY - 22)/100);
		let measure = Math.floor((e.offsetX + measureOffset)/MEASURE_WIDTH*4)/4 + measures[0]-1;

		if(track == -1)
		{
			playbackHead = measure;
			dispatch("playbackHeadMoved", measure);

		}
		else
		{
			insertClip({start: measure, end: measure+.25, keyframes: {}, track})
		}
	}

	function insertClip(clip)
	{
		let i = 0;
		while(clips[clip.track][i] && clips[clip.track][i].start < clip.start)
		{
			i++;
		}

		clips[clip.track].splice(i, 0, clip)
		clips = clips;	
	}

	function doesClipOverlap(currentClip, newClip)
	{
		for(let clip of clips[newClip.track])
		{
			if(clip == currentClip){
				continue;
			}

			if(!(newClip.end <= clip.start || newClip.start >= clip.end))
				return true; 
		}

		return false;
	}

	function isClipVisible(clip, measures)
	{
		return !(clip.end+1 <= measures[0] || clip.start+1 >= measures[measures.length-1])
	}

	function onClipMousedown(e, clip)
	{
		dispatch("openClip", clip);

		if(e.target.clientWidth - e.offsetX < 10)
		{
			targetClip = clip;
			resizeClipEnd = true;
		}
		else if(e.offsetX < 10)
		{
			targetClip = clip;
			resizeClipStart = true;
		}
		else if(moveClipX == -1)
		{
			targetClip = clip;
			moveClipX = e.offsetX;
			moveClipY = e.pageY;
		}

		e.stopPropagation();
	}

	function onMouseMove(e)
	{
		let rect = sequencer.getBoundingClientRect();
		let track = Math.floor((e.pageY - rect.top - 22)/100);
		let measure = Math.floor((e.pageX - rect.left + measureOffset)/MEASURE_WIDTH*4)/4 + measures[0]-1;
		let adjustedStart = Math.floor((e.pageX - rect.left + measureOffset - moveClipX)/MEASURE_WIDTH*4)/4 + measures[0]-1;

		if(moveClipX > -1)
		{
			if(adjustedStart != targetClip.start)
			{
				let offset = adjustedStart - targetClip.start;

				let newClip = {
					start: targetClip.start+offset,
					end: targetClip.end + offset,
					track: targetClip.track
				}

				if(doesClipOverlap(targetClip, newClip))
					return;
				
				if(adjustedStart >= 0)
				{
					targetClip.start += offset;
					targetClip.end += offset;
					clips = clips;
				}
			}

			if(track != targetClip.track && track >=0 && track < clips.length)
			{
				let newClip = {
					track,
					start: targetClip.start,
					end: targetClip.end
				}

				if(doesClipOverlap(targetClip, newClip))
					return;

				let i = clips[targetClip.track].indexOf(targetClip);
				if(i > -1)
					clips[targetClip.track].splice(i,1);
				targetClip.track = track;
				insertClip(targetClip);
			}
		}

		if(resizeClipStart)
		{
			let newClip = {
				start: measure,
				end: targetClip.end,
				track: targetClip.track
			}

			if(doesClipOverlap(targetClip, newClip) || measure >= targetClip.end || measure < 0)
				return;

			targetClip.start = measure;
			clips = clips;
		}

		if(resizeClipEnd)
		{
			let newClip = {
				start: targetClip.start,
				end: measure+.25,
				track: targetClip.track
			}

			if(doesClipOverlap(targetClip, newClip) || measure+.25 <= targetClip.start)
				return;

			targetClip.end = measure+.25;
			clips = clips;
		}
	}

	function onMouseUp(e)
	{
		targetClip = undefined;
		moveClipX = -1;
		resizeClipStart = false;
		resizeClipEnd = false;
	}

	let isScrollbarMouseScrolling = -1;
	let originalTotalScrollPx = -1;
	let originalHorizontalScroll = -1;

	function scrollbarOnMouseMove(e)
	{
		if(isScrollbarMouseScrolling != -1)
		{
			let diff = e.pageX - isScrollbarMouseScrolling;
			let percentDiff = diff/sequencer.clientWidth;
			let scrollDiff = percentDiff*originalTotalScrollPx;
			horizontalScroll = Math.max(0, originalHorizontalScroll + scrollDiff);
			lineMeasurements();
		}
	}

	function scrollbarStartScroll(e)
	{
		isScrollbarMouseScrolling = e.pageX;
		originalTotalScrollPx = totalScrollPx;
		originalHorizontalScroll = horizontalScroll;
	}

	function scrollbarEndScroll(e)
	{
		isScrollbarMouseScrolling = -1;
		originalTotalScrollPx = -1;
	}


</script>


<main bind:this={sequencer} on:wheel={handleScroll} on:mousedown={onSequencerMousedown} on:mousemove={onMouseMove} on:mouseup={onMouseUp}>
	
	{#each measures as measure,i}
		<span 
			class='measure-no'
			style={`left: ${i*MEASURE_WIDTH - measureOffset + 5}px; top: ${0}px`}
			on:dragstart={(e)=>e.preventDefault()}
		>{measure}</span>

		<div class='vline' style={`left: ${i*MEASURE_WIDTH - measureOffset}px;`}></div>
		<div class='vline thin' style={`left: ${(i+.25)*MEASURE_WIDTH - measureOffset}px;`}></div>
		<div class='vline thin' style={`left: ${(i+.5)*MEASURE_WIDTH - measureOffset}px;`}></div>
		<div class='vline thin' style={`left: ${(i+.75)*MEASURE_WIDTH - measureOffset}px;`}></div>
	{/each}
	<div class='hline' style="top: 22px;"></div>

	{#each clips as clipTrack, i}
		<div class='hline thin' style={`top: ${22+(i+1)*100}px;`}></div>

		{#each clipTrack as clip}

			{#if isClipVisible(clip, measures)}
				<div class={'clip ' + (clip==selectedClip ? "selected" : "")}
					on:mousedown={(e) => onClipMousedown(e,clip)}
					on:click={e=>e.stopPropagation()}
					on:dragstart={(e)=>e.preventDefault()}
					style={`
						top: ${22+i*100}px;
						left:${clip.start*MEASURE_WIDTH - horizontalScroll}px;
						width:${(clip.end-clip.start)*MEASURE_WIDTH}px;
						height: 100px`}

					></div>
			{/if}
			
		{/each}

	{/each}

	<div class='vline playback' style={`left: ${playbackHead*MEASURE_WIDTH - horizontalScroll}px;`}></div>
</main>
<div class='scrollbar-trough' 
	on:mousemove={scrollbarOnMouseMove} on:mouseup={scrollbarEndScroll} on:wheel={handleScroll}>
	<div class='scrollbar-bar' 
		on:mousedown={scrollbarStartScroll}
		style={`width: ${scrollBarWidth}%; left:${scrollBarPosition}%;`}></div>
</div>

<style>

	main {
		background-color: #120033;
		position: relative;
		overflow: hidden;
	}

	.measure-no {
		position: absolute;
		user-select: none;
	}

	.hline {
		position: absolute;
		left: 0px;
		right:0px;
		border-bottom: solid 2px white;
	}

	.vline {
		position: absolute;
		top:0px;
		bottom:0px;
		border-left: solid 2px white;
	}

	.vline.playback {
		border-left: solid 4px red;
		font-size:0pt;
	}

	.hline.thin, .vline.thin
	{
		border-width:1px;
		border-color: #888;
	}

	.clip {
		background-color: #cce0ff;
		box-sizing: border-box;
		position: absolute;
		border: solid 8px #0066ff;
		border-top-width: 5px;
		border-bottom-width: 5px;
	}

	.clip.selected {
		background-color: #ffffcc;
	}

	.scrollbar-trough {
		height:50px;
		background-color: #120033;
	}

	.scrollbar-bar {
		height:50px;
		background-color: #2d0080;
		position: relative;
	}
</style>