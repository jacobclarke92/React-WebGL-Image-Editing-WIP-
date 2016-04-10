

precision highp float;

uniform sampler2D texture;
varying vec2 v_texCoord;

uniform float blur;
uniform vec2 u_resolution;

const int   c_samplesX    = 51;  // must be odd
const int   c_samplesY    = 51;  // must be odd
const int   c_halfSamplesX = c_samplesX / 2;
const int   c_halfSamplesY = c_samplesY / 2;
float c_pixelSizeX = (1.0 / u_resolution.x);
float c_pixelSizeY = (1.0 / u_resolution.y);

float Gaussian (float sigma, float x) {
    return exp(-(x*x) / (2.0 * sigma*sigma));
}

vec3 BlurredPixel (in vec2 uv) {   
    float total = 0.0;
    vec3 ret = vec3(0);
        
    for (int iy = 0; iy < c_samplesY; ++iy) {

        float fy = Gaussian (blur, float(iy) - float(c_halfSamplesY));
        float offsetY = float(iy - c_halfSamplesY) * c_pixelSizeY;
        
        for (int ix = 0; ix < c_samplesX; ++ix) {

            float fx = Gaussian (blur, float(ix) - float(c_halfSamplesX));
            float offsetX = float(ix - c_halfSamplesX) * c_pixelSizeX;
            total += fx * fy;            
            ret += texture2D(texture, uv + vec2(offsetX, offsetY)).rgb * fx*fy;

        }
    }
    return ret / total;
}

void main(void) {
    vec2 uv = v_texCoord.xy;
    gl_FragColor = vec4(BlurredPixel(uv), 1.0);
}
