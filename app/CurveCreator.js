import React, { Component, PropTypes } from 'react'
import _throttle from 'lodash/throttle'

import { clamp } from 'editor/utils/mathUtils'
import { curvesHashTable } from 'editor/utils/colorUtils'

let counter = 0;

function getElementMousePosition(event, element) {
	const rect = element.getBoundingClientRect();
	if(!event) return {x: 0, y: 0};
	if(!element) return {x: event.clientX, y: event.clientY};
	return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}

export default class CurveCreator extends Component {

	static propTypes = {
		size: PropTypes.number,
		outputSize: PropTypes.number,
		lineWidth: PropTypes.number,
		throttle: PropTypes.number,
		strokeStyle: PropTypes.string,
		onChange: PropTypes.func,
	};

	static defaultProps = {
		size: 400,
		outputSize: 255,
		lineWidth: 4,
		throttle: 1000/50,
		strokeStyle: '#333c47',
		onChange: () => console.log('[CurveCreator] no onChange prop'),
	};
	
	constructor(props) {
		super(props);
		this.ctx = null;
		this.currentPointId = null;
		this.capturingMouseMove = false;
		this.handleCallback = _throttle(this.handleCallback, props.throttle);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		const defaultValue = props.defaultValue ? props.defaultValue.map(point => ({
			id: ++counter,
			x: point[0]/props.outputSize*props.size,
			y: (props.outputSize-point[1])/props.outputSize*props.size,
		})) : [
			{id: ++counter, x: 0, y: props.size},
			{id: ++counter, x: props.size, y: 0},
		];
		this.state = {
			points: defaultValue,
		};
	}

	componentDidMount() {
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('mouseup', this.handleMouseUp);
		this.handleCurveDraw(this.state.points);
	}

	componentWillUnmount() {
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mouseup', this.handleMouseUp);
	}

	handleMouseUp(event) {
		this.capturingMouseMove = false;
	}

	handleMouseMove(event) {
		if(this.capturingMouseMove) {
			const mousePosition = getElementMousePosition(event, this.refs.curveCreator);

			// clamp point position inside grid
			mousePosition.x = clamp(mousePosition.x, 0, this.props.size);
			mousePosition.y = clamp(mousePosition.y, 0, this.props.size);
			
			const points = this.state.points.map(point => {
				if(point.id == this.currentPointId) point = {...point, ...mousePosition};
				return point;
			});
			this.setState({points}, () => {
				this.handleCallback(points.map(point => [point.x, point.y]));
			});
		}
	}

	handleNewMouseDown(event) {
		this.capturingMouseMove = true;
		const mousePosition = getElementMousePosition(event, this.refs.curveCreator);
		const { points } = this.state;
		points.push({id: ++counter, ...mousePosition});
		this.currentPointId = counter;
		console.log('Created new point', mousePosition);

		// persist event and send it to mousemove handler to place point
		event.persist();
		this.handleMouseMove(event);
	}

	handlePointMouseDown(event, id) {
		this.capturingMouseMove = true;
		this.currentPointId = id;
		event.stopPropagation();
	}

	handleCallback(points) {
		const { size, outputSize } = this.props;
		const newPoints = points.map(point => [point[0]/size*outputSize, (size - point[1])/size*outputSize]);
		this.props.onChange(newPoints);
	}

	handleCurveDraw(_points) {
		const { size, strokeStyle, lineWidth } = this.props;
		const points = _points.map(point => [point.x, point.y]);
		const hashTable = curvesHashTable(points, 0, size);

		if(!this.ctx) this.ctx = this.refs.curveLine.getContext("2d");
		this.ctx.clearRect(0, 0, size, size);
		this.ctx.beginPath();
		this.ctx.strokeStyle = strokeStyle;
		this.ctx.lineWidth = lineWidth;
		for(let i = 0; i < size; i ++) {
			if(i === 0) this.ctx.moveTo(i, hashTable[i]);
			else this.ctx.lineTo(i, hashTable[i]);
		}
		this.ctx.stroke();
	}

	componentWillUpdate(nextProps, nextState) {
		this.handleCurveDraw(nextState.points);
	}

	render() {

		const { size, outputSize } = this.props;
		const { points } = this.state;

		return (
			<div 
				ref="curveCreator" 
				style={{width: size, height: size}}
				className="curve-creator grid-pattern" 
				onMouseDown={::this.handleNewMouseDown}>

				<canvas ref="curveLine" className="curve-line" width={size} height={size} />
				{points.map((point, i) => 
					<div key={i} 
						className="curve-point"
						style={{left: point.x, top: point.y}} 
						onMouseDown={event => this.handlePointMouseDown(event, point.id)}
						data-label={Math.round(point.x/size * outputSize) + ', ' + Math.round((size-point.y)/size * outputSize)} />
				)}
			</div>
		)
	}

}