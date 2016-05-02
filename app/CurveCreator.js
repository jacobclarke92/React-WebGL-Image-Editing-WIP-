import React, { Component, PropTypes } from 'react'

import { curvesHashTable } from 'editor/utils/colorUtils'

export default class CurveCreator extends Component {
	
	constructor(props) {
		super(props);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.state = {
			points: [],
		};
	}

	componentDidMount() {
		document.addEventListener('mousemove', this.handleMouseMove);
	}

	componentWillUnmount() {
		document.removeEventListener('mousemove', this.handleMouseMove);
	}

	handleMouseDown(event) {

	}

	render() {

		const { points } = this.state;

		return (
			<div className="curve-creator grid-pattern" onMouseDown={::this.handleMouseDown}>
				<canvas ref="curveLine" className="curve-line" />
				{points.map((point, i) => 
					<div className="curve-point" styles={{left: point.x, top: point.y}} />
				)}
			</div>
		)
	}

}