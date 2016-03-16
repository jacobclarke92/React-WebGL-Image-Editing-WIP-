uniform sampler2D texture;
uniform float saturation;

varying vec2 texCoord;

void main() {
	vec4 color = texture2D(texture, texCoord);

	/* saturation adjustment */
	float average = (color.r + color.g + color.b) / 3.0;
	if (saturation > 0.0) {
		color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));
	} else {
		color.rgb += (average - color.rgb) * (-saturation);
	}

	gl_FragColor = color;
}