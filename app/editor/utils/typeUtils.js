export function isNumeric(val) {
	return (!isNaN(parseFloat(val)) && isFinite(val));
}

export function isArray(val) {
	return (val instanceof Array);
}

export function isObject(val) {
	return (typeof val === 'object' && !isArray(val));
}