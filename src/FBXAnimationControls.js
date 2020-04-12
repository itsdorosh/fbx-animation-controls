const ICONS = {
	'PLAY': '▶️', 'PAUSE': '⏸', 'STOP': '⏹',
	'REPEAT': '🔁', 'REPEAT_ONCE': '🔂', 'SHUFFLE': '🔀',
	'REWIND': '⏪', 'FORWARD': '⏩',
	'PREVIOUS': '⏮', 'NEXT': '⏭'
};

const _createElement = function (tag, props, ...children) {
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

class FBXAnimationControls {

	static getAnimationTimeDisplayString(time) {
		if (!time) return;

		let t = new Date(parseInt((time * 1000).toFixed(0)));

		let mm = t.getMinutes();
		mm = mm < 10 ? '0' + mm : mm;
		let ss = t.getSeconds();
		ss = ss < 10 ? '0' + ss : ss;
		let ms = (t.getMilliseconds() / 10).toFixed(0);
		ms = ms < 10 ? '0' + ms : ms;

		return `${mm}:${ss}:${ms}`;
	}

	#attachedMesh;
	#animationAction;
	#playAnimationFlag = false;

	/**
	 * @class FBXAnimationControls
	 * @param domElement - where controls should appears
	 * @param clock - global THREE.Clock
	 */
	constructor(domElement, clock) {
		this.innerContainer = domElement;
		this.clock = clock;
		this._animationDurationDisplayString = '--:--:--';

		// TODO: display type like mm:ss:ms or ss:ms (configurable from options passed in constructor)
		// TODO: Implement properties _attachedMesh & #playAnimationFlag as getter/setter
		this.#init();
	}

	#init() {
		this.animationSlider = _createElement('input', {
			type: 'range',
			min: 0,
			max: 100,
			step: 'any',
			className: 'animationSlider'
		});

		this.playButton = _createElement(
			'div',
			{className: 'playButton'},
			ICONS.PLAY
		);

		this.currentTimeAnimation = _createElement(
			'p',
			{className: 'currentTimeAnimation'},
			`--:--:-- / ${this._animationDurationDisplayString}`
		);

		this.animationControlsContainer = _createElement(
			'div',
			{className: 'animationControlsContainer'},
			this.animationSlider, this.playButton, this.currentTimeAnimation
		);

		this.innerContainer.appendChild(this.animationControlsContainer);

		let status;

		this.animationSlider.addEventListener('mousedown', () => {
			status = this.#playAnimationFlag;
			this.pause();
		}, false);

		this.animationSlider.addEventListener('input', () => {
			this.setTimePercentage(this.animationSlider.value);
		}, false);

		this.animationSlider.addEventListener('mouseup', () => {
			if (status) this.play();
		}, false);

		this.playButton.addEventListener('click', () => {
			if (this.#playAnimationFlag) this.pause();
			else this.play();
		});
	}

	attach(mesh, props) {
		if (this.#attachedMesh !== mesh) {
			this.#attachedMesh = mesh;
			this.#attachedMesh.mixer = new THREE.AnimationMixer(mesh);
			this.#animationAction = this.#attachedMesh.mixer.clipAction(this.#attachedMesh.animations[0]);
			this._animationDurationDisplayString = FBXAnimationControls.getAnimationTimeDisplayString(this.#animationAction._clip.duration);
			if (props && props.needPlay) {
				this.play();
			}
		} else {
			return new Error('already attached');
		}
	}

	detach() {
		this.#attachedMesh = undefined;
		this.#animationAction = undefined;
		this.currentTimeAnimation.innerText = '--:--:--';
		this.animationSlider.value = '50';
		this.playButton.innerText = ICONS.STOP;
	}

	play() {
		if (this.#attachedMesh && this.#animationAction) {
			if (!this.#playAnimationFlag) {
				this.#playAnimationFlag = true;
				this.playButton.innerText = ICONS.PAUSE;
				this.#animationAction.paused = false;
			}
			if (!this.#animationAction.isRunning()) {
				this.#animationAction.play();
			}
		}
	}

	pause() {
		if (this.#attachedMesh && this.#animationAction) {
			if (this.#playAnimationFlag) {
				this.#playAnimationFlag = false;
				this.playButton.innerText = ICONS.PLAY;
				this.#animationAction.paused = true;
			}
		}
	}

	setTimePercentage(percentage) {
		if (this.#attachedMesh && this.#animationAction) {
			this.#animationAction.time = (parseFloat(percentage) / 100) * this.#animationAction._clip.duration;
			this.currentTimeAnimation.innerText = this.getCurrentAnimationTimeDisplayString();
		}
	}

	getCurrentAnimationTimeDisplayString() {
		return `${FBXAnimationControls.getAnimationTimeDisplayString(this.#animationAction.time)} / ${this._animationDurationDisplayString}`;
	}

	/**
	 * @method update
	 * @description you should use this method where your animation-loop function is called
	 */
	update() {
		if (this.#attachedMesh && this.#attachedMesh.mixer) this.#attachedMesh.mixer.update(this.clock.getDelta());
		if (this.#animationAction && this.#playAnimationFlag) {
			this.currentTimeAnimation.innerText = this.getCurrentAnimationTimeDisplayString();
			this.animationSlider.value = `${(this.#animationAction.time.toFixed(3) / this.#animationAction._clip.duration) * 100}`;
		}
	}
}
