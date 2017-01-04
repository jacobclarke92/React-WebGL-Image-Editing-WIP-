import { clamp } from './utils/mathUtils'
import { isArray } from './utils/typeUtils'
import { curvesHashTable, getContrastCurve, getVibranceMatrix, getTemperatureRGB} from './utils/colorUtils'

export function colorMatrix(matrix) {
	return {
		key: 'colorMatrix',
		matrix,
	};
}

export function colorMap(markers) {
	return {
		key: 'colorMap',
		markers,
	}
}

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

export function pixelSortHorizontal(range) {
	return pixelSort(range, 1);
}

export function pixelSortVertical(range) {
	return pixelSort(range, 2);
}

export function pixelSort(range, direction = 1) {
	const min = clamp(range[0], 0, 255)/64 - 2;
	const max = clamp(range[1], 0, 255)/64 - 2;
	return {
		iterations: 20,
		key: 'pixelSort',
		min,
		max,
		direction,
	};
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
	const value = clamp((options.value || 0), -1, 1);
	const range = clamp((options.range || 0.2), 0, 1);
	const color = isArray(options.color) ? options.color : [0, 0, 0];
	console.log('HUE ADJUST', color, value, range);
	return {
		key: 'hueAdjustment',
		value,
		color,
		range,
	};
}

export function saturationAdjustment(options) {
	const value = clamp((options.value || 0), -1, 1);
	const range = clamp((options.range || 0.1), 0, 1);
	const color = isArray(options.color) ? options.color : [0, 0, 0];
	console.log('SATURATION ADJUST', color, value, range);
	return {
		key: 'saturationAdjustment',
		value,
		color,
		range,
	};
}

export function luminanceAdjustment(options) {
	const value = clamp((options.value || 0), -1, 1);
	const range = clamp((options.range || 0.1), 0, 1);
	const color = isArray(options.color) ? options.color : [0, 0, 0];
	console.log('LUMINANCE ADJUST', color, value, range);
	return {
		key: 'luminanceAdjustment',
		value,
		color,
		range,
	};
}