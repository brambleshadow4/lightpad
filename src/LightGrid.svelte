<script>

	import { invoke} from '@tauri-apps/api/tauri';
	import {colors} from "./colors.js";
	import {createEventDispatcher} from "svelte";
	import {sendMidi} from "./midi.js";

	export let paintColor = 0;
	export function getLightData()
	{
		let data = [];
		for(let arr of lightArray)
		{
			for (let light of arr)
			{
				data.push(light.color);
			}
		}

		return data;
	}

	export function setLightData(data)
	{
		let dataCopy = data.slice();
		for(let arr of lightArray)
		{
			for (let light of arr)
			{
				let newColor = dataCopy.shift();
				if(light.color != newColor)
				{
					window.midiSignalSent++
					light.lightOn(newColor);
				}
				
			}
		}
	}


	window.addEventListener("keypress", (e)=>{

		let nextLight = {5: 21, 21:5, 9:45, 45:9, 13:49, 49:13};


		if("1234".indexOf(e.key) == -1)
			return;

		let lastLight = 0;

		for(let i=3; i >= 5-rows; i--)
		{
			for(let j=0; j<9; j++)
			{
				if(j == 0)
					lastLight = lightArray[i][j].color;

				if(j == 8)
					lightArray[i][j].lightOn(nextLight[lastLight]);
				else
					lightArray[i][j].lightOn(lightArray[i][j+1].color);

			}
		}

		for(let i=4; i<rows+4; i++)
		{
			for(let j=0; j<9; j++)
			{
				if(j == 0)
					lastLight = lightArray[i][j].color;

				if(j == 8)
					lightArray[i][j].lightOn(nextLight[lastLight]);
				else
					lightArray[i][j].lightOn(lightArray[i][j+1].color);
			}
		}

		dispatch("saveKeyframe");
	});

	const dispatch = createEventDispatcher();

	let lightArray = [];

	function Light(x,y)
	{
		this.x = x;
		this.y = y;
		this.padAddress = (9-y)*10+ 1 + x;
		this.color = 0;
		this.lightOn = function lightOn(color)
		{
			this.color = color;
			sendMidi([144, this.padAddress, color]);
			/*invoke('send_midi', {
				data: padArray([144, this.padAddress, color]),
				len: 3
			});*/

			lightArray = lightArray;
		}

		this.lightOff = function lightOff()
		{
			this.color = 0;
			invoke('send_midi', {
				data:padArray([144, this.padAddress, 0]),
				len: 3
			});

			lightArray = lightArray;
		}

		this.ondragstart = function(e){
			e.stopPropogation();
			e.preventDefault();
			return false;
		}
	}

	for(let y=0; y<9; y++)
	{
		let arr = [];
		for(let x = 0; x < 9; x++)
		{
			let light = new Light(x,y);
			light.lightOff();
			arr.push(light);
		}

		lightArray.push(arr)
	}

	function padArray(arr)
	{
		while(arr.length < 32)
		{
			arr.push(0);
		}
		return arr;
	}

	function onMouseOver(e, light)
	{
		if(e.buttons == 1)
		{
			light.lightOn(paintColor);
			console.log("savekeyframe dispatch");
			dispatch("saveKeyframe");
		}
		else if(e.buttons == 2)
		{
			e.stopPropagation();
			e.preventDefault();
			paintColor = light.color;
		}
	}

</script>


<main>
	
	{#each lightArray as outer}
		<div>
			{#each outer as light}
				<div class='light' 
					style={"background-color: " + colors[light.color]}
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