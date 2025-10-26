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
		this.__configuration = configuration;
		this.__timePlaceholder = timePlaceholders[configuration.outputFormat];
		this.__attachedMesh = null;
		this.__animationAction = null;
		this.__playAnimationFlag = false;
		this.__stopAnimationFlag = true;
		this.__duration = this.__timePlaceholder;
		this.__innerContainer = domElement;
		this.__clock = new Clock();
		this.__eventCallbacks = {};
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

	get __isAnimationAvailable() {
		return this.__attachedMesh && this.__animationAction;
	}

	static getAnimationTimeDisplayString(time, outputFormat) {
		if (time === undefined || isNaN(time)) throw new Error("property 'time' can't be undefined or NaN");

		let t = new Date(parseInt((time * 1000).toFixed(0)));

		let ms = (t.getMilliseconds() / 10).toFixed(0);
		ms = ms < 10 ? '0' + ms : ms === '100' ? '00' : ms;
		let ss = t.getSeconds();
		ss = ss < 10 ? '0' + ss : ss;
		let mm = t.getMinutes();
		mm = ms === '00' ? mm++ : mm;
		mm = mm < 10 ? '0' + mm : mm;

		return outputFormat === outputTimeFormats.MM_SS_MS ? `${mm}:${ss}:${ms}` : `${ss}:${ms}`;
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

		this.animationControlsContainer = __createElement(
			'div',
			{ className: 'animationControlsContainer' },
			this.animationSlider,
			this.playButton,
			this.currentAnimationTime
		);

		this.__innerContainer.appendChild(this.animationControlsContainer);

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
	}

	attach(mesh, attachOptions) {
		if (!this.__attachedMesh || this.__attachedMesh !== mesh) {
			this.__attachedMesh = mesh;
			this.__attachedMesh.mixer = new AnimationMixer(mesh);
			this.__animationAction = this.__attachedMesh.mixer.clipAction(this.__attachedMesh.animations[0]);
			this.__duration = FBXAnimationControls.getAnimationTimeDisplayString(
				this.__animationAction.getClip().duration,
				this.__configuration.outputFormat
			);

			if (attachOptions) {
				if (attachOptions.play) this.play();
				if (attachOptions.atTime) this.setTime(attachOptions.atTime);
			}

			this.dispatch(eventTypes.MESH_ATTACHED);
		} else {
			throw new Error('already attached');
		}
	}

	detach() {
		this.__attachedMesh = null;
		this.__animationAction = null;
		if (this.isHTMLControlsAvailable) {
			this.currentAnimationTime.innerText = `${this.__timePlaceholder} / ${this.__timePlaceholder}`;
			this.animationSlider.value = '0';
			this.playButton.innerText = defaultIcons.PLAY;
		}
		this.dispatch(eventTypes.MESH_DETACHED);
		this.dispatch(eventTypes.STOP);
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
			this.__animationAction.time = (parseFloat(percentage) / 100) * this.__animationAction.getClip().duration;
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
			this.animationSlider.value = `${(this.__animationAction.time.toFixed(3) / this.__animationAction.getClip().duration) * 100}`;
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
