export function getElementMousePosition(event, element) {
	const rect = element.getBoundingClientRect();
	if(!event) return {x: 0, y: 0};
	if(!element) return {x: event.clientX, y: event.clientY};
	return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}