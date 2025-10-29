import { AnimationMixer, Clock } from 'three';

export const defaultIcons = {
	PLAY: '▶️',
	PAUSE: '⏸',
	STOP: '⏹',
	REPEAT: '🔁',
	REPEAT_ONCE: '🔂',
	SHUFFLE: '🔀',
	REWIND: '⏪',
	FORWARD: '⏩',
	PREVIOUS: '⏮',
	NEXT: '⏭',
};

export const outputTimeFormats = {
	MM_SS_MS: 'MM_SS_MS',
	SS_MS: 'SS_MS',
};

export const defaultConfiguration = {
	outputFormat: outputTimeFormats.MM_SS_MS,
	initHTMLControls: true,
	enableAnimationSelector: true,
	autoSelectFirstAnimation: true,
};

export const timePlaceholders = {
	[outputTimeFormats.MM_SS_MS]: '--:--:--',
	[outputTimeFormats.SS_MS]: '--:--',
};

export const eventTypes = {
	PLAY: 'PLAY',
	PAUSE: 'PAUSE',
	STOP: 'STOP',
	MESH_ATTACHED: 'MESH_ATTACHED',
	MESH_DETACHED: 'MESH_DETACHED',
	CHANGE_PERCENTAGE: 'CHANGE_PERCENTAGE',
	CHANGE_TIME: 'CHANGE_TIME',
	ANIMATION_SELECTED: 'ANIMATION_SELECTED',
	ANIMATION_TRACK_CHANGED: 'ANIMATION_TRACK_CHANGED',
};

const __createElement = function (tag, props, ...children) {
	const element = document.createElement(tag);

	Object.keys(props).forEach((key) => (element[key] = props[key]));

	if (children.length > 0) {
		children.forEach((child) => {
			if (typeof child === 'string') {
				child = document.createTextNode(child);
			}
			element.appendChild(child);
		});
	}
	return element;
};

export class FBXAnimationControls {
	constructor(domElement, configuration = defaultConfiguration) {
		this.__configuration = { ...defaultConfiguration, ...configuration };
		this.__timePlaceholder = timePlaceholders[this.__configuration.outputFormat];
		this.__attachedMesh = null;
		this.__animationAction = null;
		this.__playAnimationFlag = false;
		this.__stopAnimationFlag = true;
		this.__duration = this.__timePlaceholder;
		this.__innerContainer = domElement;
		this.__clock = new Clock();
		this.__eventCallbacks = {};
		this.__availableAnimations = [];
		this.__currentAnimationIndex = -1;
		this.__animationTracks = new Map();
		if (this.__configuration.initHTMLControls) this.__init();
	}

	get attachedMesh() {
		return this.__attachedMesh;
	}

	get isPlaying() {
		return this.__playAnimationFlag;
	}

	get isPaused() {
		return !this.__playAnimationFlag;
	}

	get isStopped() {
		return this.__stopAnimationFlag;
	}

	get isHTMLControlsAvailable() {
		return this.__configuration.initHTMLControls;
	}

	get availableAnimations() {
		return this.__availableAnimations;
	}

	get currentAnimationIndex() {
		return this.__currentAnimationIndex;
	}

	get currentAnimationTrack() {
		if (this.__currentAnimationIndex >= 0 && this.__availableAnimations.length > 0) {
			return this.__availableAnimations[this.__currentAnimationIndex];
		}
		return null;
	}

	get hasMultipleAnimations() {
		return this.__availableAnimations.length > 1;
	}

	get isAnimationSelectorEnabled() {
		return this.__configuration.enableAnimationSelector;
	}

	get __isAnimationAvailable() {
		return this.__attachedMesh && this.__animationAction;
	}

