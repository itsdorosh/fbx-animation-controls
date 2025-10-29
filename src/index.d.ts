// Type definitions for fbx-animation-controls
// Definitions by: Andrii Doroshenko https://github.com/itsdorosh

/// <reference types="three" />

import { AnimationAction, Clock, Mesh } from 'three';

/**
 * Supported output time formats for animation display
 */
export enum OutputTimeFormats {
	/** Minutes:Seconds:Milliseconds format (MM:SS:MS) */
	MM_SS_MS = 'MM_SS_MS',
	/** Seconds:Milliseconds format (SS:MS) */
	SS_MS = 'SS_MS',
}

/**
 * Options for attaching a mesh to the animation controls
 */
export interface IAttachOptions {
	/** Whether to start playing the animation immediately after attachment */
	play?: boolean;
	/** Set the animation to a specific time (in seconds) or time string */
	atTime?: string | number;
	/** Index of the animation to select initially (0-based). If not specified, uses autoSelectFirstAnimation setting */
	animationIndex?: number;
}

/**
 * Configuration options for the FBX Animation Controls
 */
export interface IControlsConfiguration {
	/** Format for displaying animation time */
	outputFormat?: OutputTimeFormats;
	/** Whether to initialize HTML controls for the animation */
	initHTMLControls?: boolean;
	/** Whether to enable animation selector dropdown for multiple animations */
	enableAnimationSelector?: boolean;
	/** Whether to automatically select the first animation when attaching a mesh */
	autoSelectFirstAnimation?: boolean;
}

/**
 * Event types that can be dispatched by the animation controls
 */
export enum EventTypes {
	/** Fired when animation starts playing */
	PLAY = 'PLAY',
	/** Fired when animation is paused */
	PAUSE = 'PAUSE',
	/** Fired when animation is stopped */
	STOP = 'STOP',
	/** Fired when a mesh is attached to the controls */
	MESH_ATTACHED = 'MESH_ATTACHED',
	/** Fired when a mesh is detached from the controls */
	MESH_DETACHED = 'MESH_DETACHED',
	/** Fired when animation percentage changes */
	CHANGE_PERCENTAGE = 'CHANGE_PERCENTAGE',
	/** Fired when animation time changes */
	CHANGE_TIME = 'CHANGE_TIME',
	/** Fired when an animation is selected (including first selection) */
	ANIMATION_SELECTED = 'ANIMATION_SELECTED',
	/** Fired when animation track changes (switching between different animations) */
	ANIMATION_TRACK_CHANGED = 'ANIMATION_TRACK_CHANGED',
}

/**
 * Callback function type for event handlers
 * @param data - Optional data passed with the event
 */
export type EventCallback = (data?: any) => void;

/**
 * Information about an animation track
 */
export interface IAnimationTrackInfo {
	/** Zero-based index of the animation */
	index: number;
	/** Name of the animation (from clip or generated) */
	name: string;
	/** Duration of the animation in seconds */
	duration: number;
	/** Number of tracks in the animation */
	tracks: number;
	/** Unique identifier for the animation */
	uuid: string;
}

/**
 * Data structure for animation selection events
 */
export interface IAnimationSelectionEventData {
	/** Information about the selected animation */
	animationInfo: IAnimationTrackInfo;
	/** Index of the previously selected animation (-1 if none) */
	previousIndex: number;
	/** Index of the currently selected animation */
	currentIndex: number;
}

/**
 * FBX Animation Controls - A comprehensive animation control system for Three.js FBX models
 *
 * This class provides a complete solution for controlling FBX animations in Three.js applications,
 * including play/pause/stop functionality, time scrubbing, and optional HTML UI controls.
 *
 * @example
 * ```typescript
 * const controls = new FBXAnimationControls(containerElement, {
 *   outputFormat: OutputTimeFormats.MM_SS_MS,
 *   initHTMLControls: true
 * });
 *
 * // Attach a mesh with animation
 * controls.attach(fbxMesh, { play: true });
 *
 * // In your render loop
 * controls.update();
 * ```
 */
export class FBXAnimationControls {
	private __attachedMesh: Mesh | null;
	private __animationAction: AnimationAction | null;
	private __playAnimationFlag: boolean;
	private __stopAnimationFlag: boolean;
	private __duration: string;
	private __innerContainer: Element | HTMLElement;
	private __clock: Clock;
	private __eventCallbacks: Record<string, EventCallback[]>;
	private __configuration: IControlsConfiguration;
	private __availableAnimations: IAnimationTrackInfo[];
	private __currentAnimationIndex: number;
	private __animationTracks: Map<number, any>;

	/**
	 * Creates a new FBX Animation Controls instance
	 *
	 * @param renderingNode - The DOM element that will contain the animation controls UI
	 * @param configuration - Optional configuration object for customizing behavior
	 *
	 * @example
	 * ```typescript
	 * const container = document.getElementById('animation-controls');
	 * const controls = new FBXAnimationControls(container, {
	 *   outputFormat: OutputTimeFormats.SS_MS,
	 *   initHTMLControls: false // Disable HTML controls for custom UI
	 * });
	 * ```
	 */
	constructor(renderingNode: Element | HTMLElement, configuration?: IControlsConfiguration);

