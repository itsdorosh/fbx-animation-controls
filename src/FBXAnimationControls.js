class FBXAnimationControls {
	constructor(domElement, clock, options) {
		this.innerContainer = domElement;
		this.clock = clock;
		this.initialSettings = options;
		this._attachedMesh = undefined;
		this._animationAction = undefined;
		this._playAnimation = false;

		// TODO: display type like mm:ss:ms or ss:ms
		this.ICONS = {
			'PLAY': '▶️', 'PAUSE': '⏸', 'STOP': '⏹',
			'REPEAT': '🔁', 'REPEAT_ONCE': '🔂', 'SHUFFLE': '🔀',
			'REWIND': '⏪', 'FORWARD': '⏩',
			'PREVIOUS': '⏮', 'NEXT': '⏭'
		};

		// TODO: Implement properties _attachedMesh & _playAnimation as getter/setter
		this._init();
	}

	_init() {
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

		this.animationSlider = _createElement('input', {
			'type': 'range', 'min': '0', 'max': '100', 'step': 'any', 'className': 'animationSlider'
		});
		this.playButton = _createElement('div', { 'className': 'playButton' }, this.ICONS.PLAY);
		this.currentTimeAnimation = _createElement('p', { 'className': 'currentTimeAnimation' }, '--:--');
		this.animationControlsContainer = _createElement('div', { 'className': 'animationControlsContainer' },
			this.animationSlider, this.playButton, this.currentTimeAnimation);

		this.innerContainer.appendChild(this.animationControlsContainer);

		let status;

		this.animationSlider.addEventListener('mousedown', () => {
			status = this._playAnimation;
			this.pause();
		}, false);

		this.animationSlider.addEventListener('input', () => {
			this.SetTimePercentage(this.animationSlider.value);
		}, false);

		this.animationSlider.addEventListener('mouseup', () => {
			if (status) this.play();
		}, false);

		this.playButton.addEventListener('click', () => {
			if (this._playAnimation) this.pause();
			else this.play();
		});
	}

	play() {
		if (this._attachedMesh && this._animationAction) {
			if (!this._playAnimation) {
				this._playAnimation = true;
				this.playButton.innerText = this.ICONS.PAUSE;
				this._animationAction.paused = false;
			}
			if (!this._animationAction.isRunning()) {
				this._animationAction.play();
			}
		}
	}

	pause() {
		if (this._attachedMesh && this._animationAction) {
			if (this._playAnimation) {
				this._playAnimation = false;
				this.playButton.innerText = this.ICONS.PLAY;
				this._animationAction.paused = true;
			}
		}
	}

	SetTimePercentage(percentage) {
		if (this._attachedMesh && this._animationAction) {
			this._animationAction.time = (parseFloat(percentage) / 100) * this._animationAction._clip.duration;
			this.currentTimeAnimation.innerText = parseFloat(this._animationAction.time).toFixed(2);
		}
	}

	attach(mesh, props) {
		if (this._attachedMesh !== mesh) {
			this._attachedMesh = mesh;
			this._attachedMesh.mixer = new THREE.AnimationMixer(mesh);
			this._animationAction = this._attachedMesh.mixer.clipAction(this._attachedMesh.animations[0]);
			if (props && props.needPlay) {
				this.play();
			}
		} else {
			return new Error('already attached');
		}
	}

	detach(needHide) {
		this._attachedMesh = undefined;
		this._animationAction = undefined;
		this.currentTimeAnimation.innerText = '--:--:--';
		this.animationSlider.value = '50';
		this.playButton.innerText = this.ICONS.STOP;
		this.visible = !needHide;
	}

	_timePrepare(time) {
		let t = new Date(parseInt((time * 1000).toFixed(0)));

		let mm = t.getUTCMinutes();
		mm = mm < 10 ? '0' + mm : mm;
		let ss = t.getUTCSeconds();
		ss = ss < 10 ? '0' + ss : ss;
		let ms = (t.getUTCMilliseconds() / 10).toFixed(0);
		ms = ms < 10 ? '0' + ms : ms;

		this.currentTimeAnimation.innerText = `${mm}:${ss}:${ms}`;
	}

	update() {
		if (this._attachedMesh && this._attachedMesh.mixer) this._attachedMesh.mixer.update(this.clock.getDelta());
		if (this._animationAction && this._playAnimation) {
			this.currentTimeAnimation.innerText = parseFloat(this._animationAction.time).toFixed(2);
			this.animationSlider.value = `${(this._animationAction.time.toFixed(3) / this._animationAction._clip.duration) * 100}`;
		}
	}
}
