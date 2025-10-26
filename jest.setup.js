// Jest setup file for ES modules and Three.js testing
import { jest } from '@jest/globals';

// Mock Three.js objects since they're complex to set up in test environment
const mockAnimationMixer = {
	update: jest.fn(),
	clipAction: jest.fn(() => ({
		play: jest.fn(),
		stop: jest.fn(),
		getClip: jest.fn(() => ({ duration: 10 })),
		isRunning: jest.fn(() => false),
		time: 0,
		paused: false,
	})),
};

const mockClock = {
	getDelta: jest.fn(() => 0.016),
};

// Mock Three.js module
jest.unstable_mockModule('three', () => ({
	AnimationMixer: jest.fn(() => mockAnimationMixer),
	Clock: jest.fn(() => mockClock),
}));

// Enhanced DOM setup for better testing
if (typeof document !== 'undefined') {
	const originalCreateElement = document.createElement.bind(document);

	document.createElement = function (tag) {
		const element = originalCreateElement(tag);

		// Store event handlers for testing
		element._eventHandlers = {};

		// Enhanced addEventListener that stores handlers
		element.addEventListener = jest.fn((eventType, handler, options) => {
			if (!element._eventHandlers[eventType]) {
				element._eventHandlers[eventType] = [];
			}
			element._eventHandlers[eventType].push(handler);
		});

		// Add dispatchEvent for testing
		element.dispatchEvent = jest.fn((event) => {
			const handlers = element._eventHandlers[event.type];
			if (handlers) {
				handlers.forEach(handler => handler(event));
			}
		});

		if (!element.appendChild) {
			element.appendChild = jest.fn();
		}
		if (!element.removeChild) {
			element.removeChild = jest.fn();
		}

		// Add common properties that might be accessed
		element.innerText = element.innerText || '';
		element.className = element.className || '';
		element.value = element.value || '';

		return element;
	};
}