	static getAnimationTimeDisplayString(time, outputFormat) {
		if (time === undefined || isNaN(time)) throw new Error("property 'time' can't be undefined or NaN");

		// Handle edge cases that might occur due to floating-point precision issues
		if (time < 0) {
			time = 0; // Clamp negative values to 0
		}

		// Convert time to total milliseconds with more robust handling
		let totalMs = Math.round(time * 1000);

		// Ensure totalMs is a valid positive integer
		if (!Number.isFinite(totalMs) || totalMs < 0) {
			totalMs = 0;
		}

		// Calculate minutes, seconds, and centiseconds using more explicit math
		const minutes = Math.floor(totalMs / 60000);
		const remainingMsAfterMinutes = totalMs % 60000;
		const seconds = Math.floor(remainingMsAfterMinutes / 1000);
		const remainingMsAfterSeconds = remainingMsAfterMinutes % 1000;
		const centiseconds = Math.floor(remainingMsAfterSeconds / 10);

		// Ensure all components are valid
		const safeMinutes = Math.max(0, Math.floor(minutes)) || 0;
		const safeSeconds = Math.max(0, Math.floor(seconds)) || 0;
		const safeCentiseconds = Math.max(0, Math.floor(centiseconds)) || 0;

		// Format with leading zeros
		const mm = safeMinutes.toString().padStart(2, '0');
		const ss = safeSeconds.toString().padStart(2, '0');
		const ms = safeCentiseconds.toString().padStart(2, '0');

		return outputFormat === outputTimeFormats.MM_SS_MS ? `${mm}:${ss}:${ms}` : `${ss}:${ms}`;
	}

	static getAnimationTrackInfo(animationClip, index) {
		if (!animationClip) {
			throw new Error('Animation clip is required');
		}

		return {
			index: index,
			name: animationClip.name || `Animation ${index + 1}`,
			duration: animationClip.duration,
			tracks: animationClip.tracks ? animationClip.tracks.length : 0,
			uuid: animationClip.uuid || `animation-${index}`,
		};
	}

	__init() {
		this.animationSlider = __createElement('input', {
			type: 'range',
			min: 0,
			max: 100,
			step: 'any',
			className: 'animationSlider',
		});

		this.playButton = __createElement('div', { className: 'playButton' }, defaultIcons.PLAY);

		this.currentAnimationTime = __createElement(
			'p',
			{ className: 'currentAnimationTime' },
			`${this.__timePlaceholder} / ${this.__duration}`
		);

		// Animation selector elements
		if (this.__configuration.enableAnimationSelector) {
			this.animationSelector = __createElement('select', {
				className: 'animationSelector',
				disabled: true,
			});

			this.animationSelectorLabel = __createElement(
				'label',
				{ className: 'animationSelectorLabel', htmlFor: 'animationSelector' },
				'Track:'
			);

			this.animationInfoDisplay = __createElement(
				'span',
				{ className: 'animationInfoDisplay' },
				'No animations'
			);
		}

		// Create containers
		const mainControlsContainer = __createElement(
			'div',
			{ className: 'mainControlsContainer' },
			this.animationSlider,
			this.playButton,
			this.currentAnimationTime
		);

		const selectorContainer = this.__configuration.enableAnimationSelector
			? __createElement(
					'div',
					{ className: 'animationSelectorContainer' },
					this.animationSelectorLabel,
					this.animationSelector,
					this.animationInfoDisplay
				)
			: null;

		this.animationControlsContainer = __createElement('div', { className: 'animationControlsContainer' });

		if (selectorContainer) {
			this.animationControlsContainer.appendChild(selectorContainer);
		}
		this.animationControlsContainer.appendChild(mainControlsContainer);

		this.__innerContainer.appendChild(this.animationControlsContainer);

		this.__setupEventListeners();
	}

