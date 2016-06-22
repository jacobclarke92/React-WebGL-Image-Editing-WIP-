import React, { PropTypes, Component } from 'react'
import ColorPicker from 'rc-color-picker'
import _throttle from 'lodash/throttle'

import Gradient from './Gradient'

import { clamp } from './editor/utils/mathUtils'
import { rgbToHex, hexToRgb } from './utils/colorUtils'
import { getElementMousePosition } from './utils/domUtils'

let counter = 0;

export default class GradientCreator extends Component {
	
	static defaultProps = {
		size: 400,
		outputSize: 255,
		throttle: 1000/50,
	};

	constructor(props) {
		super(props);
		this.capturingMouseMove = false;
		this.hideCurrentMarker = false;
		this.currentMarkerId = null;
		this.handleCallback = _throttle(this.handleCallback, props.throttle);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);

		const defaultValue = props.defaultValue
		? props.defaultValue.map(marker => ({id: ++counter, ...marker})) 
		: [
			{id: ++counter, position: 0, color: [10, 0, 178], alpha: 1},
			{id: ++counter, position: 0.5, color: [255, 0, 0], alpha: 1},
			{id: ++counter, position: 1, color: [255, 252, 0], alpha: 1},
		];
		this.state = {
			markers: props.value || defaultValue,
		};
	}

	componentDidMount() {
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('mouseup', this.handleMouseUp);
	}

	componentWillUnmount() {
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mouseup', this.handleMouseUp);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({markers: nextProps.value});
	}

	handleCallback(markers) {
		this.props.onChange(markers);
	}

	handleMouseUp(event) {
		this.capturingMouseMove = false;
		if(this.hideCurrentMarker) {
			const markers = this.state.markers.filter(marker => marker.id !== this.currentMarkerId);
			this.setState({markers});
		}
	}

	handleMouseMove(event) {
		if(this.capturingMouseMove) {
			const mousePosition = getElementMousePosition(event, this.refs.gradientCreator.refs.gradient);

			// clamp point position inside grid
			mousePosition.x = clamp(mousePosition.x, 0, this.props.size);

			this.hideCurrentMarker = Math.abs(mousePosition.y) > 150;
			
			const markers = this.state.markers.map(marker => {
				if(marker.id == this.currentMarkerId) marker.position = mousePosition.x/this.props.size;
				return marker;
			});
			this.setState({markers}, () => {
				this.handleCallback(markers);
			});
		}
	}

	handleNewMouseDown(event) {
		this.capturingMouseMove = true;
		const mousePosition = getElementMousePosition(event, this.refs.gradientCreator.refs.gradient);
		
		const { markers } = this.state;
		markers.push({id: ++counter, position: mousePosition.x/this.props.size, color: [255,255,255], alpha: 1});
		this.currentMarkerId = counter;
		
		// persist event and send it to mousemove handler to place point
		event.persist();
		this.handleMouseMove(event);
	}

	handleMarkerMouseDown(event, id) {
		this.capturingMouseMove = true;
		this.currentMarkerId = id;
		event.stopPropagation();
	}

	handleMarkerDelete(id) {
		const markers = this.state.markers.filter(marker => marker.id !== id);
		this.setState({markers});
	}

	updateColor(id, color, alpha = 100) {
		console.log(alpha);
		const markers = this.state.markers.map(marker => {
			if(marker.id === id) {
				marker.color = color;
				marker.alpha = alpha/100;
			}
			return marker;
		});
		this.setState({markers});
	}

	render() {
		const { size } = this.props;
		const markers = this.state.markers.filter(marker => (!this.hideCurrentMarker || marker.id !== this.currentMarkerId));
		markers.sort((a,b) => a.position < b.position ? -1 : (a.position > b.position ? 1 : 0));
		
		return (
			<Gradient ref="gradientCreator" width={size} markers={markers} onMouseDown={::this.handleNewMouseDown}>
				{markers.map((marker, i) =>
					<div key={i} 
						className="gradient-marker" 
						style={{left: marker.position*size, backgroundColor: 'rgb('+marker.color.join(',')+')'}} 
						onClick={() => {}}
						onDoubleClick={event => this.handleMarkerDelete(marker.id)}
						onMouseDown={event => this.handleMarkerMouseDown(event, marker.id)}>
						<ColorPicker 
							placement="bottomLeft" 
							defaultColor="#FFFFFF"
							alpha={marker.alpha*100}
							color={rgbToHex(marker.color)} 
							onChange={value => this.updateColor(marker.id, hexToRgb(value.color), value.alpha)}>
							<span className="marker-trigger" />
						</ColorPicker>
					</div>
				)}
			</Gradient>
		)
	}
}