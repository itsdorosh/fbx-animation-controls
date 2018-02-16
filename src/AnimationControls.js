class AnimationControls {
    constructor(domElement, options){
        this.innerContainer = domElement;
        this.initialSettings = options;
        this._attachedMesh = null;
    }

    _init(){
        this.animationSlider = document.createElement('input');

        const props = {
            'type': 'range',
            'min': '0',
            'max': '100',
            'step': 'any',
            'id': 'animationSlider',
            'class': 'animationSlider'
        }

        for(let key in props){
          this.animationSlider[key] = props[key];
        }

        this.innerContainer.appendChild(this.animationSlider);
    }

    attach(mesh){
        if (this._attachedMesh !== mesh) {
            this._attachedMesh = mesh;
            console.log(this._attachedMesh);
        } else {
            return new Error('already attached');
        }
    }

    detach(){
      this._attachedMesh = undefined;
			this.visible = false;
    }

    update(){
      this.playerCurrentTime.innerText = parseFloat(this._animationAction.time).toFixed(2);
      this.animationSlider.value = `${(this._animationAction.time.toFixed(3) * 1000 / this._animationAction.loop) * 100 }`;
    }
}
