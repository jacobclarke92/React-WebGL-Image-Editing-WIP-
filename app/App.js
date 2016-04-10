import React, { PropTypes, Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import 'styles/app.css'
import 'styles/rcslider.css'

import Editor from 'Editor'

@DragDropContext(HTML5Backend)
export default class App extends Component {
	render() {
		return (
			<Editor />
		)
	}
}