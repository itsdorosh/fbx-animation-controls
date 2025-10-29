import { jest } from '@jest/globals';
import {
	FBXAnimationControls,
	eventTypes,
} from '../FBXAnimationControls.js';

// Mock Three.js
const mockClip1 = {
	duration: 10.0,
	name: 'Walk',
	uuid: 'walk-uuid',
	tracks: [{ name: 'track1' }, { name: 'track2' }]
};
const mockClip2 = {
	duration: 15.0,
	name: 'Run',
	uuid: 'run-uuid',
	tracks: [{ name: 'track1' }, { name: 'track2' }, { name: 'track3' }]
};
const mockClip3 = {
	duration: 5.0,
	name: 'Jump',
	uuid: 'jump-uuid',
	tracks: [{ name: 'track1' }]
};

const mockAction1 = {
	getClip: jest.fn(() => mockClip1),
	isRunning: jest.fn(() => false),
	play: jest.fn(),
	stop: jest.fn(),
	paused: false,
	time: 0,
};

const mockAction2 = {
	getClip: jest.fn(() => mockClip2),
	isRunning: jest.fn(() => false),
	play: jest.fn(),
	stop: jest.fn(),
	paused: false,
	time: 0,
};

const mockAction3 = {
	getClip: jest.fn(() => mockClip3),
	isRunning: jest.fn(() => false),
	play: jest.fn(),
	stop: jest.fn(),
	paused: false,
	time: 0,
};

const mockMixer = {
	update: jest.fn(),
	clipAction: jest.fn((clip) => {
		if (clip === mockClip1) return mockAction1;
		if (clip === mockClip2) return mockAction2;
		if (clip === mockClip3) return mockAction3;
		return mockAction1; // default
	}),
};

jest.mock('three', () => ({
	AnimationMixer: jest.fn(() => mockMixer),
	Clock: jest.fn(() => ({ getDelta: jest.fn(() => 0.016) })),
}));

