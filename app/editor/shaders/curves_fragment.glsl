export default `
precision highp float;

uniform sampler2D Texture;
uniform sampler2D map;
uniform bool red;
uniform bool green;
uniform bool blue;

varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(map, v_texCoord);
     if(red)   color.r = texture2D(Texture, vec2(color.r)).r;
     if(green) color.g = texture2D(Texture, vec2(color.g)).g;
     if(blue)  color.b = texture2D(Texture, vec2(color.b)).b;
    gl_FragColor = color;
}
`