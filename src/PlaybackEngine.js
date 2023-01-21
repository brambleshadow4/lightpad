export {PlaybackEngine}

function PlaybackEngine(lightArray, tempo)
{
	this.StartTime = -1;
	this.Keyframes = []
	this.Clips = [];
	this.CurrentKeyframe = [];
	this.InProgress = true;

	this.framesPerMs = 48 * tempo/60/1000;

	this.lights = lightArray

	let self = this;

	/* Clip has the keyframes property */
	this.playClip = function playClip(clip)
	{
		//console.log("playClip");

		if(self.StartTime == -1)
		{
			self.Clip = clip
			self.StartTime = new Date().getTime();
			self.Keyframes = Object.keys(clip.keyframes).map(x => Number(x));
			self.Keyframes.sort((a,b) => a-b);
		}

		//console.log(self);

		let nextKeyframe = self.Keyframes[0];

		if(nextKeyframe == undefined || self.InProgress == false)
		{
			self.InProgress = false;
			return;
		}

		requestAnimationFrame(self.playClip);
		//setTimeout(playClip, 0);
		let ellapsedTime = new Date().getTime() - self.StartTime;


		if(ellapsedTime * self.framesPerMs >= nextKeyframe)
		{

			self.Keyframes.shift();
			self.lights.setLightData(self.Clip.keyframes[nextKeyframe]);
		}
	}

	this.playSequence = function playSequence(_, halt)
	{
		if(halt)
		{
			self.Stop = true;
			return;
		}

		if(self.StartTime == -1)
		{ 
			//let offset = playbackHead * 192 /framesPerMs;
			self.StartTime = new Date().getTime() - offset;

			setAudioPlaybackPosition();
			if(self.Audio)
				self.Audio.play();

			
			self.Keyframes = [[],[],[],[]] // list of next keyframes on each track
			self.Composite = [[],[],[],[]]; // list of each 
			self.ActiveClip = []; // the clips currently being played
			self.Clips = [[],[],[],[]]; // the list of clips per track. Each gets removed slowly
			self.ResetBackTo = playbackHead;

			for(let i=0; i<4; i++)
			{
				for(let clip of sequence[i])
				{
					let clipCopy = JSON.parse(JSON.stringify(clip));

					if(clipCopy.end >= playbackHead)
					{
						self.Clips[i].push(clipCopy);
					}
				}

				if(self.Keyframes[i].length == 0 && self.Clips[i].length > 0)
				{
					let clip = self.Clips[i].shift();
					self.ActiveClip[i] = clip;

					let end = (clip.end-clip.start)*192;
					clip.keyframes[end] = blankFrame.slice(); // remove all lights keyframe 
					let keyframes = Object.keys(clip.keyframes).filter(x => x <= end).map(x => Number(x) + clip.start * 192);
					keyframes.sort((a,b) => a-b);
					self.Keyframes[i] = keyframes;
				}
			}
		}

		let allZero = true;
		for(let i=0; i<4; i++)
		{
			if(self.Keyframes[i].length)
			{
				allZero = false;
				break;
			}
		}

		if(allZero || self.Stop)
		{
			self.StartTime = -1;
			playbackHead = self.ResetBackTo;
			if(self.Audio)
				self.Audio.pause();
			delete self.Stop;
			setAudioPlaybackPosition();

			return;
		}

		let ellapsedTime = new Date().getTime() - self.StartTime;
		

		// playbackHead = ellapsedTime * framesPerMs/192;

		let compositeUpdated = false;

		for(let i=0; i<4; i++)
		{
			while(self.Keyframes[i][0] != undefined && ellapsedTime * framesPerMs >= self.Keyframes[i][0])
			{
				let k = self.Keyframes[i].shift();
				k = k - self.ActiveClip[i].start * 192;

				self.Composite[i] = self.ActiveClip[i].keyframes[k];
				compositeUpdated = true;
			}

			if(self.Keyframes[i].length == 0 && self.Clips[i].length > 0)
			{
				let clip = self.Clips[i].shift();
				self.ActiveClip[i] = clip;

				let end = (clip.end-clip.start)*192;
				clip.keyframes[end] = blankFrame.slice(); // remove all lights keyframe 
				let keyframes = Object.keys(clip.keyframes).filter(x => x <= end).map(x => Number(x) + clip.start * 192);
				keyframes.sort((a,b) => a-b);
				self.Keyframes[i] = keyframes;
			}

			while(self.Keyframes[i][0] != undefined && ellapsedTime * framesPerMs >= self.Keyframes[i][0])
			{
				let k = self.Keyframes[i].shift();
				k = k - self.ActiveClip[i].start * 192;

				self.Composite[i] = self.ActiveClip[i].keyframes[k];
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

			self.lights.setLightData(composite);
		}

		requestAnimationFrame(self.playSequence);
	}
}