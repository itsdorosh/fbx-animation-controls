# fbx-animation-controls

The easiest way to control FBX animations (almost 😇).

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
- n/a

## Methods
- `attach(mesh: Mesh, attachOptions: IAttachDetachOptions): void`
- `detach(detachOptions: IAttachDetachOptions): void`
- `play(): void`
- `pause(): void`
- `stop(): void`
- `setTime(time: string): void`
- `setPercentage(percentage: number): void`
- `getCurrentAnimationTimeDisplayString(): string`
- `update(): void`

## Styling

So, for now you have two options for styling animation controls:

- add to your main html file following (of course with correcting path):

    ```html
        <link rel="stylesheet" href="./node_modules/fbx-animation-controls/src/themes/default.css" />
    ```
- or add your own styles for the following selectors:

    general:
    - `.animationSlider`
    - `.playButton`
    - `.currentAnimationTime`

    for a track:
    - `.animationSlider::-webkit-slider-runnable-track`
    - `.animationSlider::-moz-range-track`
    - `.animationSlider::-ms-track`

    for a thumb:
    - `.animationSlider::-webkit-slider-thumb`
    - `.animationSlider::-moz-range-thumb`
    - `.animationSlider::-ms-thumb`
