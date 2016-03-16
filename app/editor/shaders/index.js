import default_render from 'editor/shaders/default'
import default_vertex from 'editor/shaders/default_vertex.glsl'
import default_fragment from 'editor/shaders/default_fragment.glsl'

import hue_render from 'editor/shaders/hue'
import hue_fragment from 'editor/shaders/hue_fragment.glsl'

const Shaders = {
	default: {
		render: default_render,
		vertex: default_vertex,
		fragment: default_fragment,
	},
	hue: {
		render: hue_render,
		vertex: default_vertex,
		fragment: hue_fragment,
	},
};

export default Shaders;