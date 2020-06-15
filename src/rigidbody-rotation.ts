
import { Matrix3, Vector3 } from '../lib/types';
import { rotation as rotationMatrix, multiplyMatrix } from '../lib/mat3x3';
import * as Vec3 from '../lib/vec3';


const calculateSquareIntegral = (c1: number, c2: number) => {
	return (c2**3 - c1**3) / 3;
};
const calculateLineIntegral = (c1: number, c2: number) => {
	return (c2**2 - c1**2) / 2;
};
const calculateProductIntegral = (p1: number, p2: number, q1: number, q2: number) => {
	return calculateLineIntegral(p1, p2) * calculateLineIntegral(q1, q2) / 4;
};


export const calculateOffsetCuboidSymmetricInertia = (startCorner: Vector3, size: Vector3) : Vector3 => {
    const xInt = ((startCorner[0] + size[0])**3 - startCorner[0]**3) * (size[1] * size[2]);
    const yInt = ((startCorner[1] + size[1])**3 - startCorner[1]**3) * (size[2] * size[0]);
    const zInt = ((startCorner[2] + size[2])**3 - startCorner[2]**3) * (size[0] * size[1]);
    return Vec3.multiply([yInt + zInt, zInt + xInt, xInt + yInt], 1 / 3);
};

export const calculateOffsetCuboidInertiaTensor = (startCorner: Vector3, size: Vector3): Matrix3 => {
	const x1 = startCorner[0];
	const x2 = startCorner[0] + size[0];
	const y1 = startCorner[1];
	const y2 = startCorner[1] + size[1];
	const z1 = startCorner[2];
	const z2 = startCorner[2] + size[2];

	const xSquaredInt = size[1] * size[2] * calculateSquareIntegral(x1, x2);
	const ySquaredInt = size[2] * size[0] * calculateSquareIntegral(y1, y2);
	const zSquaredInt = size[0] * size[1] * calculateSquareIntegral(z1, z2);

	const xyInt = -1 * calculateProductIntegral(x1, x2, y1, y2);
	const xzInt = -1 * calculateProductIntegral(x1, x2, z1, z2);
	const yzInt = -1 * calculateProductIntegral(y1, y2, z1, z2);

	return [
		ySquaredInt + zSquaredInt, xyInt, xzInt,
		xyInt, xSquaredInt + zSquaredInt, yzInt,
		xzInt, yzInt, xSquaredInt + ySquaredInt,
	];
};



interface Particle {
    position: Vector3,
    mass: number
}

export const addInertiaTensors = (tensors: Matrix3[]): Matrix3 => {
	const sum: Matrix3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (const tensor of tensors){
		for (let i = 0; i < 9; i++){
			sum[i] += tensor[i];
		}
	}
	return sum;
};
const scaleInetiaTensor = (tensor: Matrix3, scale: number) => tensor.map(val => val * scale);
const calculateInertiaTensorOfParticle = (particle: Particle) : Matrix3 => {
    const { position } = particle;
    const xSquared = position[0]**2;
    const ySquared = position[1]**2;
    const zSquared = position[2]**2;
    const xyProd = position[0] * position[1];
    const yzProd = position[1] * position[2];
    const zxProd = position[2] * position[0];
    const tensor = [
        ySquared + zSquared, -xyProd, -zxProd,
        -xyProd, zSquared + xSquared, -yzProd,
        -zxProd, -yzProd, xSquared + zSquared
    ] as Matrix3;
    return scaleInetiaTensor(tensor, particle.mass) as Matrix3;
};
const calculateInertiaTensorOfparticles = (particles: Particle[]) : Matrix3 => particles.reduce((tensor: Matrix3, particle) => addInertiaTensors([tensor, calculateInertiaTensorOfParticle(particle)]), [0, 0, 0, 0, 0, 0, 0, 0, 0]);

interface RigidbodyRotationState {
    orientation: Matrix3,
    angularVelocity: Vector3
};

const calculateAngularAcceleration = (angularVelocity: Vector3, inertiaTensor: Vector3): Vector3 => {
	// return [
	// 	(angularVelocity[1] * angularVelocity[2] * (inertiaTensor[1] - inertiaTensor[2])) / inertiaTensor[0],
	// 	(angularVelocity[2] * angularVelocity[0] * (inertiaTensor[2] - inertiaTensor[0])) / inertiaTensor[1],
	// 	(angularVelocity[0] * angularVelocity[1] * (inertiaTensor[0] - inertiaTensor[1])) / inertiaTensor[2],
	// ] as Vector3;
	return Vec3.multiply(
		multiplyVectorByDiagonalMatrix(
			getDiagonalMatrixInverse(inertiaTensor),
			Vec3.cross(angularVelocity, multiplyVectorByDiagonalMatrix(inertiaTensor, angularVelocity))
		), 
		-1
	) 
};


const multiplyVectorByDiagonalMatrix = (matrix: Vector3, vector: Vector3): Vector3 => [
	matrix[0] * vector[0],
	matrix[1] * vector[1],
	matrix[2] * vector[2]
];
const getDiagonalMatrixInverse = (matrix: Vector3): Vector3 => matrix.map(num => 1 / num) as Vector3;

const calculateAngularJerk = (angularVelocity: Vector3, angularAcceleration: Vector3, inertiaTensor: Vector3): Vector3 => {
	return Vec3.multiply(
		multiplyVectorByDiagonalMatrix(
			getDiagonalMatrixInverse(inertiaTensor),
			Vec3.add(
				Vec3.cross(angularAcceleration, multiplyVectorByDiagonalMatrix(inertiaTensor, angularVelocity)),
				Vec3.cross(angularVelocity, multiplyVectorByDiagonalMatrix(inertiaTensor, angularAcceleration))
			)
		),
		-1
	);
};
export const simulate = (state: RigidbodyRotationState, inertiaTensor: Vector3, deltaTime: number) : RigidbodyRotationState => {
    //inertia-tensor and angular-velocity are relative to the orientation
    const { angularVelocity, orientation } = state;
    const rotatedFrame = rotationMatrix(Vec3.multiply(angularVelocity, deltaTime));
    const nextOrientation = multiplyMatrix(orientation, rotatedFrame);
    const angularAcceleration : Vector3 = calculateAngularAcceleration(angularVelocity, inertiaTensor);
	const angularJerk: Vector3 = calculateAngularJerk(angularVelocity, angularAcceleration, inertiaTensor);
    const angularVelocityDelta = Vec3.add(
		Vec3.multiply(angularAcceleration, deltaTime),
		Vec3.multiply(angularJerk, 0.5 * deltaTime**2)
	);
    const nextAngularVelocity = Vec3.add(angularVelocity, angularVelocityDelta)

    return {
        orientation: nextOrientation,
        angularVelocity: nextAngularVelocity
    };
};