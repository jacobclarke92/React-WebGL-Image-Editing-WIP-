let debugLBP = false;
let debugStage = false;
let THRESHOLD_EPS = 1e-5;

export function dimensionsOfLBPLookupTable(cascade) {
    const stages = cascade.stages;
    const nstages = stages.length;
    const lbpArrangements = 256;
    let maxWeakClassifiers = 0;

    // Find max number of weak classifiers (for width of texture)
    for (let k = 0; k < stages.length; k += 1) {
        const nweak = stages[k].weakClassifiers.length;
        maxWeakClassifiers = nweak > maxWeakClassifiers ? nweak : maxWeakClassifiers;
    }

    const texWidth = maxWeakClassifiers * lbpArrangements;
    const texHeight = nstages;

    return [texWidth, texHeight];
}

export function createLBPLookupTable(cascade, dim) {
    const stages = cascade.stages;
    const nstages = stages.length;
    const lbpArrangements = 256;
    const texWidth = dim[0];
    const texHeight = dim[1];
    const lbpMapArray = new Uint8Array(texWidth * texHeight);

    for (let k = 0; k < stages.length; k += 1) {
        for (let w = 0; w < stages[k].weakClassifiers.length; w += 1) {
            const bitvec = stages[k].weakClassifiers[w].categoryBitVector;
            for (let lbpVal = 0; lbpVal < lbpArrangements; lbpVal += 1) {
                const bit = Boolean(bitvec[lbpVal >> 5] & (1 << (lbpVal & 31)));
                lbpMapArray[(w * lbpArrangements + lbpVal) + k * texWidth] = bit * 255;
            }
        }
    }

    return lbpMapArray;
}


export function imageToArray(image) {
    const w = image.width;
    const h = image.height;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, w, h);
    const image_u8 = imageData.data;

    const nbytes = w * h;
    const gray_u8 = new Uint8ClampedArray(nbytes);

    for(let k = 0; k < nbytes; k++){
        // Simple grayscale by intensity average
        gray_u8[k] = (image_u8[k*4] + image_u8[k*4 + 1] + image_u8[k*4 + 2]) / 3;
    }
    return gray_u8;
}

export function canvasToArray(canvas, context) {
    const w = canvas.width;
    const h = canvas.height;
    console.log(canvas);
    console.log(context);

    const imageData = context.getImageData(0, 0, w, h);
    const image_u8 = imageData.data;

    const nbytes = w * h;
    const gray_u8 = new Uint8ClampedArray(nbytes);

    for(let k = 0; k < nbytes; k++){
        // Simple grayscale by intensity average
        gray_u8[k] = (image_u8[k*4] + image_u8[k*4 + 1] + image_u8[k*4 + 2]) / 3;
    }
    return gray_u8;
}

