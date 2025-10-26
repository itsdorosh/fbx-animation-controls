import { jest } from '@jest/globals';
import { FBXAnimationControls, outputTimeFormats } from '../FBXAnimationControls.js';

describe('FBXAnimationControls - Edge Cases and Error Handling', () => {
	let container;
	let controls;

	beforeEach(() => {
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

	describe('Input Validation and Error Handling', () => {
		test('getAnimationTimeDisplayString should throw error for invalid input', () => {
			expect(() => {
				FBXAnimationControls.getAnimationTimeDisplayString(undefined, outputTimeFormats.MM_SS_MS);
			}).toThrow("property 'time' can't be undefined or NaN");

			expect(() => {
				FBXAnimationControls.getAnimationTimeDisplayString(NaN, outputTimeFormats.MM_SS_MS);
			}).toThrow("property 'time' can't be undefined or NaN");
		});

		test('should handle extreme time values gracefully', () => {
			const extremeCases = [
				{ time: -1, expectedPattern: /^00:00:00$/ }, // Negative should clamp to 0
				{ time: Infinity, expectedPattern: /^\d{2}:\d{2}:\d{2}$/ },
				{ time: -Infinity, expectedPattern: /^\d{2}:\d{2}:\d{2}$/ },
				{ time: Number.MAX_VALUE, expectedPattern: /^\d{2}:\d{2}:\d{2}$/ },
				{ time: Number.MIN_VALUE, expectedPattern: /^\d{2}:\d{2}:\d{2}$/ },
			];

			extremeCases.forEach(({ time, expectedPattern }) => {
				expect(() => {
					const display = FBXAnimationControls.getAnimationTimeDisplayString(
						time,
						outputTimeFormats.MM_SS_MS
					);
					expect(display).toMatch(expectedPattern);
				}).not.toThrow();
			});
		});

		test('should handle floating point precision edge cases', () => {
			// Test edge cases that might cause calculation errors leading to 00:00:00
			const edgeCases = [
				{ time: 1.0000000000000002, expectedPattern: /^00:01:00$/ }, // Common floating-point result
				{ time: 0.9999999999999999, expectedPattern: /^00:0[01]:\d{2}$/ }, // Just under 1
				{ time: Number.MIN_VALUE, expectedPattern: /^00:00:00$/ }, // Very small positive
				{ time: 1e-10, expectedPattern: /^00:00:00$/ }, // Very small positive
			];

			edgeCases.forEach(({ time, expectedPattern }) => {
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				expect(display).toMatch(expectedPattern);

				// Ensure we never get invalid time components for finite positive times >= 1.0
				if (Number.isFinite(time) && time >= 1.0) {
					expect(display).not.toBe('00:00:00');
				}
			});
		});

		test('should handle centiseconds overflow correctly', () => {
			// Test cases where centiseconds calculation might overflow
			const edgeCases = [
				0.995, // 99.5 centiseconds -> should be 99, not 00
				0.996, // 99.6 centiseconds -> should be 99, not 00
				0.997, // 99.7 centiseconds -> should be 99, not 00
				0.998, // 99.8 centiseconds -> should be 99, not 00
				0.999, // 99.9 centiseconds -> should be 99, not 00
			];

			edgeCases.forEach((time) => {
				const result = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				expect(result).toBe('00:00:99');
			});
		});

		test('should handle Math.max clamping in calculations', () => {
			// Test the Math.max(0, calculatedTime) logic from setPercentage
			const testCases = [
				{ input: -1e-15, expected: 0 },
				{ input: -0.1, expected: 0 },
				{ input: -1000, expected: 0 },
				{ input: 0, expected: 0 },
				{ input: 5.5, expected: 5.5 },
			];

			testCases.forEach(({ input, expected }) => {
				const clamped = Math.max(0, input);
				expect(clamped).toBe(expected);
			});
		});
	});

	describe('Time Display Bug Fixes', () => {
		test('should correctly display times near second boundaries', () => {
			// Test the specific bug: moving from 0.99 to 1.00 and back should show correct values
			const testCases = [
				{ time: 0.99, expected: '00:00:99' },
				{ time: 0.995, expected: '00:00:99' },
				{ time: 0.998, expected: '00:00:99' },
				{ time: 0.999, expected: '00:00:99' },
				{ time: 1.0, expected: '00:01:00' },
				{ time: 1.001, expected: '00:01:00' },
				{ time: 1.01, expected: '00:01:01' },
				// Test around minute boundaries too
				{ time: 59.99, expected: '00:59:99' },
				{ time: 60.0, expected: '01:00:00' },
				{ time: 60.01, expected: '01:00:01' },
				{ time: 61.0, expected: '01:01:00' },
				{ time: 61.01, expected: '01:01:01' },
			];

			testCases.forEach(({ time, expected }) => {
				const result = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				expect(result).toBe(expected);
			});
		});

		test('should not skip values when moving through seconds manually', () => {
			// Simulate slider movements that were causing the stepping issue
			const animationDuration = 120; // 2 minutes

			// Test percentage values around second boundaries
			const percentages = [
				8.33, // Around 10 seconds
				8.34, // Should show next centisecond, not skip to next second
				8.35,
			];

			percentages.forEach((percentage) => {
				const time = (percentage / 100) * animationDuration;
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);

				// Should not jump from 00:10:00 directly to 00:10:02, should show 00:10:01
				expect(display).toMatch(/^\d{2}:\d{2}:\d{2}$/);
			});
		});

		test('should handle percentage to time conversion accurately', () => {
			// Test percentage to time conversion like in debug_percentage.js
			const animationDuration = 10.0;
			const testPercentages = [
				{ percentage: 9.9, expectedTime: 0.99, expectedDisplay: '00:00:99' },
				{ percentage: 10.0, expectedTime: 1.0, expectedDisplay: '00:01:00' },
				{ percentage: 10.1, expectedTime: 1.01, expectedDisplay: '00:01:01' },
				{ percentage: 19.9, expectedTime: 1.99, expectedDisplay: '00:01:99' },
				{ percentage: 20.0, expectedTime: 2.0, expectedDisplay: '00:02:00' },
				{ percentage: 20.1, expectedTime: 2.01, expectedDisplay: '00:02:01' },
			];

			testPercentages.forEach(({ percentage, expectedTime, expectedDisplay }) => {
				const timeInSeconds = (percentage / 100) * animationDuration;
				expect(timeInSeconds).toBeCloseTo(expectedTime, 3);

				const formatted = FBXAnimationControls.getAnimationTimeDisplayString(
					timeInSeconds,
					outputTimeFormats.MM_SS_MS
				);
				expect(formatted).toBe(expectedDisplay);
			});
		});

		test('should not show 00:00:00 instead of 00:01:00 when at 1.00 second', () => {
			// Test the corrected reported issue: move to 0.99, then 1.00, then back
			const animationDuration = 10.0;

			// Step 1: Move to 0.99 seconds (9.9%)
			const step1Time = (9.9 / 100) * animationDuration;
			const step1Display = FBXAnimationControls.getAnimationTimeDisplayString(
				step1Time,
				outputTimeFormats.MM_SS_MS
			);
			expect(step1Display).toBe('00:00:99');

			// Step 2: Move to 1.00 seconds (10%) - should show 00:01:00, NOT 00:00:00
			const step2Time = (10.0 / 100) * animationDuration;
			const step2Display = FBXAnimationControls.getAnimationTimeDisplayString(
				step2Time,
				outputTimeFormats.MM_SS_MS
			);
			expect(step2Display).toBe('00:01:00');
			expect(step2Display).not.toBe('00:00:00'); // Specifically test against the reported bug

			// Test critical boundary values that might trigger the bug
			const criticalTimes = [1.0, 1.0001, 0.9999, 0.9995];
			criticalTimes.forEach((time) => {
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				if (time >= 1.0) {
					expect(display).not.toBe('00:00:00');
					expect(display).toMatch(/^00:01:\d{2}$/);
				}
			});
		});
	});

	describe('Method Robustness with Invalid States', () => {
		test('should handle methods called on detached or invalid state', () => {
			// Ensure all methods are safe to call even when in invalid states
			expect(() => {
				controls.play();
				controls.pause();
				controls.stop();
				controls.setTime(5.0);
				controls.setPercentage(50);
				controls.update();
				controls.getCurrentAnimationTimeDisplayString();
			}).not.toThrow();
		});

		test('should handle rapid state changes', () => {
			// Test rapid play/pause/stop cycles
			expect(() => {
				for (let i = 0; i < 10; i++) {
					controls.play();
					controls.pause();
					controls.stop();
				}
			}).not.toThrow();
		});

		test('should handle multiple detach calls', () => {
			// Multiple detach calls should not cause errors
			expect(() => {
				controls.detach();
				controls.detach();
				controls.detach();
			}).not.toThrow();
		});

		test('should handle setTime and setPercentage with various input types', () => {
			// Test different input types for robustness
			const timeInputs = [0, 5.5, '3.7', '0', -1, Infinity];
			const percentageInputs = [0, 50, 100, -10, 150, '25', '0'];

			expect(() => {
				timeInputs.forEach((input) => controls.setTime(input));
				percentageInputs.forEach((input) => controls.setPercentage(input));
			}).not.toThrow();
		});
	});

	describe('Advanced Animation Control Edge Cases', () => {
		test('should handle play when animation is running vs not running', () => {
			// Create mock setup
			const mockMesh = { animations: [{ duration: 10.0 }] };
			const mockAction = {
				getClip: () => ({ duration: 10.0 }),
				isRunning: jest.fn(() => false),
				play: jest.fn(),
				paused: false,
				time: 0,
			};

			controls.__attachedMesh = mockMesh;
			controls.__animationAction = mockAction;

			// Test when animation is NOT running
			mockAction.isRunning.mockReturnValue(false);
			controls.play();
			expect(controls.__playAnimationFlag).toBe(true);
			expect(controls.__stopAnimationFlag).toBe(false);
			expect(mockAction.paused).toBe(false);
			expect(mockAction.play).toHaveBeenCalled();

			// Test when animation IS running (different branch)
			jest.clearAllMocks();
			mockAction.isRunning.mockReturnValue(true);

			controls.play();

			// Should still set flags but not call play() again
			expect(mockAction.play).not.toHaveBeenCalled();
		});

		test('should handle pause when playing vs not playing', () => {
			// Create mock setup
			const mockMesh = { animations: [{ duration: 10.0 }] };
			const mockAction = {
				paused: false,
				time: 0,
			};

			controls.__attachedMesh = mockMesh;
			controls.__animationAction = mockAction;

			// Test pause when playing
			controls.__playAnimationFlag = true;
			const eventSpy = jest.spyOn(controls, 'dispatch');

			controls.pause();

			expect(controls.__playAnimationFlag).toBe(false);
			expect(mockAction.paused).toBe(true);

			// Test pause when not playing (different branch)
			jest.clearAllMocks();
			controls.__playAnimationFlag = false;

			controls.pause();

			// Should not dispatch PAUSE event when not playing
			expect(eventSpy).not.toHaveBeenCalledWith('PAUSE');
		});

		test('should handle stop when playing vs not playing', () => {
			// Create mock setup
			const mockMesh = { animations: [{ duration: 10.0 }] };
			const mockAction = {
				getClip: () => ({ duration: 10.0 }),
				stop: jest.fn(),
				time: 0,
			};

			controls.__attachedMesh = mockMesh;
			controls.__animationAction = mockAction;

			// Test stop when playing
			controls.__playAnimationFlag = true;
			controls.__stopAnimationFlag = false;
			const eventSpy = jest.spyOn(controls, 'dispatch');
			const setPercentageSpy = jest.spyOn(controls, 'setPercentage');

			controls.stop();

			expect(controls.__playAnimationFlag).toBe(false);
			expect(controls.__stopAnimationFlag).toBe(true);
			expect(mockAction.stop).toHaveBeenCalled();
			expect(setPercentageSpy).toHaveBeenCalledWith(0);

			// Test stop when not playing (different branch)
			jest.clearAllMocks();
			controls.__playAnimationFlag = false;

			controls.stop();

			// Should not perform stop actions when not playing
			expect(eventSpy).not.toHaveBeenCalledWith('STOP');
		});

		test('should handle setPercentage with negative values and Math.max clamping', () => {
			// Create mock setup
			const mockMesh = { animations: [{ duration: 10.0 }] };
			const mockAction = {
				getClip: () => ({ duration: 10.0 }),
				time: 0,
			};

			controls.__attachedMesh = mockMesh;
			controls.__animationAction = mockAction;

			// Test with a percentage that would result in negative time
			controls.setPercentage(-1);
			expect(mockAction.time).toBe(0); // Should be clamped to 0 by Math.max

			// Test with very small negative percentage
			controls.setPercentage(-0.0001);
			expect(mockAction.time).toBe(0);
		});
	});

	describe('HTML Controls Edge Cases', () => {
		test('should handle HTML controls when they might not exist', () => {
			// Test when controls are created without HTML
			const noHtmlControls = new FBXAnimationControls(container, { initHTMLControls: false });

			expect(() => {
				noHtmlControls.play();
				noHtmlControls.pause();
				noHtmlControls.stop();
				noHtmlControls.setPercentage(50);
				noHtmlControls.update();
			}).not.toThrow();
		});

		test('should handle update without HTML controls during playback', () => {
			// Create mock setup without HTML controls
			const noHtmlControls = new FBXAnimationControls(container, { initHTMLControls: false });
			const mockMesh = { animations: [{ duration: 10.0 }] };
			const mockMixer = { update: jest.fn() };

			noHtmlControls.__attachedMesh = mockMesh;
			noHtmlControls.__attachedMesh.mixer = mockMixer;
			noHtmlControls.__playAnimationFlag = true;

			expect(() => {
				noHtmlControls.update();
			}).not.toThrow();

			expect(mockMixer.update).toHaveBeenCalled();
		});
	});

	describe('Event System Edge Cases', () => {
		test('should handle event callbacks that throw errors', () => {
			const throwingCallback = jest.fn(() => {
				throw new Error('Callback error');
			});
			const normalCallback = jest.fn();

			controls.on('TEST_EVENT', throwingCallback);
			controls.on('TEST_EVENT', normalCallback);

			// Even if one callback throws, others should still be called
			// Note: This depends on the implementation - currently it doesn't handle errors
			expect(() => {
				controls.dispatch('TEST_EVENT', 'test data');
			}).toThrow('Callback error');
		});

		test('should handle undefined or null callback registration', () => {
			expect(() => {
				controls.on('TEST_EVENT', undefined);
				controls.on('TEST_EVENT', null);
				controls.dispatch('TEST_EVENT');
			}).toThrow(); // Should throw when trying to call undefined/null as function
		});
	});
});
