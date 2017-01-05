export default  `
// HSL_hueAdjustment fragment
precision highp float;

uniform sampler2D Texture;
uniform float amount;
uniform vec3 baseColor;
uniform float range;

varying vec2 v_texCoord;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {

	float rng = 60.0 / 360.0;

	vec3 avoidColorHSV = rgb2hsv(vec3(baseColor.r/255.0, baseColor.g/255.0, baseColor.b/255.0));

	vec4 color = texture2D(Texture, v_texCoord);
	vec3 colorHSV = rgb2hsv(vec3(color.r, color.g, color.b));

	float baseColorHue = avoidColorHSV[0];
	float colorHue = colorHSV[0];
	float hueDifference = colorHSV[0] - avoidColorHSV[0];
	float absHueDiff = abs(hueDifference);

	float roundAbsHueDiff = absHueDiff;
	// if(roundAbsHueDiff > 1.0 - rng) roundAbsHueDiff -= 1.0;

	float aimHue = baseColorHue + amount*rng;

	// if +- 60° of base color 
	if(roundAbsHueDiff < rng) {

		// create a pull percent based on big the hue difference is
		float pull = 1.0 - roundAbsHueDiff/rng;
		
		float tempAimHue = aimHue;
		// if(absHueDiff > roundAbsHueDiff) tempAimHue += 1.0;
		// else if(absHueDiff < roundAbsHueDiff) tempAimHue -= 1.0;
		
		// 'ease' the hue towards the aim hue and multiply in the pull and the overall amount
		colorHue += ((tempAimHue - colorHue) / 1.5) * pull * abs(pow(amount, 0.75));

		// wrap values if ease goes out of bounds
		if(colorHue < 0.0) colorHue += 1.0;
		else if(colorHue > 1.0) colorHue -= 1.0;

		colorHSV[0] = colorHue;
		vec3 colorRGB = hsv2rgb(colorHSV);
		vec4 newColor = vec4(colorRGB.r, colorRGB.g, colorRGB.b, color.a);
		gl_FragColor = newColor;
		
	}else{
		gl_FragColor = color;
	}

}
`