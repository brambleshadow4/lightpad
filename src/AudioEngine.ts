import { convertFileSrc } from '@tauri-apps/api/tauri';
import {Clip} from "./types";

export default class AudioEngine
{
	private audioLookup = {};

	public playFile = function(clip: Clip, offsetMs?: number)
	{
		let offset = offsetMs == undefined ? 0:  offsetMs/1000;

		if(clip.clearAudio)
		{
			this.stopAll();
		}

		if(!clip.audio)
			return;

		let audio = this.audioLookup[clip.audio];

		if (!isNaN(Number(clip.audioStart)))
			offset = Number(clip.audioStart)

		audio.currentTime = offset;
		
		audio.play();
	}

	public stopAll = function()
	{
		for(let key in this.audioLookup)
		{
			this.audioLookup[key].pause();
			this.audioLookup[key].currentTime = 0;
		}
	}

	public addFile = function(url: string)
	{
		if(!this.audioLookup[url])
			this.audioLookup[url] = new Audio(convertFileSrc(url));
	}
}