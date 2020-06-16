import { Vector3, Matrix3 } from '../../lib/types';
import * as Vec3 from '../../lib/vec3';
import { FaceObject, translateFaces, transformFaces } from '../face-rendering';
import { calculateOffsetCuboidSymmetricInertia, calculateOffsetCuboidInertiaTensor, addInertiaTensors } from '../rigidbody-rotation';

interface UShape {
	width: number,
	height: number,
	thickness: number
};

export const createUShape = (shapeData: UShape): { faces: FaceObject[], inertiaTensor: Vector3 } => {
	const uncenteredFaces = createFaces(shapeData);
	const massCenter = calculateMassCenter(shapeData);
	const centeredFaces = translateFaces(uncenteredFaces, Vec3.multiply(massCenter, -1));
	const inertiaTensor = calculateInertiaTensor(shapeData, massCenter);
	return {
		faces: centeredFaces,
		inertiaTensor
	};
};

const createFaces = (shapeData: UShape) : FaceObject[] => {
	const wh = shapeData.width / 2;
	const h = shapeData.height;
	const zh = shapeData.thickness / 2;
	const th = shapeData.thickness;
	
    return [
		
		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 0, 1,
					0, 1, 0
				],
				position: [0, th, 0],
			},
			polygon: [
				[wh - th, zh], [wh - th, -zh], 
				[-wh + th, -zh], [-wh + th, zh]
			]
		},

		{
			transform: {
				orientation: [
					0, 0, 1,
					0, 1, 0,
					-1, 0, 0
				],
				position: [wh - th, th, 0],
			},
			polygon: [
				[zh, 0], [zh, h - th],
				[-zh, h - th], [-zh, 0]
			]
		},
		{
			transform: {
				orientation: [
					0, 0, 1,
					0, 1, 0,
					1, 0, 0
				],
				position: [-wh + th, th, 0],
			},
			polygon: [
				[zh, 0], [zh, h - th],
				[-zh, h - th], [-zh, 0]
			]
		},

		{
			transform: {
				orientation: [
					0, 0, 1,
					0, 1, 0,
					1, 0, 0
				],
				position: [wh, 0, 0],
			},
			polygon: [
				[zh, 0], [zh, h],
				[-zh, h], [-zh, 0]
			]
		},
		{
			transform: {
				orientation: [
					0, 0, 1,
					0, 1, 0,
					-1, 0, 0
				],
				position: [-wh, 0, 0],
			},
			polygon: [
				[zh, 0], [zh, h],
				[-zh, h], [-zh, 0]
			]
		},

		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 0, 1,
					0, -1, 0
				],
				position: [0, 0, 0],
			},
			polygon: [
				[wh, zh], [wh, -zh],
				[-wh, -zh], [-wh, zh]
			]
		},

		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 0, 1,
					0, 1, 0
				],
				position: [wh - zh, h, 0],
			},
			polygon: [
				[zh, zh], [zh, -zh],
				[-zh, -zh], [-zh, zh]
			]
		},
		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 0, 1,
					0, 1, 0
				],
				position: [-wh + zh, h, 0],
			},
			polygon: [
				[zh, zh], [zh, -zh],
				[-zh, -zh], [-zh, zh]
			]
		},

		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 1, 0,
					0, 0, -1
				],
				position: [0, 0, -zh],
			},
			polygon: [
				[wh, 0], [wh, h], 
				[wh - th, h], [wh - th, th],
				[-wh + th, th], [-wh + th, h],
				[-wh, h], [-wh, 0]
			]
		},
		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 1, 0,
					0, 0, 1
				],
				position: [0, 0, zh],
			},
			polygon: [
				[wh, 0], [wh, h],
				[wh - th, h], [wh - th, th],
				[-wh + th, th], [-wh + th, h],
				[-wh, h], [-wh, 0]
			]
		},
    ]
};

const calculateInertiaTensor = (shapeData: UShape, massCenter: Vector3): Vector3 => {
	const { width, height, thickness } = shapeData;
	const offset = Vec3.multiply(massCenter, -1);
	const inertiaMatrix = addInertiaTensors([
		calculateOffsetCuboidInertiaTensor(
			Vec3.add(offset, [-width / 2, 0, -thickness / 2]), 
			[width, thickness, thickness]
		),
		calculateOffsetCuboidInertiaTensor(
			Vec3.add(offset, [-width / 2, thickness, -thickness / 2]),
			[thickness, height - thickness, thickness]
		),
		calculateOffsetCuboidInertiaTensor(
			Vec3.add(offset, [width / 2 - thickness, thickness, -thickness / 2]),
			[thickness, height - thickness, thickness]
		),
	]);
	return [inertiaMatrix[0], inertiaMatrix[4], inertiaMatrix[8]];
};

const calculateMassCenter = (shapeData: UShape): Vector3 => {
	const volumeData = calculateVolumeParts(shapeData);
	const bottomPartY = shapeData.thickness / 2;
	const armY = shapeData.thickness + (shapeData.height - shapeData.thickness) / 2;
	const massCenterY = bottomPartY * volumeData.bottomPartRelVolume + armY * volumeData.armRelVolume * 2;
	let massCenter: Vector3 = [0, massCenterY, 0];
	return massCenter;
};

interface VolumeData {
	bottomPartRelVolume: number, 
	armRelVolume: number, 
	totalVolume: number
};

const calculateVolumeParts = (shapeData: UShape): VolumeData => {
	const armVolume = (shapeData.height - shapeData.thickness) * shapeData.thickness ** 2;
	const bottomVolume = shapeData.width * shapeData.thickness**2;
	const totalVolume = armVolume + bottomVolume;
	return {
		armRelVolume: armVolume / totalVolume,
		bottomPartRelVolume: bottomVolume / totalVolume,
		totalVolume
	}
};
