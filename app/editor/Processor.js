import deepEqual from 'deep-equal'

import Shaders from './shaders'
import Program from './Program'
import Texture from './Texture'
import Framebuffer from './Framebuffer'

import { getProgramInfo } from './utils/webglUtils'

export default class Processor {

	constructor(gl, instructions = []) {
		this.IS_NODE = typeof window === 'undefined';
		if(this.IS_NODE) this.EXT_resize = gl.getExtension('STACKGL_resize_drawingbuffer');

		this.debug = false;
		this.width = 550;
		this.height = 400;
		this.canvasWidth = 550;
		this.canvasHeight = 400;

		this.gl = gl;
		this.programs = {};
		this.framebuffers = [];
		this.instructions = instructions;
		this.currentFramebufferIndex = -1;
	}

	setCanvasSize(width, height) {
		this.canvasWidth = width;
		this.canvasHeight = height;
	}

	setInstructions(instructions) {
		this.instructions = instructions;
	}

	imageLoaded(image, width, height) {
		
		this.width = width;
		this.height = height;

		// (re)init image texture
		if(this.imageTexture) this.imageTexture.destroy();
		this.imageTexture = new Texture(this.gl, width, height);
		if(this.IS_NODE) this.imageTexture.loadFromBytes(image, width, height);
		else this.imageTexture.loadContentsOf(image);

		// (re)set edit group buffer
		if(this.editGroupFramebuffer) this.editGroupFramebuffer.destroy();
		this.editGroupFramebuffer = new Framebuffer(this.gl).use();
		this.editGroupFramebuffer.attachEmptyTexture(width, height);

		// (re)set default starting program
		if(this.defaultProgram) this.defaultProgram.destroy();
		if(this.IS_NODE) this.defaultProgram = new Program('default_node', this.gl, Shaders.default_node.vertex, Shaders.default_node.fragment, Shaders.default_node.update);
		else this.defaultProgram = new Program('default', this.gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);
		
	}

	// this function returns either an existing framebuffer or a new framebuffer
	getTempFramebuffer(index) {
		const { width, height } = this;

		if(!this.framebuffers[index]) {
			this.framebuffers[index] = new Framebuffer(this.gl).use();
			this.framebuffers[index].attachEmptyTexture(width, height);
		}

		return this.framebuffers[index];
	}

	buildPrograms(instructions = this.instructions) {
		this.resetPrograms();
		if(this.debug) console.log('BUILDING PROGRAMS');
		instructions.filter(group => group.steps && group.steps.length > 0).forEach(group => {
			const groupName = group.name;
			if(!(groupName in this.programs)) this.programs[groupName] = [];
			group.steps.forEach(step => {
				this.programs[groupName].push(this.addProgram(step.key));
			});
		});
		if(!this.blendProgram) this.blendProgram = this.addProgram('blend');
	}

	addProgram(label) {
		if(!(label in Shaders)) {
			console.warn('No shader found for:', label);
			return;
		}
		const shader = Shaders[label];
		const program = new Program(label, this.gl, shader.vertex, shader.fragment, shader.update);
		return program;
	}

	resetPrograms() {
		if(this.debug) console.log('RESETTING PROGRAMS');
		Object.keys(this.programs).forEach(groupKey => {
			for(let program of this.programs[groupKey]) {
				program.destroy();
			}
		})
		this.programs = {};
		if(this.blendProgram) {
			this.blendProgram.destroy();
			this.blendProgram = null;
		}
	}

	resetFramebuffers() {
		if(this.debug) console.log('RESETTING FRAMEBUFFERS');
		this.currentFramebufferIndex = -1;
		for(let framebuffer of this.framebuffers) {
			framebuffer.destroy();
		}
		this.framebuffers = [];
	}

	resizeAll(width = this.canvasWidth, height = this.canvasHeight) {
		// if(this.debug) console.log('RESIZING VIEWPORT, PROGRAMS AND FRAMEBUFFERS', width, height);
		this.resizeViewport(width, height);
		this.resizePrograms(width, height);
		this.resizeFramebuffers(width, height);
	}

