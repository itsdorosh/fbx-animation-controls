# fbx-animation-controls

The easiest way to control FBX animations (almost 😇).

Time management, animation control, attaching different meshes, switching to next animation tracks (in development) and so on.

![fbx-animation-controls - how it looks like](./misc/fbx-animation-controls.png)

---

## Installation
`npm install fbx-animation-controls --save`

## Example of usage
```js
import {FBXAnimationControls} from 'fbx-animation-controls';

const controls = new FBXAnimationControls(document.getElementById('viewer'));

// in updateScene hook:
controls.update();

// in application logic:
controls.attach(mesh, {play: true, atTime: 0.123});
``` 

## Properties
- `attachedMesh: Mesh | null`
- `isPlaying: boolean`
- `isPaused: boolean`
- `isStopped: boolean`
- `isHTMLControlsAvailable: boolean`

## Methods
- `attach(mesh: Mesh, attachOptions: IAttachDetachOptions): void`
- `detach(): void`
- `play(): void`
- `pause(): void`
- `stop(): void`
- `setTime(time: string | number): void`
- `setPercentage(percentage: number): void`
- `getCurrentAnimationTimeDisplayString(): string`
- `update(): void`
- `on(eventName)`

## Event System
Plugin may provide some information on deman, by subcsription on available events.

Just call `controls.on(eventName)` and one of the following events (for now there is 7 events):

- PLAY
- PAUSE
- STOP
- MESH_ATTACHED
- MESH_DETACHED
- CHANGE_PERCENTAGE
- CHANGE_TIME

## Styling

So, for now you have two options for styling animation controls:

- add to your main html file following (of course with correcting path):

    ```html
        <link rel="stylesheet" href="./node_modules/fbx-animation-controls/src/themes/default.css" />
    ```
- or add your own styles for the following selectors:

    **general**:
    - `.animationSlider`
    - `.playButton`
    - `.currentAnimationTime`

    **for a track**:
    - `.animationSlider::-webkit-slider-runnable-track`
    - `.animationSlider::-moz-range-track`
    - `.animationSlider::-ms-track`

    **for a thumb**:
    - `.animationSlider::-webkit-slider-thumb`
    - `.animationSlider::-moz-range-thumb`
    - `.animationSlider::-ms-thumb`
