import React, { PropTypes, Component } from 'react'
import autobind from 'autobind-decorator'
import RCSlider from 'rc-slider'
import titleize from 'titleize'
import 'styles/app.css'

import Renderer from 'editor/components/Renderer'
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

		// generate initial slider values
		const adjustments = {};
		adjustmentProperties.map(effect => adjustments[effect.label] = effect.defaultValue);

		// store reset point, make a copy of adjustments object
		this.defaultAdjustments = {...adjustments};
		
		this.state = {
			url: 'test1.jpg',
			width: 550,
			height: 400,
			adjustments: adjustments,
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

	// Reset adjustments and filter
	handleReset() {
		this.setState({
			adjustments: {...this.defaultAdjustments},
			adjustmentSteps: [],
			filterName: null,
			filterSteps: [],
			editSteps: [],
		});
	}

	// Update image url
	setUrl(url) {
		this.setState({url});
	}

	// Update adjustment value
	setValue(key, value) {
		const { adjustments, filterSteps } = this.state;

		// make sure value is number
		if(typeof value == 'string') value = parseFloat(value);

		// update adjustment value
		adjustments[key] = value;

		// generate editSteps for Renderer
		const adjustmentSteps = this.generateEditStepsFromAdjustments(adjustments);
		const editSteps = [...adjustmentSteps, ...filterSteps];
		
		this.setState({adjustments, adjustmentSteps, editSteps});
	}

	// Update filter preset
	setFilter(filterPreset) {
		const { adjustmentSteps } = this.state;

		// convert array of objects with keys 'key' & 'value' to associative object e.g. key: value
		const filterAdjustments = {};
		filterPreset.steps.map(step => filterAdjustments[step.key] = step.value);

		// generate adjustment steps
		const filterSteps = this.generateEditStepsFromAdjustments(filterAdjustments);

		this.setState({
			filterName: filterPreset.name,
			filterSteps,
			editSteps: [...adjustmentSteps, ...filterSteps],
		});
	}

	// Generates specific edit steps for Renderer based on adjustment 'aliases'
	// eg. temperature actually uses colorMatrix, fade uses curves
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
			<div className="image-editor">
				<h1>React WebGL Image Editing</h1>
				<div className="images">
					{this.urls.map((_url, i) =>
						<button key={i} onClick={() => this.setUrl(_url)} disabled={url == _url}>Image {i+1}</button>
					)}
				</div>
				<div className="filters">
					<button onClick={() => this.setFilter({title: null, steps: []})} disabled={!filterName}>None</button>
					{filterPresets.map((filterPreset, i) =>
						<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.name === filterName}>{filterPreset.title}</button>
					)}
				</div>
				<div className="sliders">
					{Object.keys(adjustments).map((key, i) => {
						const { label, ...inputAttrs } = adjustmentProperties.filter(effect => effect.label === key)[0];
						return (
							<label key={i}>
                                <div>{titleize(label)}</div>
								<RCSlider {...inputAttrs} value={adjustments[key]} onChange={value => this.setValue(key, value)} />
							</label>
						)
					})}
				</div>
				<div>
					<button onClick={event => this.handleReset()}>Reset</button>
				</div>
				<Renderer url={url} width={width} height={height} onResize={this.handleImageResize} editSteps={editSteps} />
			</div>
		)
	}

}