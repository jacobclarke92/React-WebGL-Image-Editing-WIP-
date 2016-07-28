import Texture from './Texture'

import { createProgramFromSources } from './utils/shaderUtils'
import { setBufferRectangle } from './utils/webglUtils'
import { isNumeric, isArray } from './utils/typeUtils'

import defaultVertexSource from './shaders/default_vertex.glsl'
import defaultFragmentSource from './shaders/default_fragment.glsl'

export default class Program {

	constructor(label = '[[unlabeled]]', gl, vertexSource = defaultVertexSource, fragmentSource = defaultFragmentSource, updateFunction = () => {}) {
		if(!gl) throw 'No GL instance provided for shader';
		this.gl = gl;
		this.program = createProgramFromSources(this.gl, vertexSource, fragmentSource);

        this.updateFunction = updateFunction;
        this.label = label;
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

    update(settings, iteration = 0) {
        this.updateFunction.call(this, settings, iteration);
    }

	uniforms(uniforms) {

		this.use();
        for (let name in uniforms) {
            if (!uniforms.hasOwnProperty(name)) continue;

            const location = this.gl.getUniformLocation(this.program, name);
            // ignore uniform variable if it doesn't exist in the vertex/fragment
            if (location === null) continue;

            const value = uniforms[name];
            if(isArray(value) && value.length && isArray(value[0])) {
                const isVec3 = value[0].length > 2;
                for(let i=0; i<value.length; i ++) {
                    const vecLocation = this.gl.getUniformLocation(this.program, name+'['+i+']');
                    if(vecLocation) {
                        if(isVec3) this.gl.uniform3fv(vecLocation, new Float32Array(value[i]));
                        else this.gl.uniform2fv(vecLocation, new Float32Array(value[i]));
                    }
                }
            } else if (isArray(value)) {
                switch (value.length) {
                    case 1:  this.gl.uniform1fv(location, new Float32Array(value)); break;
                    case 2:  this.gl.uniform2fv(location, new Float32Array(value)); break;
                    case 3:  this.gl.uniform3fv(location, new Float32Array(value)); break;
                    case 4:  this.gl.uniform4fv(location, new Float32Array(value)); break;
                    case 9:  this.gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                    case 16: this.gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                    default: throw 'dont\'t know how to load uniform "' + name + '" of length ' + value.length;
                }
            } else if (isNumeric(value) || typeof value == 'boolean') {
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
        
        // initializes a WebGLBuffer storing data such as vertices or colors
        if(!this.texCoordBuffer) this.texCoordBuffer = gl.createBuffer();

        // use tex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

        // creates and initializes a buffer object's data store
        setBufferRectangle(gl, 0, 0, 1, 1);

        // get a_texCoord pointer
        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
        
        // enables the generic vertex attribute array
        gl.enableVertexAttribArray(texCoordLocation);

        // define an array of generic vertex attribute data
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        return this;
    }

    didRender() {

        const gl = this.gl;
        if(!this.buffer) this.buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        // look up where the vertex data needs to go.
        const positionLocation = gl.getAttribLocation(this.program, "a_position");

        //enables the generic vertex attribute array
        gl.enableVertexAttribArray(positionLocation);

        // define an array of generic vertex attribute data
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


        // use this buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // Set a rectangle the same size as the image.
        setBufferRectangle(gl, 0, 0, this.width, this.height);

        // set texture back to 0 -- e.g. when another activeTexture is used to set a uniform
        this.gl.activeTexture(this.gl.TEXTURE0);

        return this;
    }

    draw() {
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return this;
    }

}
