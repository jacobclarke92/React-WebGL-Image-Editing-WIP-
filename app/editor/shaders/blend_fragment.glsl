export default `
// blend fragment
precision highp float;

uniform sampler2D Texture;
uniform sampler2D originalImage;
varying vec2 v_texCoord;
 
void main() {
   	vec4 color = texture2D(Texture, v_texCoord);
   	// color.r = color.r * 0.5;
   	// color.g = color.g * 0.5;
   	// color.b = color.b * 0.5;
    // color.r = texture2D(Texture, vec2(color.r)).r;
    // color.g = texture2D(Texture, vec2(color.g)).g;
    // color.b = texture2D(Texture, vec2(color.b)).b;
    gl_FragColor = color;
}
`