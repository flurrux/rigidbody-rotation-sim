import { Vector2, Vector3, Matrix3 } from '../lib/types';
import * as Vec3 from '../lib/vec3';
import { Transform, transformPoint, transformTransform } from '../lib/transform';
import { CameraSettings, projectPoints } from './render';

export interface FaceObject {
    transform: Transform,
    polygon: Vector2[]
};

export const isFaceFacingCam = (cam: CameraSettings) => ((face: FaceObject) : boolean => {
    const positionFromOrigin = Vec3.add(face.transform.position, [0, 0, -cam.originZ]);
    return Vec3.dot(positionFromOrigin, face.transform.orientation.slice(6) as Vector3) < 0;
});

const vec2ToVec3 = (vec2: Vector2) : Vector3 => [vec2[0], vec2[1], 0];
const globalFacePolygon = (face: FaceObject): Vector3[] => face.polygon.map(vec2ToVec3).map(transformPoint(face.transform));
export const projectFaces = (faces: FaceObject[], cam: CameraSettings) : Vector2[][] => {
    return faces.filter(isFaceFacingCam(cam)).map(globalFacePolygon).map(projectPoints(cam));
};
export const translateFaces = (faces: FaceObject[], translation: Vector3): FaceObject[] => {
	return faces.map(face => ({
		...face,
		transform: {
			...face.transform,
			position: Vec3.add(face.transform.position, translation)
		}
	}))
};

export const transformFaces = (faces: FaceObject[], transform: Transform): FaceObject[] => {
	return faces.map(face => ({
		...face,
		transform: transformTransform(transform)(face.transform)
	}))
};

export const createQuadPolygon = (halfWidth: number, halfHeight: number): Vector2[] => {
    return [
        [halfWidth, halfHeight],
        [halfWidth, -halfHeight],
        [-halfWidth, -halfHeight],
        [-halfWidth, halfHeight]
    ];
};

export const pathPolygon = (ctx: CanvasRenderingContext2D, polygon: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(...polygon[0]);
    polygon.slice(1).map(point => ctx.lineTo(...point));
    ctx.closePath();
};