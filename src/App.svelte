<script>
	
	import LightGrid from "./LightGrid.svelte";
	import ColorPicker from "./ColorPicker.svelte";
	import KeyframeSequencer from "./KeyframeSequencer.svelte";
	import Sequencer from "./Sequencer.svelte";
	import ButtonGrid from "./ButtonGrid.svelte";
	import {onMount} from "svelte";
	import {invoke} from '@tauri-apps/api/tauri';
	import { listen } from '@tauri-apps/api/event'
	import { convertFileSrc } from '@tauri-apps/api/tauri';
	import {sendMidi} from "./midi.js";
	import { window as tauriWindow}  from "@tauri-apps/api"
	import { TauriEvent } from "@tauri-apps/api/event";
	import { appWindow } from "@tauri-apps/api/window";
	import {PlaybackEngine} from "./PlaybackEngine.js";
	import LightArray from "./LightArray.js";

	tauriWindow.getCurrent().listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
		
		sendMidi([240, 0, 32, 41, 2, 12, 14, 0, 247]) // launchpad X disable programmer mode.
		appWindow.close();
	})

	onMount(() => {

		//doOpenClip(sequence[0][0])
		// openProject("",""); // can uncomment to auto load a project

		sendMidi([240, 0, 32, 41, 2, 12, 14, 1, 247]) // launchpad X turn on programmer mode.

		addEventListener("keydown", function(e) {

			if(e.code == "Space")
				playTimeline(0, cp.StartTime != -1) 
			if(e.code == "KeyM")
				mainClass = mainClass ? "" : "dark";
		});

		

		// listen to the `click` event and get a function to remove the event listener
		// there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event
		appWindow.listen('midi', (event) => {


			let [type, padNumber, value] = event.payload;

			if(type == 144 && value > 0 && clips[page] && clips[page][padNumber] && clips[page][padNumber].attack)
			{	
				playClip(clips[page][padNumber].attack);
			}


			console.log(event.payload)
		});
	})

	

	var TEMPO_BPM = 120;
	var filePath = "";

	var lights = new LightArray();
	var mainClass = "";	
	var playbackHead=0;
	let color = 0;

	let MODE = "Live";

	let blankFrame = [];
	while(blankFrame.length < 81)
		blankFrame.push(0);

	let sequence = [[{start:0,end:1, track:0, keyframes: {"0": blankFrame.slice()}}],[],[],[]];

	let page = 0;
	let clips = [];
	
	document.addEventListener('contextmenu', event => event.preventDefault());

	let openKeyframe = -1;
	let openClip = undefined;

	let selectedPad = -1;

	let playback = {};

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
			let i = sequence[openClip.track].indexOf(openClip);
			sequence[openClip.track].splice(i,1);
			sequence = sequence;
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
	
	function hasLightClip(clips, page, selectedPad, prop)
	{
		return clips[page] && clips[page][selectedPad] && clips[page][selectedPad][prop]
	}

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



	function playTimeline()
	{
		throw Error("unsupport")
	}

	function playClip(clip)
	{
		if(!playback.InProgress)
		{
			playback = new PlaybackEngine(lights, TEMPO_BPM);
			playback.playClip(clip);
		}
		
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
			clips
		};
		await invoke("save_project", {data: JSON.stringify(obj)});
	}

	async function saveProjectLegacy()
	{
		let obj = {
			tempo: TEMPO_BPM,
			track: pathToMusic,
			clips: sequence
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
	}

	async function openProjectLegacy(e, name)
	{
		name = name || "";
		let data = await invoke("open_project", {name});

		let data2 = JSON.parse(data);

		sequence = data2.clips;
		TEMPO_BPM = data2.tempo;
		setMusicFile("", data2.track);
		//console.log(clip)
		//let clips = data2.clips

		for(let i=0; i<4; i++)
		{
			sequence[i].sort((a,b) => a.start-b.start);

			for(let clip of sequence[i])
			{
				delete clip.keyframes[-1];
			}
		}
	}

	function openAttackClip()
	{
		if(selectedPad == -1) 
			return;

		if(!clips[page])
			clips[page] = [];
		if(!clips[page][selectedPad])
			clips[page][selectedPad] = {attack: {keyframes:{}}}

		clips = clips;

		openClip = clips[page][selectedPad].attack;

		console.log(clips[page]);
	}

	function changeOpenPad(e)
	{
		selectedPad = e.detail;
		if(clips[page] && clips[page][selectedPad] && clips[page][selectedPad].attack)
			openClip = clips[page][selectedPad].attack;
		else
			openClip = undefined;
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
		{#if MODE == "Sequencer"}
			<Sequencer clips={sequence} selectedClip={openClip} on:openClip={onOpenClip} on:playbackHeadMoved y={setAudioPlaybackPosition} bind:playbackHead={playbackHead}/>
			<div>
				<button on:click={() => playTimeline(0, cp.StartTime != -1)}>
					{cp.StartTime == -1 ? "Play" : "Stop"}
				</button>
			</div>
		{:else}
			<ButtonGrid on:change={changeOpenPad}/>
			{#if selectedPad != -1}
				<div>
					<label>Sound:</label> <input type='file' />
				</div>
				<div>
					<label>Lights:</label>
					<span class={'input-box ' + (hasLightClip(clips, page, selectedPad, "attack")?"":"selected")}>None</span>
					<span class={'input-box ' + (hasLightClip(clips, page, selectedPad, "attack")?"selected":"")}
						 on:click={openAttackClip}>Attack</span>
					<span class='input-box'>Release</span>
				</div>

			{/if}
		{/if}

	</div>

	<div class='col2'>
		{#if openClip}
			<button on:click={() => playClip(openClip)}>Play</button><KeyframeSequencer 
				keyframes={loadedKeyframes} currentKeyframe={openKeyframe} on:openKeyframe={loadKeyframe}/>
			<div>Color: <ColorPicker bind:value={color} /></div>
			<LightGrid bind:paintColor={color} lightArray={lights} on:saveKeyframe={saveKeyframe}/>
		{/if}
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

	.input-box {
		border:solid 1px white;
		padding: 0px 3px;
	}

	.input-box.selected{
		border:solid 1px transparent;

		background-color: #ff8000;
	}
</style>



