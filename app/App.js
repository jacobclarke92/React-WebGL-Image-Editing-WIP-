import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'

import Editor from 'editor/Editor'

export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			url: 'test1.jpg',
			width: 550,
			height: 400,
		}
	}

	@autobind
	handleImageResize(width, height) {
		this.setState({width, height});
	}

	setUrl(url) {
		this.setState({url});
	}

	render() {
		const { url, width, height } = this.state;
		return (
			<div>
				<Editor url={url} width={width} height={height} onResize={this.handleImageResize} />
				<div>
					<button onClick={() => this.setUrl('test1.jpg')}>Image 1</button>
					<button onClick={() => this.setUrl('test2.jpg')}>Image 2</button>
				</div>
			</div>
		)
	}

}