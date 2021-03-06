export default  `
// grain fragment
precision highp float;

uniform sampler2D Texture;
uniform float grain;

varying vec2 v_texCoord;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    vec4 color = texture2D(Texture, v_texCoord);

    float diff = (rand(v_texCoord) - 0.5) * grain;
    color.r += diff;
    color.g += diff;
    color.b += diff;

    gl_FragColor = color;
}
`