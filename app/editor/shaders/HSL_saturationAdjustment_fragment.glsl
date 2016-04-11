precision highp float;

uniform sampler2D texture;
uniform float amount;
uniform vec3 baseColor;

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

	vec4 color = texture2D(texture, v_texCoord);
	vec3 colorHSV = rgb2hsv(vec3(color.r, color.g, color.b));
	
	float range = 30.0/360.0;

	float hueDifference = colorHSV[0] - avoidColorHSL[0];
	if(abs(hueDifference) <= range) {
		
		float adjustment = hueDifference/range;//clamp(1.0 - abs(hueDifference)/range, 0.0, 1.0);
		float bw = (min(color.r, min(color.g, color.b)) + max(color.r, max(color.g, color.b))) * 0.5;

		gl_FragColor = vec4(
			clamp(color.r + (bw - color.r) * adjustment, 0.0, 1.0),
			clamp(color.g + (bw - color.g) * adjustment, 0.0, 1.0),
			clamp(color.b + (bw - color.b) * adjustment, 0.0, 1.0), 
			color.a
		);
	}else{
		gl_FragColor = color;
	}
}