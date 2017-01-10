import React, { PropTypes, Component } from 'react'
import ReactDOM from 'react-dom'
import Tabs, { Panel } from 'react-simpletabs'
import Textarea from 'react-textarea-autosize'
import throttle from 'lodash/throttle'
import RCSlider from 'rc-slider'
import titleize from 'titleize'

import Cropper from './Cropper'
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
import { hslAdjustmentColors } from './editor/utils/colorUtils'
import _find from 'lodash/find'

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
		tipFormatter: value => percentFormatter(value),
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
	{
		label: 'pixelSortHorizontal',
		min: 0,
		max: 255,
		step: 1,
		range: true,
		defaultValue: [255, 255],
		tipFormatter: value => percentFormatter(value/25.5),
	},
	{
		label: 'pixelSortVertical',
		min: 0,
		max: 255,
		step: 1,
		range: true,
		defaultValue: [255, 255],
		tipFormatter: value => percentFormatter(value/25.5),
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

const ratios = {
	'16:9': 16/9,
	'3:2': 3/2,
	'4:3': 4/3,
	'5:4': 5/4,
	'1:1': 1/1,
	'4:5': 4/5,
	'3:4': 3/4,
	'2:3': 2/3,
};

const tonalPropertyLabels = tonalAdjustmentProperties.map(property => property.label);
const enhancementPropertyLabels = enhancementAdjustmentProperties.map(property => property.label);
const curvePropertyLabels = curveAdjustmentProperties.map(property => property.label);

const hslLabels = Object.keys(hslAdjustmentColors);

export default class Editor extends Component {

	static defaultProps = {
		renderThumbnails: true,
		adjustments: {},
	};

	constructor(props) {
		super(props);
		this.urls = ['test1.png', 'test2.jpg', 'test3.jpg', 'test4.jpg', 'test5.jpg', 'test6.jpg', 'test7.jpg', 'test8.jpg', 'test9.jpg'];

		// generate initial slider values
		let adjustments = {};
		tonalAdjustmentProperties.forEach(effect => adjustments[effect.label] = effect.defaultValue);
		enhancementAdjustmentProperties.forEach(effect => adjustments[effect.label] = effect.defaultValue);
		curveAdjustmentProperties.forEach(effect => adjustments[effect.label] = effect.defaultValue);
		adjustments[colorMapAdjustment.label] = colorMapAdjustment.defaultValue;

		// merge default adjustments with any adjustments provided
		adjustments = {...adjustments, ...props.adjustments};

		const instructions = [
			{name: 'utility', steps: []},
			{name: 'adjustments', steps: this.generateEditStepsFromAdjustments(adjustments)},
			{name: 'filter', amount: 1, steps: []},
		];

		// store reset point, make a copy of adjustments object
		this.defaultAdjustments = {...adjustments};
		this.defaultInstructions = [...instructions];
		
		this.state = {
			url: this.urls[Math.floor(Math.random()*this.urls.length)],
			width: 550,
			height: 400,
			canvasWidth: 550,
			canvasHeight: 400,
			adjustments,
			instructions,
			filterName: null,
			cropping: false,
			ratio: null,
			mainWidth: window.innerWidth * 0.6,
		}

		// throttle resize to 30fps
		window.onresize = throttle(this.handleResize.bind(this), 1000/30);
	}

	componentDidMount() {
		this.handleResize();
	}

	handleResize() {
		const box = ReactDOM.findDOMNode(this.refs.mainWindow).getBoundingClientRect();
		this.setState({mainWidth: box.width});
	}

	handleImageResize(width, height) {
		console.log('UPDATING DIMENSIONS', width, height);
		this.setState({width, height, canvasWidth: width, canvasHeight: height});
	}

	// Reset adjustments and filter
	handleReset() {
		this.setState({
			canvasWidth: this.state.width,
			canvasHeight: this.state.height,
			adjustments: {...this.defaultAdjustments},
			instructions: [...this.defaultInstructions],
			filterName: null,
		});
	}

	// Update image url
	setUrl(url) {
		this.setState({url});
	}

	// Update adjustment value
	setValue(key, value) {
		const { adjustments } = this.state;

		// make sure value is number
		if(typeof value == 'string') value = parseFloat(value);

		// update adjustment value
		adjustments[key] = value;

		// generate editSteps for Renderer
		const adjustmentSteps = this.generateEditStepsFromAdjustments(adjustments);

		// update instructions with new steps
		const instructions = this.state.instructions.map(group => group.name == 'adjustments' ? {...group, steps: adjustmentSteps} : group);
		
		this.setState({
			adjustments, 
			instructions,
		});
	}

	// Update filter preset
	setFilter(filterPreset) {

		const filterSteps = this.generateEditStepsFromFilterPreset(filterPreset);
		const instructions = this.state.instructions.map(group => group.name == 'filter' ? {...group, steps: filterSteps} : group);

		this.setState({
			filterName: filterPreset.name,
			instructions,
		});
	}

	updateFilterBlend(amount) {
		const instructions = this.state.instructions.map(group => group.name == 'filter' ? {...group, amount} : group)
		this.setState({instructions});
	}


	// this takes utility step adjustemnt(s) and recreates all the utility steps and updates canvas dimensions
	updateUtilityValue(utilityAdjustments = {}) {

		const oldUtilitySteps = _find(this.state.instructions, {name: 'utility'}).steps || [];
		const utilitySteps = [];

		let rotateStep = _find(oldUtilitySteps, {key: 'rotate'});
		let straightenStep = _find(oldUtilitySteps, {key: 'straighten'});
		let cropStep = _find(oldUtilitySteps, {key: 'crop'});

		let canvasWidth = this.state.width;
		let canvasHeight = this.state.height;

		if('rotate' in utilityAdjustments) {
			const oldRotation = (rotateStep || {}).value || 0;
			const rotation = (oldRotation + 360 + utilityAdjustments.rotate)%360;

			// transform crop values if rotating an already cropped image
			// need to properly check this once crop fragment is done
			if(cropStep && oldRotation - rotation !== 0) {
				const oldCrop = cropStep.value;
				console.log('OLD CROP', oldCrop);
				if(utilityAdjustments.rotate > 0) {
					this.crop = cropStep.value = {
						left: 1 - oldCrop.top - oldCrop.height,
						top: oldCrop.left,
						width: oldCrop.height,
						height: oldCrop.width,
					};
				}else if(utilityAdjustments.rotate < 0) {
					this.crop = cropStep.value = {
						left: oldCrop.top,
						top: 1 - oldCrop.left - oldCrop.width,
						width: oldCrop.height,
						height: oldCrop.width,
					};
				}
				console.log('NEW CROP', cropStep.value);
			}

			if(rotation === 0) {
				rotateStep = null;
			}else{
				rotateStep = {key: 'rotate', value: rotation};
			}
		}

		if(rotateStep) {
			if(rotateStep.value == 90 || rotateStep.value == 270) {
				canvasWidth = this.state.height;
				canvasHeight = this.state.width;
			}else{
				canvasWidth = this.state.width;
				canvasHeight = this.state.height;
			}
			utilitySteps.push(rotateStep);
		}


		if('straighten' in utilityAdjustments) {
			const straighten = utilityAdjustments.straighten;

			if(!straighten) {
				straightenStep = null;
			}else{
				straightenStep = {key: 'straighten', value: straighten};
			}
		}
		if(straightenStep) utilitySteps.push(straightenStep);


		if('crop' in utilityAdjustments) {
			const enabled = utilityAdjustments.enabled || false;
			let crop = utilityAdjustments.crop;

			console.log('CROP ENABLED', enabled);

			// attempt to reuse old crop value e.g. if just switching enabled state
			if(!crop && cropStep) crop = cropStep.crop;

			if(!crop) {
				cropStep = null;
			}else{
				cropStep = {key: 'crop', value: crop, enabled};
			}
		}
		if(cropStep) {
			if(cropStep.enabled) {
				canvasWidth *= cropStep.value.width;
				canvasHeight *= cropStep.value.height;
			}
			utilitySteps.push(cropStep);
		}



		// update instructions with new utility steps
		const instructions = this.state.instructions.map(group => group.name == 'utility' ? {...group, steps: utilitySteps} : group);

		// set new instructions and canvas size
		this.setState({instructions, canvasWidth, canvasHeight});
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

	handleCrop() {
		this.setState({
			cropping: false, 
			cropped: true,
		});
		this.updateUtilityValue({crop: this.crop, enabled: true});
	}

	toggleCrop() {
		const cropping = !this.state.cropping;

		// toggle crop rendering if cropping
		this.updateUtilityValue({crop: this.crop, enabled: !cropping});

		this.setState({cropping});
	}

	render() {
		const { url, width, height, canvasWidth, canvasHeight, adjustments, instructions, filterName, cropping, ratio, mainWidth } = this.state;
		const filterAmount = _find(instructions, {name: 'filter'}).amount;

		const cropperWidth = canvasWidth > mainWidth ? mainWidth : canvasWidth;
		const cropperHeight = canvasWidth > mainWidth ? (canvasHeight/canvasWidth*mainWidth) : canvasHeight;

		return (
			<div className="image-editor">
				<div className="main-window" ref="mainWindow">
					<FileDropzone onFilesReceived={::this.handleReceivedFile}>
						<div className="canvas-wrapper" style={{backgroundImage:'url('+url+')', maxWidth: width}}>
							<Renderer url={url} width={width} height={height} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onResize={::this.handleImageResize} instructions={instructions} autoResize debug />
							{cropping && <Cropper width={cropperWidth} height={cropperHeight} onApply={::this.handleCrop} fixedRatio={ratio} onChange={crop => this.crop = crop} defaultCrop={this.crop} />}
						</div>
					</FileDropzone>
				</div>
				<div className="tray">
					<div className="tray-inner">

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
								<label>Original</label>
							</button>
							{filterPresets.map((filterPreset, i) => (
								<button key={i} onClick={() => this.setFilter(filterPreset)} disabled={filterPreset.name === filterName}>
									{this.props.renderThumbnails ? (
										<Renderer url={url} width={thumbnailWidth} height={thumbnailHeight} canvasWidth={thumbnailWidth} canvasHeight={thumbnailHeight} instructions={[ { name: 'adjustments', steps: this.generateEditStepsFromFilterPreset(filterPreset) } ]} onRender={() => console.log(filterPreset.title, 'rendered!')} />
									) : (
										<img src={url} width={thumbnailWidth} height={thumbnailHeight} />
									)}
									<br />
									<label>{filterPreset.title}</label>
									{filterPreset.name === filterName && <RCSlider value={filterAmount} onChange={value => this.updateFilterBlend(value)} min={0} max={1} step={0.05} />}
								</button>
							))}
						</div>
						<label>
							Upload Preset <br />
							<input className="button" type="file" onChange={event => this.handleReceivedFile(event.nativeEvent.target.files)} />
						</label>
						<Tabs>
							<Panel title="Tonal">
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
									const curveColor = label.indexOf('_') >= 0 ? label.split('_')[1] : '#333c47';
									return (
										<label key={'curve'+i} className="curve-label">
											<div>{titleize(label.replace('_', ' '))}</div>
											<CurveCreator defaultValue={points} size={200} onChange={points => this.setValue(key, {channels, curves: points})} strokeStyle={curveColor} />
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
							<Panel title="HSL">
								<div className="tabs-container">
									<Tabs>
										{['hue', 'saturation', 'luminance'].map((hslTitle, i) => 
											<Panel key={i} title={titleize(hslTitle)}>
												{hslLabels.map((hslColor, c) => 
													<label key={c}>
														<div>{titleize(hslColor)+'s'}</div>
														<div className="rc-custom" style={{color: 'rgb('+hslAdjustmentColors[hslColor].join(',')+')'}}>
															<RCSlider value={this.state[hslTitle+'_'+hslColor] || 0} min={-1} max={1} step={0.01} onChange={value => {
																this.setValue(hslTitle+'Adjustment', {color: hslAdjustmentColors[hslColor], value});
																this.setState({[hslTitle+'_'+hslColor]: value});
															}} />
														</div>
													</label>
												)}
											</Panel>
										)}
									</Tabs>
								</div>
							</Panel>
						</Tabs>
						<div>
							<button onClick={event => this.handleReset()}>Reset</button>
							<button disabled={cropping} onClick={event => this.updateUtilityValue({rotate: -90})}>Rotate Left</button>
							<button disabled={cropping} onClick={event => this.updateUtilityValue({rotate: 90})}>Rotate Right</button>
						</div>
						<div>
							<button onClick={event => this.toggleCrop()}>Crop</button>
							{cropping && Object.keys(ratios).map((ratioLabel, i) => {
								const ratioValue = ratios[ratioLabel];
								return (<button key={i} className={ratio == ratioValue ? 'selected': ''} onClick={event => this.setState({ratio: ratio == ratioValue ? null : ratioValue})}>{ratioLabel}</button>);
							})}
						</div>
						<div className="text-center">
							<div className="input" style={{marginBottom: 30}}>
								{/*<Textarea value={JSON.stringify(instructions, null, 2)} readOnly />*/}
								<label>Terminal command</label>
								<Textarea value={'babel-node backend/index.js input='+(url.indexOf('data:') === 0 ? '[[filepath]]' : url)+' instructions="'+JSON.stringify(instructions).split('"').join('\\"')+'"'} readOnly onClick={event => {event.target.focus(); event.target.select()}} />
								<label>Server command</label>
								<Textarea value={'sudo xvfb-run -s "-ac -screen 0 1x1x24" babel-node ~/imaging/backend/index.js input='+(url.indexOf('data:') === 0 ? '[[filepath]]' : url)+' instructions="'+JSON.stringify(instructions).split('"').join('\\"')+'"'} readOnly onClick={event => {event.target.focus(); event.target.select()}} />
							</div>
							<a className="button" href={'data:text/plain,'+encodeURIComponent(JSON.stringify(instructions, null, '\t'))} download="preset.json">Download preset</a>
						</div>
					</div>
				</div>
			</div>
		)
	}

}