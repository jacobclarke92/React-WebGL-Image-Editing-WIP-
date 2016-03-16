import React, { PropTypes, Component } from 'react'

import Shaders from 'editor/shaders'

import Program from 'editor/Program'
import Texture from 'editor/Texture'
import Framebuffer from 'editor/Framebuffer'

import { getProgramInfo } from 'editor/utils/webglUtils'

export default class Editor extends Component {

	static defaultProps = {
		url: 'test.jpg',
		width: 400,
		height: 400,
		onResize: () => {},
	}

	constructor(props) {
		super();
		this.state = {
			...props,
			programs: [],
		};
	}

	componentDidMount() {
		const { width, height, url } = this.props;

		this.image = new Image();
		this.image.onload = () => this.handleImageLoad(this.image);

		this.canvas = this.refs.editor;
		this.gl = this.canvas.getContext('experimental-webgl');
		if(!this.gl) this.gl = this.canvas.getContext('webgl');

		this.loadImage(url);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({...this.state, ...nextProps});
		if(this.props.url !== nextProps.url) {
			console.log('------------------');
			this.resetPrograms(() => this.loadImage(nextProps.url))
		}
		if(this.props.hue !== nextProps.hue) {
			this.defaultProgram.uniforms({hue: nextProps.hue});
			this.defaultProgram.render();
		}
	}

	loadImage(url) {
		console.log('loading image', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		console.log('image loaded');

		if(this.imageTexture) this.imageTexture.destroy();
		this.imageTexture = new Texture(this.gl, image.width, image.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
		this.imageTexture.loadContentsOf(image);

		if(this.defaultProgram) this.defaultProgram.destroy();
		this.defaultProgram = this.addProgram('hue');
		this.defaultProgram.texture = this.imageTexture.id;
		this.defaultProgram.uniforms({hue: this.props.hue});

		this.setState({width: image.width, height: image.height}, () => {

			this.resizeViewport();
			this.resizePrograms();
			this.renderPrograms();

			console.table(getProgramInfo(this.gl, this.defaultProgram.program).uniforms);

		});
	}

	addProgram(label) {
		const shader = Shaders[label];
		const program = new Program(this.gl, shader.vertex, shader.fragment, shader.render);
		const programs = this.state.programs;
		programs.push(program);
		this.setState({programs});
		return program;
	}

	resetPrograms(callback = () => {}) {
		for(let program of this.state.programs) {
			program.destroy();
		}
		this.setState({programs: []}, callback);
	}

	resizeViewport() {
		const { width, height } = this.state;
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
		this.props.onResize(width, height);
	}

	resizePrograms() {
		const { width, height, programs } = this.state;
		for(let program of programs) {
			program.resize(width, height);
		}
	}

	renderPrograms() {
		for(let program of this.state.programs) {
			program.render();
		}
	}

	render() {
		const { width, height } = this.state;
		return (
			<canvas ref="editor" width={width} height={height} />
		)
	}

}