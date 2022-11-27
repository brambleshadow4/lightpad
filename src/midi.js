import {invoke} from '@tauri-apps/api/tauri';

function padArray(arr)
{
	while(arr.length < 32)
	{
		arr.push(0);
	}
	return arr;
}

function sendMidi(bytes)
{
	if(bytes.length > 32)
		throw new Error("Supporting MIDI messages longer than 32 bytes is not support :(");

	invoke('send_midi', {
		len: bytes.length, // has to be before call to padArray since padArray changes the length
		data: padArray(bytes)
	});	
}

export {sendMidi}