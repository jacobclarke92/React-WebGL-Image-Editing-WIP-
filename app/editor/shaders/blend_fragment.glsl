export default `
// blend fragment
precision highp float;

uniform sampler2D Texture;
// uniform sampler2D blendTexture;
uniform float amount;
varying vec2 v_texCoord;
 
void main(void) {
    // vec4 t0 = texture2D(blendTexture, v_texCoord);
    // vec4 t1 = texture2D(Texture, v_texCoord);
    // vec4 color = mix(t0, t1, amount);

    // gl_FragColor = color;
    gl_FragColor = texture2D(Texture, v_texCoord);
}
`