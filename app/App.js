import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'

import Editor from 'editor/components/Editor'
import * as Filters from 'editor/filters'
import filterPresets from 'editor/constants/presets.json'

import { isArray } from 'editor/utils/typeUtils'

const adjustmentProperties = [
	{
		label: 'hue',
		min: 0,
		max: 2,
		step: 0.01,
		defaultValue: 0,
	},
	{
		label: 'saturation',
		min: -1,
		max: 0.8,
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

const adjustmentOrder = [
	'temperature',
	'exposure',
	'contrast',
	'curves',
	'fade',
	'vibrance',
	'saturation',
	'sharpen',
	'grain',
];

export default class App extends Component {

	constructor(props) {
		super(props);
		this.urls = ['test1.jpg', 'test2.jpg', 'test3.jpg', 'test4.jpg', 'test_big.jpg'];
		const adjustments = {};
		adjustmentProperties.map(effect => adjustments[effect.label] = effect.defaultValue);
		this.state = {
			url: 'test1.jpg',
			width: 550,
			height: 400,
			adjustments,
			adjustmentSteps: [],
			filterSteps: [],
			editSteps: [],
			filterName: null,
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
		const { adjustments, filterSteps } = this.state;
		if(typeof value == 'string') value = parseFloat(value);
		adjustments[key] = value;
		const adjustmentSteps = this.generateEditStepsFromAdjustments(adjustments);
		const editSteps = [...adjustmentSteps, ...filterSteps];
		this.setState({adjustments, adjustmentSteps, editSteps});
	}

	setFilter(filterPreset) {
		const { adjustmentSteps } = this.state;
		this.setState({
			filterName: filterPreset.title,
			filterSteps: filterPreset.steps,
			editSteps: [...adjustmentSteps, ...filterPreset.steps],
		});
	}

	generateEditStepsFromAdjustments(adjustments = this.state.adjustments) {
		const editSteps = [];
		Object.keys(adjustments).map(adjustment => {
			const adjustmentValue = adjustments[adjustment];
			editSteps.push(Filters[adjustment](adjustmentValue));
		});
		return editSteps;
	}

	render() {
		const { url, width, height, adjustments, editSteps, filterName } = this.state;
		return (
			<div>
				<p>
					{this.urls.map((url, i) => 
						<button key={i} onClick={() => this.setUrl(url)}>Image {i+1}</button>
					)}
				</p>
				<p>
					<button onClick={() => this.setFilter({title: null, steps: []})} disabled={!filterName}>None</button>
					{filterPresets.map((filterPreset, i) => 
						<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.title === filterName}>Filter {i+1}</button>
					)}
				</p>
				<p>
					{Object.keys(adjustments).map((key, i) => {
						const { label, ...inputAttrs } = adjustmentProperties.filter(effect => effect.label === key)[0];
						return (
							<label key={i}>
								<input type="range" {...inputAttrs} onInput={event => this.setValue(key, event.target.value)} />
								{' '+label.toUpperCase()}
								<br />
							</label>
						)
					})}
				</p>
				<Editor url={url} width={width} height={height} onResize={this.handleImageResize} editSteps={editSteps} />
			</div>
		)
	}

}