export default `
// crop fragment
precision highp float;

uniform sampler2D Texture;
varying vec2 v_texCoord;

uniform bool enabled;
uniform float top;
uniform float left;
uniform float width;
uniform float height;
 
void main() {
	vec2 coord = v_texCoord;
	if(enabled) {
		coord = (coord - 0.5) * mat2(width, 0.0, 0.0, height);
		coord += 0.5;
		coord.x -= (1.0 - width)/2.0 - left;
		coord.y += (1.0 - height)/2.0 - top;
	}

	gl_FragColor = texture2D(Texture, coord);
}
`