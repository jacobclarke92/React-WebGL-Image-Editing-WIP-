import React, { PropTypes, Component } from 'react'

export default class Gradient extends Component {

	static defaultProps = {
		width: 200,
		height: 40,
		markers: [],
	};

	render() {
		const { children, markers, width, height, ...rest } = this.props;
		markers.sort((a,b) => a.position < b.position ? -1 : (a.position > b.position ? 1 : 0));
		const gradientStyle = 'linear-gradient(to right, '+markers.map(marker => 'rgba('+marker.color.join(',')+','+marker.alpha+') '+(marker.position*100)+'%').join(', ')+')';
		return (
			<div ref="gradient" className="gradient" style={{width, height, background: gradientStyle}} {...rest}>
				{children}
			</div>
		)
	}

}