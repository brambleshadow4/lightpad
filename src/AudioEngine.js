export default AudioEngine;

import { convertFileSrc } from '@tauri-apps/api/tauri';

function AudioEngine()
{
	this.audioLookup = {};

	this.isReady = function()
	{

	}

	this.playFile = function(clip)
	{
		if(clip.clearAudio)
		{
			for(let key in this.audioLookup)
			{
				this.audioLookup[key].pause();
				this.audioLookup[key].currentTime = 0;
			}
		}

		if(!clip.audio)
			return;

		let audio = this.audioLookup[clip.audio];

		audio.currentTime = 0;
		audio.play();
	}

	this.addFile = function(url)
	{
		if(!this.audioLookup[url])
			this.audioLookup[url] = new Audio(convertFileSrc(url));
	}
}