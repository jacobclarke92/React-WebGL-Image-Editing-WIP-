export default `
// colorMatrix fragment
precision highp float;

varying vec2 v_texCoord;

uniform sampler2D Texture;
uniform float Matrix[20];

void main(void) {
	vec4 c = texture2D(Texture, v_texCoord);
	gl_FragColor.r = Matrix[0] * c.r + Matrix[1] * c.g + Matrix[2] * c.b + Matrix[3] * c.a + Matrix[4];
	gl_FragColor.g = Matrix[5] * c.r + Matrix[6] * c.g + Matrix[7] * c.b + Matrix[8] * c.a + Matrix[9];
	gl_FragColor.b = Matrix[10] * c.r + Matrix[11] * c.g + Matrix[12] * c.b + Matrix[13] * c.a + Matrix[14];
	gl_FragColor.a = Matrix[15] * c.r + Matrix[16] * c.g + Matrix[17] * c.b + Matrix[18] * c.a + Matrix[19];
}
`