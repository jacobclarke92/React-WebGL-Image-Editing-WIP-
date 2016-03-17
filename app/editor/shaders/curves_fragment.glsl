precision mediump float;

uniform sampler2D texture;
uniform sampler2D map;

varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(texture, v_texCoord);
    color.r = texture2D(map, vec2(color.r)).r;
    color.g = texture2D(map, vec2(color.g)).g;
    color.b = texture2D(map, vec2(color.b)).b;
    gl_FragColor = color;
}