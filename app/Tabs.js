import React, { Component } from 'react'
import className from 'classnames'

export default class Tabs extends Component {

	static defaultProps = {
		activePanel: 1,
	};

	constructor(props) {
		super(props);
		this.state = {
			activePanel: props.activePanel,
		}
	}

	handleTabSelect(activePanel) {
		this.setState({activePanel});
	}

	getMenuItems() {
		if (!this.props.children) return null;
		let children = !Array.isArray(this.props.children) ? [this.props.children] : this.props.children;
		children = children.map(child => typeof child === 'function' ? child() : child).filter(child => child);

		return (
			<nav className="tabs-navigation">
				<ul className="tabs-menu">
					{children.map((child, i) => 
						<li ref={'tab-menu-'+i} key={i} className={className('tabs-menu-item', (this.state.activePanel == i+1) && 'is-active')}>
							<a onClick={() => this.handleTabSelect(i+1)}>
								{child.props.title}
							</a>
						</li>
					)}
				</ul>
			</nav>
		);
	}

	getActivePanel () {
		const index = this.state.activePanel - 1;
		const child = this.props.children[index];

		return (
			<article ref="tab-panel" className="tab-panel">
				{child}
			</article>
		);
	}

	render() {
		return (
			<div className="tabs">
				{this.getMenuItems()}
				{this.getActivePanel()}
			</div>
		);
	}

}

export class Panel extends Component {

	static defaultProps = {
		title: 'Panel',
		children: null,
	};

	render() {
		return (
			<div>{this.props.children}</div>
		);
	}
}