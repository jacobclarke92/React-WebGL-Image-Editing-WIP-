import React, { PropTypes, Component } from 'react'
import deepEqual from 'deep-equal'

import Processor from './editor/Processor'
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
		instructions: [],
		debug: false,
	};

	constructor(props) {
		super();
		this.lastEditStepsKeys = combineGroupEditStepKeys(props.instructions);
		this.waitingForRender = false;
		this.state = {
			url: props.url,
		}
	}

	componentDidMount() {
		const { width, height, canvasWidth, canvasHeight, url, debug } = this.props;

		this.debug = debug;
		this.image = new Image();
		this.image.onload = () => this.handleImageLoad(this.image);

		this.canvas = this.refs.editor;
		this.gl = this.canvas.getContext('experimental-webgl');
		if(!this.gl) this.gl = this.canvas.getContext('webgl');

		this.Processor = new Processor(this.gl, this.props.instructions);
		this.Processor.setCanvasSize(canvasWidth, canvasHeight);
		this.Processor.debug = debug;

		if(url) {
			this.loadImage(url);
		}else{
			console.log('No URL provided to Renderer');
		}
	}

	componentWillReceiveProps(nextProps) {

		const editStepsKeys = combineGroupEditStepKeys(nextProps.instructions);

		// if new url we need to reset current editor state and load new image
		if(this.props.url !== nextProps.url) {
			this.Processor.resetPrograms();
			this.Processor.resetFramebuffers();
			this.lastEditStepsKeys = editStepsKeys;
			this.loadImage(nextProps.url);

		}else{

			const resized = (this.props.canvasWidth !== nextProps.canvasWidth || this.props.canvasHeight !== nextProps.canvasHeight);

			// update canvas size if props changed
			if(resized) {
				if(this.debug) console.info('CANVAS SIZE CHANGED', nextProps.canvasWidth, nextProps.canvasHeight);
				this.refs.editor.width = nextProps.canvasWidth;
				this.refs.editor.height = nextProps.canvasHeight;
				this.Processor.setCanvasSize(nextProps.canvasWidth, nextProps.canvasHeight);
			}

			// check to see if program list / order has changed in order to allocate new programs / rebuild
			// part of this means it will re-set all the relevant sizes to match canvas size props
			if(editStepsKeys.join(',') !== this.lastEditStepsKeys.join(',')) {
				
				if(this.debug) console.info('NEW EDIT STEPS', editStepsKeys.join(','), this.lastEditStepsKeys.join(','));
				this.lastEditStepsKeys = editStepsKeys;
				this.Processor.setInstructions(nextProps.instructions);
				this.Processor.buildPrograms();
				this.Processor.resizeAll();
				this.Processor.renderInstructions();

			// do a deep check to see if edit step params have changed since last time in order to re-render
			}else if(!deepEqual(this.props.instructions, nextProps.instructions)) {

				// however if it's resized, wait until props have updated
				if(resized) {
					if(this.debug) console.info('IMAGE CHANGED SO RESIZING ALL');
					this.Processor.resizeAll();
				}
				if(this.debug) console.info('NEW EDIT STEP PARAM CHANGES');
				this.Processor.renderInstructions(nextProps.instructions);

			}else if(resized && this.waitingForRender) {

				if(this.debug) console.info('RENDERING AFTER IMAGE LOADED AND SIZE UPDATED')
				this.Processor.setInstructions(nextProps.instructions);
				this.Processor.buildPrograms();
				this.Processor.resizeAll();
				this.Processor.renderInstructions();
				this.waitingForRender = false;
			}

			if(this.debug) console.log('-------------------------');
		}
	}

	loadImage(url) {
		if(this.debug && url.indexOf('data:') < 0) console.log('loading', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		// log the image url if it's not a data uri
		if(this.debug && this.props.url.indexOf('data:') < 0) console.log(this.props.url, 'loaded');

		// for thumbnails that won't be updated
		if(!this.props.autoResize) {
			this.Processor.imageLoaded(image, this.props.width, this.props.height);
			this.Processor.buildPrograms();
			this.Processor.resizeAll();
			this.Processor.renderInstructions();

		// for main renderer
		}else{
			this.Processor.imageLoaded(image, image.width, image.height);
			// this.Processor.buildPrograms();

			this.waitingForRender = true;
			this.props.onResize(image.width, image.height);
		}
	}


	shouldComponentUpdate(nextProps, nextState) {
		// only do a react render if dimensions change
		return false;
	}

	render() {
		const { canvasWidth, canvasHeight } = this.props;
		return (
			<canvas ref="editor" width={canvasWidth} height={canvasHeight} />
		)
	}

}