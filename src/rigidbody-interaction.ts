import { Vector3, Vector2, Matrix3 } from "../lib/types";
import { Transform, transformPoint, transformDirection } from "../lib/transform";
import { inverse as inverseMatrix, multiplyVector, inverse, rotation, multiplyMatrix } from '../lib/mat3x3';
import { CameraSettings } from "./render";
import * as Vec3 from '../lib/vec3';
import * as Vec2 from '../lib/vec2';
import { FaceObject } from "./face-rendering";

export interface Ray {
	origin: Vector3,
	direction: Vector3
};
const inverseTransformRay = (transform: Transform, ray: Ray): Ray => {
	const invMat = inverseMatrix(transform.orientation);
	const relOrigin = Vec3.subtract(ray.origin, transform.position);
	const localOrigin = multiplyVector(invMat, relOrigin);
	const localDirection = multiplyVector(invMat, ray.direction);
	return {
		origin: localOrigin,
		direction: localDirection
	};
};
export const screenPointToWorldRay = (
	screenPoint: Vector2, canvas: HTMLCanvasElement, 
	camTransform: Transform, camSettings: CameraSettings): Ray => {
	
	const canvasWidthHalf = canvas.offsetWidth / 2;
	const canvasHeightHalf = canvas.offsetHeight / 2;
	const viewportPoint: Vector2 = [
		(screenPoint[0] - canvasWidthHalf) / canvasWidthHalf,
		(screenPoint[1] - canvasHeightHalf) / canvasHeightHalf
	];
	const camPlanePoint: Vector2 = [
		viewportPoint[0] * camSettings.planeWidthHalf,
		viewportPoint[1] * camSettings.planeHeightHalf
	];
	const localOrigin: Vector3 = [0, 0, camSettings.originZ];
	const localDirection: Vector3 = Vec3.normalize([
		camPlanePoint[0], camPlanePoint[1], -camSettings.originZ
	]);
	return {
		origin: transformPoint(camTransform)(localOrigin),
		direction: transformDirection(camTransform)(localDirection)
	}
};
export interface IntersectionData {
	intersectionTransform: Transform,
	distance: number
};
export const calculateLocalRayPlaneIntersection = (planeTransform: Transform, globalRay: Ray): 
	{ point: Vector3, distance: number } => {

	const localRay = inverseTransformRay(planeTransform, globalRay);
	const localOrigin = localRay.origin;
	const intersectionScale = localOrigin[2] / -localRay.direction[2];
	const localIntersectionPoint: Vector3 = [
		localOrigin[0] + localRay.direction[0] * intersectionScale,
		localOrigin[1] + localRay.direction[1] * intersectionScale,
		0
	];
	return {
		point: localIntersectionPoint,
		distance: Vec3.distance(localOrigin, localIntersectionPoint)
	};
};
export const calculateRaySphereIntersection = (sphereCenter: Vector3, sphereRadius: number, dirSign: number, ray: Ray) => {
	const localRayOrigin = Vec3.subtract(ray.origin, sphereCenter);
	const nearestRayPoint = Vec3.add(localRayOrigin, Vec3.project(ray.direction, Vec3.multiply(localRayOrigin, -1)));
	const distance = Vec3.magnitude(nearestRayPoint);
	if (distance >= sphereRadius) return Vec3.multiply(Vec3.normalize(nearestRayPoint), sphereRadius);
	const dirOffset = dirSign * Math.sqrt(sphereRadius**2 - Vec3.magnitude(nearestRayPoint)**2);
	return Vec3.add(nearestRayPoint, Vec3.multiply(ray.direction, dirOffset));
};
const calculateVec2Angle = (a: Vector2, b: Vector2): number => {
	const aOrtho: Vector2 = [ a[1], -a[0] ];
	const angleSign = Math.sign(Vec2.dot(aOrtho, b));
	const mag1 = Vec2.magnitude(a);
	const mag2 = Vec2.magnitude(b);
	return angleSign * Math.acos(Vec2.dot(a, b) / (mag1 * mag2));
};
export const isPointInPolygon = (polygon: Vector2[], point: Vector2): boolean => {
	let angleSum = 0;
	for (let i = 0; i < polygon.length; i++){
		const i2 = (i + 1) % polygon.length;
		const p1 = polygon[i];
		const p2 = polygon[i2];
		const relP1 = Vec2.subtract(p1, point);
		const relP2 = Vec2.subtract(p2, point);
		angleSum += calculateVec2Angle(relP1, relP2);
	}
	return Math.abs(angleSum) > 1e-2;
};
export const getRayFacesIntersection = (transform: Transform, faces: FaceObject[], globalRay: Ray): IntersectionData => {
	const localRay = inverseTransformRay(transform, globalRay);
	let curPoint: Vector3 = null;
	let curDistance: number = 0;
	let curFace: FaceObject = null;
	for (const face of faces){
		const planeIntersection = calculateLocalRayPlaneIntersection(face.transform, localRay);
		const planePoint: Vector2 = [
			planeIntersection.point[0],
			planeIntersection.point[1]
		];
		if (!isPointInPolygon(face.polygon, planePoint)) continue;
		if (!curPoint || planeIntersection.distance < curDistance){
			curPoint = planeIntersection.point;
			curDistance = planeIntersection.distance;
			curFace = face;
		}
	}
	if (!curPoint) return null;
	return {
		distance: curDistance,
		intersectionTransform: {
			position: transformPoint(curFace.transform)(curPoint),
			orientation: curFace.transform.orientation
		}
	}
};

