import React, { Component, PropTypes } from 'react'

import { curvesHashTable } from 'editor/utils/colorUtils'

function getElementMousePosition(event, element) {
	const rect = element.getBoundingClientRect();
	if(!event) return {x: 0, y: 0};
	if(!element) return {x: event.clientX, y: event.clientY};
	return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}

export default class CurveCreator extends Component {
	
	constructor(props) {
		super(props);
		this.capturingMouseMove = false;
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.state = {
			points: [],
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

	handleMouseMove(event) {
		if(this.capturingMouseMove) {
			const mousePosition = getElementMousePosition(event, this.refs.curveCreator);
			console.log(mousePosition);
		}
	}

	handleMouseUp(event) {
		this.capturingMouseMove = false;
	}

	handleMouseDown(event, createNew = false) {
		this.capturingMouseMove = true;
		if(createNew) {
			const mousePosition = getElementMousePosition(event, this.refs.curveCreator);
			console.log('Create new point', mousePosition);
		}
	}

	render() {

		const { points } = this.state;

		return (
			<div ref="curveCreator" className="curve-creator grid-pattern" onMouseDown={event => this.handleMouseDown(event, true)}>
				<canvas ref="curveLine" className="curve-line" />
				{points.map((point, i) => 
					<div className="curve-point" styles={{left: point.x, top: point.y}} onMouseDown={::this.handleMouseMove} />
				)}
			</div>
		)
	}

}