// Type definitions for fbx-animation-controls
// Definitions by: Andrii Doroshenko https://github.com/itsdorosh

/// <reference types="three" />

import { AnimationAction, Clock, Mesh } from 'three';

export enum OutputTimeFormats {
	MM_SS_MS = 'MM_SS_MS',
	SS_MS = 'SS_MS',
}

export interface IAttachOptions {
	play?: boolean;
	atTime?: string | number;
}

export interface IControlsConfiguration {
	outputFormat?: OutputTimeFormats;
	initHTMLControls?: boolean;
}

export enum EventTypes {
	PLAY = 'PLAY',
	PAUSE = 'PAUSE',
	STOP = 'STOP',
	MESH_ATTACHED = 'MESH_ATTACHED',
	MESH_DETACHED = 'MESH_DETACHED',
	CHANGE_PERCENTAGE = 'CHANGE_PERCENTAGE',
	CHANGE_TIME = 'CHANGE_TIME',
}

export type EventCallback = (data?: any) => void;

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

	constructor(renderingNode: Element | HTMLElement, configuration?: IControlsConfiguration);

	public get attachedMesh(): Mesh | null;

	public get isPlaying(): boolean;

	public get isPaused(): boolean;

	public get isStopped(): boolean;

	public get isHTMLControlsAvailable(): boolean;

	static getAnimationTimeDisplayString(time: number, outputFormat: OutputTimeFormats): string;

	private __init(): void;

	private __updateHTMLControlsIfAvailable(): void;

	public attach(mesh: Mesh, attachOptions?: IAttachOptions): void;

	public detach(): void;

	public play(): void;

	public pause(): void;

	public stop(): void;

	public setTime(time: string | number): void;

	public setPercentage(percentage: number): void;

	public getCurrentAnimationTimeDisplayString(): string;

	public update(): void;

	public on(eventName: EventTypes | string, callback: EventCallback): void;

	public dispatch(eventName: EventTypes | string, data?: any): void;
}
