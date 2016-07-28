import React, { PropTypes, Component } from 'react'
import Tabs, { Panel } from 'react-simpletabs'
import Textarea from 'react-textarea-autosize'
import RCSlider from 'rc-slider'
import titleize from 'titleize'

import FileDropzone from './FileDropzone'
import CurveCreator from './CurveCreator'
import GradientCreator from './GradientCreator'
import Gradient from './Gradient'
import Renderer from './Renderer'
import Select from './Select'

import * as Filters from './editor/filters'
import filterPresets from './constants/presets.json'
import gradientPresets from './constants/gradientPresets.js'

import { isArray } from './editor/utils/typeUtils'

const thumbnailWidth = 120;
const thumbnailHeight = 90;

const defaultFormatter = value => value;
const percentFormatter = value => (Math.round(value) + '%');
const decimalPercentFormatter = value => (Math.round(value*100) + '%');

const tonalAdjustmentProperties = [
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
		label: 'fade',
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 0,
		tipFormatter: percentFormatter,
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
		label: 'vibrance',
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 0,
		tipFormatter: percentFormatter,
	},
];

const enhancementAdjustmentProperties = [
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

Filters.curves_red = Filters.curves_green = Filters.curves_blue = Filters.curves;
const curveAdjustmentProperties = [
	{
		label: 'curves',
		channels: 'rgb',
		defaultValue: {channels: 'rgb', curves: [[0,0], [255,255]]},
	},
	{
		label: 'curves_red',
		channels: 'r', 
		defaultValue: {channels: 'r', curves: [[0,0], [255,255]]},
	},
	{
		label: 'curves_green',
		channels: 'g', 
		defaultValue: {channels: 'g', curves: [[0,0], [255,255]]},
	},
	{
		label: 'curves_blue',
		channels: 'b', 
		defaultValue: {channels: 'b', curves: [[0,0], [255,255]]},
	},
];

const colorMapAdjustment = {
	label: 'colorMap',
	defaultValue: [
		// {position: 0, color: [10, 0, 178], alpha: 1},
		// {position: 0.5, color: [255, 0, 0], alpha: 1},
		// {position: 1, color: [255, 252, 0], alpha: 1},
		{position: 0, color: [0,0,0], alpha: 0},
		{position: 1, color: [0,0,0], alpha: 0},
	],
};

const tonalPropertyLabels = tonalAdjustmentProperties.map(property => property.label);
const enhancementPropertyLabels = enhancementAdjustmentProperties.map(property => property.label);
const curvePropertyLabels = curveAdjustmentProperties.map(property => property.label);

export default class Editor extends Component {

	constructor(props) {
		super(props);
		this.urls = ['test1.jpg', 'test2.jpg', 'test3.jpg', 'test4.jpg', 'test5.jpg', 'test6.jpg', 'test7.jpg', 'test8.jpg', 'test9.jpg'];

		// generate initial slider values
		const adjustments = {curves: []};
		tonalAdjustmentProperties.map(effect => adjustments[effect.label] = effect.defaultValue);
		enhancementAdjustmentProperties.map(effect => adjustments[effect.label] = effect.defaultValue);
		curveAdjustmentProperties.map(effect => adjustments[effect.label] = effect.defaultValue);
		adjustments[colorMapAdjustment.label] = colorMapAdjustment.defaultValue;

		// store reset point, make a copy of adjustments object
		this.defaultAdjustments = {...adjustments};
		
		this.state = {
			url: this.urls[Math.floor(Math.random()*this.urls.length)],
			width: 550,
			height: 400,
			adjustments: adjustments,
			adjustmentSteps: [],
			filterSteps: [],
			editSteps: [],
			filterName: null,
			// hueAmount: 0,
			// hueRange: 0.13,
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
			const adjustmentProperties = [
				...tonalAdjustmentProperties, 
				...enhancementAdjustmentProperties, 
				...curveAdjustmentProperties,
				colorMapAdjustment,
			];
			const adjustmentProperty = adjustmentProperties.filter(property => property.label === adjustment)[0];
			if(!adjustmentProperty || (adjustmentProperty && adjustmentValue !== adjustmentProperty.defaultValue)) {
				const realKey = (adjustment.indexOf('_unique') > 0) ? adjustment.split('_unique')[0] : adjustment;
				editSteps.push(Filters[realKey](adjustmentValue));
			}
		});
		return editSteps;
	}

	// formats adjustments from filterPreset and gives to generateEditStepsFromAdjustments
	generateEditStepsFromFilterPreset(filterPreset) {
		const filterAdjustments = {};
		let counter = 0;
		filterPreset.steps.map(step => {
			filterAdjustments[(step.key in filterAdjustments) ? step.key+'_unique'+(++counter) : step.key] = step.value
		});
		return this.generateEditStepsFromAdjustments(filterAdjustments);
	}

	handleReceivedFile(files) {
		console.log('Files received in Editor', files);
		const file = files[0];
		const ext = file.name.substring(file.name.lastIndexOf('.')+1);
		console.log(file, ext);
		const reader = new FileReader();
		reader.onload = (theFile => e => {
			if(ext == 'json') {
				const steps  = JSON.parse(e.target.result).map(step => {
					switch(step.key) {
						case 'curves': step.value = {channels: step.channels, curves: step.curves}; break;
						case 'colorMap': step.value = step.markers; break;
					}
					return step;
				});
				filterPresets.splice(0, 0, {
					name: 'custom'+(new Date().getTime()),
					title: 'Custom',
					steps,
				});
				this.setFilter(filterPresets[0]);
			}else{
				this.setState({url: e.target.result});
			}
		})(file);
		if(ext == 'json') reader.readAsText(file);
		else reader.readAsDataURL(file);
	}

	render() {
		const { url, width, height, adjustments, editSteps, filterName } = this.state;

		return (
			<div className="image-editor">
				<h1>React WebGL Image Editing</h1>
				<div className="images">
					<label>Select an image below or drag your own onto the window</label>
					{this.urls.map((_url, i) => 
						<button key={i} onClick={() => this.setUrl(_url)} disabled={url == _url}>Image {i+1}</button>
					)}
				</div>
				<div className="filters">
					<label>Select a preset (optional)</label>
					<button onClick={() => this.setFilter({title: null, steps: []})} disabled={!filterName}>
						<img src={url} width={thumbnailWidth} height={thumbnailHeight} onMouseDown={e => e.preventDefault()} />
						<br />
						Original
					</button>
					{filterPresets.map((filterPreset, i) => (
						<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.name === filterName}>
							<Renderer url={url} width={thumbnailWidth} height={thumbnailHeight} editSteps={this.generateEditStepsFromFilterPreset(filterPreset)} onRender={() => console.log(filterPreset.title, 'rendered!')} />
							<br />
							{filterPreset.title}
						</button>
					))}
				</div>
				<label>
					Upload Preset <br />
					<input className="button" type="file" onChange={event => this.handleReceivedFile(event.nativeEvent.target.files)} />
				</label>
				<Tabs>
					<Panel title="Tonal Adjustments">
						<div className="sliders">
							{Object.keys(adjustments).filter(key => tonalPropertyLabels.indexOf(key) >= 0).map((key, i) => {
								const { label, ...inputAttrs } = tonalAdjustmentProperties.filter(effect => effect.label === key)[0];
								return (
									<label key={'tonal'+i}>
										<div>{titleize(label)}</div>
										<RCSlider {...inputAttrs} value={adjustments[key]} onChange={value => this.setValue(key, value)} included={inputAttrs.min < 0} marks={inputAttrs.defaultValue > inputAttrs.min ? {[inputAttrs.defaultValue]: inputAttrs.defaultValue} : {}} />
									</label>
								)
							})}
						</div>
					</Panel>
					<Panel title="Curves">
						{Object.keys(adjustments).filter(key => curvePropertyLabels.indexOf(key) >= 0).map((key, i) => {
							const { label, channels } = curveAdjustmentProperties.filter(effect => effect.label === key)[0];
							const points = adjustments[key].curves;
							return (
								<label key={'curve'+i} className="curve-label">
									<div>{titleize(label.replace('_', ' '))}</div>
									<CurveCreator defaultValue={points} size={200} onChange={points => this.setValue(key, {channels, curves: points})} />
								</label>
							)
						})}
					</Panel>
					<Panel title="Enhancements">
						<div className="sliders">
							{Object.keys(adjustments).filter(key => enhancementPropertyLabels.indexOf(key) >= 0).map((key, i) => {
								const { label, ...inputAttrs } = enhancementAdjustmentProperties.filter(effect => effect.label === key)[0];
								return (
									<label key={'enhancement'+i}>
		                                <div>{titleize(label)}</div>
										<RCSlider {...inputAttrs} value={adjustments[key]} onChange={value => this.setValue(key, value)} included={inputAttrs.min < 0} marks={inputAttrs.defaultValue > inputAttrs.min ? {[inputAttrs.defaultValue]: inputAttrs.defaultValue} : {}} />
									</label>
								)
							})}
						</div>
					</Panel>
					<Panel title="Color Map">
						<div className="input">
							<label>Gradient Presets</label>
							<Select 
								items={gradientPresets}
								onChange={value => this.setValue('colorMap', value.markers)}
								Item={props => 
									<div>
										<label>{props.item.title}</label>
										<Gradient markers={props.item.markers} width={200} height={30} />
									</div>
								} />
						</div>
						<GradientCreator value={adjustments['colorMap']} onChange={value => this.setValue('colorMap', value)} />
					</Panel>
					{/*
					<Panel title="HSL Adjustments">
						<Tabs>
							<Panel title="Hue">
								<RCSlider value={this.state.hueAmount} min={-1} max={1} step={0.01} onChange={value => {this.setValue('hueAdjustment', {color: [66, 255, 7], value, range: this.state.hueRange}); this.setState({hueAmount: value})}} />
								<RCSlider value={this.state.hueRange} min={0} max={1} step={0.01} onChange={range => {this.setValue('hueAdjustment', {color: [66, 255, 7], value: this.state.hueAmount, range}); this.setState({hueRange: range})}} />
							</Panel>
							<Panel title="Luminance">
								<div>Hi</div>
							</Panel>
							<Panel title="Saturation">
								<div>Hello</div>
							</Panel>
						</Tabs>
					</Panel>
					*/}
				</Tabs>
				<div>
					<button onClick={event => this.handleReset()}>Reset</button>
				</div>
				<FileDropzone onFilesReceived={::this.handleReceivedFile}>
					<div className="canvas-wrapper" style={{backgroundImage:'url('+url+')', maxWidth: width}}>
						<Renderer url={url} width={width} height={height} onResize={::this.handleImageResize} editSteps={editSteps} autoResize />
					</div>
				</FileDropzone>
				<div className="text-center">
					<div className="input" style={{marginBottom: 30}}>
						<label>Terminal command</label>
						<Textarea value={'babel-node backend/index.js input='+(url.indexOf('data:') === 0 ? '[[filepath]]' : url)+' editSteps="'+JSON.stringify(editSteps).split('"').join('\\"')+'"'} readOnly onClick={event => {event.target.focus(); event.target.select()}} />
						<label>Server command</label>
						<Textarea value={'sudo xvfb-run -s "-ac -screen 0 1x1x24" babel-node ~/imaging/backend/index.js input='+(url.indexOf('data:') === 0 ? '[[filepath]]' : url)+' editSteps="'+JSON.stringify(editSteps).split('"').join('\\"')+'"'} readOnly onClick={event => {event.target.focus(); event.target.select()}} />
					</div>
					<a className="button" href={'data:text/plain,'+encodeURIComponent(JSON.stringify(editSteps, null, '\t'))} download="preset.json">Download preset</a>
				</div>
			</div>
		)
	}

}