import {sendMidi} from "./midi";

export default class LightArray 
{
	public sync: boolean = true;
	public updateControl?: Function;
	public array: Light[][] = [];

	constructor()
	{
		this.array = [];
		this.sync = true;

		for(let y=0; y<9; y++)
		{
			let innerArray: Light[] = [];
			for(let x = 0; x < 9; x++)
			{
				let light = new Light(x,y);
				light.parent = this;
				light.lightOff();
				innerArray.push(light);
			}

			this.array.push(innerArray)
		}
	}

	public setSync(value)
	{
		let oldSync = this.sync;
		this.sync = value;
		if(!oldSync && value)
		{
			for(let arr of this.array)
			{
				for (let light of arr)
				{
					light.lightOn(light.componentColor);
				}
			}
			
		}
	}

	public getLightData(): number[]
	{
		let data: number[] = [];
		for(let arr of this.array)
		{
			for (let light of arr)
			{
				data.push(light.componentColor);
			}
		}

		return data;
	}

	public setLightData(data: number[])
	{
		let dataCopy = data.slice();

		for(let arr of this.array)
		{
			for (let light of arr)
			{
				let newColor = dataCopy.shift() || 0;
				if(light.componentColor != newColor)
				{
					//window.midiSignalSent++
					light.lightOn(newColor);
				}
				
			}
		}

		if(this.updateControl)
			this.updateControl();
	}
}


let lightArray = [];

class Light
{
	private x = 0;
	private y = 0;
	private padAddress = -1;
	public deviceColor = 0;
	public componentColor = 0;
	public parent: LightArray;

	constructor(x: number, y: number)
	{
		this.x = x;
		this.y = y;
		this.padAddress = (9-y)*10+ 1 + x;
		this.deviceColor = 0;
		this.componentColor = 0;
	}

	public lightOn(color: number): void
	{
		
		if(this.parent.sync)
			this.componentColor = color;

		if(this.deviceColor != color)
		{
			sendMidi([144, this.padAddress, color]);
			this.deviceColor = color;
		}
		
		lightArray = lightArray;
	}

	public lightOff()
	{
		this.deviceColor = 0;
		if(this.parent.sync)
			this.componentColor = 0;
		sendMidi([144, this.padAddress, 0]);
		lightArray = lightArray;
	}


}
