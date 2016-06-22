import { interpolateGradient } from '../utils/colorUtils'
import Texture from '../Texture'

export default function(settings) {

	const rgbaData = interpolateGradient(settings.markers, 256);

	// // create curve texture if not already existing
	if(!this.curveTexture) this.curveTexture = new Texture(this.gl, this.width, this.height);
	
	this.curveTexture.loadFromBytes(rgbaData, 256, 1);
	this.curveTexture.use(3);
	this.gl.uniform1i(this.gl.getUniformLocation(this.program, "map"), 3);
	
}