export interface InteractionState {
	localGrabPoint: Vector3,
	hemisphereSign: number,
	sphereRadius: number,
	angularVelocityHistory: {
		angularVelocity: Vector3,
		deltaTime: number
	}[],
	angularVelocitySampleCount: number
};
export const handlePointerDown = (intersection: IntersectionData, bodyFrame: Matrix3): InteractionState => {
	const isecPoint = intersection.intersectionTransform.position;
	const worldIsecPoint = multiplyVector(bodyFrame, isecPoint);
	const sphereRadius = Vec3.magnitude(isecPoint);
	return {
		sphereRadius,
		localGrabPoint: intersection.intersectionTransform.position,
		angularVelocityHistory: [],
		angularVelocitySampleCount: 3,
		hemisphereSign: Math.sign(worldIsecPoint[2])
	}
};
export const handlePointerDrag = (worldRay: Ray, bodyFrame: Matrix3, state: InteractionState, deltaTime: number): 
	{ state: InteractionState, transform: Matrix3 } => {
	const sphereIntersection: Vector3 = calculateRaySphereIntersection([0, 0, 0], state.sphereRadius, state.hemisphereSign, worldRay);
	const globalGrabPoint = multiplyVector(bodyFrame, state.localGrabPoint);
	const rotationAxis = Vec3.normalize(Vec3.cross(globalGrabPoint, sphereIntersection));
	const rotationAngle = Math.acos(Math.min(1, Vec3.dot(sphereIntersection, globalGrabPoint) / state.sphereRadius**2));
	const rotationVector = Vec3.multiply(rotationAxis, rotationAngle);
	const rotationMatrix = rotation(rotationVector);
	const nextBodyFrame: Matrix3 = multiplyMatrix(rotationMatrix, bodyFrame);
	const angularVelocity = Vec3.multiply(rotationVector, 1 / deltaTime);

	const angularVeloHistory = state.angularVelocityHistory.slice();
	angularVeloHistory.push({
		angularVelocity: angularVelocity,
		deltaTime: deltaTime
	});
	if (angularVeloHistory.length > state.angularVelocitySampleCount){
		angularVeloHistory.shift();
	}

	return {
		state: {
			...state,
			angularVelocityHistory: angularVeloHistory
		},
		transform: nextBodyFrame
	}
};
const calculateVectorAverage = (vectors: Vector3[]): Vector3 => {
	let sum: Vector3 = [0, 0, 0];
	for (const vec of vectors){
		sum = Vec3.add(sum, vec);
	}
	return Vec3.divide(sum, vectors.length);
};
export const handlePointerUp = (state: InteractionState): Vector3 => {
	if (state.angularVelocityHistory.length === 0) return [0, 0, 0];
	return calculateVectorAverage(state.angularVelocityHistory.map(entry => entry.angularVelocity));
};