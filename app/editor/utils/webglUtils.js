
export function setBufferRectangle(gl, x, y, width, height) {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]), 
        gl.STATIC_DRAW
    );
}

export function getProgramInfo(gl, program) {

    const result = {
        attributes: [],
        uniforms: [],
        attributeCount: 0,
        uniformCount: 0
    }
	const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    // Taken from the WebGl spec:
    // http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14
    const enums = {
        0x8B50: 'FLOAT_VEC2',
        0x8B51: 'FLOAT_VEC3',
        0x8B52: 'FLOAT_VEC4',
        0x8B53: 'INT_VEC2',
        0x8B54: 'INT_VEC3',
        0x8B55: 'INT_VEC4',
        0x8B56: 'BOOL',
        0x8B57: 'BOOL_VEC2',
        0x8B58: 'BOOL_VEC3',
        0x8B59: 'BOOL_VEC4',
        0x8B5A: 'FLOAT_MAT2',
        0x8B5B: 'FLOAT_MAT3',
        0x8B5C: 'FLOAT_MAT4',
        0x8B5E: 'SAMPLER_2D',
        0x8B60: 'SAMPLER_CUBE',
        0x1400: 'BYTE',
        0x1401: 'UNSIGNED_BYTE',
        0x1402: 'SHORT',
        0x1403: 'UNSIGNED_SHORT',
        0x1404: 'INT',
        0x1405: 'UNSIGNED_INT',
        0x1406: 'FLOAT'
    };

    // Loop through active uniforms
    for (let i=0; i < activeUniforms; i++) {
        const uniform = gl.getActiveUniform(program, i);
        uniform.typeName = enums[uniform.type];
        result.uniforms.push(uniform);
        result.uniformCount += uniform.size;
    }

    // Loop through active attributes
    for (let i=0; i < activeAttributes; i++) {
        const attribute = gl.getActiveAttrib(program, i);
        attribute.typeName = enums[attribute.type];
        result.attributes.push(attribute);
        result.attributeCount += attribute.size;
    }

    return result;
}

export function getActiveUniforms(gl, program) {
    const uniforms = {};
    const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let k = 0; k < nUniforms; k ++) {
        const activeInfo = gl.getActiveUniform(program, k);
        const uniformName = activeInfo.name.split('[')[0];
        activeInfo.location = gl.getUniformLocation(program, uniformName);
        uniforms[uniformName] = activeInfo;
    }
    return uniforms;
}

export function setUniform(gl, activeInfo, name, value) {
    const location = activeInfo.location;
    switch (activeInfo.type) {
        case gl.FLOAT:          gl.uniform1fv(location, new Float32Array(value)); break;
        case gl.FLOAT_VEC2:     gl.uniform2fv(location, new Float32Array(value)); break;
        case gl.FLOAT_VEC3:     gl.uniform3fv(location, new Float32Array(value)); break;
        case gl.FLOAT_VEC4:     gl.uniform4fv(location, new Float32Array(value)); break;
        case gl.FLOAT_MAT2:     gl.uniformMatrix2fv(location, false, new Float32Array(value)); break;
        case gl.FLOAT_MAT3:     gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
        case gl.FLOAT_MAT4:     gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
        case gl.INT:            gl.uniform1iv(location, new Int32Array(value)); break;
        case gl.INT_VEC2:       gl.uniform2iv(location, new Int32Array(value)); break;
        case gl.INT_VEC3:       gl.uniform3iv(location, new Int32Array(value)); break;
        case gl.INT_VEC4:       gl.uniform4iv(location, new Int32Array(value)); break;
        case gl.BOOL:           gl.uniform1iv(location, new Int32Array(value)); break;
        case gl.BOOL_VEC2:      gl.uniform2iv(location, new Int32Array(value)); break;
        case gl.BOOL_VEC3:      gl.uniform3iv(location, new Int32Array(value)); break;
        case gl.BOOL_VEC4:      gl.uniform4iv(location, new Int32Array(value)); break;
        case gl.SAMPLER_2D:     gl.uniform1iv(location, new Int32Array(value)); break;
        case gl.SAMPLER_CUBE:   gl.uniform1iv(location, new Int32Array(value)); break;
        default: console.log(value); throw 'dont\'t know how to load uniform "' + name + '" of type "'+(activeInfo.type).toString(16)+'"';
    }
}

export function setNumericUniform(gl, activeInfo, name, value) {
    const location = activeInfo.location;
    switch (activeInfo.type) {
        case gl.BOOL:           gl.uniform1f(location, value); break;
        case gl.FLOAT:          gl.uniform1f(location, value); break;
        case gl.INT:            gl.uniform1i(location, value); break;
        case gl.SAMPLER_2D:     gl.uniform1i(location, value); break;
        case gl.SAMPLER_CUBE:   gl.uniform1i(location, value); break;
        default: console.log(value); throw 'don\'t know how to load numeric uniform "' + name +'" of type "'+(activeInfo.type).toString(16)+'"';
    }
}
