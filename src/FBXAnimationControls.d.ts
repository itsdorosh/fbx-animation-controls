// Type definitions for fbx-animation-controls
// Definitions by: Andrii Doroshenko https://github.com/itsdorosh

/// <reference types="three" />

import {AnimationAction, Clock, Mesh} from "three";

export enum OutputTimeFormats {
	MM_SS_MS = 'MM_SS_MS',
	SS_MS = 'SS_MS'
}

export interface IAttachOptions {
	play?: boolean;
	atTime?: string;
}

export interface IControlsConfiguration {
	outputFormat?: string;
	initHTMLControls?: boolean;
}

export class FBXAnimationControls {
	private __attachedMesh: Mesh;
	private __animationAction: AnimationAction;
	private __playAnimationFlag: boolean;
	private __duration: string;
	private __innerContainer: Element | HTMLElement;
	private __clock: Clock;

	constructor(renderingNode: Element | HTMLElement, configuration: IControlsConfiguration);

	public get attachedMesh(): Mesh | null;

	public get isPlaying(): boolean;

	public get isPaused(): boolean;

	public get isStopped(): boolean;

	public get isHTMLControlsAvailable(): boolean;

	static getAnimationTimeDisplayString(time: string, outputFormat: OutputTimeFormats): string;

	private __init(): void;

	private __updateHTMLControlsIfAvailable(): void;

	public attach(mesh: Mesh, attachOptions: IAttachOptions): void;

	public detach(): void;

	public play(): void;

	public pause(): void;

	public stop(): void;

	public setTime(time: string | number): void;

	public setPercentage(percentage: number): void;

	public getCurrentAnimationTimeDisplayString(): string;

	public update(): void;
}
