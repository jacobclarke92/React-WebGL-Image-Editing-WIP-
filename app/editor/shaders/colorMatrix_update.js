const defaultMatrix = [
	1, 0, 0, 0, 0,
	0, 1, 0, 0, 0,
	0, 0, 1, 0, 0,
	0, 0, 0, 1, 0
];

export default function(settings) {
	const matrix = settings.matrix || defaultMatrix;
	const location = this.gl.getUniformLocation(this.program, 'Matrix') || this.gl.getUniformLocation(this.program, 'Matrix[0]');
	if(location) this.gl.uniform1fv(location, new Float32Array(matrix));
}