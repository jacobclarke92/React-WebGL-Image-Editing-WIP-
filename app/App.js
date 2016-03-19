import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'
import RCSlider from 'rc-slider'

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
		tipFormatter: defaultFormatter,
	},
	{
		label: 'gamma',
		min: 0.2,
		max: 4,
		step: 0.01,
		defaultValue: 1,
		tipFormatter: defaultFormatter,
	},
	{
		label: 'saturation',
		min: -1,
		max: 0.6,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: percentFormatter,
	},
	{
		label: 'vibrance',
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 0,
		tipFormatter: percentFormatter,
	},
	{
		label: 'grain',
		min: 0,
		max: 0.5,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: defaultFormatter,
	},
	{
		label: 'temperature',
		min: 4600,
		max: 8600,
		step: 100,
		defaultValue: 6700,
		tipFormatter: kelvinFormatter,
	},
	// {
	// 	label: 'fade',
	// 	min: 0,
	// 	max: 100,
	// },
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

function percentFormatter(_value){
	return _value + '%';
}

function kelvinFormatter(_value){
	return _value + 'k';
}

function defaultFormatter(_value){
	return _value;
}

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

		const filterAdjustments = {};
		// convert array of objects with keys 'key' & 'value' to associative object e.g. key: value
		filterPreset.steps.map(step => filterAdjustments[step.key] = step.value);

		// generate adjustment steps
		const filterSteps = this.generateEditStepsFromAdjustments(filterAdjustments);

		this.setState({
			filterName: filterPreset.title,
			filterSteps,
			editSteps: [...adjustmentSteps, ...filterSteps],
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
				<div>
					{this.urls.map((url, i) =>
						<button key={i} onClick={() => this.setUrl(url)}>Image {i+1}</button>
					)}
				</div>
				<div>
					<button onClick={() => this.setFilter({title: null, steps: []})} disabled={!filterName}>None</button>
					{filterPresets.map((filterPreset, i) =>
						<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.title === filterName}>{filterPreset.friendlyTitle}</button>
					)}
				</div>
				<div>
					{Object.keys(adjustments).map((key, i) => {
						const { label, ...inputAttrs } = adjustmentProperties.filter(effect => effect.label === key)[0];
						return (
							<label key={i}>
                                <div>{' '+label.toUpperCase()}</div>
								{/*<input type="range" {...inputAttrs} value={adjustments[key]} onChange={event => this.setValue(key, event.target.value)} />
                                <span>{' '+adjustments[key]}</span>
                                */}
								<br />
								<RCSlider {...inputAttrs} value={adjustments[key]} onChange={value => this.setValue(key, value)} />
								<br />
							</label>
						)
					})}
				</div>
				<Editor url={url} width={width} height={height} onResize={this.handleImageResize} editSteps={editSteps} />
			</div>
		)
	}

}