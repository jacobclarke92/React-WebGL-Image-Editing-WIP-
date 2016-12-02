import React, { PropTypes, Component } from 'react'
import deepEqual from 'deep-equal'

import Shaders from './editor/shaders'

import Program from './editor/Program'
import Texture from './editor/Texture'
import Framebuffer from './editor/Framebuffer'

import { getProgramInfo } from './editor/utils/webglUtils'
// import cascadeFrontalFace from './editor/constants/cascade_frontalface'

function combineGroupEditStepKeys(instructions) {
	return instructions.reduce((steps, group) => [...steps, ...(group.steps || [])], []).map(step => step.key);
}

export default class Editor extends Component {

	static defaultProps = {
		url: 'test.jpg',
		width: 400,
		height: 400,
		canvasWidth: 400,
		canvasHeight: 400,
		onResize: () => {},
		onRender: () => {},
		autoResize: false,
		// editSteps: [],
		instructions: [],
	};

	constructor(props) {
		super();
		this.programs = {};
		this.framebuffers = [];
		this.currentFramebufferIndex = -1;
		this.lastEditStepsKeys = combineGroupEditStepKeys(props.instructions);
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

		if(url) {
			this.loadImage(url);
		}else{
			console.log('No URL provided to Renderer');
		}
	}

	componentWillReceiveProps(nextProps) {
		// update certain aspects of state
		this.setState({settings: nextProps.settings});

		const editStepsKeys = combineGroupEditStepKeys(nextProps.instructions);
		// console.log(this.props.url);
		// console.log(this.lastEditStepsKeys.join(','));
		// console.log(editStepsKeys.join(','));

		// if new url we need to reset current editor state and load new image
		if(this.props.url !== nextProps.url) {
			this.resetPrograms();
			this.resetFramebuffers();
			this.lastEditStepsKeys = editStepsKeys;
			this.loadImage(nextProps.url);

		}else{

			// update viewport and programs if size has changed
			if(this.props.width !== nextProps.width || this.props.height !== nextProps.height) {
				console.log('RESIZING VIEWPORTS AND PROGRAMS');
				this.resizeViewport(nextProps.width, nextProps.height);
				this.resizePrograms(nextProps.width, nextProps.height);
			}

			// if(this.props.canvasWidth !== nextProps.canvasWidth || this.props.canvasHeight !== nextProps.canvasHeight) {
			// 	this.resizeViewport(nextProps.canvasWidth, nextProps.canvasHeight);
			// }

			// check to see if program list / order has changed in order to allocate new programs / rebuild
			if(editStepsKeys.join(',') !== this.lastEditStepsKeys.join(',')) {
				console.log('NEW EDIT STEPS', editStepsKeys.join(','), this.lastEditStepsKeys.join(','));
				this.lastEditStepsKeys = editStepsKeys;
				this.buildPrograms(nextProps.instructions);
				this.resizePrograms(nextProps.width, nextProps.height);
				this.renderEditSteps(nextProps.instructions);

			// do a deep check to see if edit step params have changed since last time in order to re-render
			}else if(!deepEqual(this.props.instructions, nextProps.instructions)) {
				console.log('NEW EDIT STEP PARAM CHANGES');
				this.renderEditSteps(nextProps.instructions);
			}
		}
	}

