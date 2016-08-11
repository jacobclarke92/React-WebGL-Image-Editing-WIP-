import fs from 'fs'
import path from 'path'
import Canvas, { Image } from 'canvas'
import frontalface from '../app/editor/constants/frontalface'
import jsfeat from 'jsfeat'
import deepEqual from 'deep-equal'

const args = {};
process.argv.slice(2).forEach(arg => {
	const parts = arg.split('=');
	if(parts.length > 1) args[parts[0]] = parts[1];
	else args[arg] = null;
});




const img = new Image;

function getRectCenter(rect) {
	return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
}

function dist(pt1, pt2) {
	return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

function processImage() {
	console.log('image loaded');

	const w = img.width;
	const h = img.height;

	const startTime = new Date().getTime();

	const canvas = new Canvas(w, h);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, w, h);

	const img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
	const ii_sum = new Int32Array((w+1)*(h+1));
	const ii_sqsum = new Int32Array((w+1)*(h+1));
	const ii_tilted = new Int32Array((w+1)*(h+1));

    jsfeat.imgproc.grayscale(imageData.data, w, h, img_u8, jsfeat.COLOR_RGBA2GRAY);
    jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
    jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, null);

    let rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted, null, img_u8.cols, img_u8.rows, frontalface, 1.15, 2);
	
	rects = rects.filter(rect => rect.confidence > 106.2);


    const newRects = [];
    const rectCenters = [];
    const rectProximity = (w+h)/2 / 20;

	for(let rect of rects) {

		const rectCenter = getRectCenter(rect);
		const foundNeighbor = rectCenters.reduce((found, pt) => found ? found : dist(rectCenter, pt) <= rectProximity, false);
		const insideAnother = rects.reduce((found, item) => found ? found : (
			!deepEqual(rect, item) && (
				item.x >= rect.x && 
				item.x+item.width <= rect.x+rect.width && 
				item.y >= rect.y &&
				item.y+item.height <= rect.y+rect.height
			)
		), false);
		if(!foundNeighbor && !insideAnother) {
			rectCenters.push(rectCenter);
			newRects.push({x: rect.x, y: rect.y, width: rect.width, height: rect.height});
			// newRects.push(rect);
		}
	}

	console.log(newRects);
	console.log('Detected faces in '+(new Date().getTime() - startTime)+'ms');
}

if('input' in args) {
	const imagePath = path.isAbsolute(args.input) ? args.input : path.resolve(__dirname + '/../' + args.input);
	console.log(imagePath);

	fs.readFile(imagePath, (error, image) => {
		if(error) {
			console.warn('ERROR', error);
			return;
		}else{
			img.src = image;	
			processImage();
		}
	});
}