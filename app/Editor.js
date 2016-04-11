import React, { PropTypes, Component } from 'react'
import RCSlider from 'rc-slider'
import titleize from 'titleize'

import FileDropzone from 'FileDropzone'

import Renderer from 'editor/components/Renderer'

import * as Filters from 'editor/filters'
import filterPresets from 'editor/constants/presets.json'

import { isArray } from 'editor/utils/typeUtils'

const thumbnailWidth = 160;
const thumbnailHeight = 100;

const defaultFormatter = value => value;
const percentFormatter = value => (Math.round(value) + '%');
const decimalPercentFormatter = value => (Math.round(value*100) + '%');

const adjustmentProperties = [
	{
		label: 'hue',
		min: 0,
		max: 2,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: value => Math.round(value*180) + '°',
	},
	{
		label: 'temperature',
		min: 4600,
		max: 8800,
		step: 50,
		defaultValue: 6700,
		tipFormatter: value => value+'k',
	},
	{
		label: 'exposure',
		min: -50,
		max: 50,
		step: 1,
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
		label: 'contrast',
		min: 0,
		max: 50,
		step: 1,
		defaultValue: 0,
		tipFormatter: defaultFormatter,
	},
	{
		label: 'saturation',
		min: -1,
		max: 0.6,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: decimalPercentFormatter,
	},
	{
		label: 'fade',
		min: 0,
		max: 100,
		step: 1,
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
		label: 'denoise',
		min: 0,
		max: 1,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: decimalPercentFormatter,
	},
	{
		label: 'sharpen',
		min: 0,
		max: 10,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: value => percentFormatter(value*10),
	},
	{
		label: 'blur',
		min: 0,
		max: 20,
		step: 0.2,
		defaultValue: 0,
		tipFormatter: value => percentFormatter(value*5),
	},
	{
		label: 'bloom',
		min: 0,
		max: 1,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: decimalPercentFormatter,
	},
	{
		label: 'grain',
		min: 0,
		max: 0.5,
		step: 0.01,
		defaultValue: 0,
		tipFormatter: value => decimalPercentFormatter(value*2),
	},
];

export default class Editor extends Component {

	constructor(props) {
		super(props);
		this.urls = ['test1.jpg', 'test2.jpg', 'test3.jpg', 'test4.jpg', 'test5.jpg', 'test_big.jpg'];

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
		const filterSteps = this.generateEditStepsFromFilterPreset(filterPreset);

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
			const adjustmentProperty = adjustmentProperties.filter(property => property.label === adjustment)[0];
			if(!adjustmentProperty || (adjustmentProperty && adjustmentValue !== adjustmentProperty.defaultValue)) {
				editSteps.push(Filters[adjustment](adjustmentValue));
			}
		});
		return editSteps;
	}

	// formats adjustments from filterPreset and gives to generateEditStepsFromAdjustments
	generateEditStepsFromFilterPreset(filterPreset) {
		const filterAdjustments = {};
		filterPreset.steps.map(step => filterAdjustments[step.key] = step.value);
		return this.generateEditStepsFromAdjustments(filterAdjustments);
	}

	handleReceivedFile(files) {
		console.log('Files received in Editor', files);
		const file = files[0];
		const reader = new FileReader();
		reader.onload = (theFile => e => {
			this.setState({url: e.target.result});
		})(file);
		reader.readAsDataURL(file);
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
					<button onClick={() => this.setFilter({title: null, steps: []})} disabled={!filterName}>
						<img src={url} width={thumbnailWidth} height={thumbnailHeight} />
						<br />
						Original
					</button>
					{filterPresets.map((filterPreset, i) => (
						<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.name === filterName}>
							<Renderer url={url} width={thumbnailWidth} height={thumbnailHeight} editSteps={this.generateEditStepsFromFilterPreset(filterPreset)} />
							<br />
							{filterPreset.title}
						</button>
					))}
				</div>
				<div className="sliders">
					{Object.keys(adjustments).map((key, i) => {
						const { label, ...inputAttrs } = adjustmentProperties.filter(effect => effect.label === key)[0];
						return (
							<label key={i}>
                                <div>{titleize(label)}</div>
								<RCSlider {...inputAttrs} value={adjustments[key]} onChange={value => this.setValue(key, value)} included={inputAttrs.min < 0} marks={inputAttrs.defaultValue > inputAttrs.min ? {[inputAttrs.defaultValue]: inputAttrs.defaultValue} : {}} />
							</label>
						)
					})}
				</div>
				<div>
					<button onClick={event => this.handleReset()}>Reset</button>
				</div>
				<FileDropzone onFilesReceived={::this.handleReceivedFile}>
					<div className="canvas-wrapper" style={{backgroundImage:'url('+url+')', maxWidth: width}}>
						<Renderer url={url} width={width} height={height} onResize={::this.handleImageResize} editSteps={editSteps} autoResize />
					</div>
				</FileDropzone>
			</div>
		)
	}

}