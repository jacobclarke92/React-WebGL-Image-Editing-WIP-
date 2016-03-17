import Texture from 'editor/Texture'

import { createProgramFromSources } from 'editor/utils/shaderUtils'
import { setRectangle } from 'editor/utils/webglUtils'
import { isNumeric, isArray } from 'editor/utils/typeUtils'

import defaultVertexSource from 'editor/shaders/default_vertex.glsl'
import defaultFragmentSource from 'editor/shaders/default_fragment.glsl'

export default class Program {

	constructor(gl, vertexSource = defaultVertexSource, fragmentSource = defaultFragmentSource) {
		if(!gl) throw 'No GL instance provided for shader';
		this.gl = gl;
		this.program = createProgramFromSources(this.gl, vertexSource, fragmentSource);

        this.label = '[unlabeled]';
        this.width = 100;
        this.height = 100;

        return this;
	}

	destroy() {
		this.gl.deleteProgram(this.program);
        this.program = null;
	}

    use() {
        this.gl.useProgram(this.program);
        return this;
    }

    resize(width, height) {
        this.use();

        const resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(resolutionLocation, width, height);
        this.width = width;
        this.height = height;

        return this;
    }

	uniforms(uniforms) {

		this.use();
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

        return this;
	}

	textures(textures) {
		this.use();
        for (let name in textures) {
            if (!textures.hasOwnProperty(name)) continue;
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
        }

        return this;
	}

	willRender(left, top, right, bottom) {

        const gl = this.gl;
        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
        if(!this.texCoordBuffer) this.texCoordBuffer = gl.createBuffer();

        // use tex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
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

        return this;
    }

    didRender() {

        const gl = this.gl;
        // look up where the vertex data needs to go.
        const positionLocation = gl.getAttribLocation(this.program, "a_position");
        if(!this.buffer) this.buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // use this buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // Set a rectangle the same size as the image.
        setRectangle(gl, 0, 0, this.width, this.height);

        return this;
    }

    draw() {
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return this;
    }

}
