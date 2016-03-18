import { curvesHashTable } from 'editor/utils/colorUtils'
import Texture from 'editor/Texture'

export default function(settings) {
	const channels = settings.channels || 'rgb';
	const curves = settings.curves;
	const hashTable = curvesHashTable(curves);

	if(!this.hashTexture) this.hashTexture = new Texture(this.gl);
	hashTexture.loadFromBytes(hashTable, 256, 1);
	
	this.gl.activeTexture(this.gl.TEXTURE1);
	this.gl.bindTexture(this.gl.TEXTURE_2D, hashTexture.id);
	this.gl.uniform1i(this.gl.getUniformLocation(this.program, "map"), 1);
}