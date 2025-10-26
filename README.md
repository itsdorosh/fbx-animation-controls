# fbx-animation-controls

The easiest way to control FBX animations with Three.js (almost 😇).

Provides time management, animation control, mesh attachment, and HTML-based controls for FBX animations in Three.js applications.

![fbx-animation-controls - how it looks like](./misc/fbx-animation-controls.png)

---

## 🚀 Installation

```bash
npm install fbx-animation-controls --save
```

## 📖 Basic Usage

### JavaScript

```js
import { FBXAnimationControls } from 'fbx-animation-controls';

const controls = new FBXAnimationControls(document.getElementById('viewer'));

// Attach an FBX mesh with animations
controls.attach(mesh, { play: true, atTime: 0.123 });

// In your render loop:
function animate() {
    controls.update();
    // ... your other render code
    requestAnimationFrame(animate);
}
```

### TypeScript

```ts
import { FBXAnimationControls, IAttachOptions, IControlsConfiguration, OutputTimeFormats } from 'fbx-animation-controls';

const config: IControlsConfiguration = {
    outputFormat: OutputTimeFormats.MM_SS_MS,
    initHTMLControls: true
};

const controls = new FBXAnimationControls(document.getElementById('viewer')!, config);

const attachOptions: IAttachOptions = {
    play: true,
    atTime: 2.5
};

controls.attach(mesh, attachOptions);
```

## 📋 API Reference

### Properties

- `attachedMesh: Mesh | null` - Currently attached Three.js mesh
- `isPlaying: boolean` - Whether animation is currently playing
- `isPaused: boolean` - Whether animation is paused
- `isStopped: boolean` - Whether animation is stopped
- `isHTMLControlsAvailable: boolean` - Whether HTML controls are initialized

### Methods

#### `attach(mesh: Mesh, attachOptions?: IAttachOptions): void`

Attach a Three.js mesh with FBX animations.

**Parameters:**

- `mesh` - Three.js Mesh object with animations
- `attachOptions` - Optional configuration object
  - `play?: boolean` - Auto-play animation after attachment
  - `atTime?: string | number` - Start time for the animation

#### `detach(): void`

Detach the current mesh and reset controls.

#### `play(): void`

Start playing the animation.

#### `pause(): void`

Pause the animation at current time.

#### `stop(): void`

Stop the animation and reset to beginning.

#### `setTime(time: string | number): void`

Set the current animation time.

#### `setPercentage(percentage: number): void`

Set animation progress as percentage (0-100).

#### `getCurrentAnimationTimeDisplayString(): string`

Get formatted string of current animation time.

#### `update(): void`

Update the animation mixer. **Call this in your render loop!**

#### `on(eventName: string, callback: (data?: any) => void): void`

Subscribe to animation events.

### Configuration

```ts
interface IControlsConfiguration {
    outputFormat?: OutputTimeFormats;  // Time display format
    initHTMLControls?: boolean;        // Whether to create HTML controls
}

enum OutputTimeFormats {
    MM_SS_MS = 'MM_SS_MS',  // 01:23:45 format
    SS_MS = 'SS_MS'         // 23:45 format
}
```

## 🎯 Event System

Subscribe to events to get notified of animation state changes:

```js
controls.on('PLAY', () => console.log('Animation started'));
controls.on('PAUSE', () => console.log('Animation paused'));
controls.on('STOP', () => console.log('Animation stopped'));
controls.on('MESH_ATTACHED', () => console.log('Mesh attached'));
controls.on('MESH_DETACHED', () => console.log('Mesh detached'));
controls.on('CHANGE_PERCENTAGE', (percentage) => console.log('Progress:', percentage));
controls.on('CHANGE_TIME', (time) => console.log('Time:', time));
```

**Available Events:**

- `PLAY` - Animation started
- `PAUSE` - Animation paused  
- `STOP` - Animation stopped
- `MESH_ATTACHED` - Mesh attached to controls
- `MESH_DETACHED` - Mesh detached from controls
- `CHANGE_PERCENTAGE` - Animation progress changed
- `CHANGE_TIME` - Animation time changed

## 🎨 Styling

### Option 1: Use Default Styles

Add to your HTML file:

```html
<link rel="stylesheet" href="./node_modules/fbx-animation-controls/src/themes/default.css" />
```

### Option 2: Custom Styles

Style these CSS selectors according to your design:

**General Elements:**

- `.animationSlider` - Range input slider
- `.playButton` - Play/pause button
- `.currentAnimationTime` - Time display text

**Slider Track (cross-browser):**

- `.animationSlider::-webkit-slider-runnable-track` (WebKit)
- `.animationSlider::-moz-range-track` (Firefox)
- `.animationSlider::-ms-track` (IE/Edge)

**Slider Thumb (cross-browser):**

- `.animationSlider::-webkit-slider-thumb` (WebKit)
- `.animationSlider::-moz-range-thumb` (Firefox)
- `.animationSlider::-ms-thumb` (IE/Edge)

## 🔧 Development

```bash
# Lint code
npm run lint

# Format code  
npm run format

# Check everything
npm run check
```

## 📄 License

MIT

## 🤝 Contributing

Issues and pull requests are welcome!
