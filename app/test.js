import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import WebGLDebug from 'webgl-debug'


import Shaders from './editor/shaders'
import Program from './editor/Program'
import Texture from './editor/Texture'
import Framebuffer from './editor/Framebuffer'

const useDebugger = false;

function throwOnGLError(err, funcName, args) {
   throw WebGLDebug.glEnumToString(err) 
   + 'was caused by call to ' 
   + funcName;
}

class App extends Component {

	constructor() {
		super();
		this.state = {
			rotate: 0,
			width: 640,
			height: 640,
			canvasWidth: 640,
			canvasHeight: 480,
		}
	}

	componentDidMount() {
		this.currentFramebufferIndex = -1;
		this.image = new Image();
		this.image.onload = () => this.handleImageLoad(this.image);
		this.canvas = this.refs.editor;
		this.gl = this.canvas.getContext('experimental-webgl');
		if(!this.gl) this.gl = this.canvas.getContext('webgl');

		this.gl = WebGLDebug.makeDebugContext(this.gl, throwOnGLError)

		this.defaultProgram = new Program('default', this.gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);
		this.rotateProgram = new Program('default', this.gl, Shaders.rotate.vertex, Shaders.rotate.fragment, Shaders.rotate.update);
		this.saturationProgram = new Program('saturation', this.gl, Shaders.saturation.vertex, Shaders.saturation.fragment, Shaders.saturation.update);
		this.gammaProgram = new Program('gamma', this.gl, Shaders.gamma.vertex, Shaders.gamma.fragment, Shaders.gamma.update);
		this.blendProgram = new Program('blend', this.gl, Shaders.blend.vertex, Shaders.blend.fragment, Shaders.blend.update);
		this.testProgram = new Program('default', this.gl, Shaders.rotate.vertex, Shaders.default.fragment, Shaders.default.update);
		
		this.framebuffer1 = new Framebuffer(this.gl).use();
		this.framebuffer1.attachEmptyTexture(this.props.width, this.props.height);
		this.framebuffer2 = new Framebuffer(this.gl).use();
		this.framebuffer2.attachEmptyTexture(this.props.width, this.props.height);
		this.editGroupFramebuffer = new Framebuffer(this.gl).use();
		this.editGroupFramebuffer.attachEmptyTexture(this.props.width, this.props.height);

		this.image.src = '/test2__.jpg';
	}

	handleImageLoad(image) {

		this.imageTexture = new Texture(this.gl, image.width, image.height);
		this.imageTexture.loadContentsOf(image);

		const width = image.width;
		const height = image.height;

		this.setState({width, height, canvasWidth: width, canvasHeight: height}, () => {
			this.resizeAll();
			this.renderEditSteps();
		});
	}

	resizeAll() {
		const { canvasWidth, canvasHeight } = this.state;
		this.gl.viewport(0, 0, canvasWidth, canvasHeight);
		this.defaultProgram.resize(canvasWidth, canvasHeight);
		this.rotateProgram.resize(canvasWidth, canvasHeight);
		this.saturationProgram.resize(canvasWidth, canvasHeight);
		this.gammaProgram.resize(canvasWidth, canvasHeight);
		this.testProgram.resize(canvasWidth, canvasHeight);
		this.framebuffer1.resizeTexture(canvasWidth, canvasHeight);
		this.framebuffer2.resizeTexture(canvasWidth, canvasHeight);
		this.editGroupFramebuffer.resizeTexture(canvasWidth, canvasHeight);
	}

	renderEditSteps() {
		const { rotate } = this.state;

		// default program step
		let program = this.defaultProgram;
		let sourceTexture = this.imageTexture;
		let target = this.framebuffer1;

		program.use();
		program.update({key: 'default'});

		program.willRender();
		sourceTexture.use();
		
		target.use();//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

		program.didRender();
		program.draw();

		if(useDebugger) debugger;


		//rotate step
		program = this.rotateProgram;
		sourceTexture = this.framebuffer1.texture;
		target = this.framebuffer2;

		program.use();
		program.update({key: 'rotate', value: rotate});
		program.willRender();
		sourceTexture.use();

		target.use();//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

		program.didRender();
		program.draw();

		if(useDebugger) debugger;

		//saturation step
		program = this.saturationProgram;
		sourceTexture = this.framebuffer2.texture;
		target = this.framebuffer1;

		program.use();
		program.update({key: 'saturation', value: 0.6});
		program.willRender();
		sourceTexture.use();

		target.use();//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

		program.didRender();
		program.draw();

		if(useDebugger) debugger;

		// copy texture reference to group framebuffer
		this.editGroupFramebuffer.use();
		this.editGroupFramebuffer.attachTexture(this.framebuffer1.texture.id);
		this.editGroupFramebuffer.use();
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

		if(useDebugger) debugger;

		// test drawing group framebuffer to cavnas
		// program = this.testProgram;
		// sourceTexture = this.editGroupFramebuffer.texture;
		// target = null;

		// program.use();
		// program.update({key: 'default'});
		// program.willRender();
		// sourceTexture.use();
		// this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);
		// program.didRender();
		// program.draw();
		// return;



		//gamma step
		program = this.gammaProgram;
		sourceTexture = this.framebuffer1.texture;
		target = this.framebuffer2;

		program.use();
		program.update({key: 'gamma', value: 0.02});
		program.willRender();
		sourceTexture.use();

		target.use();//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);

		program.didRender();
		program.draw();
		// return;
		
		if(useDebugger) debugger;

		// blend end of saturation step with gamma step to 50%
		program = this.saturationProgram;
		sourceTexture = this.framebuffer2.texture;
		// const blendTexture = this.editGroupFramebuffer.texture;

		program.use();
		// program.update({key: 'blend', amount: 0.5, blendTexture});
		program.update({key: 'saturation', value: 0});
		program.willRender();
		sourceTexture.use();

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

		program.didRender();
		program.draw();

		if(useDebugger) debugger;

	}

	handleRotate(rotationAdd) {
		const { width, height } = this.state;
		const rotate = (this.state.rotate + 360 + rotationAdd) % 360;
		const canvasWidth = (rotate == 90 || rotate == 270) ? height : width;
		const canvasHeight = (rotate == 90 || rotate == 270) ? width : height;
		this.setState({rotate, canvasWidth, canvasHeight}, () => {
			this.resizeAll();
			this.renderEditSteps();
		});
	}

	render() {
		const { canvasWidth, canvasHeight } = this.state;
		return (
			<div>
				<button onClick={() => this.handleRotate(90)}>Rotate Right</button>
				<button onClick={() => this.handleRotate(-90)}>Rotate Left</button>
				<br />
				<canvas ref="editor" width={canvasWidth} height={canvasHeight} />
			</div>
		)
	}
}

ReactDOM.render(<App /> , document.getElementById('app'));