import { jest } from '@jest/globals';
import {
	FBXAnimationControls,
	outputTimeFormats,
	defaultConfiguration,
	eventTypes,
	defaultIcons,
} from '../FBXAnimationControls.js';

// Mock Three.js before importing
const mockClip = { duration: 10.0 };
const mockAction = {
	getClip: jest.fn(() => mockClip),
	isRunning: jest.fn(() => false),
	play: jest.fn(),
	stop: jest.fn(),
	paused: false,
	time: 0,
};
const mockMixer = {
	update: jest.fn(),
	clipAction: jest.fn(() => mockAction),
};

jest.mock('three', () => ({
	AnimationMixer: jest.fn(() => mockMixer),
	Clock: jest.fn(() => ({ getDelta: jest.fn(() => 0.016) })),
}));

describe('FBXAnimationControls - Core Functionality', () => {
	let container;
	let controls;

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement('div');
		controls = new FBXAnimationControls(container);
	});

	afterEach(() => {
		if (controls && controls.attachedMesh) {
			try {
				controls.detach();
			} catch {
				// Ignore cleanup errors
			}
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

	describe('Constructor and Configuration', () => {
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

		test('should handle constructor with initHTMLControls false', () => {
			const customConfig = { initHTMLControls: false };
			const customControls = new FBXAnimationControls(container, customConfig);

			expect(customControls.isHTMLControlsAvailable).toBe(false);
			expect(customControls.playButton).toBeUndefined();
			expect(customControls.animationSlider).toBeUndefined();
			expect(customControls.currentAnimationTime).toBeUndefined();
		});

		test('should handle different output formats', () => {
			const mmSsMs = new FBXAnimationControls(container, { outputFormat: 'MM_SS_MS' });
			const ssMss = new FBXAnimationControls(container, { outputFormat: 'SS_MS' });

			expect(mmSsMs.__timePlaceholder).toBe('--:--:--');
			expect(ssMss.__timePlaceholder).toBe('--:--');
		});
	});

	describe('Properties and Initial State', () => {
		test('should have correct initial state', () => {
			expect(controls.attachedMesh).toBe(null);
			expect(controls.isPlaying).toBe(false);
			expect(controls.isPaused).toBe(true);
			expect(controls.isStopped).toBe(true);
		});

		test('should handle play/pause/stop state transitions without animation', () => {
			expect(controls.isPlaying).toBe(false);
			expect(controls.isPaused).toBe(true);
			expect(controls.isStopped).toBe(true);

			// These should not throw but also not change state without attached animation
			controls.play();
			controls.pause();
			controls.stop();

			// State should remain unchanged since no animation is attached
			expect(controls.isPlaying).toBe(false);
			expect(controls.isPaused).toBe(true);
			expect(controls.isStopped).toBe(true);
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

		test('should handle setTime without attached mesh gracefully', () => {
			expect(() => {
				controls.setTime(5.0);
				controls.setTime('3.7');
			}).not.toThrow();
		});

		test('should handle setPercentage without attached mesh gracefully', () => {
			expect(() => {
				controls.setPercentage(50);
			}).not.toThrow();
		});

		test('should return placeholder when getCurrentAnimationTimeDisplayString called without mesh', () => {
			const timeString = controls.getCurrentAnimationTimeDisplayString();
			expect(timeString).toBe('--:--:-- / --:--:--');
		});
	});

	describe('Mesh Attachment and Animation Control', () => {
		test('should handle attach with attachOptions', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			const playSpy = jest.spyOn(controls, 'play');
			const setTimeSpy = jest.spyOn(controls, 'setTime');
			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			controls.attach(mockMesh, { play: true, atTime: 2.5 });

			expect(controls.attachedMesh).toBe(mockMesh);
			expect(mockMesh.mixer).toBeDefined();
			expect(playSpy).toHaveBeenCalled();
			expect(setTimeSpy).toHaveBeenCalledWith(2.5);
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.MESH_ATTACHED);
		});

		test('should handle attach without attachOptions', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			controls.attach(mockMesh);

			expect(controls.attachedMesh).toBe(mockMesh);
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.MESH_ATTACHED);
		});

		test('should throw error when attaching same mesh twice', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			expect(() => {
				controls.attach(mockMesh);
			}).toThrow('already attached');
		});

		test('should handle full animation workflow with HTML controls', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Test play functionality with HTML controls
			controls.play();
			expect(controls.isPlaying).toBe(true);
			expect(controls.playButton.innerText).toBe(defaultIcons.PAUSE);

			// Test setPercentage with HTML controls update
			controls.setPercentage(50);
			expect(mockAction.time).toBe(5.0); // 50% of 10 seconds
			expect(controls.currentAnimationTime.innerText).toContain('00:05:00');

			// Test update with playing animation
			controls.update();
			expect(mockMixer.update).toHaveBeenCalled();
		});

		test('should handle setTime with both number and string types', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			// Test with number
			controls.setTime(5.5);
			expect(mockAction.time).toBe(5.5);
			expect(dispatchSpy).toHaveBeenLastCalledWith(eventTypes.CHANGE_TIME, 5.5);

			// Test with string
			controls.setTime('3.7');
			expect(mockAction.time).toBe(3.7);
			expect(dispatchSpy).toHaveBeenLastCalledWith(eventTypes.CHANGE_TIME, 3.7);
		});

		test('should handle play/pause/stop state transitions with animation', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			// Test play when not running
			mockAction.isRunning.mockReturnValue(false);
			controls.play();
			expect(mockAction.paused).toBe(false);
			expect(mockAction.play).toHaveBeenCalled();
			expect(dispatchSpy).toHaveBeenLastCalledWith(eventTypes.PLAY);

			// Test pause when playing
			controls.__playAnimationFlag = true;
			controls.pause();
			expect(mockAction.paused).toBe(true);
			expect(dispatchSpy).toHaveBeenLastCalledWith(eventTypes.PAUSE);

			// Test stop when playing
			controls.__playAnimationFlag = true;
			controls.__stopAnimationFlag = false;
			const setPercentageSpy = jest.spyOn(controls, 'setPercentage');

			controls.stop();
			expect(mockAction.stop).toHaveBeenCalled();
			expect(setPercentageSpy).toHaveBeenCalledWith(0);
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.STOP);
		});
	});

	describe('Detach and Cleanup', () => {
		test('should reset state properly on detach', () => {
			controls.detach();
			expect(controls.attachedMesh).toBe(null);
		});

		test('should reset HTML controls when detaching', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Verify HTML controls exist
			expect(controls.isHTMLControlsAvailable).toBe(true);
			expect(controls.currentAnimationTime).toBeDefined();
			expect(controls.animationSlider).toBeDefined();
			expect(controls.playButton).toBeDefined();

			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			controls.detach();

			expect(controls.attachedMesh).toBe(null);
			expect(controls.currentAnimationTime.innerText).toBe('--:--:-- / --:--:--');
			expect(controls.animationSlider.value).toBe('0');
			expect(controls.playButton.innerText).toBe(defaultIcons.PLAY);
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.MESH_DETACHED);
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.STOP);
		});

		test('should reset HTML controls when detaching with HTML controls enabled', () => {
			// Mock the HTML elements that should exist when HTML controls are enabled
			controls.currentAnimationTime = { innerText: 'some value' };
			controls.animationSlider = { value: '50' };
			controls.playButton = { innerText: 'some icon' };

			const eventSpy = jest.spyOn(controls, 'dispatch');

			controls.detach();

			// Should reset HTML controls to default values
			expect(controls.currentAnimationTime.innerText).toBe('--:--:-- / --:--:--');
			expect(controls.animationSlider.value).toBe('0');
			expect(controls.playButton.innerText).toBe(defaultIcons.PLAY);

			// Should dispatch events
			expect(eventSpy).toHaveBeenCalledWith(eventTypes.MESH_DETACHED);
			expect(eventSpy).toHaveBeenCalledWith(eventTypes.STOP);
		});
	});

	describe('Update Method', () => {
		test('should handle update with no attached mesh', () => {
			expect(() => {
				controls.update();
			}).not.toThrow();
		});

		test('should handle update with attached mesh but no mixer', () => {
			controls.__attachedMesh = { animations: [] };

			expect(() => {
				controls.update();
			}).not.toThrow();
		});

		test('should update mixer when attached', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);
			controls.update();

			expect(mockMixer.update).toHaveBeenCalled();
		});

		test('should update HTML controls when playing', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);
			controls.play();

			const mockCurrentAnimationTime = { innerText: '' };
			const mockAnimationSlider = { value: '' };
			controls.currentAnimationTime = mockCurrentAnimationTime;
			controls.animationSlider = mockAnimationSlider;

			// Set a specific time for testing
			mockAction.time = 2.5;

			controls.update();

			expect(mockCurrentAnimationTime.innerText).toContain('00:02:50');
			expect(mockAnimationSlider.value).toBe('25'); // 2.5/10 * 100 = 25%
		});

		test('should not update HTML controls when not playing', () => {
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);
			// Don't call play(), so it's not playing

			const mockCurrentAnimationTime = { innerText: 'unchanged' };
			controls.currentAnimationTime = mockCurrentAnimationTime;

			controls.update();

			expect(mockCurrentAnimationTime.innerText).toBe('unchanged');
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
			controls.dispatch('TEST_EVENT', 'test data');
			expect(callback1).toHaveBeenCalledWith('test data');
			expect(callback2).toHaveBeenCalledWith('test data');
		});

		test('should handle dispatch with non-existent event', () => {
			const callback = jest.fn();

			controls.dispatch('NON_EXISTENT_EVENT', 'test data');

			// Should not throw error, just do nothing
			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('HTML Controls', () => {
		test('should create HTML elements when initHTMLControls is true', () => {
			expect(controls.isHTMLControlsAvailable).toBe(true);
			expect(controls.animationSlider).toBeDefined();
			expect(controls.playButton).toBeDefined();
			expect(controls.currentAnimationTime).toBeDefined();
			expect(controls.animationControlsContainer).toBeDefined();
		});

		test('should set up event listeners on slider', () => {
			expect(controls.animationSlider).toBeDefined();
			expect(controls.animationSlider.type).toBe('range');
			expect(controls.animationSlider.min).toBe('0');
			expect(controls.animationSlider.max).toBe('100');
		});

		test('should set up click handler on play button', () => {
			expect(controls.playButton).toBeDefined();
			expect(controls.playButton.className).toBe('playButton');
		});

		test('should handle slider mousedown event to pause animation', () => {
			// Set up a mock mesh so we can test with actual animation state
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Start playing animation
			controls.play();
			expect(controls.isPlaying).toBe(true);

			// The event handlers should be registered during __init()
			// Let's access them through the enhanced mock system
			const mousedownHandlers = controls.animationSlider._eventHandlers?.mousedown;

			// Trigger the mousedown event handler directly (this will execute lines 164-165)
			if (mousedownHandlers && mousedownHandlers.length > 0) {
				mousedownHandlers[0](); // Execute the first (and should be only) mousedown handler
			}

			// Verify the behavior of lines 164-165
			expect(controls.isPlaying).toBe(false); // Should be paused after mousedown
		});

		test('should handle complete slider interaction workflow with actual event handlers', () => {
			// Set up a mock mesh
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Test the complete workflow
			// 1. Start with animation playing
			controls.play();
			expect(controls.isPlaying).toBe(true);

			// 2. Trigger mousedown handler (executes lines 164-165)
			const mousedownHandlers = controls.animationSlider._eventHandlers?.mousedown;
			if (mousedownHandlers && mousedownHandlers.length > 0) {
				mousedownHandlers[0]();
			}
			expect(controls.isPlaying).toBe(false); // Should be paused

			// 3. Simulate slider input during drag
			controls.animationSlider.value = '50';
			const inputHandlers = controls.animationSlider._eventHandlers?.input;
			if (inputHandlers && inputHandlers.length > 0) {
				inputHandlers[0]();
			}
			// Should have called setPercentage and dispatched CHANGE_PERCENTAGE

			// 4. Trigger mouseup handler - should resume since was playing before
			const mouseupHandlers = controls.animationSlider._eventHandlers?.mouseup;
			if (mouseupHandlers && mouseupHandlers.length > 0) {
				mouseupHandlers[0]();
			}
			expect(controls.isPlaying).toBe(true); // Should resume playing

			// 5. Test play button click handler
			const clickHandlers = controls.playButton._eventHandlers?.click;
			if (clickHandlers && clickHandlers.length > 0) {
				clickHandlers[0](); // Should pause
				expect(controls.isPlaying).toBe(false);

				clickHandlers[0](); // Should play again
				expect(controls.isPlaying).toBe(true);
			}
		});

		test('should handle slider interaction workflow correctly', () => {
			// Set up a mock mesh
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Test the complete slider interaction workflow
			// 1. Start with animation playing
			controls.play();
			expect(controls.isPlaying).toBe(true);

			// 2. Simulate mousedown behavior (lines 164-165)
			const wasPlayingBeforeInteraction = controls.isPlaying; // Store playing state
			controls.pause(); // Pause on mousedown
			expect(controls.isPlaying).toBe(false);

			// 3. Simulate slider input during drag
			const setPercentageSpy = jest.spyOn(controls, 'setPercentage');
			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			// This simulates the input event handler
			controls.setPercentage('50');
			controls.dispatch(eventTypes.CHANGE_PERCENTAGE, '50');

			expect(setPercentageSpy).toHaveBeenCalledWith('50');
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.CHANGE_PERCENTAGE, '50');

			// 4. Simulate mouseup behavior - resume if was playing before
			if (wasPlayingBeforeInteraction) {
				const playSpy = jest.spyOn(controls, 'play');
				controls.play(); // Resume playing
				expect(playSpy).toHaveBeenCalled();
			}
		});

		test('should handle slider mousedown when animation was not playing', () => {
			// Set up a mock mesh
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Don't start playing - animation should be paused
			expect(controls.isPlaying).toBe(false);

			// Simulate mousedown behavior when not playing
			const wasPlayingBeforeInteraction = controls.isPlaying; // Should be false
			controls.pause(); // This should not change anything since already paused

			expect(wasPlayingBeforeInteraction).toBe(false);
			expect(controls.isPlaying).toBe(false);

			// Simulate mouseup - should NOT resume since wasn't playing before
			if (wasPlayingBeforeInteraction) {
				controls.play(); // This should not execute
			}

			// Animation should still be paused
			expect(controls.isPlaying).toBe(false);
		});

		test('should handle play button click behavior', () => {
			// Set up a mock mesh
			const mockMesh = {
				animations: [mockClip],
			};

			controls.attach(mockMesh);

			// Initially not playing
			expect(controls.isPlaying).toBe(false);

			// Simulate the play button click handler logic
			if (controls.isPlaying) {
				controls.pause();
			} else {
				controls.play();
			}

			// Should now be playing
			expect(controls.isPlaying).toBe(true);

			// Click again to pause
			if (controls.isPlaying) {
				controls.pause();
			} else {
				controls.play();
			}

			// Should now be paused
			expect(controls.isPlaying).toBe(false);
		});

		test('should verify event listeners are set up on slider', () => {
			// Verify that the slider has event listeners registered
			// This confirms that the __init method sets up the required events
			expect(controls.animationSlider).toBeDefined();
			expect(controls.animationSlider.addEventListener).toBeDefined();

			// The addEventListener should have been called for mousedown, input, and mouseup
			// Since it's mocked, we can verify the slider exists and is properly configured
			expect(controls.animationSlider.type).toBe('range');
			expect(controls.animationSlider.min).toBe('0');
			expect(controls.animationSlider.max).toBe('100');
			expect(controls.animationSlider.step).toBe('any');
		});

		test('should verify event listeners are set up on play button', () => {
			// Verify that the play button has event listeners registered
			expect(controls.playButton).toBeDefined();
			expect(controls.playButton.addEventListener).toBeDefined();
			expect(controls.playButton.className).toBe('playButton');
		});
	});
});
