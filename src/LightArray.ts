import {sendMidi} from "./midi";

export default class LightArray 
{
	public sync: boolean = true;
	public updateControl?: Function;
	public array: Light[][] = [];
	public patternArray: Light[][] = [];

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

		for(let y=0; y<15; y++)
		{
			let innerArray: Light[] = [];
			for(let x = 0; x < 15; x++)
			{
				let light = new Light(x,y, true);
				light.parent = this;
				light.lightOff();
				innerArray.push(light);
			}

			this.patternArray.push(innerArray)
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

	public getPatternData(): number[]
	{
		let data: number[] = [];
		for(let arr of this.patternArray)
		{
			for (let light of arr)
			{
				data.push(light.componentColor);
			}
		}

		return data;
	}

	public setPatternData(data: number[])
	{
		let dataCopy = data.slice();

		for(let arr of this.patternArray)
		{
			for (let light of arr)
			{
				let newColor = dataCopy.shift() || 0;
				if(light.componentColor != newColor)
				{
					light.lightOn(newColor);
				}
			}
		}

		if(this.updateControl)
			this.updateControl();
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

	public setPatternPosition(padAddress: number)
	{
		let selectedX = (padAddress-11)%10;
		let selectedY = Math.floor((padAddress-11)/10);

		for(let y=0; y<15; y++)
		{
			for (let x=0; x<15; x++)
			{
				let xOffsetFromMid = x - 7;
				let yOffsetFromMid = 7 - y;

				let newX = xOffsetFromMid + selectedX;
				let newY = yOffsetFromMid + selectedY;

				let newAddress = -1;

				if(0 <= newX && newX <= 7 && 0 <= newY && newY <= 7)
					newAddress = newY*10 + 11 + newX
				

				this.patternArray[y][x].padAddress = newAddress;
			}
		}
	}

	public setRelativeLight
}


let lightArray = [];

class Light
{
	private x = 0;
	private y = 0;
	public padAddress = -1;
	public deviceColor = 0;
	public componentColor = 0;
	public parent: LightArray;

	constructor(x: number, y: number, patternLight=false)
	{
		this.x = x;
		this.y = y;
		if(!patternLight)
			this.padAddress = (9-y)*10 + 1 + x;
		else
			this.padAddress = -1;
		this.deviceColor = 0;
		this.componentColor = 0;
	}


	public lightOn(color: number): void
	{
		if(this.parent.sync)
			this.componentColor = color;

		if(this.deviceColor != color && this.padAddress != -1)
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
		if(this.padAddress != -1)
			sendMidi([144, this.padAddress, 0]);
		lightArray = lightArray;
	}


}
