precision highp float;

varying vec2 vUv;

uniform sampler2D texture;
uniform vec2 px;
uniform float m[9];

void main(void) {
	vec4 c11 = texture2D(texture, vUv - px);
	vec4 c12 = texture2D(texture, vec2(vUv.x, vUv.y - px.y));
	vec4 c13 = texture2D(texture, vec2(vUv.x + px.x, vUv.y - px.y));

	vec4 c21 = texture2D(texture, vec2(vUv.x - px.x, vUv.y) );
	vec4 c22 = texture2D(texture, vUv);
	vec4 c23 = texture2D(texture, vec2(vUv.x + px.x, vUv.y) );

	vec4 c31 = texture2D(texture, vec2(vUv.x - px.x, vUv.y + px.y) );
	vec4 c32 = texture2D(texture, vec2(vUv.x, vUv.y + px.y) );
	vec4 c33 = texture2D(texture, vUv + px );

	gl_FragColor = 
		c11 * m[0] + c12 * m[1] + c22 * m[2] +
		c21 * m[3] + c22 * m[4] + c23 * m[5] +
		c31 * m[6] + c32 * m[7] + c33 * m[8];
	gl_FragColor.a = c22.a;
}