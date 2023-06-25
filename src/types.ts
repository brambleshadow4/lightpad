export {LightClip, Clip}

type LightClip = {
	keyframes: {[k:number] : number[]},
	track: number, // the track no of the sequence the clip is on
	start: number,
	end: number
}

type Clip =  {
	audio?: string, // path to the audio files
	tempo?: string, // tempo to set the project to 
	attack?: LightClip,
	sequence?: LightClip[][],
	clearAudio?: boolean,
	clearLights?: boolean,
	pageTo?: number
}