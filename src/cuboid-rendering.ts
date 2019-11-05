import { Vector3, Vector2 } from './types';
import { Transform, transformPoint } from './transform';
import { CameraSettings, projectPoints } from './render';
import * as Vec3 from './vec3';

export interface FaceObject {
    transform: Transform,
    polygon: Vector2[]
};
const isFaceFacingCam = (cam: CameraSettings) => ((face: FaceObject) : boolean => {
    const positionFromOrigin = Vec3.add(face.transform.position, [0, 0, -cam.originZ]);
    return Vec3.dot(positionFromOrigin, face.transform.orientation.slice(6) as Vector3) < 0;
});
const vec2ToVec3 = (vec2: Vector2) : Vector3 => [vec2[0], vec2[1], 0];
const globalFacePolygon = (face: FaceObject): Vector3[] => face.polygon.map(vec2ToVec3).map(transformPoint(face.transform));
export const projectFaces = (faces: FaceObject[], cam: CameraSettings) : Vector2[][] => {
    return faces.filter(isFaceFacingCam(cam)).map(globalFacePolygon).map(projectPoints(cam));
};
const createQuadPolygon = (halfWidth: number, halfHeight: number): Vector2[] => {
    return [
        [halfWidth, halfHeight],
        [halfWidth, -halfHeight],
        [-halfWidth, -halfHeight],
        [-halfWidth, halfHeight]
    ];
};
export const createCuboidFaces = (size: Vector3) : FaceObject[] => {
    const halfSize = Vec3.divide(size, 2);
    return [
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, 1, 0, 0],
                position: [halfSize[0], 0, 0],
            },
            polygon: createQuadPolygon(halfSize[2], halfSize[1])
        },
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, -1, 0, 0],
                position: [-halfSize[0], 0, 0],
            },
            polygon: createQuadPolygon(halfSize[2], halfSize[1])
        },
        {
            transform: {
                orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                position: [0, 0, halfSize[2]],
            },
            polygon: createQuadPolygon(halfSize[0], halfSize[1])
        },
        {
            transform: {
                orientation: [1, 0, 0, 0, 1, 0, 0, 0, -1],
                position: [0, 0, -halfSize[2]],
            },
            polygon: createQuadPolygon(halfSize[0], halfSize[1])
        },
        {
            transform: {
                orientation: [1, 0, 0, 0, 0, 1, 0, 1, 0],
                position: [0, halfSize[1], 0],
            },
            polygon: createQuadPolygon(halfSize[0], halfSize[2])
        },
        {
            transform: {
                orientation: [1, 0, 0, 0, 0, 1, 0, -1, 0],
                position: [0, -halfSize[1], 0],
            },
            polygon: createQuadPolygon(halfSize[0], halfSize[2])
        },
    ]
};