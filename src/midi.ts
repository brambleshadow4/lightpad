import {invoke} from '@tauri-apps/api/tauri';
export {sendMidi}

function padArray(arr: number[]): number[]
{
	let newArr = arr.slice();
	while(newArr.length < 32)
	{
		newArr.push(0);
	}
	return newArr;
}

function sendMidi(bytes: number[])
{
	if(bytes.length > 32)
		throw new Error("Supporting MIDI messages longer than 32 bytes is not support :(");

	let newBytes = padArray(bytes)

	invoke('send_midi', {
		len: bytes.length, // has to be before call to padArray since padArray changes the length
		data: newBytes
	});	
}

