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
		editSteps: [],
	}

	constructor(props) {
		super();
		this.programs = [];
		this.framebuffers = [];
		this.currentFramebufferIndex = -1;
		this.lastEditStepsKeys = props.editSteps.map(editStep => editStep.key);
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

		const editStepsKeys = nextProps.editSteps.map(editStep => editStep.key);

		// if new url we need to reset current editor state and load new image
		if(this.props.url !== nextProps.url) {
			console.log('------------------');
			this.resetPrograms();
			this.resetFramebuffers();
			this.lastEditStepsKeys = editStepsKeys;
			this.loadImage(nextProps.url);

		}else{

			if(editStepsKeys.join(',') !== this.lastEditStepsKeys.join(',')) {
				console.log('---');
				console.log('editStepsKeys changed');
				this.lastEditStepsKeys = editStepsKeys;
				this.buildPrograms();
				this.resizePrograms();

				// Wait until props have been updated before re-rendering
				this.setState({}, () => this.renderEditSteps());

			}else if(!deepEqual(this.props.editSteps, nextProps.editSteps)) {
				console.log('---');
				console.log('editSteps changed');
				this.renderEditSteps();
			}
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
		this.defaultProgram = new Program('default', this.gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);

		this.buildPrograms();

		this.setState({width: image.width, height: image.height}, () => {

			this.resizeViewport();
			this.resizePrograms();
			this.renderEditSteps();

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

	buildPrograms(programList = this.lastEditStepsKeys) {
		console.log('building programs', programList);
		this.resetPrograms();
		programList.map(filterLabel => {
			this.addProgram(filterLabel);
		});
	}

	addProgram(label) {
		const shader = Shaders[label];
		if(!shader) {
			console.warn('No shader found for:', label);
			return;
		}
		const program = new Program(label, this.gl, shader.vertex, shader.fragment, shader.update);
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
		if(this.defaultProgram) this.defaultProgram.resize(width, height);
		for(let program of this.programs) {
			program.resize(width, height);
		}
	}

	renderEditSteps() {
		const { editSteps } = this.props;

		const steps = [{key: 'default'}, ...editSteps];

		console.log('render steps', steps);

		for(let count = 0; count < steps.length; count ++) {
			const step = steps[count];
			const program = count === 0 ? this.defaultProgram : this.programs[count-1];

			// switch to program
			program.use();

			// run the shader's update function -- modifies uniforms
			// program must be in use before calling update otherwise current program's uniforms get modified
			program.update(step);

			// determine source texture - original image texture if first pass or a framebuffer texture
			const source = count === 0 ? this.imageTexture.id : this.getTempFramebuffer(this.currentFramebufferIndex).texture.id;

			// determine render target, set to null if last one because null = canvas
			let target = null;
			if(count < steps.length-1) {
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

			// console.table(getProgramInfo(this.gl, program.program).uniforms);

		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (
			nextState.width !== this.state.width ||
			nextState.height !== this.state.height
		);
	}

	render() {
		const { width, height } = this.state;
		return (
			<div className="canvas-wrapper" style={{backgroundImage:'url('+this.props.url+')', maxWidth:width}}>
				<canvas ref="editor" width={width} height={height} />
			</div>
		)
	}

}