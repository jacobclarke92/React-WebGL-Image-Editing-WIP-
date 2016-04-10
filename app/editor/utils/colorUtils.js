import regression from 'regression'
import { clamp } from 'editor/utils/mathUtils'
import { isNumeric } from 'editor/utils/typeUtils'

export function curvesHashTable(points = [[0,0], [255,255]], min = 0, max = 255) {
	const result = regression('polynomial', points, points.length-1);
	const coefficients = result.equation;
	const curvesHashTable = [];
	for(var x = min; x <= max; x++) {
		curvesHashTable[x] = 0;
		for(var c=points.length-1; c >= 0; c --) {
			curvesHashTable[x] += coefficients[c]*Math.pow(x, c);
		}
		curvesHashTable[x] = clamp(curvesHashTable[x], min, max);
	}
	return curvesHashTable;
}

// modeled from photoshop
export function getContrastCurve(contrast = 0) {
	if(typeof contrast == 'string' && isNumeric(contrast)) contrast = parseInt(contrast);
	const amt = 75;
	return [
		[0,		0],
		[amt, 	0+amt-contrast],
		[180,	255-amt+contrast],
		[255,	255]
	];
}

export function getVibranceMatrix(vibrance) {
	if(typeof vibrance == 'string' && isNumeric(vibrance)) vibrance = parseInt(vibrance);
	const amt = vibrance/200;
	return [
		1+amt,		-amt/1.5,	-amt/1.5,	0,	0,
		-amt/1.5,	1+amt,		-amt/1.5,	0,	0,
		-amt/1.5,	-amt/1.5,	1+amt,		0,	0,
		0,			0,			0,			1,	0,
	];
}

// http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
export function getTemperatureRGB(temp) {
	temp /= 100;

	let red = temp <= 66 ? 255 : 329.698727446 * Math.pow( temp - 60, -0.1332047592 );
	red = red < 0 ? 0 : red > 255 ? 255 : red;

	let green = temp <= 66 ? 99.4708025861 * Math.log( temp ) - 161.1195681661 : 288.1221695283 * Math.pow( temp - 60, -0.0755148492 );
	green = green < 0 ? 0 : green > 255 ? 255 : green;

	let blue = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.5177312231 * Math.log( temp - 10 ) - 305.0447927307;
	blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;

	return {red, green, blue};
}