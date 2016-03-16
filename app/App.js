import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'

import Editor from 'editor/Editor'

export default class App extends Component {

	constructor(props) {
		super(props);
		this.urls = ['test1.jpg', 'test2.jpg', 'test3.jpg', 'test_big.jpg'];
		this.state = {
			url: 'test1.jpg',
			width: 550,
			height: 400,
			hue: 0,
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
		const { url, width, height, hue } = this.state;
		return (
			<div>
				<p>
					{this.urls.map((url, i) => 
						<button key={i} onClick={() => this.setUrl(url)}>Image {i+1}</button>
					)}
					<input type="range" min={0} max={2} step={0.01} defaultValue={0} onInput={event => this.setState({hue: event.target.value})} />
				</p>
				<Editor url={url} width={width} height={height} onResize={this.handleImageResize} hue={hue} />
			</div>
		)
	}

}