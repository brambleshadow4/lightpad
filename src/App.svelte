<script>
	
	import LightGrid from "./LightGrid.svelte";
	import ColorPicker from "./ColorPicker.svelte";
	import KeyframeSequencer from "./KeyframeSequencer.svelte";
	import Sequencer from "./Sequencer.svelte";
	import {onMount} from "svelte";
	import {invoke} from '@tauri-apps/api/tauri';
	import { convertFileSrc } from '@tauri-apps/api/tauri';
	import {sendMidi} from "./midi.js";
	import { window as tauriWindow}  from "@tauri-apps/api"
	import { TauriEvent } from "@tauri-apps/api/event";
	import { appWindow } from "@tauri-apps/api/window";

	tauriWindow.getCurrent().listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
		
		sendMidi([240, 0, 32, 41, 2, 12, 14, 0, 247]) // launchpad X disable programmer mode.
		appWindow.close();
	})

	onMount(() => {

		doOpenClip(clips[0][0])
		// openProject("",""); // can uncomment to auto load a project

		sendMidi([240, 0, 32, 41, 2, 12, 14, 1, 247]) // launchpad X turn on programmer mode.

		addEventListener("keydown", function(e) {

			if(e.code == "Space")
				playTimeline(0, cp.StartTime != -1) 
			if(e.code == "KeyM")
				mainClass = mainClass ? "" : "dark";
		});

	})

	/*appWindow.listen("close", ({ event, payload }) => {

		alert("we are closing this thing I think?");
		
		
	});*/

	var TEMPO_BPM = 120;
	var filePath = "";

	var lights;
	var mainClass = "";	
	var playbackHead=0;
	let color = 0;

	let blankFrame = [];
	while(blankFrame.length < 81)
		blankFrame.push(0);

	let clips = [[{start:0,end:1, track:0, keyframes: {"0": blankFrame.slice()}}],[],[],[]];
	
	document.addEventListener('contextmenu', event => event.preventDefault());

	let openKeyframe = -1;
	let openClip = undefined;

	let pathToMusic = "";

	function getShortPath(x)
	{
		let a = x.lastIndexOf("/");
		let b = x.lastIndexOf("\\");
		return x.substring(Math.max(a,b)+1);
	}

	$: shortPathToMusic = getShortPath(pathToMusic);

	window.addEventListener('keydown', function(e)
	{
		if(e.key.toUpperCase() == "D" && openKeyframe != -1)
		{
			delete openClip.keyframes[openKeyframe];
			openKeyframe = -1;
			openClip.keyframes = openClip.keyframes;
			let x = [0]
			while(x.length < 81)
				x.push(0);
		
			lights.setLightData(x);
		}
		if(e.key=="Backspace" && openClip)
		{
			let i = clips[openClip.track].indexOf(openClip);
			clips[openClip.track].splice(i,1);
			clips = clips;
			openClip = undefined 
			openKeyframe = -1;
		}
	});

	function saveKeyframe()
	{
		if(openKeyframe != -1)
		{
			openClip.keyframes[openKeyframe] = lights.getLightData();
		}
	}

	function loadKeyframe(e)
	{
		let nextKeyframe = e.detail;

		if(!openClip.keyframes[nextKeyframe])
		{
			if(openClip.keyframes[openKeyframe])
			{
				openClip.keyframes[nextKeyframe] = openClip.keyframes[openKeyframe].slice();
			}
			else 
			{
				let arr = [];
				while(arr.length < 81)
					arr.push(0)
				openClip.keyframes[nextKeyframe] = arr;
			}
			
		}

		openClip.keyframes = openClip.keyframes;
		openKeyframe = nextKeyframe;

		if(openClip.keyframes[nextKeyframe])
		{
			lights.setLightData(openClip.keyframes[nextKeyframe]);
		}
	}

	let cp = {};
	cp.StartTime = -1;
	cp.Keyframes = []
	cp.Clips = [];
	cp.CurrentKeyframe = [];
		

	function setAudioPlaybackPosition()
	{
		if(!cp.Audio)
			return;
		let offset = playbackHead * 192 /framesPerMs;
		cp.Audio.currentTime = offset/1000;
	}

	async function setMusicFile(e, path)
	{
		console.log("path " + path);
		if(path)
			pathToMusic = path;
		else
			pathToMusic = await invoke("pick_music_file");
		 
		cp.Audio = new Audio(convertFileSrc(pathToMusic));
	}


	function playClip()
	{
		openKeyframe = -1;

		if(cp.StartTime == -1)
		{
			cp.StartTime = new Date().getTime();
			cp.Keyframes = Object.keys(openClip.keyframes).map(x => Number(x));
			cp.Keyframes.sort((a,b) => a-b);
		}

		let nextKeyframe = cp.Keyframes[0];

		if(nextKeyframe == undefined)
		{
			cp.StartTime = -1;
			return;
		}

		requestAnimationFrame(playClip);
		//setTimeout(playClip, 0);
		let ellapsedTime = new Date().getTime() - cp.StartTime;

		if(ellapsedTime * framesPerMs >= nextKeyframe)
		{
			cp.Keyframes.shift();
			lights.setLightData(openClip.keyframes[nextKeyframe]);
		}
	}

	$:framesPerMs = 48 * TEMPO_BPM/60/1000;

	function playTimeline(_, halt)
	{
		if(halt)
		{
			cp.Stop = true;
			return;
		}

		if(cp.StartTime == -1)
		{ 
			let offset = playbackHead * 192 /framesPerMs;
			cp.StartTime = new Date().getTime() - offset;

			setAudioPlaybackPosition();
			if(cp.Audio)
				cp.Audio.play();

			
			cp.Keyframes = [[],[],[],[]] // list of next keyframes on each track
			cp.Composite = [[],[],[],[]]; // list of each 
			cp.ActiveClip = []; // the clips currently being played
			cp.Clips = [[],[],[],[]]; // the list of clips per track. Each gets removed slowly
			cp.ResetBackTo = playbackHead;

			for(let i=0; i<4; i++)
			{
				for(let clip of clips[i])
				{
					let clipCopy = JSON.parse(JSON.stringify(clip));

					if(clipCopy.end >= playbackHead)
					{
						cp.Clips[i].push(clipCopy);
					}
				}

				if(cp.Keyframes[i].length == 0 && cp.Clips[i].length > 0)
				{
					let clip = cp.Clips[i].shift();
					cp.ActiveClip[i] = clip;

					let end = (clip.end-clip.start)*192;
					clip.keyframes[end] = blankFrame.slice(); // remove all lights keyframe 
					let keyframes = Object.keys(clip.keyframes).filter(x => x <= end).map(x => Number(x) + clip.start * 192);
					keyframes.sort((a,b) => a-b);
					cp.Keyframes[i] = keyframes;
				}
			}
		}

		let allZero = true;
		for(let i=0; i<4; i++)
		{
			if(cp.Keyframes[i].length)
			{
				allZero = false;
				break;
			}
		}

		if(allZero || cp.Stop)
		{
			cp.StartTime = -1;
			playbackHead = cp.ResetBackTo;
			if(cp.Audio)
				cp.Audio.pause();
			delete cp.Stop;
			setAudioPlaybackPosition();

			return;
		}

		let ellapsedTime = new Date().getTime() - cp.StartTime;
		

		playbackHead = ellapsedTime * framesPerMs/192;

		let compositeUpdated = false;

		for(let i=0; i<4; i++)
		{
			while(cp.Keyframes[i][0] != undefined && ellapsedTime * framesPerMs >= cp.Keyframes[i][0])
			{
				let k = cp.Keyframes[i].shift();
				k = k - cp.ActiveClip[i].start * 192;

				cp.Composite[i] = cp.ActiveClip[i].keyframes[k];
				compositeUpdated = true;
			}

			if(cp.Keyframes[i].length == 0 && cp.Clips[i].length > 0)
			{
				let clip = cp.Clips[i].shift();
				cp.ActiveClip[i] = clip;

				let end = (clip.end-clip.start)*192;
				clip.keyframes[end] = blankFrame.slice(); // remove all lights keyframe 
				let keyframes = Object.keys(clip.keyframes).filter(x => x <= end).map(x => Number(x) + clip.start * 192);
				keyframes.sort((a,b) => a-b);
				cp.Keyframes[i] = keyframes;
			}

			while(cp.Keyframes[i][0] != undefined && ellapsedTime * framesPerMs >= cp.Keyframes[i][0])
			{
				let k = cp.Keyframes[i].shift();
				k = k - cp.ActiveClip[i].start * 192;

				cp.Composite[i] = cp.ActiveClip[i].keyframes[k];
				compositeUpdated = true;
			}

		}

		if(compositeUpdated)
		{
			let composite = [];
			for(let i=0; i<81; i++)
			{
				composite[i] = cp.Composite[0][i] || cp.Composite[1][i] || cp.Composite[2][i] || cp.Composite[3][i] || 0;
			}

			lights.setLightData(composite);
		}

		requestAnimationFrame(playTimeline);
	}

	function onOpenClip(e)
	{
		doOpenClip(e.detail);
	}

	function doOpenClip(clip)
	{
		openKeyframe = -1; // close previous keyframe first, so opening a new keyframe doesn't wipe it.
		openClip = clip;

		let k= Object.keys(openClip.keyframes).map(x => Number(x))[0]
		k = k == undefined ? -1 : k;
		loadKeyframe({detail: k});
	}

	$:loadedKeyframes = openClip ? Object.keys(openClip.keyframes).map(x => Number(x)) : [];


	async function saveProject()
	{
		let obj = {
			tempo: TEMPO_BPM,
			track: pathToMusic,
			clips
		};
		await invoke("save_project", {data: JSON.stringify(obj)});
	}

	async function openProject(e, name)
	{
		name = name || "";
		let data = await invoke("open_project", {name});

		let data2 = JSON.parse(data);

		clips = data2.clips;
		TEMPO_BPM = data2.tempo;
		setMusicFile("", data2.track);
		//console.log(clip)
		//let clips = data2.clips

		for(let i=0; i<4; i++)
		{
			clips[i].sort((a,b) => a.start-b.start);

			for(let clip of clips[i])
			{
				delete clip.keyframes[-1];
			}
		}
	}



