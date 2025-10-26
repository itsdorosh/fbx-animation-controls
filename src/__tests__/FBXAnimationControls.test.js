import { jest } from '@jest/globals';
import { FBXAnimationControls, outputTimeFormats, defaultConfiguration, eventTypes } from '../FBXAnimationControls.js';

describe('FBXAnimationControls', () => {
	let container;
	let controls;

	beforeEach(() => {
		// Create a mock DOM element
		container = document.createElement('div');
		controls = new FBXAnimationControls(container);
	});

	afterEach(() => {
		if (controls) {
			controls.detach();
		}
	});

	describe('Module Exports', () => {
		test('should export outputTimeFormats', () => {
			expect(outputTimeFormats).toBeDefined();
			expect(outputTimeFormats.MM_SS_MS).toBe('MM_SS_MS');
			expect(outputTimeFormats.SS_MS).toBe('SS_MS');
		});

		test('should export defaultConfiguration', () => {
			expect(defaultConfiguration).toBeDefined();
			expect(defaultConfiguration.outputFormat).toBe(outputTimeFormats.MM_SS_MS);
			expect(defaultConfiguration.initHTMLControls).toBe(true);
		});

		test('should export eventTypes', () => {
			expect(eventTypes).toBeDefined();
			expect(eventTypes.PLAY).toBe('PLAY');
			expect(eventTypes.PAUSE).toBe('PAUSE');
			expect(eventTypes.STOP).toBe('STOP');
		});
	});

	describe('Constructor', () => {
		test('should create instance with default configuration', () => {
			expect(controls).toBeInstanceOf(FBXAnimationControls);
			expect(controls.isHTMLControlsAvailable).toBe(true);
		});

		test('should create instance with custom configuration', () => {
			const customConfig = {
				outputFormat: outputTimeFormats.SS_MS,
				initHTMLControls: false,
			};
			const customControls = new FBXAnimationControls(container, customConfig);
			expect(customControls.isHTMLControlsAvailable).toBe(false);
		});
	});

	describe('Properties', () => {
		test('should have correct initial state', () => {
			expect(controls.attachedMesh).toBe(null);
			expect(controls.isPlaying).toBe(false);
			expect(controls.isPaused).toBe(true);
			expect(controls.isStopped).toBe(true);
		});
	});

	describe('Static Methods', () => {
		test('getAnimationTimeDisplayString should format time correctly for MM_SS_MS', () => {
			const timeString = FBXAnimationControls.getAnimationTimeDisplayString(65.5, outputTimeFormats.MM_SS_MS);
			expect(timeString).toMatch(/\d{2}:\d{2}:\d{2}/);
		});

		test('getAnimationTimeDisplayString should format time correctly for SS_MS', () => {
			const timeString = FBXAnimationControls.getAnimationTimeDisplayString(65.5, outputTimeFormats.SS_MS);
			expect(timeString).toMatch(/\d{2}:\d{2}/);
		});

		test('getAnimationTimeDisplayString should throw error for invalid input', () => {
			expect(() => {
				FBXAnimationControls.getAnimationTimeDisplayString(undefined, outputTimeFormats.MM_SS_MS);
			}).toThrow("property 'time' can't be undefined or NaN");

			expect(() => {
				FBXAnimationControls.getAnimationTimeDisplayString(NaN, outputTimeFormats.MM_SS_MS);
			}).toThrow("property 'time' can't be undefined or NaN");
		});
	});

	describe('Event System', () => {
		test('should register and call event callbacks', () => {
			const callback = jest.fn();
			controls.on('TEST_EVENT', callback);
			controls.dispatch('TEST_EVENT', 'test data');
			expect(callback).toHaveBeenCalledWith('test data');
		});

		test('should handle multiple callbacks for same event', () => {
			const callback1 = jest.fn();
			const callback2 = jest.fn();
			controls.on('TEST_EVENT', callback1);
			controls.on('TEST_EVENT', callback2);
			controls.dispatch('TEST_EVENT');
			expect(callback1).toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});
	});

	describe('Animation Control Methods', () => {
		test('should handle play/pause/stop without attached mesh', () => {
			expect(() => {
				controls.play();
				controls.pause();
				controls.stop();
			}).not.toThrow();
		});

		test('should return placeholder time when no animation', () => {
			const timeString = controls.getCurrentAnimationTimeDisplayString();
			expect(timeString).toContain('--');
		});

		test('should handle setTime without attached mesh', () => {
			expect(() => {
				controls.setTime(5.0);
			}).not.toThrow();
		});

		test('should handle setPercentage without attached mesh', () => {
			expect(() => {
				controls.setPercentage(50);
			}).not.toThrow();
		});
	});

	describe('Detach Method', () => {
		test('should reset state properly on detach', () => {
			controls.detach();
			expect(controls.attachedMesh).toBe(null);
		});
	});
});
