export default `
// filter vertex
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

// uniform bool enabled;
// uniform float top;
// uniform float left;
// uniform float width;
// uniform float height;
 
void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   /*
   // tried to do it in vertex but made no difference to the artifactiness
   if(enabled) {
   		float scaleX = pow(width, -1.0);
   		float scaleY = pow(height, -1.0);
		clipSpace = clipSpace * mat2(scaleX, 0.0, 0.0, scaleY);
		// clipSpace += 0.5;
		// clipSpace.x -= (1.0 - width)*scaleX;// + left*scaleX;
		// clipSpace.y -= (1.0 - height) + top;
	}
	*/
	
   	gl_Position = vec4(clipSpace * vec2(1, 1), 0, 1);
   	v_texCoord = a_texCoord;
}
`