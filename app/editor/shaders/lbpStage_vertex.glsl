export default  `
// used for face detection

// Uniforms - same for all vertices
uniform vec2 u_resolution;
//Attributes - vertex-specific
attribute vec2 a_position;
void main() {
   // convert pixel coords to range -1,1
   vec2 normCoords = ((a_position/u_resolution) * 2.0) - 1.0;
   gl_Position = vec4(normCoords, -1.0, 1.0);
}
`