import LightArray from "./LightArray";
import {LightClip, Clip} from "./types";

let BLANK_FRAME = [0]
while(BLANK_FRAME.length < 81)
	BLANK_FRAME.push(0);



type LiveClip = {
	StartTime: number,
	Keyframes: number[],
	InProgress: boolean,
	Clip: LightClip,

	preserve: boolean,
	order: number,
	type: "clip"
}

type LiveSequcence = {
	Clips: LightClip[][],
	type: "sequence",
	StartTime: number,
	InProgress: boolean,
	Orders: number[]
}


export default class PlaybackEngine
{
	public StartTime = -1;
	public Keyframes: number[] = [];
	public Clips: LightClip[] = [];
	public CurrentKeyframe = [];
	public InProgress = true;

	public framesPerMs = 48 * 120/60/1000;

	public lights: LightArray;
	public queue: (LiveClip | LiveSequcence)[] = [];
	public queueStarted = false;

	public composite = {};

	private nextOrder = 1;

	constructor(lightArray: LightArray, tempo: string)
	{
		this.lights = lightArray;
		this.framesPerMs =  48 * Number(tempo)/60/1000;
	}


	public setTempo(tempo :string)
	{
		let newTempo = Number(tempo);
		if(isNaN(newTempo) || !newTempo)
			return;

		this.framesPerMs = 48 * newTempo/60/1000;
	}

	public processQueue()
	{
		let doUpdate = false;

		console.log(this.queue);

		for(let i=0; i<this.queue.length; i++)
		{
			let clip = this.queue[i];

			let ellapsedTime = new Date().getTime() - clip.StartTime;

			if(clip.type == "clip")
			{
				let nextKeyframe = clip.Keyframes[0];

				if(nextKeyframe == undefined || clip.InProgress == false)
				{
					clip.InProgress = false;
					this.queue.splice(i,1);
				
					if(!clip.preserve)
						delete this.composite[clip.order];

					doUpdate = true;
					i--;

					continue;
				}

				if(ellapsedTime * this.framesPerMs >= nextKeyframe)
				{
					clip.Keyframes.shift();
					this.composite[clip.order] = clip.Clip.keyframes[nextKeyframe];	
					doUpdate = true;
				}
			}
			if(clip.type == "sequence")
			{
				for(let i=0; i<4; i++)
				{
					if(clip.Clips[i].length == 0)
						continue;

					let innerClip = clip.Clips[i][0];
					let innerClipStart = innerClip.start * 192/this.framesPerMs;

					if(innerClipStart > ellapsedTime)
						continue;

					let newClip = JSON.parse(JSON.stringify(innerClip));
					let preserve = false;

					let end = (newClip.end-newClip.start)*192;

					if(clip.Clips[i][1] && clip.Clips[i][1].keyframes[0] && clip.Clips[i][1].start == clip.Clips[i][0].end)
					{
						preserve = true;
					}
					else
					{
						let end = (newClip.end-newClip.start)*192;
						newClip.keyframes[end] = BLANK_FRAME.slice(); // remove all lights keyframe 
					}
					

					let keyframes = Object.keys(newClip.keyframes).map(x => Number(x)).filter(x => x <= end);
					keyframes.sort((a,b) => a-b);	

					this.queue.push({
						type: "clip",
						order: clip.Orders[i],
						Clip: newClip,
						preserve,
						StartTime: clip.StartTime + innerClipStart,
						Keyframes: keyframes,
						InProgress: true,
					});

					clip.Clips[i].shift();
				}		
			}	
		}

		requestAnimationFrame(this.processQueue.bind(this));

		if(!doUpdate)
			return;

		let composite: number[] = [];
		while(composite.length < 81)
			composite.push(0);

		let keys = Object.keys(this.composite).map(x => Number(x)).sort((a,b)=>b-a);

		if(keys.length == 0)
			return;

		for(let key of keys)
		{
			for(let i=0; i<81; i++)
			{
				if(composite[i] == 0)
					composite[i] = this.composite[key][i];
			}
		}

		this.lights.setLightData(composite);
	}


	public stopAll()
	{
		this.composite = {};
		this.queue = [];
		this.lights.setLightData(BLANK_FRAME);
	}


	/* Clip has the keyframes property */
	public playClip = function playClip(lightClip: Clip, offset: number)
	{
		if(lightClip.tempo)
		{
			this.setTempo(lightClip.tempo);
		}

		offset = offset || 0;

		if(lightClip.clearLights)
		{
			this.composite = {};
			this.queue = [];
		}

		if(!this.queueStarted)
			this.processQueue();

		if(!lightClip.attack && !lightClip.sequence)
			return;

		

		if(lightClip.attack)
		{
			let keyframes = Object.keys(lightClip.attack.keyframes).map(x => Number(x));
			keyframes.sort((a,b) => a-b);	

			this.queue.push({
				type: "clip",
				order: this.nextOrder++,
				Clip: lightClip.attack,
				StartTime: new Date().getTime(),
				Keyframes: keyframes
			});
		}

		if(lightClip.sequence)
		{
			let playbackObj: LiveSequcence = {
				type: "sequence",
				StartTime: new Date().getTime() - offset,
				Clips: [[],[],[],[]], // the list of clips per track. Each gets removed slowly
				Orders: [this.nextOrder++, this.nextOrder++, this.nextOrder++, this.nextOrder++].reverse(),
				InProgress: true,
			}	

			for(let i=0; i<4; i++)
			{
				for(let seqClip of lightClip.sequence[i])
				{
					let clipCopy: LightClip = JSON.parse(JSON.stringify(seqClip));

					if(clipCopy.start*192/this.framesPerMs >= offset)
						playbackObj.Clips[i].push(clipCopy);
				}
			}

			this.queue.push(playbackObj);
		}
	}
}