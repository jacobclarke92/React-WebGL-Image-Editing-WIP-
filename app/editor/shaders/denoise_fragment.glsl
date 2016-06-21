export default `
precision highp float;

uniform sampler2D Texture;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

uniform float denoise;

void main() {
    vec4 center = texture2D(Texture, v_texCoord);
    vec4 color = vec4(0.0);
    float total = 0.0;
    for (float x = -4.0; x <= 4.0; x += 1.0) {
        for (float y = -4.0; y <= 4.0; y += 1.0) {
            vec4 sample = texture2D(Texture, v_texCoord + vec2(x, y) / u_resolution);
            float weight = 1.0 - abs(dot(sample.rgb - center.rgb, vec3(0.25)));
            weight = pow(weight, denoise);
            color += sample * weight;
            total += weight;
        }
    }
    gl_FragColor = color / total;
}
`