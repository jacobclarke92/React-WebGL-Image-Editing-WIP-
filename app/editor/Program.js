import Texture from 'editor/Texture'

import { createProgramFromSources } from 'editor/utils/shaderUtils'
import { setRectangle } from 'editor/utils/webglUtils'
import { isNumeric, isArray } from 'editor/utils/typeUtils'

import defaultVertexSource from 'editor/shaders/default_vertex.glsl'
import defaultFragmentSource from 'editor/shaders/default_fragment.glsl'

export default class Program {

	constructor(gl, vertexSource = defaultVertexSource, fragmentSource = defaultFragmentSource, renderFunction = () => {}) {
		if(!gl) throw 'No GL instance provided for shader';
		this.gl = gl;
		this.program = createProgramFromSources(this.gl, vertexSource, fragmentSource);
        this.renderFunction = renderFunction;

		this.vertexPositionLocation = null;
        this.renderArgs = [];
        this.label = '[unlabeled]';
        this.width = 550;
        this.height = 400;
        this.texture = null;
	}

	destroy() {
		this.gl.deleteProgram(this.program);
        this.program = null;
        if(this.texture) this.texture.destroy();
	}

    resize(width, height) {
        this.gl.useProgram(this.program);

        const resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(resolutionLocation, width, height);
        this.width = width;
        this.height = height;
    }

    render() {
        console.log('rendering shader');
        this.gl.useProgram(this.program);
        this.preRender();
        this.renderFunction.apply(this, [this.gl, this.program, this.texture, ...this.renderArgs]);
        this.postRender();
    }

	uniforms(uniforms) {

		this.gl.useProgram(this.program);
        for (let name in uniforms) {
            if (!uniforms.hasOwnProperty(name)) continue;

            const location = this.gl.getUniformLocation(this.program, name);
            if (location === null) continue; // will be null if the uniform isn't used in the shader

            const value = uniforms[name];
            if (isArray(value)) {
                switch (value.length) {
                    case 1:  this.gl.uniform1fv(location, new Float32Array(value)); break;
                    case 2:  this.gl.uniform2fv(location, new Float32Array(value)); break;
                    case 3:  this.gl.uniform3fv(location, new Float32Array(value)); break;
                    case 4:  this.gl.uniform4fv(location, new Float32Array(value)); break;
                    case 9:  this.gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                    case 16: this.gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                    default: throw 'dont\'t know how to load uniform "' + name + '" of length ' + value.length;
                }
            } else if (isNumeric(value)) {
                this.gl.uniform1f(location, value);
            } else {
                throw 'attempted to set uniform "' + name + '" to invalid value ' + (value || 'undefined').toString();
            }
        }

        // allow chaining
        return this;
	}

	textures(textures) {
		this.gl.useProgram(this.program);
        for (let name in textures) {
            if (!textures.hasOwnProperty(name)) continue;
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
        }

        // allow chaining
        return this;
	}

	preRender(left, top, right, bottom) {

        const gl = this.gl;

        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

        // provide texture coordinates for the rectangle.
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    }

    postRender() {

        const gl = this.gl;

        // look up where the vertex data needs to go.
        const positionLocation = gl.getAttribLocation(this.program, "a_position");

        // Create a buffer for the position of the rectangle corners.
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set a rectangle the same size as the image.
        setRectangle(gl, 0, 0, this.width, this.height);


        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

}
