export default AudioEngine;

import { convertFileSrc } from '@tauri-apps/api/tauri';

function AudioEngine()
{
	this.audioLookup = {};

	this.isReady = function()
	{

	}

	this.playFile = function(clip, offsetMs)
	{
		let offset = offsetMs/1000 || 0;

		if(clip.clearAudio)
		{
			this.stopAll();
		}

		if(!clip.audio)
			return;

		let audio = this.audioLookup[clip.audio];

		audio.currentTime = offset;
		audio.play();
	}

	this.stopAll = function()
	{
		for(let key in this.audioLookup)
		{
			this.audioLookup[key].pause();
			this.audioLookup[key].currentTime = 0;
		}
	}

	this.addFile = function(url)
	{
		if(!this.audioLookup[url])
			this.audioLookup[url] = new Audio(convertFileSrc(url));
	}
}