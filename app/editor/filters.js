import { clamp } from 'editor/utils/mathUtils'
import { curvesHashTable, getContrastCurve, getVibranceMatrix, getTemperatureRGB} from 'editor/utils/colorUtils'


export function temperature(amount) {

	const {red, green, blue} = getTemperatureRGB(adjust);
	console.log('Temperature: '+adjust+' K', red, green, blue);

	const matrix = [
		red/255,	0,	0,	0,	0,
		0,	green/255,	0,	0,	0,
		0,	0,	blue/255,	0,	0,
		0,	0,	0,	1,	0
	];

	return {
		key: 'colorMatrix', 
		matrix,
	};
}

export function exposure(amount) {

	const p = Math.abs(adjust) / 100;
	const ctrl1 = [0, 255*p];
	const ctrl2 = [255 - (255*p), 255];
	if(adjust < 0) {
		ctrl1.reverse();
		ctrl2.reverse();
	}

	return {
		key: 'curves', 
		channels: 'rgb', 
		curves: [ctrl1, ctrl2],
	}
}

export function contrast(amount) {

	const curves = getContrastCurve(amount);

	return {
		key: 'curves', 
		channels: 'rgb', 
		curves,
	};
}

// insert shadow and highlight recovery here

export function fade(amount) {
	const ctrl1 = [0, adjust];
	const ctrl2 = [255, 255 - adjust/2];

	return {
		key: 'curves', 
		channels: 'rgb',
		curves: [ctrl1, ctrl2],
	};
}

export function vibrance(amount) {

	const matrix = getVibranceMatrix(amount);

	return {
		key: 'colorMatrix', 
		matrix,
	};
}

export function saturation(amount) {
	const value = clamp(amount, -1, 1);
	return {
		key: 'saturation', 
		value,
	};
}

export function channels(options) {

	const red = options.red ? options.red/100 : 0;
	const green = options.green ? options.green/100 : 0;
	const blue = options.blue ? options.blue/100 : 0; 
	const matrix = [
		1,	0,	0,	0,	red,
		0,	1,	0,	0,	green,
		0,	0,	1,	0,	blue,
		0,	0,	0,	1,	0
	];

	return {
		key: 'colorMatrix', 
		matrix,
	};
}

export function hue(amount) {
	const value = clamp(amount, 0, 2);
	return {
		key: 'hue',
		value,
	}
}

export function sharpen(amount) {
	const value = clamp(amount, 0, 10);
	return {
		key: 'sharpen', 
		value,
	};
}

export function grain(amount) {
	const value = clamp(amount, 0, 1);
	return {
		key: 'grain', 
		value,
	};
}