import React, { PropTypes, Component } from 'react'
import classnames from 'classnames'
import { DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

const dropTargetSpec = {
	canDrop: (props, monitor) => monitor.getItemType() === NativeTypes.FILE,
	drop: (props, monitor, component) => component.props.onFilesReceived(monitor.getItem().files),
}

@DropTarget(NativeTypes.FILE, dropTargetSpec, (connect, monitor) => ({
	isOver: monitor.isOver(),
	canDrop: monitor.canDrop(),
	connectDropTarget: connect.dropTarget(),
}))
export default class Dropzone extends Component {
	render() {
		const { children, connectDropTarget, isOver, canDrop } = this.props;
		return connectDropTarget(
			<div className={classnames('dropzone', isOver && 'over', canDrop && 'drop')}>
				{children}
			</div>
		);
	}
}