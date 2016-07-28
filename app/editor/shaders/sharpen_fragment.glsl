export default  `
// sharpen fragment
precision highp float;
uniform sampler2D Texture;

uniform vec2 offset3x3[9];
uniform vec2 offset5x5[25];
uniform vec2 offset7x7[49];
uniform float sharpen;

varying vec2 v_texCoord;

void main() {

    vec4 texel = vec4(0.0);

    float filter[9];
    
    filter[0] = 0.0;    filter[1] = 1.0;   filter[2] = 0.0;
    filter[3] = 1.0;    filter[4] = -4.0;  filter[5] = 1.0;
    filter[6] = 0.0;    filter[7] = 1.0;   filter[8] = 0.0;
    
    for (int i = 0; i < 9; i++) {   
        texel += texture2D(Texture, v_texCoord + offset3x3[i]) * filter[i];
    }


    gl_FragColor = texture2D(Texture, v_texCoord) + sharpen * texel;
}
`