import { Vector3, Matrix3 } from '../../lib/types';
import * as Vec3 from '../../lib/vec3';
import { FaceObject, translateFaces, transformFaces } from '../face-rendering';
import { calculateOffsetCuboidInertiaTensor, addInertiaTensors } from '../rigidbody-rotation';

interface LShape {
	length: number,
	height: number,
	width: number
};

export const createLShapeFaces = (shapeData: LShape) : FaceObject[] => {
	const l = shapeData.length;
	const wh = shapeData.width / 2;
	const h = shapeData.height;
	
    return [
		{
			transform: {
				orientation: [
					1, 0, 0,
					0, 0, 1,
					0, 1, 0
				],
				position: [h, h, 0],
			},
			polygon: [
				[0, -wh], [l - h, -wh],
				[l - h, wh], [0, wh]
			]
		},
		{
			transform: {
				orientation: [
					0, 1, 0,
					0, 0, 1,
					1, 0, 0
				],
				position: [h, h, 0],
			},
			polygon: [
				[0, -wh], [l - h, -wh],
				[l - h, wh], [0, wh]
			]
		},

		{
			transform: {
				orientation: [
					0, 0, 1,
					0, 1, 0,
					1, 0, 0
				],
				position: [l, 0, 0],
			},
			polygon: [
				[wh, 0], [wh, h], 
				[-wh, h], [-wh, 0]
			]
		},
		{
			transform: {
				orientation: [
					0, 0, 1,
					1, 0, 0,
					0, 1, 0
				],
				position: [0, l, 0],
			},
			polygon: [
				[wh, 0], [wh, h],
				[-wh, h], [-wh, 0]
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
				[0, -wh], [l, -wh],
				[l, wh], [0, wh]
			]
		},
		{
			transform: {
				orientation: [
					0, 1, 0,
					0, 0, 1,
					-1, 0, 0
				],
				position: [0, 0, 0],
			},
			polygon: [
				[0, -wh], [l, -wh],
				[l, wh], [0, wh]
			]
		},

		{
			transform: {
				orientation: [1, 0, 0, 0, 1, 0, 0, 0, -1],
				position: [0, 0, -wh],
			},
			polygon: [
				[0, 0], [l, 0],
				[l, h], [h, h],
				[h, l], [0, l]
			]
		},
		{
			transform: {
				orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
				position: [0, 0, wh],
			},
			polygon: [
				[0, 0], [l, 0],
				[l, h], [h, h],
				[h, l], [0, l]
			]
		},
    ]
};

export const createCenteredLShapeFaces = (shapeData: LShape): FaceObject[] => {
	const uncenteredFaces = createLShapeFaces(shapeData);
	const massCenter = calculateLShapeMassCenter(shapeData);
	return translateFaces(uncenteredFaces, Vec3.multiply(massCenter, -1));
};

export const createLShapeFacesAndInertiaTensor = (shapeData: LShape): { faces: FaceObject[], inertiaTensor: Vector3 } => {
	const centeredFaces = createCenteredLShapeFaces(shapeData);
	const rotationAndInertia = calculateLShapeRotationAndInertiaTensor(shapeData);
	return {
		faces: transformFaces(centeredFaces, { position: [0, 0, 0], orientation: rotationAndInertia.rotation }),
		inertiaTensor: rotationAndInertia.inertiaTensor
	}; 
};

export const calculateLShapeInertiaTensor = (shapeData: LShape) : Matrix3 => {
	const { width, height, length } = shapeData;
	const massCenter = calculateLShapeMassCenter(shapeData);
	const offset = Vec3.multiply(massCenter, -1);
	const inertia1 = calculateOffsetCuboidInertiaTensor(
		Vec3.add(offset, [0, 0, -width / 2]),
		[height, height, width]
	);
	const inertia2 = calculateOffsetCuboidInertiaTensor(
		Vec3.add(offset, [height, 0, -width / 2]),
		[length - height, height, width]
	);
	const inertia3 = calculateOffsetCuboidInertiaTensor(
		Vec3.add(offset, [0, height, -width / 2]),
		[height, length - height, width]
	);
	return addInertiaTensors([inertia1, inertia2, inertia3]);
};

export const calculateLShapeMassCenter = (shapeData: LShape) : Vector3 => {
	const { width, height, length } = shapeData;
	
	const joinVolume = width * height**2;
	const armVolume = (length * width * height) - joinVolume;
	const totalVolume = 2 * armVolume + joinVolume;
	const joinRelVolume = joinVolume / totalVolume;
	const armRelVolume = armVolume / totalVolume;

	let massCenter: Vector3 = [0, 0, 0];
	massCenter = Vec3.add(massCenter, Vec3.multiply([height / 2, height / 2, 0], joinRelVolume));
	massCenter = Vec3.add(massCenter, Vec3.multiply([(length + height) / 2, height / 2, 0], armRelVolume));
	massCenter = Vec3.add(massCenter, Vec3.multiply([height / 2, (length + height) / 2, 0], armRelVolume));
	return massCenter;
};

export const calculateLShapeRotationAndInertiaTensor = (shapeData: LShape): { rotation: Matrix3, inertiaTensor: Vector3 } => {
	const inertiaTensor = calculateLShapeInertiaTensor(shapeData);
	const axis1Length = Math.SQRT2 * (inertiaTensor[0] + inertiaTensor[1]);
	const axis2Length = Math.SQRT2 * (inertiaTensor[0] - inertiaTensor[1]);
	const axis3Length = inertiaTensor[8];

	const rotation: Matrix3 = [
		Math.SQRT1_2, Math.SQRT1_2, 0,
		Math.SQRT1_2, -Math.SQRT1_2, 0,
		0, 0, 1
	];

	const inertiaVector: Vector3 = [axis1Length, axis2Length, axis3Length];

	return {
		inertiaTensor: inertiaVector,
		rotation
	};
};