export default `
// blend fragment
precision highp float;

uniform sampler2D Texture;
uniform sampler2D blendTexture;
uniform float amount;
uniform int blendType;
varying vec2 v_texCoord;

/*
	Adapted from
	https://github.com/jamieowen/glsl-blend

	Blend Types
	1: DEFAULT Alpha blend

	2: Darken
	3: Multiply
	4: Color burn
	5: Linear burn
	6: Darker color -- not used

	7: Lighten
	8: Screen
	9: Color dodge
	10: Linear dodge
	11: Lighter color -- not used

	12: Overlay
	13: Soft light
	14: Hard light -- same as overlay?
	15: Vivid light
	16: Linear light
	17: Pin light
	18: Hard mix

	19: Difference
	20: Exclusion
	21: Subtract
	22: Divide -- not used

	23: Hue
	24: Saturation
	25: Color
	26: Luminosity
 */
 
float darken(float c0, float c1) {
	return min(c0, c1);
}

float lighten(float c0, float c1) {
	return max(c0, c1);
}

float burn(float c0, float c1) {
	return (c1 == 0.0) ? c1 : max((1.0 - ((1.0 - c0) / c1)), 0.0);
}

float linearBurn(float c0, float c1) {
	return max(c0 + c1 - 1.0, 0.0);
}

float screen(float c0, float c1) {
	return 1.0 - ((1.0 - c0) * (1.0 - c1));
}

float colorDodge(float c0, float c1) {
	return (c1 == 1.0) ? c1 : min(c0 / (1.0 - c1), 1.0);
}

float colorBurn(float c0, float c1) {
	return (c1 == 0.0) ? c1 : max((1.0 - ((1.0 - c0)/c1)), 0.0);
}

float linearDodge(float c0, float c1) {
	return min(c0 + c1, 1.0);
}

float overlay(float c0, float c1) {
	return c0 < 0.5 ? (2.0 * c0 * c1) : (1.0 - 2.0*(1.0 - c0)*(1.0 - c1));
}

float softLight(float c0, float c1) {
	return (c1 < 0.5) ? (2.0*c0*c1 + c0*c0*(1.0 - 2.0*c1)) : (sqrt(c0)*(2.0*c1 - 1.0) + 2.0*c0*(1.0 - c1));
}

float vividLight(float c0, float c1) {
	return (c1 < 0.5) ? colorBurn(c0, (2.0*c1)) : colorDodge(c0,(2.0*(c1 - 0.5)));
}

float linearLight(float c0, float c1) {
	return (c1 < 0.5) ? linearBurn(c0, (2.0*c1)) : linearDodge(c0, (2.0*(c1 - 0.5)));
}

float pinLight(float c0, float c1) {
	return (c1 < 0.5) ? darken(c0,(2.0*c1)) : lighten(c0, (2.0*(c1 - 0.5)));
}

float hardMix(float c0, float c1) {
	return (vividLight(c0, c1) < 0.5) ? 0.0 : 1.0;
}

float difference(float c0, float c1) {
	return abs(c0 - c1);
}

float exclusion(float c0, float c1) {
	return c0 + c1 - 2.0*c0*c1;
}

float subtract(float c0, float c1) {
	return max(c0 + c1 - 1.0, 0.0);
}

void main(void) {

	// get pixels for each layer
	vec4 basePixel = texture2D(blendTexture, v_texCoord);
	vec4 blendPixel = texture2D(Texture, v_texCoord);

	// seperate rgb from rgba
    vec3 t0 = basePixel.rgb;
    vec3 t1 = blendPixel.rgb;
    vec3 color = t1;
    
    // darken
    if(blendType == 2) {
    	color = vec3(darken(t0.r, t1.r), darken(t0.g, t1.g), darken(t0.b, t1.b));

    // multiply wow
	}else if (blendType == 3) {
		color = t0 * t1;

    // color burn
	}else if (blendType == 4) {
		color = vec3(burn(t0.r, t1.r), burn(t0.g, t1.g), burn(t0.b, t1.b));

    // linear burn
	}else if (blendType == 5) {
		color = vec3(linearBurn(t0.r, t1.r), linearBurn(t0.g, t1.g), linearBurn(t0.b, t1.b));


    // lighten
	}else if (blendType == 7) {
		color = vec3(lighten(t0.r, t1.r), lighten(t0.g, t1.g), lighten(t0.b, t1.b));

    // screen
	}else if (blendType == 8) {
		color = vec3(screen(t0.r, t1.r), screen(t0.g, t1.g), screen(t0.b, t1.b));

    // color dodge
	}else if (blendType == 9) {
		color = vec3(colorDodge(t0.r, t1.r), colorDodge(t0.g, t1.g), colorDodge(t0.b, t1.b));

    // linear dodge
	}else if (blendType == 10) {
		color = vec3(linearDodge(t0.r, t1.r), linearDodge(t0.g, t1.g), linearDodge(t0.b, t1.b));

    // lighter color
	}else if (blendType == 11) {
		color = color;

    // overlay
	}else if (blendType == 12) {
		color = vec3(overlay(t0.r, t1.r), overlay(t0.g, t1.g), overlay(t0.b, t1.b));

    // soft light
	}else if (blendType == 13) {
		color = vec3(softLight(t0.r, t1.r), softLight(t0.g, t1.g), softLight(t0.b, t1.b));

    // hard light -- apparently same as overlay?
	}else if (blendType == 14) {
		color = vec3(overlay(t0.r, t1.r), overlay(t0.g, t1.g), overlay(t0.b, t1.b));

    // vivid light
	}else if (blendType == 15) {
		color = vec3(vividLight(t0.r, t1.r), vividLight(t0.g, t1.g), vividLight(t0.b, t1.b));

    // linear light
	}else if (blendType == 16) {
		color = vec3(linearLight(t0.r, t1.r), linearLight(t0.g, t1.g), linearLight(t0.b, t1.b));

    // pin light
	}else if (blendType == 17) {
		color = vec3(pinLight(t0.r, t1.r), pinLight(t0.g, t1.g), pinLight(t0.b, t1.b));

    // hard mix
	}else if (blendType == 18) {
		color = vec3(hardMix(t0.r, t1.r), hardMix(t0.g, t1.g), hardMix(t0.b, t1.b));


	// difference
	}else if(blendType == 19) {
		color = vec3(difference(t0.r, t1.r), difference(t0.g, t1.g), difference(t0.b, t1.b));

	// exclusion
	}else if(blendType == 20) {
		color = vec3(exclusion(t0.r, t1.r), exclusion(t0.g, t1.g), exclusion(t0.b, t1.b));

	// subtract
	}else if(blendType == 21) {
		color = vec3(subtract(t0.r, t1.r), subtract(t0.g, t1.g), subtract(t0.b, t1.b));

	// divide -- not used
	}else if(blendType == 22) {
		color = color;
	}

	// blend to amount
	color = color * amount + t0 * (1.0 - amount);


    gl_FragColor = vec4(color.rgb, basePixel.a * blendPixel.a);
}
`