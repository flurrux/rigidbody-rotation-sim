import { Matrix3, Vector2, Vector3 } from "../../lib/types";
import { FaceObject } from "../face-rendering";

export const makeQuad = (position: Vector3, orientation: Matrix3, size: Vector2): FaceObject => {
	return {
		transform: { position, orientation },
		polygon: [
			[-size[0], -size[1]], 
			[+size[0], -size[1]], 
			[+size[0], +size[1]], 
			[-size[0], +size[1]], 
		]
	}
}

export const front: Matrix3 = [
	1, 0, 0,
	0, 1, 0,
	0, 0, 1
];
export const back: Matrix3 = [
	1, 0, 0,
	0, -1, 0,
	0, 0, -1
];
export const up: Matrix3 = [
	1, 0, 0,
	0, 0, -1,
	0, 1, 0
];
export const down: Matrix3 = [
	1, 0, 0,
	0, 0, 1,
	0, -1, 0
];
export const right: Matrix3 = [
	0, 0, -1,
	0, 1, 0,
	1, 0, 0
];
export const left: Matrix3 = [
	0, 0, 1,
	0, 1, 0,
	-1, 0, 0
];