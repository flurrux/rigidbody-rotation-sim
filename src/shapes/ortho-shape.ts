import { identity, multiplyMatrix } from "../../lib/mat3x3";
import { Matrix3, Vector3 } from "../../lib/types";
import { FaceObject } from "../face-rendering";
import { scaleVector } from "../util";
import { front, back, up, down, right, left, makeQuad } from './shape-util';

interface OrthoShape {
	coreSize: number, 
	extrudeSize: Vector3
};



export const createCrossShapeFaces = (shapeData: OrthoShape): FaceObject[] => {
	const { coreSize, extrudeSize } = shapeData;
	const s = coreSize;
	const [w, h, l] = [
		extrudeSize[0] / 2,
		extrudeSize[1] / 2,
		extrudeSize[2] / 2
	];
	return [
		makeQuad([0, +(s + h), +s], front, [s, h]), 
		makeQuad([0, -(s + h), +s], front, [s, h]), 
		makeQuad([+(s + w), 0, +s], front, [w, s]), 
		makeQuad([-(s + w), 0, +s], front, [w, s]), 

		makeQuad([0, +(s + h), -s], back, [s, h]),
		makeQuad([0, -(s + h), -s], back, [s, h]),
		

		makeQuad([+s, +(s + h), 0], right, [s, h]),
		makeQuad([+s, -(s + h), 0], right, [s, h]),
		makeQuad([+s, 0, +(s + l)], right, [l, s]),

		makeQuad([+(s + w), 0, -s], back, [w, s]),


		makeQuad([-s, +(s + h), 0], left, [s, h]),
		makeQuad([-s, -(s + h), 0], left, [s, h]),
		makeQuad([-s, 0, +(s + l)], left, [l, s]),

		makeQuad([-(s + w), 0, -s], back, [w, s]), 

		makeQuad([+s, 0, -(s + l)], right, [l, s]),

		makeQuad([-s, 0, -(s + l)], left, [l, s]),

		makeQuad([+(s + w), +s, 0], up, [w, s]),
		makeQuad([-(s + w), +s, 0], up, [w, s]),
		makeQuad([0, +s, +(s + l)], up, [s, l]),
		makeQuad([0, +s, -(s + l)], up, [s, l]),
		

		makeQuad([+(s + w), -s, 0], down, [w, s]),
		makeQuad([-(s + w), -s, 0], down, [w, s]),
		makeQuad([0, -s, +(s + l)], down, [s, l]),
		makeQuad([0, -s, -(s + l)], down, [s, l]),


		//caps 
		makeQuad([0, 0, +(s + 2 * l)], front, [s, s]),
		makeQuad([0, 0, -(s + 2 * l)], back, [s, s]),
		makeQuad([+(s + 2 * w), 0, 0], right, [s, s]),
		makeQuad([-(s + 2 * w), 0, 0], left, [s, s]),
		makeQuad([0, +(s + 2 * h), 0], up, [s, s]),
		makeQuad([0, -(s + 2 * h), 0], down, [s, s]),
	]
};