	/**
	 * Gets the currently attached mesh
	 * @returns The attached Three.js Mesh object, or null if no mesh is attached
	 */
	public get attachedMesh(): Mesh | null;

	/**
	 * Checks if the animation is currently playing
	 * @returns True if the animation is playing, false otherwise
	 */
	public get isPlaying(): boolean;

	/**
	 * Checks if the animation is currently paused
	 * @returns True if the animation is paused, false otherwise
	 */
	public get isPaused(): boolean;

	/**
	 * Checks if the animation is currently stopped
	 * @returns True if the animation is stopped, false otherwise
	 */
	public get isStopped(): boolean;

	/**
	 * Checks if HTML controls are available and initialized
	 * @returns True if HTML controls are available, false otherwise
	 */
	public get isHTMLControlsAvailable(): boolean;

	/**
	 * Gets the list of available animations in the attached mesh
	 * @returns Array of animation track information
	 */
	public get availableAnimations(): IAnimationTrackInfo[];

	/**
	 * Gets the index of the currently selected animation
	 * @returns Current animation index, or -1 if none selected
	 */
	public get currentAnimationIndex(): number;

	/**
	 * Gets information about the currently selected animation track
	 * @returns Current animation track info, or null if none selected
	 */
	public get currentAnimationTrack(): IAnimationTrackInfo | null;

	/**
	 * Checks if the attached mesh has multiple animations
	 * @returns True if there are multiple animations available
	 */
	public get hasMultipleAnimations(): boolean;

	/**
	 * Checks if the animation selector feature is enabled
	 * @returns True if animation selector is enabled in configuration
	 */
	public get isAnimationSelectorEnabled(): boolean;

	/**
	 * Converts animation time to a formatted display string
	 *
	 * @param time - Time in seconds to convert
	 * @param outputFormat - The format to use for the output string
	 * @returns Formatted time string (e.g., "01:23:45" or "23:45")
	 * @throws Error if time is undefined or NaN
	 *
	 * @example
	 * ```typescript
	 * const timeString = FBXAnimationControls.getAnimationTimeDisplayString(
	 *   65.5,
	 *   OutputTimeFormats.MM_SS_MS
	 * ); // Returns "01:05:50"
	 * ```
	 */
	static getAnimationTimeDisplayString(time: number, outputFormat: OutputTimeFormats): string;

	/**
	 * Gets information about an animation track from a Three.js AnimationClip
	 *
	 * @param animationClip - The Three.js AnimationClip to analyze
	 * @param index - The index of this animation in the collection
	 * @returns Animation track information object
	 * @throws Error if animationClip is null or undefined
	 *
	 * @example
	 * ```typescript
	 * const trackInfo = FBXAnimationControls.getAnimationTrackInfo(clip, 0);
	 * console.log(`Animation: ${trackInfo.name}, Duration: ${trackInfo.duration}s`);
	 * ```
	 */
	static getAnimationTrackInfo(animationClip: any, index: number): IAnimationTrackInfo;

	/**
	 * Initializes the HTML controls UI (private method)
	 * @private
	 */
	private __init(): void;

	/**
	 * Updates HTML controls if they are available (private method)
	 * @private
	 */
	private __updateHTMLControlsIfAvailable(): void;

	/**
	 * Attaches a Three.js mesh with FBX animation to the controls
	 *
	 * @param mesh - The Three.js Mesh object containing FBX animations
	 * @param attachOptions - Optional settings for attachment behavior
	 * @throws Error if a mesh is already attached
	 *
	 * @example
	 * ```typescript
	 * // Attach and start playing immediately at 50% progress
	 * controls.attach(fbxMesh, {
	 *   play: true,
	 *   atTime: totalDuration * 0.5
	 * });
	 * ```
	 */
	public attach(mesh: Mesh, attachOptions?: IAttachOptions): void;

	/**
	 * Detaches the currently attached mesh and resets the controls
	 *
	 * This method stops any playing animation, clears the attached mesh,
	 * and resets the UI controls to their default state.
	 *
	 * @example
	 * ```typescript
	 * controls.detach();
	 * // Controls are now ready for a new mesh
	 * ```
	 */
	public detach(): void;

	/**
	 * Starts or resumes animation playback
	 *
	 * If the animation is paused, it will resume from the current position.
	 * If the animation is stopped, it will start from the beginning.
	 *
	 * @example
	 * ```typescript
	 * controls.play();
	 * ```
	 */
	public play(): void;

	/**
	 * Pauses the animation at the current position
	 *
	 * The animation can be resumed later using the play() method.
	 *
	 * @example
	 * ```typescript
	 * controls.pause();
	 * ```
	 */
	public pause(): void;

	/**
	 * Stops the animation and resets it to the beginning
	 *
	 * Unlike pause(), this method resets the animation position to 0%.
	 *
	 * @example
	 * ```typescript
	 * controls.stop();
	 * ```
	 */
	public stop(): void;