export function debugShowGrayscale(data_u8, w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(w, h);

    for (let k = 0; k < w * h; k += 1) {
        const grayByte = data_u8[k];
        imageData.data[k * 4] = grayByte;
        imageData.data[k * 4 + 1] = grayByte;
        imageData.data[k * 4 + 2] = grayByte;
        imageData.data[k * 4 + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    const im = document.createElement("img");
    im.width = w;
    im.height = h;
    im.src = canvas.toDataURL();
    im.className = "webcvimage";
    document.body.appendChild(im);
    return im;
}

export function integralImage(in_u8, w, h, out){
    if (out === undefined) {
        out = new Float32Array((w+1) * (h+1));
    }

    // Algorithm adapted from opencv
    let src = 0;
    let sum = 0;

    const srcstep = w;
    const sumstep = w+1;

    // memset( sum, 0, (size.width+1)*sizeof(sum[0]));
    for(let x=0; x< w+1; x++){
        out[x] = 0;
    }

    sum += sumstep + 1;

    for(let y = 0; y < h; y++, src += srcstep, sum += sumstep) {
        let s = 0;
        out[sum-1] = 0;
        for(let x = 0; x < w; x ++) {
            s += in_u8[src + x];
            const val = out[sum + x - sumstep] + s;
            //console.log(val)
            out[sum + x] = val
        }
    }
    return out;
}

export function evaluateStage(integralIm, stage, stageN, w_orig, h_orig, acceptedWindows, scale) {

    const startTime = new Date();
    const winsize = Math.round(24*scale);
    const w_integral = w_orig + 1;
    const h_integral = h_orig + 1;
    const weaks = stage.weakClassifiers;
    const nweak = weaks.length;
    const stageThreshold = stage.stageThreshold - THRESHOLD_EPS;
    const iim = integralIm;
    let naccepted = 0;
    let nwins = 0;

    var p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15;
    var r0,r1,r2,r3,r4,r5,r6,r7,c;

    const lbpImage = new Uint8Array(w_integral * h_integral);

    for(let y = 0; y < h_orig-winsize; y++) {
        for(let x = 0; x < w_orig-winsize; x++) {
            if(x + winsize < w_orig && y + winsize < h_orig) {
                const offs = x + w_integral * y;

                if(stageN > 0 && !acceptedWindows[offs]) {
                    continue;
                }

                nwins++;
                let contribution = 0;
                
                for(let w = 0; w < nweak; w++) {
                    const weak = stage.weakClassifiers[w];
                    const rect = weak.featureRectangle;
                    const bitvec = weak.categoryBitVector;
                    let rx = Math.round(rect[0] * scale);
                    let ry = Math.round(rect[1] * scale);
                    let rw = Math.round(rect[2] * scale);
                    let rh = Math.round(rect[3] * scale);

                    // Sample 16 points from integral image to compute LBP value
                    
                    /* p0  p1   p4  p5
                       p2  p3   p6  p7
                       p12 p13  p8  p9
                       p14 p15 p10 p11
                    */

                    // Top left quadrant
                    p0 = iim[offs + rx + ry * w_integral];  // top left point
                    p1 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p2 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p3 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Top right quadrant
                    rx += 2 * rw;
                    p4 = iim[offs + rx + ry * w_integral];  // top left point
                    p5 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p6 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p7 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Bottom right quadrant
                    ry += 2 * rh;
                    p8 = iim[offs + rx + ry * w_integral];  // top left point
                    p9 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p10 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p11 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    // Bottom left quadrant
                    rx -= 2 * rw;
                    p12 = iim[offs + rx + ry * w_integral];  // top left point
                    p13 = iim[offs + (rx + rw) + ry * w_integral]; // top right pt
                    p14 = iim[offs + rx + (ry + rh) * w_integral]; // bottom left pt
                    p15 = iim[offs + (rx + rw) + (ry + rh) * w_integral]; // bottom right

                    /* Compute intensities from integral images values
                        r0 r1 r2
                        r7 c  r3
                        r6 r5 r4
                    */

                    c = p8 - p6 - p13 + p3;

                    r0 = p3 - p2 - p1 + p0;
                    r1 = p6 - p4 - p3 + p1;
                    r2 = p7 - p5 - p6 + p4;
                    r3 = p9 - p7 - p8 + p6;
                    r4 = p11 - p9 - p10 + p8;
                    r5 = p10 - p8 - p15 + p13;
                    r6 = p15 - p13 - p14 + p12;
                    r7 = p13 - p3 - p12 + p2;

                    const lbp = ((r0 >= c) << 7) + ((r1 >= c) << 6) + ((r2 >= c) << 5) + ((r3 >= c) << 4) + ((r4 >= c) << 3) + ((r5 >= c) << 2) + ((r6 >= c) << 1) + (r7 >= c);
                    //var lbp = ((r0 > c) << 7) + ((r1 > c) << 6) + ((r2 > c) << 5) + ((r3 > c) << 4) + ((r4 > c) << 3) + ((r5 > c) << 2) + ((r6 > c) << 1) + (r7 > c);

                    const bit = Boolean(bitvec[lbp >> 5] & (1 << (lbp & 31)));
                    //bit = window.lbpLookup[256 * w + lbp + lbpDim[0] * stageN];

                    contribution += bit ? weak.leafValues[0] : weak.leafValues[1];


                    if(w == 1) lbpImage[offs] = lbp;
                    
                    //console.log(lbp)
                }

                if(contribution > stageThreshold) { 
                    naccepted++;
                    acceptedWindows[offs] = 255;
                }
                else {
                    acceptedWindows[offs] = 0;
                }
            }
        }
    }

    if (debugStage) {
        //document.body.appendChild(document.createElement('br'));
        debugShowGrayscale(acceptedWindows, w_integral, h_integral).title = "Stage " + stageN;
        if(debugLBP) {
            debugShowGrayscale(lbpImage, w_integral, h_integral).title = "Stage " + stageN;
        }
    }

    const endTime = new Date();
    const runTime = endTime - startTime;

    console.log("Stage %d time %d nwins %d", stageN, runTime, nwins);

}

export function runImageCascade(image, cascade) {
    const image_u8 = imageToArray(image);
    return runCascade(image_u8, image.width, image.height, cascade);
}

export function runCanvasCascade(canvas, context, cascade) {
    const image_u8 = canvasToArray(canvas, context);
    return runCascade(image_u8, canvas.width, canvas.height, cascade);
}

export function runCascade(image_u8, w, h, cascade) {
    // const image_u8 = imageToArray(image);
    const outpixels_u8 = new Uint8Array(w*h);

    /**** WHY ARE THESE GLOBALS CHECK BACK LATER ***/
    window.lbpDim = dimensionsOfLBPLookupTable(cascade);
    window.lbpLookup = createLBPLookupTable(cascade, lbpDim);

    const startCascadeTime = new Date();

    const integralIm = integralImage(image_u8, w, h);
    const w_integral = w + 1;
    const h_integral = h + 1;

    const stageCount = cascade.stages.length;

    const windowSize = 24;
    const scaleFactor = 1.2;

    const rectangles = []

    for(let scale = 1.0; scale * windowSize < w && scale * windowSize < h; scale *= scaleFactor) {
        const scaledWindowSize = Math.round(scale * windowSize);
        const acceptedWindows = new Uint8Array((w+1) * (h+1));
        const title = document.createElement('h2')
        title.innerHTML = 'Scale' + scale;
        document.body.appendChild(title);
        for(let stageN = 0; stageN < stageCount; stageN++) {
            evaluateStage(integralIm, cascade.stages[stageN], stageN, w, h, acceptedWindows, scale);
        }
        debugShowGrayscale(acceptedWindows, w_integral, h_integral);
        for(let y = 0; y < (h_integral); y++) {
            for(let x = 0; x < (w_integral); x++) {
                const offs = x + w_integral * y;
                if(acceptedWindows[offs] == 255) {
                    //console.log("%d,%d", x, y);
                    rectangles.push([x, y, scaledWindowSize, scaledWindowSize]);

                    image_u8[x + y * w] = 255;
                    outpixels_u8[x + y * w] = 255;
                }  
            }
        }
    }

    const endCascadeTime = new Date();

    const cascadeTime = endCascadeTime - startCascadeTime;
    console.log("cascade time %d", cascadeTime);
    

    debugShowGrayscale(image_u8, w, h);
    debugShowGrayscale(outpixels_u8, w, h);
    return rectangles;
    
}