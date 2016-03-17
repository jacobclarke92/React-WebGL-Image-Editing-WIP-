import React, { PropTypes, Component } from 'react'
import deepEqual from 'deep-equal'

import Shaders from 'editor/shaders'

import Program from 'editor/Program'
import Texture from 'editor/Texture'
import FramebufferTexture from 'editor/FramebufferTexture'

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
		this.programs = [];
		this.framebuffers = [];
		this.currentFramebufferIndex = -1;
		this.state = {
			url: props.url,
			settings: props.settings,
		}
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
		// update certain aspects of state
		this.setState({settings: nextProps.settings});

		// if new url we need to reset current editor state and load new image
		if(this.props.url !== nextProps.url) {
			console.log('------------------');
			this.resetPrograms();
			this.resetFramebuffers();
			this.loadImage(nextProps.url);

		// if settings have changed re-render canvas
		}else if(!deepEqual(this.props.settings, nextProps.settings)) {
			this.renderPrograms();
		}
	}

	loadImage(url) {
		console.log('loading image', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		console.log('image loaded');

		// make texture for base image, destroy old one first if it exists
		if(this.imageTexture) this.imageTexture.destroy();
		this.imageTexture = new Texture(this.gl, image.width, image.height);
		this.imageTexture.loadContentsOf(image);

		// init base program to render base image
		if(this.defaultProgram) this.defaultProgram.destroy();
		this.defaultProgram = this.addProgram('default');

		this.addProgram('hue');
		this.addProgram('saturation');
		this.addProgram('grain');

		this.setState({width: image.width, height: image.height}, () => {

			this.resizeViewport();
			this.resizePrograms();
			this.renderPrograms();

			console.table(getProgramInfo(this.gl, this.defaultProgram.program).uniforms);

		});
	}

	// this function returns either an existing framebuffer or a new framebuffer
	getTempFramebuffer(index) {
		const { width, height } = this.state;

		if(!this.framebuffers[index]) {
			this.framebuffers[index] = new FramebufferTexture(this.gl);
			this.framebuffers[index].attachEmptyTexture(width, height);
		}

		return this.framebuffers[index];
	}

	addProgram(label) {
		const shader = Shaders[label];
		const program = new Program(this.gl, shader.vertex, shader.fragment);
		program.label = label;
		this.programs.push(program);
		return program;
	}

	resetPrograms() {
		for(let program of this.programs) {
			program.destroy();
		}
		this.programs = [];
	}

	resetFramebuffers() {
		this.currentFramebufferIndex = -1;
		for(let framebuffer of this.framebuffers) {
			if(framebuffer.texture) framebuffer.texture.destroy();
			framebuffer.destroy();
		}
		this.framebuffers = [];
	}

	resizeViewport() {
		const { width, height } = this.state;
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
		this.props.onResize(width, height);
	}

	resizePrograms() {
		const { width, height } = this.state;
		for(let program of this.programs) {
			program.resize(width, height);
		}
	}

	renderPrograms() {
		const { settings } = this.state;

		for(let count = 0; count < this.programs.length; count ++) {
			const program = this.programs[count];

			// switch to program
			program.use();

			// update program's uniforms vars if they exist in our state settings
			if(settings.hasOwnProperty(program.label)) {
				program.uniforms({
					[program.label]: settings[program.label],
				});
			}

			// determine source texture - original image texture if first pass or a framebuffer texture
			const source = count === 0 ? this.imageTexture.id : this.getTempFramebuffer(this.currentFramebufferIndex).texture.id;
			
			// determine render target, set to null if last one because null = canvas
			let target = null;
			if(count < this.programs.length-1) {
				this.currentFramebufferIndex = (this.currentFramebufferIndex+1)%2;
				target = this.getTempFramebuffer(this.currentFramebufferIndex).id;
			}

			// pre-render calcs idk
			program.willRender();

			// use current source texture and framebuffer target
			this.gl.bindTexture(this.gl.TEXTURE_2D, source);
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

			// post-render calcs idk
			program.didRender();

			// draw that shit
			program.draw();

		}
	}

	render() {
		const { width, height } = this.state;
		return (
			<canvas ref="editor" width={width} height={height} />
		)
	}

}