	/**
	 * Sets the animation to a specific time position
	 *
	 * @param time - Time in seconds (as number) or time string to set the animation to
	 *
	 * @example
	 * ```typescript
	 * controls.setTime(30.5); // Set to 30.5 seconds
	 * controls.setTime("45");  // Set to 45 seconds
	 * ```
	 */
	public setTime(time: string | number): void;

	/**
	 * Sets the animation position as a percentage of total duration
	 *
	 * @param percentage - Percentage (0-100) of the animation duration
	 *
	 * @example
	 * ```typescript
	 * controls.setPercentage(50); // Set to 50% (middle) of animation
	 * controls.setPercentage(0);  // Reset to beginning
	 * controls.setPercentage(100); // Jump to end
	 * ```
	 */
	public setPercentage(percentage: number): void;

	/**
	 * Gets the current animation time as a formatted display string
	 *
	 * @returns Formatted string showing current time and total duration
	 *          (e.g., "01:23:45 / 02:30:00")
	 *
	 * @example
	 * ```typescript
	 * const timeDisplay = controls.getCurrentAnimationTimeDisplayString();
	 * console.log(timeDisplay); // "00:15:30 / 01:05:20"
	 * ```
	 */
	public getCurrentAnimationTimeDisplayString(): string;

	/**
	 * Updates the animation mixer and controls
	 *
	 * This method must be called in your render loop to keep the animation
	 * and UI controls synchronized.
	 *
	 * @example
	 * ```typescript
	 * function animate() {
	 *   controls.update();
	 *   renderer.render(scene, camera);
	 *   requestAnimationFrame(animate);
	 * }
	 * ```
	 */
	public update(): void;

	/**
	 * Registers an event listener for animation control events
	 *
	 * @param eventName - The event type to listen for
	 * @param callback - Function to call when the event is fired
	 *
	 * @example
	 * ```typescript
	 * controls.on(EventTypes.PLAY, () => {
	 *   console.log('Animation started playing');
	 * });
	 *
	 * controls.on(EventTypes.CHANGE_TIME, (time) => {
	 *   console.log('Animation time changed to:', time);
	 * });
	 * ```
	 */
	public on(eventName: EventTypes | string, callback: EventCallback): void;

	/**
	 * Manually dispatches an event to all registered listeners
	 *
	 * @param eventName - The event type to dispatch
	 * @param data - Optional data to pass to event listeners
	 *
	 * @example
	 * ```typescript
	 * controls.dispatch(EventTypes.PLAY);
	 * controls.dispatch('custom-event', { customData: 'value' });
	 * ```
	 */
	public dispatch(eventName: EventTypes | string, data?: any): void;

	/**
	 * Selects an animation by its index
	 *
	 * @param index - Zero-based index of the animation to select
	 * @returns Information about the selected animation
	 * @throws Error if no mesh is attached or index is invalid
	 *
	 * @example
	 * ```typescript
	 * const selectedAnimation = controls.selectAnimation(1);
	 * console.log(`Selected: ${selectedAnimation.name}`);
	 * ```
	 */
	public selectAnimation(index: number): IAnimationTrackInfo;

	/**
	 * Selects an animation by its name
	 *
	 * @param name - Name of the animation to select
	 * @returns Information about the selected animation
	 * @throws Error if no mesh is attached or animation name not found
	 *
	 * @example
	 * ```typescript
	 * const selectedAnimation = controls.selectAnimationByName('Run');
	 * console.log(`Selected: ${selectedAnimation.name}`);
	 * ```
	 */
	public selectAnimationByName(name: string): IAnimationTrackInfo;

	/**
	 * Gets a list of all available animations
	 *
	 * @returns Array of animation track information (copy of internal array)
	 *
	 * @example
	 * ```typescript
	 * const animations = controls.getAnimationList();
	 * animations.forEach((anim, index) => {
	 *   console.log(`${index}: ${anim.name} (${anim.duration}s)`);
	 * });
	 * ```
	 */
	public getAnimationList(): IAnimationTrackInfo[];

	/**
	 * Gets animation information by index
	 *
	 * @param index - Zero-based index of the animation
	 * @returns Animation track information, or null if index is invalid
	 *
	 * @example
	 * ```typescript
	 * const animation = controls.getAnimationByIndex(0);
	 * if (animation) {
	 *   console.log(`First animation: ${animation.name}`);
	 * }
	 * ```
	 */
	public getAnimationByIndex(index: number): IAnimationTrackInfo | null;

	/**
	 * Gets animation information by name
	 *
	 * @param name - Name of the animation to find
	 * @returns Animation track information, or null if not found
	 *
	 * @example
	 * ```typescript
	 * const walkAnimation = controls.getAnimationByName('Walk');
	 * if (walkAnimation) {
	 *   console.log(`Walk animation duration: ${walkAnimation.duration}s`);
	 * }
	 * ```
	 */
	public getAnimationByName(name: string): IAnimationTrackInfo | null;
}
