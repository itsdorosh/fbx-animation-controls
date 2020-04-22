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
- `setPersentage(persentage: number): void`
- `getCurrentAnimationTimeDisplayString(): string`
- `update(): void`