	resizeViewport(width = this.canvasWidth, height = this.canvasHeight) {
		if(this.debug) console.log('RESIZING VIEWPORT');
		if(this.IS_NODE) this.EXT_resize.resize(width, height);
		this.gl.viewport(0, 0, width, height);
	}

	resizePrograms(width = this.canvasWidth, height = this.canvasHeight) {
		if(this.debug) console.log('RESIZING PROGRAMS');
		if(this.defaultProgram) this.defaultProgram.resize(width, height);
		if(this.blendProgram) this.blendProgram.resize(width, height);
		Object.keys(this.programs).forEach(groupKey => {
			for(let program of this.programs[groupKey]) {
				program.resize(width, height);
			}
		});
	}

	resizeFramebuffers(width = this.canvasWidth, height = this.canvasHeight) {
		if(this.debug) console.log('RESIZING FRAMEBUFFERS');
		for(let i = 0; i < this.framebuffers.length; i ++) {
			this.framebuffers[i].resizeTexture(width, height);
		}
		this.editGroupFramebuffer.resizeTexture(width, height);
	}

	renderInstructions(_instructions = this.instructions || []) {
		if(this.debug) console.log('RENDERING INSTRUCTIONS');

		// inject default shader as first render step of first edit group - settings
		const instructions = [{name: 'preRender', steps: [{key: 'default'}]}, ..._instructions].filter(group => group.steps && group.steps.length > 0);

		let totalStepCount = -1;
		let lastProgram = null;

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
				lastProgram = program;

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
					let target = null;
					if(!(count >= steps.length-1 && groupCount >= instructions.length-1 && iteration >= iterations-1 && !('amount' in group))) {
						this.currentFramebufferIndex = (this.currentFramebufferIndex+1)%2;
						target = this.getTempFramebuffer(this.currentFramebufferIndex).id;
					}

					if(this.debug && !this.IS_NODE) {
						if(count >= steps.length-1 && iteration >= iterations-1) console.log('LAST STEP RENDER TARGET FOR', groupName, target);
						if(count >= steps.length-1 && groupCount >= instructions.length-1 && iteration >= iterations-1) console.log('AND FINAL RENDER TARGET FOR', groupName, target);
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


				// if last edit step of group and next group has an 'amount' value then store current image in seperate framebuffer for later blending
				if(count >= steps.length-1 && groupCount < instructions.length-1 && ('amount' in instructions[groupCount+1])) {
					
					if(this.debug) console.log('STORING IMAGE OF FINAL EDIT STEP FOR', groupName);
					if(this.debug) console.log('NEXT EDIT STEP IS', instructions[groupCount+1].name)
					this.editGroupFramebuffer.use();
					program.draw();
				}


				
				// if last edit step of group and group needs to blend with last group then do that
				if(groupCount > 0 && count >= steps.length-1 && ('amount' in group)) {
					if(this.debug) console.log('APPLY GROUP EDITS OPACITY', group.amount);
					
					const sourceTexture = this.getTempFramebuffer(this.currentFramebufferIndex).texture;

					let blendTarget = null;
					if(groupCount < instructions.length-1) {
						this.currentFramebufferIndex = (this.currentFramebufferIndex+1)%2;
						blendTarget = this.getTempFramebuffer(this.currentFramebufferIndex).id;
					}

					if(this.debug) console.log('BLEND STEP RENDER TARGET', blendTarget);

					this.blendProgram.use();
					this.blendProgram.update({
						key: 'blend', 
						amount: group.amount, 
						blendTexture: this.editGroupFramebuffer.texture,
					});

					this.blendProgram.willRender();
					sourceTexture.use();
					this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, blendTarget);
					this.blendProgram.didRender();
					this.blendProgram.draw();

				}
				
			
				
				


				// console.table(getProgramInfo(this.gl, program.program).uniforms);
			}
		}
	}

}