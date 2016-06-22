import React, { PropTypes, Component } from 'react'
import cloneDeep from 'lodash/cloneDeep'

export default class Editor extends Component {

	static defaultProps = {
		items: [],
		placeholder: 'Select...',
		Item: props => (<span>{item.key}</span>),
		value: null,
		onChange: value => {},
	};

	constructor(props) {
		super(props);
		this.expanding = false;
		this.state = { expanded: false, value: null };
		this.handleMouseUp = this.handleMouseUp.bind(this);
	}

	componentDidMount() {
		document.addEventListener('mouseup', this.handleMouseUp);
	}

	componentWillUnmount() {
		document.removeEventListener('mouseup', this.handleMouseUp);
	}

	handleMouseUp() {
		if(!this.expanding) this.setState({expanded: false});
	}

	handleExpand(event) {
		this.expanding = false;
		this.setState({expanded: true});
		event.stopPropagation();
	}

	handleSelect(value) {
		this.expanding = false;
		this.setState({value, expanded: false});
		this.props.onChange(cloneDeep(value));
	}

	render() {
		const { expanded, value } = this.state;
		const { items, Item, placeholder } = this.props;
		return (
			<div className="select-wrapper">
				<div className="select" onMouseDown={() => this.expanding = true} onClick={::this.handleExpand}>
					{value ? <Item item={value} /> : placeholder}
				</div>
				{expanded && 
					<div className="options">
						{items.map((item, i) =>
							<div key={i} className="option" onMouseDown={() => this.expanding = true} onClick={() => this.handleSelect(item)}>
								<Item item={item} />
							</div>
						)}
					</div>
				}
			</div>
		)
	}

}