
/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
export function compileShader(gl, shaderSource, shaderType) {
	// Create the shader object
	var shader = gl.createShader(shaderType);
 
	// Set the shader source code.
	gl.shaderSource(shader, shaderSource);
 
	// Compile the shader
	gl.compileShader(shader);
 
	// Check if it compiled
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!success) {
		// Something went wrong during compilation; get the error
		console.log(gl.getShaderInfoLog(shader));
		throw "could not compile shader"
	}
 
	return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
export function createProgram(gl, vertexShader, fragmentShader) {
	// create a program.
	const program = gl.createProgram();
 
	// attach the shaders.
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
 
	// link the program.
	gl.linkProgram(program);
 
	// Check if it linked.
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!success) {
			// something went wrong with the link
			throw ("program failed to link:" + gl.getProgramInfoLog (program));
	}
 
	return program;
};


/**
 * Creates a program from 2 script tags.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} vertexShader The vertex shader string.
 * @param {string} fragmentShader The fragment shader string.
 * @return {!WebGLProgram} A program
 */
export function createProgramFromSources(gl, vertexSource, fragmentSource) {

	const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
	const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
	return createProgram(gl, vertexShader, fragmentShader);
}