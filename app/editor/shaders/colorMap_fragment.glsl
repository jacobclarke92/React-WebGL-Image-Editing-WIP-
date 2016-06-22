export default `
// default fragment
precision highp float;

uniform sampler2D Texture;
uniform sampler2D map;
varying vec2 v_texCoord;
 
void main() {
   	vec4 color = texture2D(map, v_texCoord);
    color.r = texture2D(Texture, vec2(color.r)).r;
    color.g = texture2D(Texture, vec2(color.g)).g;
    color.b = texture2D(Texture, vec2(color.b)).b;
    gl_FragColor = color;
}
`