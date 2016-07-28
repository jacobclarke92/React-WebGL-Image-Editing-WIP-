// called within context of a Program
export default function(settings) {
	if(settings.key && settings.value) {
		// console.log('updating uniform:', settings.key, settings.value);
		this.uniforms({
			[settings.key]: settings.value,
			offset3x3: calcTextureOffsets(this.width, this.height, 3),
			offset5x5: calcTextureOffsets(this.width, this.height, 5),
			offset7x7: calcTextureOffsets(this.width, this.height, 7),
		});
	}
}

function calcTextureOffsets(width, height, size){

	const deltaX = 1.0/width;
	const deltaY = 1.0/height;
	const distance = Math.floor(size/2);
	const offsets = [];

    for(let i = -distance; i <= distance; i++){
        for(let j = -distance; j <= distance; j++){
            offsets.push(/*{x: i*deltaX, y: j*deltaY}*/ [i*deltaX, j*deltaY]);
        }
    }

    return offsets;
}