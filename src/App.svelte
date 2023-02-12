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
	import PlaybackEngine from "./PlaybackEngine.js";
	import AudioEngine from "./AudioEngine.js";
	import LightArray from "./LightArray.js";
	import Checkbox from "./Checkbox.svelte";

	tauriWindow.getCurrent().listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
		
		sendMidi([240, 0, 32, 41, 2, 12, 14, 0, 247]) // launchpad X disable programmer mode.
		appWindow.close();
	})

	onMount(() => {

		//doOpenClip(sequence[0][0])
		openProject("","C:\\Users\\jdm38\\Desktop\\test.json"); // can uncomment to auto load a project

		sendMidi([240, 0, 32, 41, 2, 12, 14, 1, 247]) // launchpad X turn on programmer mode.

		addEventListener("keydown", function(e) {

			if(e.code == "Space")
			{
				//playTimeline(0, cp.StartTime != -1) 
			}
			if(e.code == "KeyM")
				mainClass = mainClass ? "" : "dark";
		});

		

		// listen to the `click` event and get a function to remove the event listener
		// there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event
		appWindow.listen('midi', (event) => {


			let [type, padNumber, value] = event.payload;

			if((type == 144 || type==176) && value > 0 && clips[page] && clips[page][padNumber])
			{	
				playClip(clips[page][padNumber]);
			}

			//console.log(event.payload)
		});
	})

	

	var TEMPO_BPM = 120;
	var filePath = "";

	var lights = new LightArray();
	var mainClass = "";	
	var playbackHead=0;
	let color = 0;

	let BLANK_FRAME = [0]
	while(BLANK_FRAME.length < 81)
		BLANK_FRAME.push(0);

	let MODE = "Live";

	//let sequence = [[{start:0,end:1, track:0, keyframes: {"0": BLANK_FRAME.slice()}}],[],[],[]];
	let sequence = null;

	// Blank sequence [[{start:0,end:1, track:0, keyframes: {"0": BLANK_FRAME.slice()}}],[],[],[]]

	let page = 0;
	let clips = [];
	
	document.addEventListener('contextmenu', event => event.preventDefault());

	let openKeyframe = -1;
	let openClip = undefined;

	let selectedPad = -1;

	let playback = {};
	let audioEngine = new AudioEngine();
	let lightEngine = new PlaybackEngine(lights, TEMPO_BPM);

	let pathToMusic = "";

	function getShortPath(x)
	{
		let a = x.lastIndexOf("/");
		let b = x.lastIndexOf("\\");
		return x.substring(Math.max(a,b)+1);
	}

	function changeOpenClip(newClip)
	{
		openKeyframe = -1; //set this first to prevent accidentally wiping anything
		openClip = newClip;
		if(newClip)
		{
			let k = Object.keys(newClip.keyframes).sort()[0]
			
			if(k != undefined)
			{
				openKeyframe = k;
				lights.setLightData(newClip.keyframes[k]);
				return;
			}
		}
		
		openKeyframe = -1;
		lights.setLightData(BLANK_FRAME);
	}

	$: shortPathToMusic = getShortPath(pathToMusic);

	window.addEventListener('keydown', function(e)
	{
		if(e.key.toUpperCase() == "D" && openKeyframe != -1)
		{
			delete openClip.keyframes[openKeyframe];
			openKeyframe = -1;
			openClip.keyframes = openClip.keyframes;
		
			lights.setLightData(BLANK_FRAME);
		}
		if(e.key=="Backspace" && openClip)
		{
			let i = sequence[openClip.track].indexOf(openClip);
			sequence[openClip.track].splice(i,1);
			sequence = sequence;

			changeOpenClip(undefined);
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
		//if(!cp.Audio)
		//	return;
		let offset = playbackHead * 192 /framesPerMs;
		//cp.Audio.currentTime = offset/1000;
	}

	async function setMusicClip()
	{
		let newPath = await invoke("pick_music_file");

		if(!clips[page])
			clips[page] = [];
		if(!clips[page][selectedPad])
			clips[page][selectedPad] = {}

		clips[page][selectedPad].audio = newPath;

		audioEngine.addFile(newPath);
	}


	function playTimeline()
	{
		throw Error("unsupport")
	}

	function playClip(clip)
	{
		audioEngine.playFile(clip);


		lightEngine.playClip(clip)


		if(!isNaN(clip.pageTo))
		{
			onChangePage({detail: clip.pageTo});
		}
		
	}

	function onOpenClip(e)
	{
		console.log(e.detail);
		doOpenClip(e.detail);
	}

	function onChangePage(e)
	{
		changeOpenClip(undefined);
		selectedPad = -1;

		let newPage = Number(e.detail);
		console.log(e);
		if(isNaN(newPage))
			newPage = 0;

		if(clips[newPage] == undefined)
			clips[newPage] = [];

		//page = newPage;
		clips = clips;
		page = newPage;
	}

	function doOpenClip(clip)
	{
		changeOpenClip(clip);

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

		for(let page of clips)
		{
			for(let clip of page)
			{

				if(clip && clip.audio)
					audioEngine.addFile(clip.audio);
			}
		}
	}

	async function openProjectLegacy(e, name)
	{
		name = name || "";
		let data = await invoke("open_project", {name});

		let data2 = JSON.parse(data);

		sequence = data2.clips;
		TEMPO_BPM = data2.tempo;
		//setMusicFile("", data2.track);

		for(let i=0; i<4; i++)
		{
			sequence[i].sort((a,b) => a.start-b.start);

			for(let clip of sequence[i])
			{
				delete clip.keyframes[-1];
			}
		}a
	}

	function removeLightClips()
	{
		if(!clips[page] || !clips[page][selectedPad])
			return;

		delete clips[page][selectedPad].attack;
		delete clips[page][selectedPad].sequence;
		clips = clips;
		changeOpenClip(undefined);

		let noLights =[];
		while(noLights.length < 81)
			noLights.push(0)
		lights.setLightData(noLights);

		sequence = null;

	}	

	function openAttackClip()
	{
		if(selectedPad == -1) 
			return;

		if(!clips[page])
			clips[page] = [];
		if(!clips[page][selectedPad])
			clips[page][selectedPad] = {};

		if(!clips[page][selectedPad].attack)
			clips[page][selectedPad].attack = {keyframes:{}}

		delete clips[page][selectedPad].sequence;
		sequence = null;

		clips = clips;

		changeOpenClip(clips[page][selectedPad].attack);
	}

	function openSequence()
	{
		if(selectedPad == -1) 
			return;

		if(!clips[page])
			clips[page] = [];
		if(!clips[page][selectedPad])
			clips[page][selectedPad] = {};

		if(!clips[page][selectedPad].sequence)
			clips[page][selectedPad].sequence = [[{start:0,end:1, track:0, keyframes: {"0": BLANK_FRAME.slice()}}],[],[],[]]

		delete clips[page][selectedPad].attack;

		sequence = clips[page][selectedPad].sequence
		clips = clips;

		changeOpenClip(undefined);
	}

	function changeOpenPad(e)
	{
		clips[page][e.detail] = clips[page][e.detail] || {};
		selectedPad = e.detail;
		changeOpenClip(clips[page] && clips[page][selectedPad] && clips[page][selectedPad].attack);
		
	}

	function shortFileName(clips, page, selectedPad)
	{
		if(!clips[page]) return "";
		if(!clips[page][selectedPad]) return "";
		if(!clips[page][selectedPad].audio) return "";

		let file = clips[page][selectedPad].audio;
		file = file.substring(file.lastIndexOf("/")+1)
		file = file.substring(file.lastIndexOf("\\")+1)
		return file;
	}
</script>



<main class={mainClass}>
	<div class='col1'>
		<div>
			<button on:click={openProject}>Open</button>
			<button on:click={saveProject}>Save</button>
			<label>BPM:</label> <input bind:value={TEMPO_BPM} type="number" />
		</div>
		{#if sequence}
			<Sequencer clips={sequence} selectedClip={openClip} on:openClip={onOpenClip} on:playbackHeadMoved y={setAudioPlaybackPosition} bind:playbackHead={playbackHead}/>
			<div>
				<button on:click={() => {}}>
					{true ? "Play" : "Stop"}
				</button>
				<button on:click={() => {sequence = undefined}}>
					Close
				</button>
			</div>
		{:else}
			<ButtonGrid on:change={changeOpenPad} on:changePage={onChangePage} bind:page={page} clips={clips[page]} />
			
		{/if}
		{#if selectedPad != -1}
			<div class="option-row">
				<label>Audio:</label>
				<button on:click={setMusicClip}>File</button>
				<input readonly type="text" value={shortFileName(clips,page,selectedPad)}/>
			</div>
			<div class="option-row">
				<label></label>
				<Checkbox bind:value={clips[page][selectedPad].clearAudio} label={"Clear Old Audio"} />
			</div>
			<div class="option-row"> 
				<label>Lights:</label>
				<span class={'input-box ' + (!hasLightClip(clips, page, selectedPad, "attack")&&!hasLightClip(clips, page, selectedPad, "sequence")?"selected":"")}
					on:click={removeLightClips}>
					None
				</span>
				<span class={'input-box ' + (hasLightClip(clips, page, selectedPad, "attack")?"selected":"")}
					 on:click={openAttackClip}>Clip</span>
				<span class={'input-box ' + (hasLightClip(clips, page, selectedPad, "sequence")?"selected":"")}
					 on:click={openSequence}>Sequence</span>
			</div>
			<div class="option-row">
				<label>&nbsp;</label>
				<Checkbox bind:value={clips[page][selectedPad].clearLights} label={"Clear Old Lights"} />
			</div>
			<div class="option-row">
				<label>Control:</label>
				<input class="short" placeholder="Page to" bind:value={clips[page][selectedPad].pageTo}/>
				<input class="short" placeholder="Tempo" bind:value={clips[page][selectedPad].tempo}/>
			</div>

		{/if}

	</div>

	<div class='col2'>
		{#if openClip}
			<button on:click={() => playClip({attack: openClip})}>Play</button><KeyframeSequencer 
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
		display:inline-block;
		width:.6in;
	}

	input.short
	{
		width: 1in;
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
	.option-row {
		margin:5px 0px;
	}
</style>



