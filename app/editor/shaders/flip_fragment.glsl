export default `
// flip fragment
precision highp float;

uniform sampler2D Texture;
varying vec2 v_texCoord;
 
void main() {
	vec2 coord = v_texCoord;
	coord.y = -(coord.y - 0.5) + 0.5;
   gl_FragColor = texture2D(Texture, coord);
}
`