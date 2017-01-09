import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import throttle from 'lodash/throttle'

import { isShiftKeyPressed } from './utils/selectKeyUtils'

const ApplyButton = props => (
	<button className="button-icon" onClick={props.onApply}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="20" height="18">
			<path d="M908.3,132.5L336.7,704.2l-245-245L10,540.8l326.7,326.7l81.7-81.7L990,214.2L908.3,132.5z"/>
		</svg>
	</button>
);
const defaultCrop = {top: 0, left: 0, width: 1, height: 1};

export default class Cropper extends Component {

	static propTypes = {
		/** Image width */
		width: PropTypes.number,
		/** Image height */
		height: PropTypes.number,
		/** Image ratio, either null for free-crop or a ratio converted to a decimal (e.g. 3:2 = 1.5) */
		fixedRatio: PropTypes.number,
		/** Called on live resize */
		onChange: PropTypes.func,
		/** Only called when apply button is pressed */
		onApply: PropTypes.func,
		/** Object containing number perchanges for: top, left, width, height. Ranges from 0 to 1 */
		defaultCrop: PropTypes.object,
		/** React component for the Apply button */
		ApplyButton: PropTypes.func,
	};

	static defaultProps = {
		width: 640,
		height: 480,
		fixedRatio: null,
		onChange: () => false,
		onApply: () => false,
		defaultCrop,
		ApplyButton,
	};

	constructor(props) {
		super();
		const crop = props.defaultCrop || defaultCrop;
		this.state = {
			dragging: false,
			resizing: false,
			cropL: crop.left,// * props.width,
			cropT: crop.top,// * props.height,
			cropW: crop.width,// * props.width,
			cropH: crop.height,// * props.height,
		}
		this.cropType = null;
		this.offsetTop = this.offsetLeft = this.clientX = this.clientY = this.dragX = this.dragY = this.origCropL = this.origCropT = 0;
		this.origCropW = props.width;
		this.origCropH = props.height;
		this.resizeRatio = 1;
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseMove = throttle(this.handleMouseMove, 1000/60);
		this.handleResize = this.handleResize.bind(this);
		this.handleResize = throttle(::this.handleResize, 200);
	}

	componentDidMount() {

		this.refs.omg.setAttribute('fill-rule', 'evenodd'); // wtf react

		window.addEventListener('mouseup', this.handleMouseUp);
		window.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('resize', this.handleResize);
		this.handleResize();
	}

