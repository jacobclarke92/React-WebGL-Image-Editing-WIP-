import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _find from 'lodash/find'

import Renderer from './Renderer'

const preset1 = [
	{
		"name": "utility",
		"steps": [
			{
				"key": "rotate",
				"value": 90
			}
		]
	},
	{
		"name": "adjustments",
		"steps": []
	},
	{
		"name": "filter",
		"amount": 1,
		"steps": []
	}
];

class App extends Component {

	static defaultProps = {
		url: 'test3.jpg',
		instructions: preset1,
	};

	constructor(props) {
		super(props);
		this.state = {
			width: 550,
			height: 400,
			canvasWidth: 550,
			canvasHeight: 400,
		}
	}

	handleResize(width, height) {
		console.log('NEW IMAGE DIMENSIONS', width, height);

		const { instructions } = this.props;
		let canvasWidth = width;
		let canvasHeight = height;

		const utilitySteps = _find(instructions, {name: 'utility'}).steps || [];
		const rotateStep = _find(utilitySteps, {key: 'rotate'});
		const cropStep = _find(utilitySteps, {key: 'crop'});
		
		if(rotateStep && (rotateStep.value == 90 || rotateStep.value == 270)) {
			canvasWidth = height;
			canvasHeight = width;
		}

		if(cropStep && cropStep.value) {
			canvasWidth = Math.floor(canvasWidth * cropStep.value.width);
			canvasHeight = Math.floor(canvasHeight * cropStep.value.height);
		}

		console.log('ACTUAL IMAGE DIMENSIONS', canvasWidth, canvasHeight);

		this.setState({width, height, canvasWidth, canvasHeight});
	}

	render() {
		const { url, instructions } = this.props;
		const { width, height, canvasWidth, canvasHeight } = this.state;
		return (
			<div style={{zoom: 0.5}}>
				<Renderer url={url} instructions={instructions} width={width} height={height} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onResize={::this.handleResize} autoResize debug  />
			</div>
		)
	}

}

ReactDOM.render(<App /> , document.getElementById('app'));