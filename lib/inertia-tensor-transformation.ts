import { Transform } from "./transform";
import { Matrix3, Vector3 } from "./types";
import { subtract } from "./vec3";

type Matrix3x3 = Matrix3;


/*
	returns [
		sum(x_i * x_i), sum(x_i * y_i), sum(x_i * z_i),
		sum(y_i * x_i), sum(y_i * y_i), sum(y_i * z_i),
		sum(z_i * x_i), sum(z_i * y_i), sum(z_i * z_i)
	]
*/
function transformSqrdComponentsByMatrix3x3(matrix: Matrix3x3, sqrd: Vector3): Matrix3x3 {
	const m = matrix;
	const x2 = (m[0])**2 * sqrd[0] + (m[3])**2 * sqrd[1] + (m[6])**2 * sqrd[2];
	const y2 = (m[1])**2 * sqrd[0] + (m[4])**2 * sqrd[1] + (m[7])**2 * sqrd[2];
	const z2 = (m[2])**2 * sqrd[0] + (m[5])**2 * sqrd[1] + (m[8])**2 * sqrd[2];
	const xy = m[0] * m[1] * sqrd[0] + m[3] * m[4] * sqrd[1] + m[6] * m[7] * sqrd[2];
	const yz = m[1] * m[2] * sqrd[0] + m[4] * m[5] * sqrd[1] + m[7] * m[8] * sqrd[2];
	const zx = m[2] * m[0] * sqrd[0] + m[5] * m[3] * sqrd[1] + m[8] * m[6] * sqrd[2];
	return [
		x2, xy, zx,
		xy, y2, yz,
		zx, yz, z2
	]
}

/*
	sum means the sum over all particles
	sumsOfSingles: [ sum(x_i), sum(y_i), sum(z_i) ]
	sumsOfPairs: [
		sum(x_i * x_i), sum(x_i * y_i), sum(x_i * z_i),
		sum(y_i * x_i), sum(y_i * y_i), sum(y_i * z_i),
		sum(z_i * x_i), sum(z_i * y_i), sum(z_i * z_i)
	]
*/
function calculateTranslatedInertiaTensorComponents(
	sumsOfPairs: number[], mass: number, translation: Vector3): number[] {
		
	const [tx, ty, tz] = translation;	
	return [
		sumsOfPairs[0] + mass * tx**2,
		sumsOfPairs[4] + mass * ty**2,
		sumsOfPairs[8] + mass * tz**2,
		sumsOfPairs[1] + mass * tx * ty,
		sumsOfPairs[5] + mass * ty * tz,
		sumsOfPairs[6] + mass * tz * tx
	]
}

/*
	components: [
		x^2, y^2, z^2,
		x*y, y*z, z*x
	]
*/
function createInertiaTensorFromComponents(components: number[]): Matrix3x3 {
	const c = components;
	return [
		c[1] + c[2], -c[3], 	   -c[5],
		-c[3], 		  c[2] + c[0], -c[4],
		-c[5], 		 -c[4], 		c[0] + c[1]
	]
}

export function calculateSqrdComponentsFromInertiaVector(inertiaVector: Vector3): Vector3 {
	const sqrdSum = (inertiaVector[0] + inertiaVector[1] + inertiaVector[2]) / 2;
	return subtract([sqrdSum, sqrdSum, sqrdSum], inertiaVector);
}

export function transformInertiaVector(transform: Transform, inertiaVector: Vector3, mass: number): Matrix3x3 {
	const sqrd = calculateSqrdComponentsFromInertiaVector(inertiaVector);
	const rotatedComponents = transformSqrdComponentsByMatrix3x3(transform.orientation, sqrd);
	const translatedComponents = calculateTranslatedInertiaTensorComponents(rotatedComponents, mass, transform.position);
	return createInertiaTensorFromComponents(translatedComponents);
}