	__setupEventListeners() {
		let isPlayingBeforeInteract;

		this.animationSlider.addEventListener(
			'mousedown',
			() => {
				isPlayingBeforeInteract = this.isPlaying;
				this.pause();
			},
			false
		);

		this.animationSlider.addEventListener(
			'input',
			() => {
				this.setPercentage(this.animationSlider.value);
				this.dispatch(eventTypes.CHANGE_PERCENTAGE, this.animationSlider.value);
			},
			false
		);

		this.animationSlider.addEventListener(
			'mouseup',
			() => {
				if (isPlayingBeforeInteract) this.play();
			},
			false
		);

		this.playButton.addEventListener('click', () => {
			if (this.isPlaying) this.pause();
			else this.play();
		});

		// Animation selector event listener
		if (this.__configuration.enableAnimationSelector && this.animationSelector) {
			this.animationSelector.addEventListener('change', (event) => {
				const selectedIndex = parseInt(event.target.value, 10);
				if (!isNaN(selectedIndex) && selectedIndex >= 0) {
					this.selectAnimation(selectedIndex);
				}
			});
		}
	}

	attach(mesh, attachOptions) {
		if (!this.__attachedMesh || this.__attachedMesh !== mesh) {
			this.__attachedMesh = mesh;
			this.__attachedMesh.mixer = new AnimationMixer(mesh);

			// Process all available animations
			this.__processAnimations(mesh.animations);

			// Select initial animation
			let initialAnimationIndex = -1;
			if (attachOptions && typeof attachOptions.animationIndex === 'number') {
				initialAnimationIndex = attachOptions.animationIndex;
			} else if (this.__configuration.autoSelectFirstAnimation && this.__availableAnimations.length > 0) {
				initialAnimationIndex = 0;
			}

			if (initialAnimationIndex >= 0 && initialAnimationIndex < this.__availableAnimations.length) {
				this.__setAnimationByIndex(initialAnimationIndex);
			}

			// Update UI
			this.__updateAnimationSelector();

			if (attachOptions) {
				if (attachOptions.play) this.play();
				if (attachOptions.atTime) this.setTime(attachOptions.atTime);
			}

			this.dispatch(eventTypes.MESH_ATTACHED);
		} else {
			throw new Error('already attached');
		}
	}

	__processAnimations(animations) {
		this.__availableAnimations = [];
		this.__animationTracks.clear();
		this.__currentAnimationIndex = -1;

		if (animations && animations.length > 0) {
			animations.forEach((animation, index) => {
				const trackInfo = FBXAnimationControls.getAnimationTrackInfo(animation, index);
				this.__availableAnimations.push(trackInfo);
				this.__animationTracks.set(index, animation);
			});
		}
	}

	__setAnimationByIndex(index) {
		if (index < 0 || index >= this.__availableAnimations.length) {
			throw new Error(`Animation index ${index} is out of range. Available: 0-${this.__availableAnimations.length - 1}`);
		}

		const previousIndex = this.__currentAnimationIndex;

		// Stop current animation if playing
		if (this.__animationAction && this.isPlaying) {
			this.__animationAction.stop();
		}

		// Clear current action
		this.__animationAction = null;

		// Set new animation
		const animationClip = this.__animationTracks.get(index);
		if (animationClip && this.__attachedMesh && this.__attachedMesh.mixer) {
			this.__animationAction = this.__attachedMesh.mixer.clipAction(animationClip);
			this.__currentAnimationIndex = index;

			// Update duration
			this.__duration = FBXAnimationControls.getAnimationTimeDisplayString(
				this.__animationAction.getClip().duration,
				this.__configuration.outputFormat
			);

			// Reset time display and slider
			if (this.isHTMLControlsAvailable) {
				this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
				this.animationSlider.value = '0';
				this.playButton.innerText = defaultIcons.PLAY;
			}

			// Update flags
			this.__playAnimationFlag = false;
			this.__stopAnimationFlag = true;

			// Dispatch events
			this.dispatch(eventTypes.ANIMATION_SELECTED, {
				animationInfo: this.__availableAnimations[index],
				previousIndex: previousIndex,
				currentIndex: index,
			});

			if (previousIndex !== index && previousIndex >= 0) {
				this.dispatch(eventTypes.ANIMATION_TRACK_CHANGED, {
					animationInfo: this.__availableAnimations[index],
					previousIndex: previousIndex,
					currentIndex: index,
				});
			}
		}
	}

