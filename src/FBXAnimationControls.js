import {Clock, AnimationMixer} from "three";

const ICONS = {
	'PLAY': '▶️',
	'PAUSE': '⏸',
	'STOP': '⏹',
	'REPEAT': '🔁',
	'REPEAT_ONCE': '🔂',
	'SHUFFLE': '🔀',
	'REWIND': '⏪',
	'FORWARD': '⏩',
	'PREVIOUS': '⏮',
	'NEXT': '⏭'
};

const __createElement = function (tag, props, ...children) {
	const element = document.createElement(tag);

	Object.keys(props).forEach(key => element[key] = props[key]);

	if (children.length > 0) {
		children.forEach(child => {
			if (typeof child === 'string') {
				child = document.createTextNode(child);
			}
			element.appendChild(child);
		});
	}
	return element;
};

// TODO: add JSDoc in d.ts file with description of each method
// TODO: add description about each css-class for customization

// TODO: add implementation for setTime() method
// TODO: add configurable thing for enable/disable html-elements for control animation
// TODO: display type like mm:ss:ms or ss:ms (configurable from options passed in constructor)
// TODO: add simple event system for notify about some events (e.g ANIMATION_STARTED, ANIMATION_PAUSED, ANIMATION_STOPPED)
export class FBXAnimationControls {

	static getAnimationTimeDisplayString(time) {
		if (time === undefined || isNaN(time)) throw new Error(`property 'time' can't be undefined or NaN`);

		let t = new Date(parseInt((time * 1000).toFixed(0)));

		let mm = t.getMinutes();
		mm = mm < 10 ? '0' + mm : mm;
		let ss = t.getSeconds();
		ss = ss < 10 ? '0' + ss : ss;
		let ms = (t.getMilliseconds() / 10).toFixed(0);
		ms = ms < 10 ? '0' + ms : ms;

		return `${mm}:${ss}:${ms}`;
	}

	constructor(domElement) {
		this.__attachedMesh = null;
		this.__animationAction = null;
		this.__playAnimationFlag = false;
		this.__duration = '--:--:--';
		this.__innerContainer = domElement;
		this.__clock = new Clock();
		this.__init();
	}

	__init() {
		this.animationSlider = __createElement('input', {
			type: 'range',
			min: 0,
			max: 100,
			step: 'any',
			className: 'animationSlider'
		});

		this.playButton = __createElement(
			'div',
			{className: 'playButton'},
			ICONS.PLAY
		);

		this.currentAnimationTime = __createElement(
			'p',
			{className: 'currentAnimationTime'},
			`--:--:-- / ${this.__duration}`
		);

		this.animationControlsContainer = __createElement(
			'div',
			{className: 'animationControlsContainer'},
			this.animationSlider, this.playButton, this.currentAnimationTime
		);

		this.__innerContainer.appendChild(this.animationControlsContainer);

		let status;

		this.animationSlider.addEventListener('mousedown', () => {
			status = this.__playAnimationFlag;
			this.pause();
		}, false);

		this.animationSlider.addEventListener('input', () => {
			this.setPercentage(this.animationSlider.value);
		}, false);

		this.animationSlider.addEventListener('mouseup', () => {
			if (status) this.play();
		}, false);

		this.playButton.addEventListener('click', () => {
			if (this.__playAnimationFlag) this.pause();
			else this.play();
		});
	}

	__isAnimationAvailable() {
		return this.__attachedMesh && this.__animationAction;
	}

	attach(mesh, attachOptions) {
		if (this.__attachedMesh !== mesh) {
			this.__attachedMesh = mesh;
			this.__attachedMesh.mixer = new AnimationMixer(mesh);
			this.__animationAction = this.__attachedMesh.mixer.clipAction(this.__attachedMesh.animations[0]);
			this.__duration = FBXAnimationControls.getAnimationTimeDisplayString(this.__animationAction.getClip().duration);
			if (attachOptions && attachOptions.play) {
				this.play();
			}
		} else {
			throw new Error('already attached');
		}
	}

	get attachedMesh() {
		return this.__attachedMesh;
	}

	detach() {
		this.__attachedMesh = undefined;
		this.__animationAction = undefined;
		this.currentAnimationTime.innerText = '--:--:--';
		this.animationSlider.value = '50';
		this.playButton.innerText = ICONS.STOP;
	}

	play() {
		if (this.__isAnimationAvailable()) {
			if (!this.__playAnimationFlag) {
				this.__playAnimationFlag = true;
				this.playButton.innerText = ICONS.PAUSE;
				this.__animationAction.paused = false;
			}
			if (!this.__animationAction.isRunning()) {
				this.__animationAction.play();
			}
		}
	}

	get isPlaying() {
		return this.__playAnimationFlag;
	}

	pause() {
		if (this.__isAnimationAvailable()) {
			if (this.__playAnimationFlag) {
				this.__playAnimationFlag = false;
				this.playButton.innerText = ICONS.PLAY;
				this.__animationAction.paused = true;
			}
		}
	}

	get isPaused() {
		return !this.__playAnimationFlag;
	}

	stop() {
		if (this.__isAnimationAvailable()) {
			if (this.__playAnimationFlag) {
				this.__playAnimationFlag = false;
				this.playButton.innerText = ICONS.STOP;
				// TODO: research for this.__animationAction.stop
				this.__animationAction.paused = true;
				this.setPercentage(0);
			}
		}
	}

	get isStopped() {
		// TODO: add private flag for it
		return !this.__playAnimationFlag;
	}

	setTime(time) {
	}

	setPercentage(percentage) {
		if (this.__isAnimationAvailable()) {
			this.__animationAction.time = (parseFloat(percentage) / 100) * this.__animationAction.getClip().duration;
			this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
		}
	}

	getCurrentAnimationTimeDisplayString() {
		return `${FBXAnimationControls.getAnimationTimeDisplayString(this.__animationAction.time)} / ${this.__duration}`;
	}

	update() {
		if (this.__attachedMesh && this.__attachedMesh.mixer) this.__attachedMesh.mixer.update(this.__clock.getDelta());
		if (this.__animationAction && this.__playAnimationFlag) {
			this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
			this.animationSlider.value =
				`${(this.__animationAction.time.toFixed(3) / this.__animationAction.getClip().duration) * 100}`;
		}
	}
}
