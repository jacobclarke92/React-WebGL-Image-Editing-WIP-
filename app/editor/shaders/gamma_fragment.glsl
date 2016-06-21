export default `
// gamma fragment
precision highp float;

varying vec2 v_texCoord;

uniform sampler2D Texture;
uniform float gamma;

void main(void) {
	float g = pow(gamma, -1.0);
	vec4 color = texture2D(Texture, v_texCoord);
	color.rgb = vec3(
		pow(abs(color.r), g),
		pow(abs(color.g), g),
		pow(abs(color.b), g)
	);
	gl_FragColor = color;
}
`