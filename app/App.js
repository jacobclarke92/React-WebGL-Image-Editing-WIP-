import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'

import Editor from 'editor/Editor'

const effects = [
	{
		label: 'hue',
		min: 0,
		max: 2,
		step: 0.01,
		defaultValue: 0,
	},
	{
		label: 'saturation',
		min: 0,
		max: 0.9,
		step: 0.01,
		defaultValue: 0,
	},
	{
		label: 'grain',
		min: 0,
		max: 0.8,
		step: 0.01,
		defaultValue: 0,
	},
];

export default class App extends Component {

	constructor(props) {
		super(props);
		this.urls = ['test1.jpg', 'test2.jpg', 'test3.jpg', 'test_big.jpg'];
		const settings = {};
		effects.map(effect => settings[effect.label] = effect.defaultValue);
		this.state = {
			url: 'test1.jpg',
			width: 550,
			height: 400,
			settings,
		}
	}

	@autobind
	handleImageResize(width, height) {
		this.setState({width, height});
	}

	setUrl(url) {
		this.setState({url});
	}

	setValue(key, value) {
		const { settings } = this.state;
		if(typeof value == 'string') value = parseFloat(value);
		settings[key] = value;
		this.setState({settings});
	}

	render() {
		const { url, width, height, settings } = this.state;
		return (
			<div>
				<p>
					{this.urls.map((url, i) => 
						<button key={i} onClick={() => this.setUrl(url)}>Image {i+1}</button>
					)}
				</p>
				<p>
					{Object.keys(settings).map((key, i) => {
						const { label, ...inputAttrs } = effects.filter(effect => effect.label === key)[0];
						return (
							<label key={i}>
								<input type="range" {...inputAttrs} onInput={event => this.setValue(key, event.target.value)} />
								{' '+label.toUpperCase()}
								<br />
							</label>
						)
					})}
				</p>
				<Editor url={url} width={width} height={height} onResize={this.handleImageResize} settings={{...settings}} />
			</div>
		)
	}

}