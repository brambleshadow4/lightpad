import {sendMidi} from "./midi.js";

export default LightArray;

function LightArray()
{
	this.array = [];
	this.sync = true;

	for(let y=0; y<9; y++)
	{
		let innerArray = [];
		for(let x = 0; x < 9; x++)
		{
			let light = new Light(x,y);
			light.parent = this;
			light.lightOff();
			innerArray.push(light);
		}

		this.array.push(innerArray)
	}

	this.setSync = function setSync(value)
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

	this.getLightData = function getLightData()
	{
		let data = [];
		for(let arr of this.array)
		{
			for (let light of arr)
			{
				data.push(light.componentColor);
			}
		}

		return data;
	}

	this.setLightData = function setLightData(data)
	{
		let dataCopy = data.slice();

		for(let arr of this.array)
		{
			for (let light of arr)
			{
				let newColor = dataCopy.shift();
				if(light.color != newColor)
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

function Light(x,y)
{
	this.x = x;
	this.y = y;
	this.padAddress = (9-y)*10+ 1 + x;
	this.deviceColor = 0;
	this.componentColor = 0;
	this.lightOn = function lightOn(color)
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

	this.lightOff = function lightOff()
	{
		this.deviceColor = 0;
		if(this.parent.sync)
			this.componentColor = 0;
		sendMidi([144, this.padAddress, 0]);
		lightArray = lightArray;
	}

	this.ondragstart = function(e){
		e.stopPropogation();
		e.preventDefault();
		return false;
	}
}