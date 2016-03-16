import React, { PropTypes, Component } from 'react'

import Shaders from 'editor/shaders'

import Program from 'editor/Program'
import Texture from 'editor/Texture'
import Framebuffer from 'editor/Framebuffer'

export default class Editor extends Component {

	static defaultProps = {
		url: 'test.jpg',
		width: 400,
		height: 400,
		onResize: () => {},
	}

	constructor(props) {
		super();
		this.state = {...props};
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

	loadImage(url) {
		console.log('loading image', url);
		this.image.src = url;
	}

	handleImageLoad(image) {
		console.log('image loaded');

		this.imageTexture = new Texture(this.gl, image.width, image.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
		this.imageTexture.loadContentsOf(image);

		const defaultProgram = new Program(this.gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.render);
		defaultProgram.texture = this.imageTexture.id;

		this.setState({width: image.width, height: image.height}, () => {

			this.resizeViewport();
			defaultProgram.resize(image.width, image.height);

			defaultProgram.render();	

		})	
	}

	resizeViewport() {
		console.log('resizing viewport');
		const { width, height } = this.state;

		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);

		this.props.onResize(width, height);
	}

	render() {
		const { width, height } = this.state;
		return (
			<div>
				<canvas ref="editor" width={width} height={height} />
				<p>Heyo</p>
			</div>
		)
	}

}