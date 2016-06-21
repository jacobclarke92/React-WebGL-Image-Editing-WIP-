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

	vec3 avoidColorHSL = rgb2hsv(vec3(baseColor.r/255.0, baseColor.g/255.0, baseColor.b/255.0));

	vec4 color = texture2D(Texture, v_texCoord);
	vec3 colorHSV = rgb2hsv(vec3(color.r, color.g, color.b));
	
	// float range = 30.0/360.0;

	float hueDifference = colorHSV[0] - avoidColorHSL[0];
	if(abs(hueDifference) <= range) {
		colorHSV[0] += amount * hueDifference;
		vec3 colorRGB = hsv2rgb(colorHSV);
		vec4 newColor = vec4(colorRGB.r, colorRGB.g, colorRGB.b, color.a);
		gl_FragColor = newColor;
	}else{
		gl_FragColor = color;
	}
}
`