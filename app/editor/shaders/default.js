export default function render(gl, program, texture) {

	console.log('running render function');

	// use texture provided
	gl.bindTexture(gl.TEXTURE_2D, texture);

}