	__updateAnimationSelector() {
		if (!this.__configuration.enableAnimationSelector || !this.animationSelector) {
			return;
		}

		// Clear existing options
		this.animationSelector.innerHTML = '';

		if (this.__availableAnimations.length === 0) {
			this.animationSelector.disabled = true;
			this.animationInfoDisplay.textContent = 'No animations';
			return;
		}

		// Add options for each animation
		this.__availableAnimations.forEach((animationInfo, index) => {
			const option = __createElement('option', {
				value: index.toString(),
				textContent: animationInfo.name,
			});
			this.animationSelector.appendChild(option);
		});

		// Set current selection
		if (this.__currentAnimationIndex >= 0) {
			this.animationSelector.value = this.__currentAnimationIndex.toString();
		}

		// Update info display
		this.__updateAnimationInfoDisplay();

		// Enable selector
		this.animationSelector.disabled = false;
	}

	__updateAnimationInfoDisplay() {
		if (!this.__configuration.enableAnimationSelector || !this.animationInfoDisplay) {
			return;
		}

		if (this.__currentAnimationIndex >= 0 && this.__availableAnimations.length > 0) {
			const currentTrack = this.__availableAnimations[this.__currentAnimationIndex];
			const durationStr = FBXAnimationControls.getAnimationTimeDisplayString(
				currentTrack.duration,
				this.__configuration.outputFormat
			);
			this.animationInfoDisplay.textContent = `${currentTrack.tracks} tracks, ${durationStr}`;
		} else {
			this.animationInfoDisplay.textContent = this.__availableAnimations.length > 0
				? `${this.__availableAnimations.length} animations available`
				: 'No animations';
		}
	}

	detach() {
		this.__attachedMesh = null;
		this.__animationAction = null;
		this.__availableAnimations = [];
		this.__animationTracks.clear();
		this.__currentAnimationIndex = -1;

		if (this.isHTMLControlsAvailable) {
			this.currentAnimationTime.innerText = `${this.__timePlaceholder} / ${this.__timePlaceholder}`;
			this.animationSlider.value = '0';
			this.playButton.innerText = defaultIcons.PLAY;

			// Reset animation selector
			if (this.__configuration.enableAnimationSelector && this.animationSelector) {
				this.animationSelector.innerHTML = '';
				this.animationSelector.disabled = true;
				this.animationInfoDisplay.textContent = 'No animations';
			}
		}
		this.dispatch(eventTypes.MESH_DETACHED);
		this.dispatch(eventTypes.STOP);
	}

	selectAnimation(index) {
		if (!this.__attachedMesh) {
			throw new Error('No mesh attached. Please attach a mesh before selecting animations.');
		}

		if (typeof index !== 'number' || index < 0 || index >= this.__availableAnimations.length) {
			throw new Error(`Invalid animation index. Must be between 0 and ${this.__availableAnimations.length - 1}`);
		}

		const wasPlaying = this.isPlaying;

		this.__setAnimationByIndex(index);

		// Update selector UI
		if (this.__configuration.enableAnimationSelector && this.animationSelector) {
			this.animationSelector.value = index.toString();
			this.__updateAnimationInfoDisplay();
		}

		// If animation was playing, start the new one
		if (wasPlaying) {
			this.play();
		}

		return this.__availableAnimations[index];
	}

	selectAnimationByName(name) {
		if (!this.__attachedMesh) {
			throw new Error('No mesh attached. Please attach a mesh before selecting animations.');
		}

		const animationIndex = this.__availableAnimations.findIndex(
			(anim) => anim.name === name
		);

		if (animationIndex === -1) {
			throw new Error(`Animation "${name}" not found. Available animations: ${this.__availableAnimations.map(a => a.name).join(', ')}`);
		}

		return this.selectAnimation(animationIndex);
	}

