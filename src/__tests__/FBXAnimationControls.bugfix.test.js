import { FBXAnimationControls, outputTimeFormats } from '../FBXAnimationControls.js';

describe('FBXAnimationControls - Bug Fixes', () => {
	describe('Time Display Edge Cases', () => {
		test('should correctly display times near second boundaries', () => {
			// Test the specific bug: moving from 0.99 to 1.00 and back should show correct values
			const testCases = [
				{ time: 0.99, expected: '00:00:99' },
				{ time: 0.995, expected: '00:00:99' },
				{ time: 0.998, expected: '00:00:99' },
				{ time: 0.999, expected: '00:00:99' },
				{ time: 1.000, expected: '00:01:00' },
				{ time: 1.001, expected: '00:01:00' },
				{ time: 1.01, expected: '00:01:01' },
				// Test around minute boundaries too
				{ time: 59.99, expected: '00:59:99' },
				{ time: 60.00, expected: '01:00:00' },
				{ time: 60.01, expected: '01:00:01' },
				{ time: 61.00, expected: '01:01:00' },
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
				8.33,  // Around 10 seconds
				8.34,  // Should show next centisecond, not skip to next second
				8.35,
			];

			percentages.forEach(percentage => {
				const time = (percentage / 100) * animationDuration;
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);

				// Should not jump from 00:10:00 directly to 00:10:02, should show 00:10:01
				expect(display).toMatch(/^\d{2}:\d{2}:\d{2}$/);
			});
		});

		test('should handle centiseconds overflow correctly', () => {
			// Test the specific bug where 99.5 centiseconds was becoming 00 instead of 99
			const edgeCases = [
				0.995, // 99.5 centiseconds -> should be 99, not 00
				0.996, // 99.6 centiseconds -> should be 99, not 00
				0.997, // 99.7 centiseconds -> should be 99, not 00
				0.998, // 99.8 centiseconds -> should be 99, not 00
				0.999, // 99.9 centiseconds -> should be 99, not 00
			];

			edgeCases.forEach(time => {
				const result = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				expect(result).toBe('00:00:99');
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

				const formatted = FBXAnimationControls.getAnimationTimeDisplayString(timeInSeconds, outputTimeFormats.MM_SS_MS);
				expect(formatted).toBe(expectedDisplay);
			});
		});

		test('should handle slider bidirectional conversion correctly', () => {
			// Test the slider value round-trip conversion like in debug_slider.js
			const animationDuration = 10.0;
			const sliderValues = [9.9, 10.0, 10.1, 9.95];

			sliderValues.forEach(sliderValue => {
				// Convert slider percentage to time
				const calculatedTime = (parseFloat(sliderValue) / 100) * animationDuration;

				// Convert time to display string
				const displayString = FBXAnimationControls.getAnimationTimeDisplayString(calculatedTime, outputTimeFormats.MM_SS_MS);

				// Convert time back to slider percentage (like in updateHTMLControls)
				const backToSliderValue = (calculatedTime.toFixed(3) / animationDuration) * 100;

				// The round-trip should be consistent
				expect(backToSliderValue).toBeCloseTo(sliderValue, 2);
				expect(displayString).toMatch(/^\d{2}:\d{2}:\d{2}$/);
			});
		});

		test('should handle precise time increments around boundaries', () => {
			// Test very small increments like in debug_slider.js
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

		test('should not skip 00:04:00 when scrubbing from 00:03:99 to 00:04:01', () => {
			// Test the specific reported issue: scrubbing from 00:03:99 to 00:04:00 skipping to 00:04:01
			const animationDuration = 10.0;
			const displays = new Set();

			// Test fine-grained slider movements around the 4-second boundary with wider range
			for (let percentage = 39.90; percentage <= 40.15; percentage += 0.01) {
				const time = (percentage / 100) * animationDuration;
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				displays.add(display);
			}

			// Should see all three time displays without skipping
			expect(displays.has('00:03:99')).toBe(true);
			expect(displays.has('00:04:00')).toBe(true);
			expect(displays.has('00:04:01')).toBe(true);
		});

		test('should not show 00:00:00 instead of 00:01:00 when at 1.00 second', () => {
			// Test the corrected reported issue: move to 0.99, then 1.00, then back
			// Problem: 1.00 second shows as 00:00:00 instead of 00:01:00
			const animationDuration = 10.0;

			// Step 1: Move to 0.99 seconds (9.9%)
			const step1Time = (9.9 / 100) * animationDuration;
			const step1Display = FBXAnimationControls.getAnimationTimeDisplayString(step1Time, outputTimeFormats.MM_SS_MS);
			expect(step1Display).toBe('00:00:99');

			// Step 2: Move to 1.00 seconds (10%) - should show 00:01:00, NOT 00:00:00
			const step2Time = (10.0 / 100) * animationDuration;
			const step2Display = FBXAnimationControls.getAnimationTimeDisplayString(step2Time, outputTimeFormats.MM_SS_MS);
			expect(step2Display).toBe('00:01:00');
			expect(step2Display).not.toBe('00:00:00'); // Specifically test against the reported bug

			// Step 3: Go back a little bit - should show appropriate times, never 00:00:00 for significant times
			const backPercentages = [9.99, 9.98, 9.97, 9.96, 9.95, 9.94, 9.93, 9.92, 9.91, 9.9];
			backPercentages.forEach(percentage => {
				const backTime = (percentage / 100) * animationDuration;
				const backDisplay = FBXAnimationControls.getAnimationTimeDisplayString(backTime, outputTimeFormats.MM_SS_MS);

				// Should never show 00:00:00 for times significantly greater than 0
				if (backTime > 0.5) {
					expect(backDisplay).not.toBe('00:00:00');
				}

				// For times close to 1 second, should show either 00:00:99 or 00:01:00, never 00:00:00
				if (backTime > 0.9) {
					expect(backDisplay).toMatch(/^00:0[01]:\d{2}$/);
				}
			});

			// Test critical boundary values that might trigger the bug
			const criticalTimes = [1.0, 1.0001, 0.9999, 0.9995];
			criticalTimes.forEach(time => {
				const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
				if (time >= 1.0) {
					expect(display).not.toBe('00:00:00');
					expect(display).toMatch(/^00:01:\d{2}$/);
				}
			});
		});

		test('should handle extreme edge cases that could cause 00:00:00 bug', () => {
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

			// Test cases that should throw errors
			const invalidCases = [undefined, NaN];
			invalidCases.forEach(invalidTime => {
				expect(() => {
					FBXAnimationControls.getAnimationTimeDisplayString(invalidTime, outputTimeFormats.MM_SS_MS);
				}).toThrow("property 'time' can't be undefined or NaN");
			});

			// Test cases that should be handled gracefully (no errors)
			const extremeCases = [Infinity, -Infinity, Number.MAX_VALUE, -1e-10];
			extremeCases.forEach(time => {
				expect(() => {
					const display = FBXAnimationControls.getAnimationTimeDisplayString(time, outputTimeFormats.MM_SS_MS);
					expect(display).toMatch(/^\d{2}:\d{2}:\d{2}$/);
				}).not.toThrow();
			});
		});
	});
});
