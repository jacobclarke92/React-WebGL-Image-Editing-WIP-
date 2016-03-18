import default_vertex from 'editor/shaders/default_vertex.glsl'
import default_fragment from 'editor/shaders/default_fragment.glsl'
import default_update from 'editor/shaders/defualt_update'

import filter_vertex from 'editor/shaders/filter_vertex.glsl'
import curves_fragment from 'editor/shaders/curves_fragment.glsl'
import grain_fragment from 'editor/shaders/grain_fragment.glsl'
import hue_fragment from 'editor/shaders/hue_fragment.glsl'
import saturation_fragment from 'editor/shaders/saturation_fragment.glsl'

const Shaders = {
	default: {
		update: default_update,
		vertex: default_vertex,
		fragment: default_fragment,
	},
	// curves: {
	// 	vertex: filter_vertex,
	// 	fragment: curves_fragment,
	// },
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
};

export default Shaders;