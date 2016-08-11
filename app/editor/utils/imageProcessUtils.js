
const workCanvas = document.createElement('canvas');
const workContext = workCanvas.getContext('2d');

export function imageToGreyArray (image, outarray, w, h) {
    const canvas = workCanvas;

    canvas.width = w;
    canvas.height = h;

    workContext.drawImage(image, 0, 0, w, h);
    const imageData = workContext.getImageData(0, 0, w, h);

    const image_u8 = imageData.data;
    const nbytes = w * h;
    let grey_u8 = null;

    if (outarray === undefined || outarray === null) {
        grey_u8 = new Uint8ClampedArray(nbytes);
    } else {
        grey_u8 = outarray;
    }


    for (let k = 0; k < nbytes; k ++) {
        // Simple greyscale by intensity average
        grey_u8[k] = (0.299 * image_u8[k * 4] + 0.587 * image_u8[k * 4 + 1] + 0.114 * image_u8[k * 4 + 2]);
    }
    

    return grey_u8;
}

export function integralImage (in_u8, w, h, out) {
    let srcIndex = 0;
    let sumIndex = 0;
    const srcStep = w;
    const sumStep = w + 1;

    if (out === undefined) {
        out = new Float32Array((w + 1) * (h + 1));
    }

    // Algorithm adapted from opencv

    // Set first row to all 0s
    // Replaces `memset( sum, 0, (size.width+1)*sizeof(sum[0]));`
    for (let x = 0; x < w + 1; x ++) {
        out[x] = 0;
    }

    sumIndex += sumStep + 1;

    for (let y = 0; y < h; y ++, srcIndex += srcStep, sumIndex += sumStep) {
        let s = 0;
        // Set first column to 0
        out[sumIndex - 1] = 0;
        for (let x = 0; x < w; x ++) {
            s += in_u8[srcIndex + x];
            out[sumIndex + x] = out[sumIndex + x - sumStep] + s;
        }
    }
    return out;
}