	getAnimationList() {
		return [...this.__availableAnimations];
	}

	getAnimationByIndex(index) {
		if (index >= 0 && index < this.__availableAnimations.length) {
			return this.__availableAnimations[index];
		}
		return null;
	}

	getAnimationByName(name) {
		return this.__availableAnimations.find(anim => anim.name === name) || null;
	}

	play() {
		if (this.__isAnimationAvailable) {
			if (this.isPaused || this.isStopped) {
				this.__playAnimationFlag = true;
				this.__stopAnimationFlag = false;
				if (this.isHTMLControlsAvailable) this.playButton.innerText = defaultIcons.PAUSE;
			}

			if (!this.__animationAction.isRunning()) {
				this.__animationAction.paused = false;
				this.__animationAction.play();
				this.dispatch(eventTypes.PLAY);
			}
		}
	}

	pause() {
		if (this.__isAnimationAvailable) {
			if (this.__playAnimationFlag) {
				this.__playAnimationFlag = false;
				if (this.isHTMLControlsAvailable) this.playButton.innerText = defaultIcons.PLAY;
				this.__animationAction.paused = true;
				this.dispatch(eventTypes.PAUSE);
			}
		}
	}

	stop() {
		if (this.__isAnimationAvailable) {
			if (this.isPlaying) {
				this.__playAnimationFlag = false;
				this.__stopAnimationFlag = true;
				this.__animationAction.stop();
				this.dispatch(eventTypes.STOP);
				if (this.isHTMLControlsAvailable) this.playButton.innerText = defaultIcons.STOP;
				this.setPercentage(0);
			}
		}
	}

	setTime(time) {
		if (this.__isAnimationAvailable) {
			this.__animationAction.time = typeof time === 'number' ? time : parseFloat(time);
			this.dispatch(eventTypes.CHANGE_TIME, this.__animationAction.time);
		}
	}

	setPercentage(percentage) {
		if (this.__isAnimationAvailable) {
			const calculatedTime = (parseFloat(percentage) / 100) * this.__animationAction.getClip().duration;
			// Ensure time is never negative due to floating-point precision issues
			this.__animationAction.time = Math.max(0, calculatedTime);
			if (this.isHTMLControlsAvailable) {
				this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
			}
			this.dispatch(eventTypes.CHANGE_TIME, this.__animationAction.time);
		}
	}

	getCurrentAnimationTimeDisplayString() {
		if (!this.__isAnimationAvailable) {
			return `${this.__timePlaceholder} / ${this.__timePlaceholder}`;
		}
		return `${FBXAnimationControls.getAnimationTimeDisplayString(
			this.__animationAction.time,
			this.__configuration.outputFormat
		)} / ${this.__duration}`;
	}

	update() {
		if (this.__attachedMesh && this.__attachedMesh.mixer) this.__attachedMesh.mixer.update(this.__clock.getDelta());
		if (this.__animationAction && this.isPlaying) this.__updateHTMLControlsIfAvailable();
	}

	__updateHTMLControlsIfAvailable() {
		if (this.isHTMLControlsAvailable) {
			this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
			// Use higher precision for slider value to reduce stepping issues during manual scrubbing
			this.animationSlider.value = `${(this.__animationAction.time / this.__animationAction.getClip().duration) * 100}`;

			// Update animation info display if enabled
			if (this.__configuration.enableAnimationSelector) {
				this.__updateAnimationInfoDisplay();
			}
		}
	}

	on(eventName, callback) {
		if (!(eventName in this.__eventCallbacks)) {
			this.__eventCallbacks[eventName] = [];
		}
		this.__eventCallbacks[eventName].push(callback);
	}

	dispatch(eventName, data) {
		if (eventName in this.__eventCallbacks) {
			this.__eventCallbacks[eventName].forEach((callback) => callback(data));
		}
	}
}