	componentWillUnmount() {
		window.removeEventListener('mouseup', this.handleMouseUp);	
		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('resize', this.handleResize);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.fixedRatio !== this.props.fixedRatio && nextProps.fixedRatio !== null) {
			this.updateCrop(nextProps, true);
		}
	}

	/**
	 * called on window resize to position correctly against 'BoundingClientRect'
	 */
	handleResize() {
		const offset = ReactDOM.findDOMNode(this.refs.cropper).getBoundingClientRect();
		this.offsetTop = offset.top;
		this.offsetLeft = offset.left;
	}

	/**
	 * called by onMouseDown of any cropping edge/corner
	 * @param  {MouseEvent} event 	passed from onMouseDown of cropping edge/corner
	 * @param  {String} cropType 	type of crop, any of the following: TL, TM, TR, ML, MR, BL, BM, BR
	 */
	cropStart(event, cropType) {
		console.log('start crop');
		event.stopPropagation();

		const { width, height } = this.props;
		const { cropW, cropH, cropL, cropT } = this.state;

		this.cropType = cropType;
		this.resizeRatio = cropW/cropH;
		this.origCropW = cropW * width;
		this.origCropH = cropH * height;
		this.origCropL = cropL * width;
		this.origCropT = cropT * height;

		this.setState({resizing: true});
	}

	/**
	 * called by onMouseDown of the cropping area
	 * @param  {MouseEvent} event 	passed on from onMouseDown of cropping area
	 */
	moveStart(event) {
		console.log('start move');
		const { width, height } = this.props;
		const { cropL, cropT } = this.state;

		this.dragX = this.clientX - this.offsetLeft - cropL*width;
		this.dragY = this.clientY - this.offsetTop - cropT*height;

		console.log(this.dragX, this.dragY);
		this.setState({dragging: true});
	}

	/**
	 * sets dragging and resizing state to false
	 */
	handleMouseUp() {
		this.setState({dragging: false, resizing: false});
	}

	/**
	 * called onMouseMove, updates mouse position vars (is throttled in constructor)
	 * @param  {MouseEvent} event
	 */
	handleMouseMove(event) {

		this.clientX = event.clientX;
		this.clientY = event.clientY;

		this.updateCrop();
	}

	/**
	 * called onClick of Apply button, calls onChange prop with new crop object
	 */
	handleApply() {
		const { width, height } = this.props;
		const { cropL, cropT, cropW, cropH } = this.state;
		this.props.onChange({
			left: cropL,
			top: cropT,
			width: cropW,
			height: cropH,
		});
		this.props.onApply();
	}

	/**
	 * called either from handleMouseMove or from componentWillReceiveProps (if fixed ratio has changed)
	 * @param {Object} props
	 * @param {Number} props.width		image width
	 * @param {Number} props.height		image height
	 * @param {Number} props.fixedRatio fixed ratio, either null or a ratio converted to decimal (e.g 3:2 = 1.5)
	 * @param {Boolean} forceResize 	determines if a resize needs to be forced, typically on fixed ratio change
	 */
	updateCrop(props = this.props, forceResize = false) {

		const { dragging, resizing } = this.state;
		const { width, height, fixedRatio } = props;

		let mouseX = this.clientX - this.offsetLeft;
		let mouseY = this.clientY - this.offsetTop;
		mouseX = mouseX < 0 ? 0 : mouseX > width ? width : mouseX;
		mouseY = mouseY < 0 ? 0 : mouseY > height ? height : mouseY;

		let { cropL, cropT, cropW, cropH } = this.state;

		// we need to crop values to be in pixels instead of percent
		cropL *= width;
		cropW *= width;
		cropT *= height;
		cropH *= height;

		let updating = false;

		if(dragging) {

			// const { cropW, cropH } = this.state;
			cropL = mouseX - this.dragX; 
			cropT = mouseY - this.dragY;
			cropL = cropL < 0 ? 0 : cropL > width - cropW ? width - cropW : cropL;
			cropT = cropT < 0 ? 0 : cropT > height - cropH ? height - cropH : cropT;

			updating = true;

		}else if(resizing || forceResize) {

			// let { cropW, cropH, cropL, cropT } = this.state;
			const cmd = this.cropType || 'TL';

			if(isShiftKeyPressed() || fixedRatio) {
				const ratio = fixedRatio || this.resizeRatio;

				if(cmd[0] !== 'M') {

					let diffX = 0;
					let diffY = 0;

					if(cmd[0] == 'T') {
						diffX = (cropL + cropW) - mouseX;
						diffY = (cropT + cropH) - mouseY;
					}else{
						diffX = mouseX - cropL;
						diffY = mouseY - cropT;
					}

					if(diffX > diffY) {
						cropH = diffX/ratio;
						cropW = diffX;
					}else{
						cropW = diffY*ratio;
						cropH = diffY;
					}


					if(cmd[0] == 'T') {
						cropT = this.origCropT - (cropH - this.origCropH);
						if(mouseY > cropT + cropH) this.cropType = 'B' + cmd[1];
					}else{
						if(mouseY < cropT) this.cropType = 'T' + cmd[1];
					}
					if(cmd[1] == 'L') {
						cropL = this.origCropL - (cropW - this.origCropW);
						if(mouseX > cropL + cropW) this.cropType = cmd[0] + 'R';
					}else{
						if(mouseX < cropL) this.cropType = cmd[0] + 'L';
					}

					if(cropT < 0) cropT = 0;
					if(cropL < 0) cropL = 0;

					if(cropT + cropH > height) {
						cropH = height - cropT;
						cropW = cropH*ratio;
					}
					if(cropL + cropW > width) {
						cropW = width - cropL;
						cropH = cropW/ratio;
					}
				}

			}else{
			
				if(cmd[1] == 'L') {
					cropW = cropW + (cropL - mouseX);
					cropL = mouseX;
				}else if(cmd[1] == 'R') {
					cropW = mouseX - cropL;
				}

				if(cmd[0] == 'T') {
					cropH = cropH + (cropT - mouseY);
					cropT = mouseY;
				}else if(cmd[0] == 'B') {
					cropH = mouseY - cropT;
				}

			}

			// check if cropping is going back on itself and adjust accordingly
			if(cropW < 0) {
				cropL += cropW;
				cropW = Math.abs(cropW);
				this.cropType = cmd[0] + (cmd[1] == 'L' ? 'R' : 'L');
			}
			if(cropH < 0) {
				cropT += cropH;
				cropH = Math.abs(cropH);
				this.cropType = (cmd[0] == 'T' ? 'B' : 'T') + cmd[1];
			}

			updating = true;
		}

		if(!updating) return;

		// convert crop values back to percentages
		cropL /= width;
		cropW /= width;
		cropT /= height;
		cropH /= height;

		this.setState({cropL, cropT, cropW, cropH});

		this.props.onChange({
			left: cropL,
			top: cropT,
			width: cropW,
			height: cropH,
		});
	}

	render() {
		const { width, height, ApplyButton, onApply } = this.props;
		
		let { cropL, cropT, cropW, cropH } = this.state;
		cropL *= width;
		cropW *= width;
		cropT *= height;
		cropH *= height;

		const path = 'M0 0 H ' + width + ' V ' + height + ' H 0 ZM' + cropL + ' ' + cropT + ' H ' + (cropL + cropW) + ' V ' + (cropT + cropH) + ' H ' + cropL + ' V ' + cropH + 'Z';
		const cropStyle = { left: cropL, top: cropT, width: cropW, height: cropH };

		return (
			<div className="cropper" style={{width, height}} ref="cropper">
				<div className="crop-zone" style={cropStyle} onMouseDown={::this.moveStart}>
					<div className="crop-handle TL" onMouseDown={e => this.cropStart(e, 'TL')} />
					<div className="crop-handle TM" onMouseDown={e => this.cropStart(e, 'TM')} />
					<div className="crop-handle TR" onMouseDown={e => this.cropStart(e, 'TR')} />
					<div className="crop-handle ML" onMouseDown={e => this.cropStart(e, 'ML')} />
					<div className="crop-handle MR" onMouseDown={e => this.cropStart(e, 'MR')} />
					<div className="crop-handle BL" onMouseDown={e => this.cropStart(e, 'BL')} />
					<div className="crop-handle BM" onMouseDown={e => this.cropStart(e, 'BM')} />
					<div className="crop-handle BR" onMouseDown={e => this.cropStart(e, 'BR')} />
					<ApplyButton onApply={::this.handleApply} />
				</div>
				<svg width={width} height={height} viewBox={'0 0 '+width+' '+height}>
					<path d={path} fill="rgba(0,0,0,0.5)" ref="omg" />
				</svg>

			</div>
		);
	}

}
