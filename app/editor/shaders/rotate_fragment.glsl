export default `
// gamma fragment
precision highp float;

varying vec2 v_texCoord;

uniform sampler2D Texture;
uniform float rotate;

void main(void) {

	vec2 coord = v_texCoord;
	float theta = rotate / -180.0 * 3.14159265358;
	float sin_factor = sin(theta);
    float cos_factor = cos(theta);
    coord = (coord - 0.5) * mat2(cos_factor, sin_factor, -sin_factor, cos_factor);
    coord += 0.5;
    gl_FragColor = texture2D(Texture, coord);
}
`