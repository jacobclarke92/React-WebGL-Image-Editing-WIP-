import React, { Component } from 'react'
import RCSlider from 'rc-slider'
import _debounce from 'lodash/debounce'

export default class Slider extends Component {

	static defaultProps = {
		min: 0,
		max: 1,
		step: 0.05,
		value: 0,
		defaultValue: 0,
		debounce: 0,
	};

	constructor(props) {
		super(props);
		this.state = {
			value: props.value || props.defaultValue,
		};

		if(props.debounce) this.onChange = _debounce(this.onChange, props.debounce);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.value != this.props.value) {
			this.setState({value: nextProps.value});
		}
	}

	handleChange(value) {
		this.setState({value});
		this.onChange(value);
	}

	onChange(value) {
		this.props.onChange(value);
	}

	render() {
		const { value } = this.state;
		const { debounce, ...props } = this.props;
		return (
			<RCSlider 
				{...props} 
				value={value}
				onChange={value => this.handleChange(value)} 
				included={props.min < 0} 
				marks={props.defaultValue > props.min ? {[props.defaultValue]: props.defaultValue} : {}} />
		);
	}
}
