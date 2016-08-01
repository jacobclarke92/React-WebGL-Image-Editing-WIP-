export default  `
// pixel sort
precision highp float;

uniform sampler2D Texture;
uniform vec2 u_resolution;
uniform float iteration;

uniform float pixelSort;
uniform float direction;
uniform float inverted;
uniform float threshMin;
uniform float threshMax;

varying vec2 v_texCoord;

void main()
{
    //rgb(147, 109, 99)
    
    // vec2 uv = v_texCoord.xy / u_resolution.xy;
    // vec2 texel = 1. / u_resolution.xy;
    vec2 uv = v_texCoord.xy;
    vec2 texel = vec2(1.0, 1.0);
    
    // float stepAmount = texel.x;
    float stepAmount = texel.y;
    if(direction <= 1.0) stepAmount = texel.x;
    vec2 n = vec2(0.0, inverted * stepAmount);
    if(direction <= 1.0) n = vec2(inverted * stepAmount, 0.0);

    vec4 im_n =  texture2D(Texture, uv+n);
    vec4 im =    texture2D(Texture, uv);
    
    float lum = im.r + im.g + im.b; //0.2126 * im.r + 0.7152 * im.g + 0.0722 * im.b;
    float lum_n = im_n.r + im_n.g + im_n.b; //0.2126 * im_n.r + 0.7152 * im_n.g + 0.0722 * im_n.b;
    float lum_diff = lum_n - lum;
    
    // only apply to ever second pixel because neighbouring y pixels are compared
    float offset = v_texCoord.y;
    if(direction <= 1.0) offset = v_texCoord.x;
    if(int(mod(float(iteration) + offset, 2.0)) == 0) {
        if (lum_diff > threshMin && lum_diff < threshMax) { 
            im = im_n;    
        }
    }
    
    
    // wait 10 frames before applying
    if(iteration < 1.0) {
        gl_FragColor = texture2D(Texture, uv);
    } else {
        gl_FragColor = im;
    }
    
}
`

/*

// WORKING SHADERTOY CODE, FOR REFERENCE
// https://www.shadertoy.com/view/XdcGWf

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    float direction = -1.0;
    float thresholdMin = 0.18;
    float thresholdMax = 0.9;
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 texel = 1. / iResolution.xy;
    
    float step_y = texel.y;
    vec2 n  = vec2(0.0, direction* step_y);

    vec4 im_n =  texture2D(iChannel0, uv+n);
    vec4 im =    texture2D(iChannel0, uv);
    
    
    float lum = im.r + im.g + im.b; //0.2126 * im.r + 0.7152 * im.g + 0.0722 * im.b;
    float lum_n = im_n.r + im_n.g + im_n.b; //0.2126 * im_n.r + 0.7152 * im_n.g + 0.0722 * im_n.b;
    float lum_diff = lum_n - lum;
    
    // only apply to ever second pixel because neighbouring y pixels are compared
    if(int(mod(float(iFrame) + fragCoord.y, 2.0)) == 0) {
        if (lum_diff > thresholdMin && lum_diff < thresholdMax) { 
            im = im_n;    
        }
    }
    
    // wait 10 frames before applying
    if(iFrame < 10) {
        fragColor = texture2D(iChannel1, uv);
    } else {
        fragColor = im;
    }
    
}

 */