</script>



<main class={mainClass}>
	<div class='col1'>
		<div>
			<button on:click={openProject}>Open</button>
			<button on:click={saveProject}>Save</button>
			<button on:click={setMusicFile}>Music File</button><span class="filename" title={pathToMusic}>{shortPathToMusic}</span>
			<label>BPM:</label> <input bind:value={TEMPO_BPM} type="number" />
		</div>
		<Sequencer clips={clips} selectedClip={openClip} on:openClip={onOpenClip} on:playbackHeadMoved  ={setAudioPlaybackPosition} bind:playbackHead={playbackHead}/>
		<div>
			<button on:click={() => playTimeline(0, cp.StartTime != -1)}>
				{cp.StartTime == -1 ? "Play" : "Stop"}
			</button>
		</div>
	</div>

	<div class='col2'>
		<button on:click={playClip}>Play</button><KeyframeSequencer 
			keyframes={loadedKeyframes} currentKeyframe={openKeyframe} on:openKeyframe={loadKeyframe}/>
		<div>Color: <ColorPicker bind:value={color} /></div>
		<LightGrid bind:paintColor={color} bind:this={lights} on:saveKeyframe={saveKeyframe}/>
	</div>
	
</main>

<style>
	main {
		color:white;
		display: flex;
		flex-direction: row;
		overflow-x: auto;
	}

	.dark {
		display:none;
	}

	.col1 {
		flex-grow:1;
		padding:8pt;
	}

	.col2 {
		margin-right:.5in;
		width: 7in;
		flex-shrink: 0;
	}

	.keyframes {
		margin:20px;
	}

	label {
		display:inline;
	}

	.filename {
		display:inline-block;
		width:2in;
		overflow-x: hidden;
		white-space: pre;
	}
</style>