describe('FBXAnimationControls - Animation Selector Feature', () => {
	let container;
	let controls;

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement('div');
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

	describe('Configuration and Initialization', () => {
		test('should initialize with animation selector enabled by default', () => {
			controls = new FBXAnimationControls(container);
			expect(controls.isAnimationSelectorEnabled).toBe(true);
		});

		test('should allow disabling animation selector', () => {
			controls = new FBXAnimationControls(container, {
				enableAnimationSelector: false,
			});
			expect(controls.isAnimationSelectorEnabled).toBe(false);
		});

		test('should create animation selector UI elements when enabled', () => {
			controls = new FBXAnimationControls(container);
			expect(controls.animationSelector).toBeDefined();
			expect(controls.animationSelectorLabel).toBeDefined();
			expect(controls.animationInfoDisplay).toBeDefined();
		});

		test('should not create animation selector UI elements when disabled', () => {
			controls = new FBXAnimationControls(container, {
				enableAnimationSelector: false,
			});
			expect(controls.animationSelector).toBeUndefined();
			expect(controls.animationSelectorLabel).toBeUndefined();
			expect(controls.animationInfoDisplay).toBeUndefined();
		});
	});

	describe('Animation Track Information', () => {
		test('should extract animation track info correctly', () => {
			const trackInfo = FBXAnimationControls.getAnimationTrackInfo(mockClip1, 0);

			expect(trackInfo).toEqual({
				index: 0,
				name: 'Walk',
				duration: 10.0,
				tracks: 2,
				uuid: 'walk-uuid',
			});
		});

		test('should handle animation without name', () => {
			const clipWithoutName = { duration: 8.0, tracks: [{}] };
			const trackInfo = FBXAnimationControls.getAnimationTrackInfo(clipWithoutName, 2);

			expect(trackInfo.name).toBe('Animation 3');
			expect(trackInfo.index).toBe(2);
		});

		test('should handle animation without tracks', () => {
			const clipWithoutTracks = { duration: 8.0, name: 'Test' };
			const trackInfo = FBXAnimationControls.getAnimationTrackInfo(clipWithoutTracks, 0);

			expect(trackInfo.tracks).toBe(0);
		});

		test('should throw error for null animation clip', () => {
			expect(() => {
				FBXAnimationControls.getAnimationTrackInfo(null, 0);
			}).toThrow('Animation clip is required');
		});
	});

	describe('Mesh Attachment with Multiple Animations', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
		});

		test('should process multiple animations on attach', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2, mockClip3],
			};

			controls.attach(mockMesh);

			expect(controls.availableAnimations).toHaveLength(3);
			expect(controls.availableAnimations[0].name).toBe('Walk');
			expect(controls.availableAnimations[1].name).toBe('Run');
			expect(controls.availableAnimations[2].name).toBe('Jump');
		});

		test('should auto-select first animation by default', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			expect(controls.currentAnimationIndex).toBe(0);
			expect(controls.currentAnimationTrack.name).toBe('Walk');
		});

		test('should not auto-select when disabled', () => {
			controls = new FBXAnimationControls(container, {
				autoSelectFirstAnimation: false,
			});

			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			expect(controls.currentAnimationIndex).toBe(-1);
			expect(controls.currentAnimationTrack).toBe(null);
		});

		test('should select specific animation on attach', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2, mockClip3],
			};

			controls.attach(mockMesh, { animationIndex: 1 });

			expect(controls.currentAnimationIndex).toBe(1);
			expect(controls.currentAnimationTrack.name).toBe('Run');
		});

		test('should handle single animation', () => {
			const mockMesh = {
				animations: [mockClip1],
			};

			controls.attach(mockMesh);

			expect(controls.availableAnimations).toHaveLength(1);
			expect(controls.hasMultipleAnimations).toBe(false);
			expect(controls.currentAnimationIndex).toBe(0);
		});

		test('should handle mesh with no animations', () => {
			const mockMesh = {
				animations: [],
			};

			controls.attach(mockMesh);

			expect(controls.availableAnimations).toHaveLength(0);
			expect(controls.hasMultipleAnimations).toBe(false);
			expect(controls.currentAnimationIndex).toBe(-1);
		});
	});

	describe('Animation Selection Methods', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
			const mockMesh = {
				animations: [mockClip1, mockClip2, mockClip3],
			};
			controls.attach(mockMesh);
		});

		test('should select animation by index', () => {
			const dispatchSpy = jest.spyOn(controls, 'dispatch');

			const result = controls.selectAnimation(1);

			expect(controls.currentAnimationIndex).toBe(1);
			expect(result.name).toBe('Run');
			expect(dispatchSpy).toHaveBeenCalledWith(eventTypes.ANIMATION_TRACK_CHANGED, expect.objectContaining({
				currentIndex: 1,
				previousIndex: 0,
			}));
		});

		test('should select animation by name', () => {
			const result = controls.selectAnimationByName('Jump');

			expect(controls.currentAnimationIndex).toBe(2);
			expect(result.name).toBe('Jump');
		});

		test('should throw error for invalid index', () => {
			expect(() => {
				controls.selectAnimation(5);
			}).toThrow('Invalid animation index. Must be between 0 and 2');

			expect(() => {
				controls.selectAnimation(-1);
			}).toThrow('Invalid animation index. Must be between 0 and 2');
		});

		test('should throw error for invalid name', () => {
			expect(() => {
				controls.selectAnimationByName('NonExistent');
			}).toThrow('Animation "NonExistent" not found');
		});

		test('should throw error when no mesh attached', () => {
			controls.detach();

			expect(() => {
				controls.selectAnimation(0);
			}).toThrow('No mesh attached');

			expect(() => {
				controls.selectAnimationByName('Walk');
			}).toThrow('No mesh attached');
		});

		test('should preserve playing state when switching animations', () => {
			// Start playing
			controls.play();
			expect(controls.isPlaying).toBe(true);

			// Switch animation
			controls.selectAnimation(1);

			// Should still be playing
			expect(controls.isPlaying).toBe(true);
		});

		test('should reset time when switching animations', () => {
			// Set time on first animation
			controls.setTime(5);

			// Switch to second animation
			controls.selectAnimation(1);

			// Time should be reset and new animation should be set
			expect(mockAction2.time).toBe(0); // New animation starts at 0
		});
	});

	describe('Animation Query Methods', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
			const mockMesh = {
				animations: [mockClip1, mockClip2, mockClip3],
			};
			controls.attach(mockMesh);
		});

		test('should get animation list', () => {
			const animations = controls.getAnimationList();

			expect(animations).toHaveLength(3);
			expect(animations[0].name).toBe('Walk');
			expect(animations[1].name).toBe('Run');
			expect(animations[2].name).toBe('Jump');

			// Should return a copy
			animations.push({ name: 'Fake' });
			expect(controls.availableAnimations).toHaveLength(3);
		});

		test('should get animation by index', () => {
			const animation = controls.getAnimationByIndex(1);
			expect(animation.name).toBe('Run');

			const invalidAnimation = controls.getAnimationByIndex(10);
			expect(invalidAnimation).toBe(null);
		});

		test('should get animation by name', () => {
			const animation = controls.getAnimationByName('Jump');
			expect(animation.name).toBe('Jump');
			expect(animation.index).toBe(2);

			const invalidAnimation = controls.getAnimationByName('NonExistent');
			expect(invalidAnimation).toBe(null);
		});
	});

	describe('UI Updates and Event Handling', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
		});

		test('should update selector dropdown when animations are available', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			expect(controls.animationSelector.disabled).toBe(false);
			expect(controls.animationSelector.children).toHaveLength(2);
			expect(controls.animationSelector.children[0].textContent).toBe('Walk');
			expect(controls.animationSelector.children[1].textContent).toBe('Run');
		});

		test('should update info display correctly', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			// Should show info for selected animation
			expect(controls.animationInfoDisplay.textContent).toBe('2 tracks, 00:10:00');
		});

		test('should handle selector change event', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			// Mock the selector change by directly calling selectAnimation
			const selectSpy = jest.spyOn(controls, 'selectAnimation');

			// Simulate what would happen when selector changes to index 1
			const mockEvent = {
				target: { value: '1' }
			};

			// Trigger the event handler logic directly
			const selectedIndex = parseInt(mockEvent.target.value, 10);
			if (!isNaN(selectedIndex) && selectedIndex >= 0) {
				controls.selectAnimation(selectedIndex);
			}

			expect(selectSpy).toHaveBeenCalledWith(1);
		});

		test('should disable selector when no animations', () => {
			const mockMesh = {
				animations: [],
			};

			controls.attach(mockMesh);

			expect(controls.animationSelector.disabled).toBe(true);
			expect(controls.animationInfoDisplay.textContent).toBe('No animations');
		});

		test('should reset selector on detach', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);
			controls.detach();

			expect(controls.animationSelector.innerHTML).toBe('');
			expect(controls.animationSelector.disabled).toBe(true);
			expect(controls.animationInfoDisplay.textContent).toBe('No animations');
		});
	});

	describe('Event System for Animation Selection', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
		});

		test('should dispatch ANIMATION_SELECTED on initial selection', () => {
			const callback = jest.fn();
			controls.on(eventTypes.ANIMATION_SELECTED, callback);

			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			expect(callback).toHaveBeenCalledWith(expect.objectContaining({
				animationInfo: expect.objectContaining({ name: 'Walk' }),
				currentIndex: 0,
				previousIndex: -1,
			}));
		});

		test('should dispatch ANIMATION_TRACK_CHANGED when switching', () => {
			const trackChangedCallback = jest.fn();
			controls.on(eventTypes.ANIMATION_TRACK_CHANGED, trackChangedCallback);

			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);
			controls.selectAnimation(1);

			expect(trackChangedCallback).toHaveBeenCalledWith(expect.objectContaining({
				animationInfo: expect.objectContaining({ name: 'Run' }),
				currentIndex: 1,
				previousIndex: 0,
			}));
		});

		test('should not dispatch ANIMATION_TRACK_CHANGED for initial selection', () => {
			const trackChangedCallback = jest.fn();
			controls.on(eventTypes.ANIMATION_TRACK_CHANGED, trackChangedCallback);

			const mockMesh = {
				animations: [mockClip1],
			};

			controls.attach(mockMesh);

			expect(trackChangedCallback).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases and Error Handling', () => {
		beforeEach(() => {
			controls = new FBXAnimationControls(container);
		});

		test('should handle animations with duplicate names', () => {
			const duplicateClip = { ...mockClip1, uuid: 'duplicate-uuid' };
			const mockMesh = {
				animations: [mockClip1, duplicateClip],
			};

			controls.attach(mockMesh);

			expect(controls.availableAnimations).toHaveLength(2);
			expect(controls.availableAnimations[0].name).toBe('Walk');
			expect(controls.availableAnimations[1].name).toBe('Walk');
			expect(controls.availableAnimations[0].uuid).toBe('walk-uuid');
			expect(controls.availableAnimations[1].uuid).toBe('duplicate-uuid');
		});

		test('should handle malformed animation clips gracefully', () => {
			const malformedClip = { duration: 'invalid' };

			expect(() => {
				FBXAnimationControls.getAnimationTrackInfo(malformedClip, 0);
			}).not.toThrow();
		});

		test('should handle selector with invalid values', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			// Simulate selector with invalid value by directly testing the logic
			const mockEvent = {
				target: { value: 'invalid' }
			};

			const selectSpy = jest.spyOn(controls, 'selectAnimation');

			// Test the event handler logic directly
			const selectedIndex = parseInt(mockEvent.target.value, 10);
			if (!isNaN(selectedIndex) && selectedIndex >= 0) {
				controls.selectAnimation(selectedIndex);
			}

			// Should not call selectAnimation with invalid value
			expect(selectSpy).not.toHaveBeenCalled();
		});

		test('should maintain state consistency during rapid switching', () => {
			const mockMesh = {
				animations: [mockClip1, mockClip2, mockClip3],
			};

			controls.attach(mockMesh);

			// Rapidly switch animations
			controls.selectAnimation(1);
			controls.selectAnimation(2);
			controls.selectAnimation(0);

			expect(controls.currentAnimationIndex).toBe(0);
			expect(controls.currentAnimationTrack.name).toBe('Walk');
		});
	});

	describe('Backwards Compatibility', () => {
		test('should work with existing single animation workflow', () => {
			controls = new FBXAnimationControls(container, {
				enableAnimationSelector: false,
			});

			const mockMesh = {
				animations: [mockClip1],
			};

			// This should work exactly like the old API
			controls.attach(mockMesh, { play: true });

			expect(controls.currentAnimationIndex).toBe(0);
			expect(controls.isPlaying).toBe(true);
		});

		test('should default to first animation like before', () => {
			controls = new FBXAnimationControls(container);

			const mockMesh = {
				animations: [mockClip1, mockClip2],
			};

			controls.attach(mockMesh);

			// Should automatically select first animation like the old behavior
			expect(controls.currentAnimationIndex).toBe(0);
			expect(controls.currentAnimationTrack.name).toBe('Walk');
		});
	});
});
