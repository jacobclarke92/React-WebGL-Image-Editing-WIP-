import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'

import Editor from 'editor/Editor'

export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			url: 'test.jpg',
			width: 550,
			height: 400,
		}
	}

	@autobind
	handleImageResize(width, height) {
		this.setState({width, height});
	}

	render() {
		const { url, width, height } = this.state;
		return (
			<Editor url={url} width={width} height={height} onResize={this.handleImageResize} />
		)
	}

}