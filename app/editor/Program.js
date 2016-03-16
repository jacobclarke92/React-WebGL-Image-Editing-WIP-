import Texture from 'editor/Texture'

import { createProgramFromSources } from 'editor/utils/shaderUtils'
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
	}

	destroy() {
		this.gl.deleteProgram(this.program);
        this.program = null;
	}

    resize(width, height) {
        const resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(resolutionLocation, width, height);
        this.width = width;
        this.height = height;
    }

    render() {
        this.renderFunction.apply(this, [this.gl, this.program, ...this.renderArgs]);
        this.drawRect();
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

	drawRect(left, top, right, bottom) {


        // calculate draw dimensions based on viewport
        const viewport = this.gl.getParameter(this.gl.VIEWPORT);
        top = top !== undefined ? (top - viewport[1]) / viewport[3] : 0;
        left = left !== undefined ? (left - viewport[0]) / viewport[2] : 0;
        right = right !== undefined ? (right - viewport[0]) / viewport[2] : 1;
        bottom = bottom !== undefined ? (bottom - viewport[1]) / viewport[3] : 1;

        // creates a vertex buffer if ones doesn't exist
        if (this.gl.vertexPositionBuffer == null) {
            this.gl.vertexPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([ 
                left, top, 
                left, bottom, 
                right, top, 
                right, bottom 
            ]), this.gl.STATIC_DRAW);
        }

        // set and enable position location if not
        if (this.vertexPositionLocation == null) {
            this.vertexPositionLocation = this.gl.getAttribLocation(this.program, 'a_vertexPosition');
            this.gl.enableVertexAttribArray(this.vertexPositionLocation);
        }



        this.gl.useProgram(this.program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexPositionBuffer);
        this.gl.vertexAttribPointer(this.vertexPositionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

}