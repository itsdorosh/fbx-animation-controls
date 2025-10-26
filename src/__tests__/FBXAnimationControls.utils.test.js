import { FBXAnimationControls, outputTimeFormats } from '../FBXAnimationControls.js';

describe('FBXAnimationControls - Utility Functions', () => {
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

	describe('Static Time Formatting Methods', () => {
		test('getAnimationTimeDisplayString should format time correctly for MM_SS_MS', () => {
			const timeString = FBXAnimationControls.getAnimationTimeDisplayString(65.5, outputTimeFormats.MM_SS_MS);
			expect(timeString).toMatch(/\d{2}:\d{2}:\d{2}/);
		});

		test('getAnimationTimeDisplayString should format time correctly for SS_MS', () => {
			const timeString = FBXAnimationControls.getAnimationTimeDisplayString(65.5, outputTimeFormats.SS_MS);
			expect(timeString).toMatch(/\d{2}:\d{2}/);
		});

		test('should format basic time values correctly', () => {
			const testCases = [
				{ time: 0, format: 'MM_SS_MS', expected: '00:00:00' },
				{ time: 1, format: 'MM_SS_MS', expected: '00:01:00' },
				{ time: 60, format: 'MM_SS_MS', expected: '01:00:00' },
				{ time: 61.5, format: 'MM_SS_MS', expected: '01:01:50' },
				{ time: 0, format: 'SS_MS', expected: '00:00' },
				{ time: 1, format: 'SS_MS', expected: '01:00' },
				{ time: 61.5, format: 'SS_MS', expected: '01:50' },
			];

			testCases.forEach(({ time, format, expected }) => {
				const result = FBXAnimationControls.getAnimationTimeDisplayString(time, format);
				expect(result).toBe(expected);
			});
		});

		test('should handle complex time formatting scenarios', () => {
			// Test precise boundary cases
			const testCases = [
				{ time: 0.99, expected: '00:00:99' },
				{ time: 0.995, expected: '00:00:99' },
				{ time: 0.998, expected: '00:00:99' },
				{ time: 0.999, expected: '00:00:99' },
				{ time: 1.0, expected: '00:01:00' },
				{ time: 1.001, expected: '00:01:00' },
				{ time: 1.01, expected: '00:01:01' },
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

		test('should handle centiseconds calculations correctly', () => {
			// Test percentage to time conversion accuracy
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

		test('should handle slider bidirectional conversion correctly', () => {
			const animationDuration = 10.0;
			const sliderValues = [9.9, 10.0, 10.1, 9.95];

			sliderValues.forEach((sliderValue) => {
				// Convert slider percentage to time
				const calculatedTime = (parseFloat(sliderValue) / 100) * animationDuration;

				// Convert time to display string
				const displayString = FBXAnimationControls.getAnimationTimeDisplayString(
					calculatedTime,
					outputTimeFormats.MM_SS_MS
				);

				// Convert time back to slider percentage (like in updateHTMLControls)
				const backToSliderValue = (calculatedTime.toFixed(3) / animationDuration) * 100;

				// The round-trip should be consistent
				expect(backToSliderValue).toBeCloseTo(sliderValue, 2);
				expect(displayString).toMatch(/^\d{2}:\d{2}:\d{2}$/);
			});
		});

		test('should handle precise time increments around boundaries', () => {
			const animationDuration = 10.0;
			const precision = 0.01;

			// Test around the 10% mark (1 second)
			for (let i = 9.98; i <= 10.02; i += precision) {
				const time = (i / 100) * animationDuration;
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);

				// Should always return a valid time format
				expect(display).toMatch(/^\d{2}:\d{2}:\d{2}$/);

				// Should not have inconsistent jumps in centiseconds
				const centiseconds = parseInt(display.split(':')[2]);
				expect(centiseconds).toBeGreaterThanOrEqual(0);
				expect(centiseconds).toBeLessThanOrEqual(99);
			}
		});

		test('should not skip time values when scrubbing', () => {
			const animationDuration = 10.0;
			const displays = new Set();

			// Test fine-grained slider movements around the 4-second boundary
			for (let percentage = 39.9; percentage <= 40.15; percentage += 0.01) {
				const time = (percentage / 100) * animationDuration;
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				displays.add(display);
			}

			// Should see all three time displays without skipping
			expect(displays.has('00:03:99')).toBe(true);
			expect(displays.has('00:04:00')).toBe(true);
			expect(displays.has('00:04:01')).toBe(true);
		});

		test('should correctly handle 1.00 second boundary', () => {
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

			// Step 3: Go back a little bit - should show appropriate times
			const backPercentages = [9.99, 9.98, 9.97, 9.96, 9.95, 9.94, 9.93, 9.92, 9.91, 9.9];
			backPercentages.forEach((percentage) => {
				const backTime = (percentage / 100) * animationDuration;
				const backDisplay = FBXAnimationControls.getAnimationTimeDisplayString(
					backTime,
					outputTimeFormats.MM_SS_MS
				);

				// Should never show 00:00:00 for times significantly greater than 0
				if (backTime > 0.5) {
					expect(backDisplay).not.toBe('00:00:00');
				}

				// For times close to 1 second, should show either 00:00:99 or 00:01:00
				if (backTime > 0.9) {
					expect(backDisplay).toMatch(/^00:0[01]:\d{2}$/);
				}
			});
		});
	});

	describe('getCurrentAnimationTimeDisplayString Method', () => {
		test('should return placeholder when no animation attached', () => {
			const timeString = controls.getCurrentAnimationTimeDisplayString();
			expect(timeString).toBe('--:--:-- / --:--:--');
		});

		test('should format current time with duration when animation attached', () => {
			// Create mock setup for testing
			const mockAction = {
				time: 2.5,
				getClip: () => ({ duration: 10.0 }),
			};

			controls.__attachedMesh = { animations: [] };
			controls.__animationAction = mockAction;
			controls.__duration = '00:10:00';

			const timeString = controls.getCurrentAnimationTimeDisplayString();
			expect(timeString).toContain('00:02:50');
			expect(timeString).toContain('00:10:00');
		});
	});

	describe('Time Calculation Utilities', () => {
		test('should handle floating point precision in time calculations', () => {
			// Test the Math.max(0, calculatedTime) logic
			const verySmallNegative = -1e-15;
			const result = FBXAnimationControls.getAnimationTimeDisplayString(
				Math.max(0, verySmallNegative),
				outputTimeFormats.MM_SS_MS
			);
			expect(result).toBe('00:00:00');
		});

		test('should handle percentage to time conversion edge cases', () => {
			// Simulate setPercentage calculations
			const animationDuration = 10.0;

			// Test negative percentage (should clamp to 0)
			const negativePercentage = -1;
			const calculatedTime = (negativePercentage / 100) * animationDuration;
			const clampedTime = Math.max(0, calculatedTime);
			expect(clampedTime).toBe(0);

			// Test very large percentage
			const largePercentage = 150;
			const largeTime = (largePercentage / 100) * animationDuration;
			const display = FBXAnimationControls.getAnimationTimeDisplayString(largeTime, outputTimeFormats.MM_SS_MS);
			expect(display).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		});

		test('should handle precise slider value calculations', () => {
			// Test the calculation used in __updateHTMLControlsIfAvailable
			const animationTime = 2.5;
			const animationDuration = 10.0;

			const sliderValue = (animationTime / animationDuration) * 100;
			expect(sliderValue).toBe(25);

			// Test with high precision
			const preciseTime = 3.333333;
			const preciseSliderValue = (preciseTime / animationDuration) * 100;
			expect(preciseSliderValue).toBeCloseTo(33.33333, 5);
		});
	});

	describe('Format Validation', () => {
		test('should handle both supported time formats', () => {
			const time = 125.75; // 2 minutes, 5 seconds, 75 centiseconds

			const mmSsMs = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
			expect(mmSsMs).toBe('02:05:75');

			const ssMss = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.SS_MS);
			expect(ssMss).toBe('05:75');
		});

		test('should validate time format patterns', () => {
			const testCases = [
				{ time: 0, format: outputTimeFormats.MM_SS_MS },
				{ time: 59.99, format: outputTimeFormats.MM_SS_MS },
				{ time: 3661.45, format: outputTimeFormats.MM_SS_MS }, // Over an hour
				{ time: 0, format: outputTimeFormats.SS_MS },
				{ time: 59.99, format: outputTimeFormats.SS_MS },
				{ time: 3661.45, format: outputTimeFormats.SS_MS },
			];

			testCases.forEach(({ time, format }) => {
				const result = FBXAnimationControls.getAnimationTimeDisplayString(time, format);

				if (format === outputTimeFormats.MM_SS_MS) {
					expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
				} else {
					expect(result).toMatch(/^\d{2}:\d{2}$/);
				}
			});
		});
	});
});
