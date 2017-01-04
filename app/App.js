import React, { PropTypes, Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import '../node_modules/rc-slider/assets/index.css'
import '../node_modules/rc-color-picker/assets/index.css'
import './styles/app.css'
import './styles/curvecreator.css'
import './styles/gradientcreator.css'
import './styles/simpletabs.css'

import Editor from './Editor'

@DragDropContext(HTML5Backend)
export default class App extends Component {
	render() {
		return (
			<Editor />
		)
	}
}