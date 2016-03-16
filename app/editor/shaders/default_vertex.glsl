attribute vec2 vertex;
attribute vec2 _texCoord;
varying vec2 texCoord;
void main() {
    texCoord = _texCoord;
    gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);
}