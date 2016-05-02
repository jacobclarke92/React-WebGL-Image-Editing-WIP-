import { clamp } from 'editor/utils/mathUtils'
import { curvesHashTable, getContrastCurve, getVibranceMatrix, getTemperatureRGB} from 'editor/utils/colorUtils'


export function temperature(amount) {

	const {red, green, blue} = getTemperatureRGB(amount);
	// console.log('Temperature: '+amount+' K', red, green, blue);

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

export function curves(options) {
	const channels = options.channels || 'rgb';
	const curves = options.curves || [[0,0], [255, 255]];
	return {
		key: 'curves',
		channels,
		curves,
	}
}

export function exposure(amount) {

	const p = Math.abs(amount) / 100;
	const ctrl1 = [0, 255*p];
	const ctrl2 = [255 - (255*p), 255];
	if(amount < 0) {
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
	const ctrl1 = [0, amount];
	const ctrl2 = [255, 255 - amount/2];

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

export function blur(amount) {
	const value = clamp(amount, 0, 100);
	return {
		key: 'blur',
		value
	}
}

export function bloom(amount) {
	const value = clamp(amount, 0, 1);
	return {
		key: 'bloom',
		value
	}
}

export function denoise(amount) {
	amount = clamp(amount, 0, 1);
	const value = 3 + 200 * Math.pow(1 - amount, 4);
	return {
		key: 'denoise',
		value
	}
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

export function gamma(amount) {
	const value = clamp(amount, 0, 10);
	return {
		key: 'gamma',
		value
	}
}

export function grain(amount) {
	const value = clamp(amount, 0, 1);
	return {
		key: 'grain',
		value,
	};
}

export function hueAdjustment(options) {
	console.warn('HUE ADJUST OPTS', options);
	const value = clamp(options.value, -1, 1);
	const range = clamp(options.range, 0, 1);
	return {
		key: 'hueAdjustment',
		value,
		color: options.color,
		range,
	};
}

export function saturationAdjustment(options) {
	console.warn('LUMINANCE ADJUST OPTS', options);
	const value = clamp(options.value, -1, 1);
	const range = clamp(options.range, 0, 1);
	return {
		key: 'saturationAdjustment',
		value,
		color: options.color,
		range,
	};
}

export function luminanceAdjustment(options) {
	console.warn('LUMINANCE ADJUST OPTS', options);
	const value = clamp(options.value, -1, 1);
	const range = clamp(options.range, 0, 1);
	return {
		key: 'luminanceAdjustment',
		value,
		color: options.color,
		range,
	};
}