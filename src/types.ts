export {LightClip, Clip}

type LightClip = {
	keyframes: {[k:number] : number[]},
	track: number, // the track no of the sequence the clip is on
	start: number,
	end: number,
	isPattern?: boolean
}

type Clip =  {
	audio?: string, // path to the audio files
	audioStart?: string, // how many seconds in to start the audio
	tempo?: string, // tempo to set the project to 
	attack?: LightClip,
	pattern?: LightClip,
	sequence?: LightClip[][],
	clearAudio?: boolean,
	clearLights?: boolean,
	pageTo?: number
}