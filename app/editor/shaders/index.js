import default_vertex from './default_vertex.glsl'
import default_vertex_node from './default_vertex_node.glsl'
import default_fragment from './default_fragment.glsl'
import default_update from './default_update'
import filter_vertex from './filter_vertex.glsl'

import rotate_fragment from './rotate_fragment.glsl'

import blur_fragment from './blur_fragment.glsl'
import bloom_fragment from './bloom_fragment.glsl'
import curves_update from './curves_update'
import curves_fragment from './curves_fragment.glsl'
import colorMap_update from './colorMap_update'
import colorMap_fragment from './colorMap_fragment.glsl'
import colorMatrix_update from './colorMatrix_update'
import colorMatrix_fragment from './colorMatrix_fragment.glsl'
import denoise_fragment from './denoise_fragment.glsl'
import gamma_fragment from './gamma_fragment.glsl'
import grain_fragment from './grain_fragment.glsl'
import HSL_update from './HSL_update'
import HSL_hueAdjustment_fragment from './HSL_hueAdjustment_fragment.glsl'
import HSL_saturationAdjustment_fragment from './HSL_saturationAdjustment_fragment.glsl'
import HSL_luminanceAdjustment_fragment from './HSL_luminanceAdjustment_fragment.glsl'
import hue_fragment from './hue_fragment.glsl'
import pixelSort_update from './pixelSort_update'
import pixelSort_fragment from './pixelSort_fragment.glsl'
import saturation_fragment from './saturation_fragment.glsl'
import sharpen_update from './sharpen_update'
import sharpen_fragment from './sharpen_fragment.glsl'

const Shaders = {
	default: {
		update: default_update,
		vertex: default_vertex,
		fragment: default_fragment,
	},
	default_node: {
		update: default_update,
		vertex: default_vertex_node,
		fragment: default_fragment,
	},

	rotate: {
		update: default_update,
		vertex: filter_vertex,
		fragment: rotate_fragment,
	},
	straighten: {
		update: default_update,
		vertex: filter_vertex,
		fragment: default_fragment,
	},
	crop: {
		update: default_update,
		vertex: filter_vertex,
		fragment: default_fragment,
	},

	blur: {
		update: default_update,
		vertex: filter_vertex,
		fragment: blur_fragment,
	},
	bloom: {
		update: default_update,
		vertex: filter_vertex,
		fragment: bloom_fragment,
	},
	curves: {
		update: curves_update,
		vertex: filter_vertex,
		fragment: curves_fragment,
	},
	colorMap: {
		update: colorMap_update,
		vertex: filter_vertex,
		fragment: colorMap_fragment,
	},
	colorMatrix: {
		update: colorMatrix_update,
		vertex: filter_vertex,
		fragment: colorMatrix_fragment,
	},
	denoise: {
		update: default_update,
		vertex: filter_vertex,
		fragment: denoise_fragment,
	},
	gamma: {
		update: default_update,
		vertex: filter_vertex,
		fragment: gamma_fragment,
	},
	grain: {
		update: default_update,
		vertex: filter_vertex,
		fragment: grain_fragment,
	},
	hue: {
		update: default_update,
		vertex: filter_vertex,
		fragment: hue_fragment,
	},
	pixelSort: {
		update: pixelSort_update,
		vertex: filter_vertex,
		fragment: pixelSort_fragment,
	},
	saturation: {
		update: default_update,
		vertex: filter_vertex,
		fragment: saturation_fragment,
	},
	hueAdjustment: {
		update: HSL_update,
		vertex: filter_vertex,
		fragment: HSL_hueAdjustment_fragment,
	},
	saturationAdjustment: {
		update: HSL_update,
		vertex: filter_vertex,
		fragment: HSL_saturationAdjustment_fragment,
	},
	luminanceAdjustment: {
		update: HSL_update,
		vertex: filter_vertex,
		fragment: HSL_luminanceAdjustment_fragment,
	},
	// dummy sharpen for now to keep presets happy
	sharpen: {
		update: sharpen_update,
		vertex: filter_vertex,
		fragment: sharpen_fragment,
	},
};

export default Shaders;