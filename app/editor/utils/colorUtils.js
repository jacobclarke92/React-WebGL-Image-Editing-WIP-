import regression from 'regression'
import { clamp } from './mathUtils'
import { isNumeric } from './typeUtils'

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

export function interpolateGradient(_markers, range = 255) {
	// map the position and alpha to 255 then sort by position
	let markers = _markers.map(marker => ({
		...marker, 
		position: Math.floor(marker.position*range), 
		alpha: Math.floor(marker.alpha*255)
	})).sort((a,b) => a.position < b.position ? -1 : (a.position > b.position ? 1 : 0));

	// if first marker is above 0 then create an identical one at 0
	if(markers[0].position > 0) markers = [{...markers[0], position: 0}, ...markers];
	// and vice versa
	if(markers[markers.length-1].position < 255) markers = [...markers, {...markers[markers.length-1], position: 255}];

	const rgbaData = [];
	let currentMarker = markers[0];
	let nextMarker = markers[1];
	for(let i=0; i<range; i++) {

		// bump current marker if reached next marker position
		if(i >= nextMarker.position) currentMarker = nextMarker;

		// don't proceed if reached last marker (position 255)
		const currentMarkerIndex = markers.indexOf(currentMarker);
		if(currentMarkerIndex === markers.length-1) break;
		nextMarker = markers[currentMarkerIndex+1];

		// get percentage along current and next marker
		const amt = (i-currentMarker.position)/(nextMarker.position-currentMarker.position);

		// add pixel data to array
		rgbaData.push(currentMarker.color[0]*(1-amt) + nextMarker.color[0]*amt);
		rgbaData.push(currentMarker.color[1]*(1-amt) + nextMarker.color[1]*amt);
		rgbaData.push(currentMarker.color[2]*(1-amt) + nextMarker.color[2]*amt);
		rgbaData.push(currentMarker.alpha*(1-amt) + nextMarker.alpha*amt);
	}
	return rgbaData;
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

const red 		= [187, 13,  44];
const orange	= [188, 81,  22];
const yellow	= [191, 182, 38];
const green		= [69,  188, 33];
const aqua		= [44,  190, 161];
const blue		= [13,  109, 188];
const purple	= [143, 33,  188];
const magenta 	= [187, 23,  123];

const hueAdjustRanges = {
	reds: [magenta, orange],
	oranges: [red, yellow],
	yellows: [orange, green],
	greens: [yellow, aqua],
	aquas: [green, blue],
	blues: [aqua, purple],
	purples: [blue, magenta],
	magentas: [magenta, red],
}