	loadImage(url) {
		if(url.indexOf('data:') < 0) console.log('loading', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		// log the image url if it's not a data uri
		if(this.props.url.indexOf('data:') < 0) console.log(this.props.url, 'loaded');

		// make texture for base image, destroy old one first if it exists
		if(this.imageTexture) this.imageTexture.destroy();
		this.imageTexture = new Texture(this.gl, image.width, image.height);
		this.imageTexture.loadContentsOf(image);

		// init base program to render base image
		if(this.defaultProgram) this.defaultProgram.destroy();
		this.defaultProgram = new Program('default', this.gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);

		// init programs 
		this.buildPrograms();

		// autoResize is a feature which I'm not sure will have use going forward
		// if set to true it will pass back image dimensions, which should in turn be returned to component as props
		// if set to false it means the image dimensions are already known and should have been provided at the same time as the new image url
		// the danger there is that if not autoResize and provided dimensions are different to what the image's dimensions actually are, the shaders could behave unpredicatably
		if(!this.props.autoResize) {
			this.resizeViewport();
			this.resizePrograms();
			this.renderEditSteps();
		}else{
			this.props.onResize(image.width, image.height);
		}

	}

	// this function returns either an existing framebuffer or a new framebuffer
	getTempFramebuffer(index) {
		const { width, height } = this.props;

		if(!this.framebuffers[index]) {
			this.framebuffers[index] = new Framebuffer(this.gl).use();
			this.framebuffers[index].attachEmptyTexture(width, height);
		}

		return this.framebuffers[index];
	}

	buildPrograms(instructions = this.props.instructions) {
		this.resetPrograms();
		instructions.filter(group => group.steps && group.steps.length > 0).forEach(group => {
			const groupName = group.name;
			if(!(groupName in this.programs)) this.programs[groupName] = [];
			group.steps.forEach(step => {
				this.programs[groupName].push(this.addProgram(step.key));
			});
		});
		if(window.doFaceDetection) this.addProgram('faceDetect');
	}

	addProgram(label) {
		if(!(label in Shaders)) {
			console.warn('No shader found for:', label);
			return;
		}
		const shader = Shaders[label];
		const program = new Program(label, this.gl, shader.vertex, shader.fragment, shader.update);
		// this.programs.push(program);
		return program;
	}

	resetPrograms() {
		Object.keys(this.programs).forEach(groupKey => {
			for(let program of this.programs[groupKey]) {
				program.destroy();
			}
		})
		this.programs = {};
	}

	resetFramebuffers() {
		this.currentFramebufferIndex = -1;
		for(let framebuffer of this.framebuffers) {
			if(framebuffer.texture) framebuffer.texture.destroy();
			framebuffer.destroy();
		}
		this.framebuffers = [];
	}

	resizeViewport(width = this.props.width, height = this.props.height) {
		// this.canvas.width = width;
		// this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
	}

	resizePrograms(width = this.props.width, height = this.props.height) {
		if(this.defaultProgram) this.defaultProgram.resize(width, height);
		Object.keys(this.programs).forEach(groupKey => {
			for(let program of this.programs[groupKey]) {
				program.resize(width, height);
			}
		});
	}

	renderEditSteps(_instructions = this.props.instructions || []) {

		// inject default shader as first render step of first edit group - settings
		const instructions = [{name: 'preRender', steps: [{key: 'default'}]}, ..._instructions].filter(group => group.steps && group.steps.length > 0);
		// const steps = [{key: 'default'}, ...editSteps];

		let totalStepCount = -1;
		// iterate over instruction groups
		for(let groupCount = 0; groupCount < instructions.length; groupCount ++) {
			const group = instructions[groupCount];
			const groupName = group.name;
			const steps = group.steps || [];

			// iterate over group edit steps
			for(let count = 0; count < steps.length; count ++) {
				const step = steps[count];
				totalStepCount ++;

				// select the correct program, if first, select the default injected shader from above
				const program = totalStepCount === 0 ? this.defaultProgram : this.programs[groupName][count];

				// switch to program
				program.use();

				// iterations are just a means of compounding a program's render output
				// its sole purpose is to make my self-indulgent pixel-sorting shader work :~)
				const iterations = step.iterations || 1;
				for(let iteration = 0; iteration < iterations; iteration++) {

					// run the shader's update function -- modifies uniforms
					// program must be in use before calling update otherwise previously active program's uniforms get modified
					program.update(step, iteration);

					// determine source texture - original image texture if first pass or a framebuffer texture for any following passes
					// explaination of framebuffers below...
					const sourceTexture = totalStepCount === 0 ? this.imageTexture : this.getTempFramebuffer(this.currentFramebufferIndex).texture;

					// Think of framebuffers as extra, unseen canvases, we only need 2 framebuffers, they get reused.
					// We take it in turns to take what's on one framebuffer as a texture, apply our edit steps to it, and then render the result to the other framebuffer.
					// So for the next edit step we do the same thing except the other way around, repeat ad infinitum.
					// ----
					// If we're up to the last step then the render target stays at null (null = canvas),
					// Otherwise we increment our framebuffer index to select (or create) the next framebuffer
					// console.log(groupName, step.key);
					// console.log(count, steps.length-1);
					// console.log(groupCount, instructions.length-1);
					// console.log(iteration, iterations-1);
					let target = null;
					if(!(count >= steps.length-1 && groupCount >= instructions.length-1 && iteration >= iterations-1)) {
						this.currentFramebufferIndex = (this.currentFramebufferIndex+1)%2;
						target = this.getTempFramebuffer(this.currentFramebufferIndex).id;
					}


					// pre-render calcs idk
					program.willRender();

					// use current source texture and framebuffer target
					sourceTexture.use();
					this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

					// post-render calcs idk
					program.didRender();

					// draw that shit
					program.draw();

				}

				// console.table(getProgramInfo(this.gl, program.program).uniforms);
			}
		}

		this.props.onRender();
	}

	shouldComponentUpdate(nextProps, nextState) {
		// only do a react render if dimensions change
		return (
			nextProps.canvasWidth !== this.props.canvasWidth ||
			nextProps.canvasHeight !== this.props.canvasHeight
		);
	}

	render() {
		const { canvasWidth, canvasHeight } = this.props;
		return (
			<canvas ref="editor" width={canvasWidth} height={canvasHeight} />
		)
	}

}