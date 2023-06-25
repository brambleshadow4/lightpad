export default PlaybackEngine;

let BLANK_FRAME = [0]
while(BLANK_FRAME.length < 81)
	BLANK_FRAME.push(0);

function PlaybackEngine(lightArray, tempo)
{
	this.StartTime = -1;
	this.Keyframes = []
	this.Clips = [];
	this.CurrentKeyframe = [];
	this.InProgress = true;

	this.framesPerMs = 48 * tempo/60/1000;

	this.lights = lightArray;
	this.queue = [];
	this.queueStarted = false;

	this.composite = {};

	this.nextOrder = 1;


	let self = this;

	this.setTempo = function(tempo)
	{
		let newTempo = Number(tempo);
		if(isNaN(newTempo) || !newTempo)
			return;

		this.framesPerMs = 48 * newTempo/60/1000;
	}

	this.processQueue = function()
	{
		let doUpdate = false;

		for(let i=0; i<self.queue.length; i++)
		{
			let clip = self.queue[i];

			let ellapsedTime = new Date().getTime() - clip.StartTime;

			if(clip.type == "clip")
			{
				let nextKeyframe = clip.Keyframes[0];

				if(nextKeyframe == undefined || clip.InProgress == false)
				{
					clip.InProgress = false;
					self.queue.splice(i,1);
				
					if(!clip.preserve)
						delete self.composite[clip.order];

					doUpdate = true;
					i--;

					continue;
				}

				if(ellapsedTime * self.framesPerMs >= nextKeyframe)
				{
					clip.Keyframes.shift();
					self.composite[clip.order] = clip.Clip.keyframes[nextKeyframe];	
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
					let innerClipStart = innerClip.start * 192/self.framesPerMs;

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



					self.queue.push({
						type: "clip",
						order: clip.Orders[i],
						Clip: newClip,
						preserve,
						StartTime: clip.StartTime + innerClipStart,
						Keyframes: keyframes
					});

					clip.Clips[i].shift();
				}		
			}	
		}

		requestAnimationFrame(self.processQueue);

		if(!doUpdate)
			return;

		let composite = [];
		while(composite.length < 81)
			composite.push(0);

		let keys = Object.keys(self.composite).map(x => Number(x)).sort((a,b)=>b-a);

		for(let key of keys)
		{
			for(let i=0; i<81; i++)
			{
				if(composite[i] == 0)
					composite[i] = self.composite[key][i];
			}
		}

		self.lights.setLightData(composite);
	}


	this.stopAll = function()
	{
		this.composite = {};
		this.queue = [];
		lightArray.setLightData(BLANK_FRAME);
	}


	/* Clip has the keyframes property */
	this.playClip = function playClip(lightClip, offset)
	{
		if(lightClip.tempo)
		{
			this.setTempo(lightClip.tempo);
		}

		offset = offset || 0;

		if(lightClip.clearLights)
		{
			self.composite = {};
			self.queue = [];
		}

		if(!this.queueStarted)
			this.processQueue();

		if(!lightClip.attack && !lightClip.sequence)
			return;

		

		if(lightClip.attack)
		{
			let keyframes = Object.keys(lightClip.attack.keyframes).map(x => Number(x));
			keyframes.sort((a,b) => a-b);	

			self.queue.push({
				type: "clip",
				order: self.nextOrder++,
				Clip: lightClip.attack,
				StartTime: new Date().getTime(),
				Keyframes: keyframes
			});
		}

		if(lightClip.sequence)
		{
			let playbackObj = {
				type: "sequence",
				StartTime: new Date().getTime() - offset,
				Clips: [[],[],[],[]], // the list of clips per track. Each gets removed slowly
				Orders: [self.nextOrder++, self.nextOrder++, self.nextOrder++, self.nextOrder++].reverse()
			}	

			for(let i=0; i<4; i++)
			{
				for(let seqClip of lightClip.sequence[i])
				{
					let clipCopy = JSON.parse(JSON.stringify(seqClip));

					if(clipCopy.start*192/self.framesPerMs >= offset)
						playbackObj.Clips[i].push(clipCopy);
				}
			}

			self.queue.push(playbackObj);
		}
	}
}