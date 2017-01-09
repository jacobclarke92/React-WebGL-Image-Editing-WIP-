/**
 * Select Key Utilities
 * @module Utilities/selectKeyUtils
 */

import keycode from 'keycode'

let shiftKeyPressed = false;
let ctrlKeyPressed = false;

/**
 * @return {Boolean}
 */
export const isShiftKeyPressed = () => shiftKeyPressed;

/**
 * @return {Boolean}
 */
export const isCtrlKeyPressed = () => ctrlKeyPressed;

/**
 * Callback to 'keydown' listener sets ctrl/shift down vars
 * @param  {Object} event - native key down event
 */
function handleKeyDown(event) {
	switch (keycode(event)) {
		case 'shift': shiftKeyPressed = true; break;
		case 'ctrl': ctrlKeyPressed = true; break;
		case 'command': ctrlKeyPressed = true; break;
	}
}

/**
 * Callback to 'keyup' listener sets ctrl/shift down vars
 * @param  {Object} event - native key down event
 */
function handleKeyUp(event) {
	switch (keycode(event)) {
		case 'shift': shiftKeyPressed = false; break;
		case 'ctrl': ctrlKeyPressed = false; break;
		case 'command': ctrlKeyPressed = false; break;
	}
}

/**
 * Attaches 'keydown' and 'keyup' event listeners to document
 * @param  {document} [element=document] - which element to attach event listeners to
 */
function init(element = document) {
	element.addEventListener('keydown', handleKeyDown);
	element.addEventListener('keyup', handleKeyUp);
}

init();