export default  `
// pixel sort
precision highp float;

uniform sampler2D Texture;
uniform float pixel_sort;

varying vec2 v_texCoord;
/*
int highestColor(float r, float g, float b) {

  int greatestColor = 0;
  float minVal = -1.0;          // account for 0s in the color (0 will be greater)
  if (r > minVal) {
    greatestColor = 1;
    minVal = r;
  }
  if (g > minVal) {
    greatestColor = 2;
    minVal = g;
  }
  if (b > minVal) {
    greatestColor = 3;
    minVal = b;
  }

  return greatestColor;
}

void main() {
    gl_FragColor = texture2D(Texture, v_texCoord) ;
}
*/

// Created by Eduardo Castineyra - casty/2015
// Creative Commons Attribution 4.0 International License

uniform vec2 resolution;// = vec2(width, height);

uniform vec2 texel;// = 1.0/resolution.xy;
uniform vec2 pixel;// = 1.0/resolution;

#define MAXSIZE 350


uniform float MM;// = 1.0;

// uniform int accum[16];

// uniform vec2 fragCoordNewAPI;// = vec2(0.0);

/*
vec4 tex(int x, vec2 fragCoordNewAPI) {
    return texture2D(Texture, vec2(x, fragCoordNewAPI.y / MM)/float(MAXSIZE), 0.0);
}
*/

/*
void accumValue(float f) {
    int i4 = int(floor(f * 15.0));
    for (int i = 0; i < 16; i++) {
        accum[i] += i == i4 ? 1 : 0;
    }
}
*/

ivec2 find_Kth(int k, int accum[16]){
    bool found = false;
    int value = 0;
    int i;
    
    int a = accum[0];
    
    for (int i = 0; i < 16; i++){
        if (!found){
            value = i;
            if (k < accum[i]) found = true;
            else k -= accum[i];
        }
    }
    
    return ivec2(value, k);  //The kth occurrence of value is what we want
}

vec4 findTexel(int value, int k, vec2 fragCoordNewAPI){
    vec4 texel2 = vec4(1.0, 0.0, 0.0, 1.0);
    for (int i = 0; i < MAXSIZE; i++){
        vec4 v = texture2D(Texture, vec2(i, fragCoordNewAPI.y / MM)/float(MAXSIZE), 0.0); //tex(i, fragCoordNewAPI);
        int i4 = int(floor(v.g * 15.0));
        if (i4 == value){
            if (k == 0) texel2 = v;
            k -= 1;
        }
    }
    return texel2;
}

/*
int getAccum(int n){
    int ret = 100;
    for (int i = 0; i < 16; i++){
        if (i == n) ret = accum[i];
    }
    return ret;
}
*/

void main() {

    int accum[16];

    for (int i = 0; i < 16; i++) {
        accum[i] = 0;
    }
    
    // fragCoordNewAPI = fragCoord;
    
    vec2 uv = gl_FragCoord.xy / resolution.xy;    
    
    gl_FragColor = vec4(0.0);

    if (gl_FragCoord.x / MM > float(MAXSIZE * 2)) discard;    

    if (gl_FragCoord.y / MM > float(MAXSIZE)) discard;
    
    for (int i = 0; i < MAXSIZE; i++){
        // accumValue(tex(i).g);
        // int i4 = int(floor( tex(i, gl_FragCoord).g * 15.0 ));
        int i4 = int(floor( texture2D(Texture, vec2(x, gl_FragCoord.y / MM)/float(MAXSIZE), 0.0).g * 15.0 ));
        for (int i = 0; i < 16; i++) {
            accum[i] += i == i4 ? 1 : 0;
        }
    }
    
    int k = int(gl_FragCoord.x / MM);
    
    ivec2 order = find_Kth(k, accum);
    
    //gl_FragColor.r = step(0.0, MM *  float(getAccum(x)) - gl_FragCoord.y);
    //gl_FragColor.b = step(0.0, MM *  float(order.r) - gl_FragCoord.y);
    //gl_FragColor.g = step(0.0, MM *  float(order.g) - gl_FragCoord.y);
    
    gl_FragColor += findTexel(order.r, order.g, gl_FragCoord);
    if (gl_FragCoord.x / MM > float(MAXSIZE)) {
        gl_FragColor = texture2D(Texture, vec2((int(gl_FragCoord.x) - MAXSIZE) / int(MM), gl_FragCoord.y / MM)/float(MAXSIZE), 0.0);
    }

}
`