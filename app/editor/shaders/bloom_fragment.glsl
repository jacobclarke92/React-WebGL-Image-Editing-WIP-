export default  `
// bloom fragment
precision highp float;

uniform sampler2D Texture;
varying vec2 v_texCoord;

uniform float bloom;
uniform vec2 u_resolution;


vec4 BlurColor (in vec2 Coord, in sampler2D Tex, in float MipBias) {

	vec2 TexelSize = MipBias/u_resolution.xy;
    
    vec4  Color = texture2D(Tex, Coord, MipBias);
    Color += texture2D(Tex, Coord + vec2(TexelSize.x,0.0), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(-TexelSize.x,0.0), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(0.0,TexelSize.y), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(0.0,-TexelSize.y), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(TexelSize.x,TexelSize.y), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(-TexelSize.x,TexelSize.y), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(TexelSize.x,-TexelSize.y), MipBias);    	
    Color += texture2D(Tex, Coord + vec2(-TexelSize.x,-TexelSize.y), MipBias);    

    return Color/9.0;
}


void main(void) {
	
    vec2 uv = v_texCoord.xy;

    float Bloom = 1.0 - bloom;
    float Threshold = Bloom;
    float BlurSize = 2.0 - Bloom * 2.0;
    float Intensity = 2.0 - Bloom * 2.0;
    
    vec4 Color = texture2D(Texture, uv);
    vec4 Highlight = clamp(BlurColor(uv, Texture, BlurSize) - Threshold, 0.0, 1.0) * 1.0 / (1.0 - Threshold);
        
    gl_FragColor = 1.0 - (1.0 - Color) * (1.0 - Highlight*Intensity); //Screen Blend Mode
}
`