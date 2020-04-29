// Type definitions for fbx-animation-controls
// Definitions by: Andrii Doroshenko https://github.com/itsdorosh

/// <reference types="three" />

import {AnimationAction, Clock, Mesh} from "three";

export interface IAttachDetachOptions {
	play?: boolean;
	atTime?: string;
}

export interface ControlsConfiguration {
	outputFormat?: string;
	initHTMLControls?: boolean;
}

export class FBXAnimationControls {
	private __attachedMesh: Mesh;
	private __animationAction: AnimationAction;
	private __playAnimationFlag: boolean;
	private __duration: string;
	private __innerContainer: HTMLElement;
	private __clock: Clock;

	constructor(renderingNode: HTMLElement, configuration: ControlsConfiguration);

	static getAnimationTimeDisplayString(time: string): string;

	private __init(): void;

	public attach(mesh: Mesh, attachOptions: IAttachDetachOptions): void;

	public detach(detachOptions: IAttachDetachOptions): void;

	public play(): void;

	public pause(): void;

	public stop(): void;

	public setTime(time: string | number): void;

	public setPercentage(percentage: number): void;

	public getCurrentAnimationTimeDisplayString(): string;

	public update(): void;
}
