export default  `
precision highp float;

uniform sampler2D Texture;
uniform float saturation;

varying vec2 v_texCoord;

void main() {
	vec4 color = texture2D(Texture, v_texCoord);

	/* saturation adjustment */
	float average = (color.r + color.g + color.b) / 3.0;
	if (saturation > 0.0) {
		color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));
	} else {
		color.rgb += (average - color.rgb) * (-saturation);
	}

	gl_FragColor = color;
}
`