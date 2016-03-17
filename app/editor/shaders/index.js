import default_vertex from 'editor/shaders/default_vertex.glsl'
import default_fragment from 'editor/shaders/default_fragment.glsl'

import curves_fragment from 'editor/shaders/curves_fragment.glsl'
import grain_fragment from 'editor/shaders/grain_fragment.glsl'
import hue_fragment from 'editor/shaders/hue_fragment.glsl'
import saturation_fragment from 'editor/shaders/saturation_fragment.glsl'

const Shaders = {
	default: {
		vertex: default_vertex,
		fragment: default_fragment,
	},
	curves: {
		vertex: default_vertex,
		fragment: curves_fragment,
	},
	grain: {
		vertex: default_vertex,
		fragment: grain_fragment,
	},
	hue: {
		vertex: default_vertex,
		fragment: hue_fragment,
	},
	saturation: {
		vertex: default_vertex,
		fragment: saturation_fragment,
	},
};

export default Shaders;