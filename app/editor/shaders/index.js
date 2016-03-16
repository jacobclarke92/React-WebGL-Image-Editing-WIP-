import default_vertex from 'editor/shaders/default_vertex.glsl'
import default_fragment from 'editor/shaders/default_fragment.glsl'
import default_render from 'editor/shaders/default'

export default {
	default: {
		render: default_render,
		vertex: default_vertex,
		fragment: default_fragment,
	},
}