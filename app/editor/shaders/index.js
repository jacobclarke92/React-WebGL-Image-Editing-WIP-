import default_vertex from 'editor/shaders/default_vertex.glsl'
import default_fragment from 'editor/shaders/default_fragment.glsl'
import default_update from 'editor/shaders/default_update'

import filter_vertex from 'editor/shaders/filter_vertex.glsl'
import curves_update from 'editor/shaders/curves_update'
import curves_fragment from 'editor/shaders/curves_fragment.glsl'
import gamma_fragment from 'editor/shaders/gamma_fragment.glsl'
import grain_fragment from 'editor/shaders/grain_fragment.glsl'
import hue_fragment from 'editor/shaders/hue_fragment.glsl'
import saturation_fragment from 'editor/shaders/saturation_fragment.glsl'
import colorMatrix_update from 'editor/shaders/colorMatrix_update'
import colorMatrix_fragment from 'editor/shaders/colorMatrix_fragment.glsl'

const Shaders = {
	default: {
		update: default_update,
		vertex: default_vertex,
		fragment: default_fragment,
	},
	curves: {
		update: curves_update,
		vertex: filter_vertex,
		fragment: curves_fragment,
	},
	colorMatrix: {
		update: colorMatrix_update,
		vertex: filter_vertex,
		fragment: colorMatrix_fragment,
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
	saturation: {
		update: default_update,
		vertex: filter_vertex,
		fragment: saturation_fragment,
	},
	// dummy sharpen for now to keep presets happy
	sharpen: {
		update: default_update,
		vertex: filter_vertex,
		fragment: default_fragment,
	}
};

export default Shaders;