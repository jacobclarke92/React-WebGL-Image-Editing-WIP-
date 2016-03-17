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
		if(this.props.hue !== nextProps.hue || this.props.saturation !== nextProps.saturation) {
			this.renderPrograms();
		}
	}

	loadImage(url) {
		console.log('loading image', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		console.log('image loaded');

		
		// we make blank textures and assign them to framebuffers
		this.textures = [];
		this.framebuffers = [];

		for(let i=0; i<2; i++) {
			const texture = new Texture(this.gl, image.width, image.height);
			this.textures.push(texture);
			texture.loadEmpty();

			const fbo = new Framebuffer(this.gl);
			this.framebuffers.push(fbo);
			fbo.attachTexture(texture.id);
		}


		// make texture for base image
		if(this.imageTexture) this.imageTexture.destroy();
		this.imageTexture = new Texture(this.gl, image.width, image.height);
		this.imageTexture.loadContentsOf(image);


		// init base program to render base image
		if(this.defaultProgram) this.defaultProgram.destroy();
		this.defaultProgram = this.addProgram('saturation');
		this.defaultProgram.texture = this.imageTexture.id;


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
		program.label = label;
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
		const { programs } = this.state;

		let count = 0;
		for(let count = 0; count < programs.length; count ++) {
			const program = programs[count];

			if(count === programs.length-1) {
				// binding framebuffer of null means to render to canvas instead of framebuffer
				this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
			}else{
				// if not last edit then render on to one of our framebuffers
				this.framebuffers[count % 2].use();
			}
			if(this.state.hasOwnProperty(program.label)) {
				program.uniforms({
					[program.label]: this.state[program.label],
				});
			}
			program.render();
			count ++;
		}

	}

	render() {
		const { width, height } = this.state;
		return (
			<canvas ref="editor" width={width} height={height} />
		)
	}

}