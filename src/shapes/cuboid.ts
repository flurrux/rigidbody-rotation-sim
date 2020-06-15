import { Vector3 } from '../../lib/types';
import * as Vec3 from '../../lib/vec3';
import { FaceObject, createQuadPolygon } from '../face-rendering';

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

export const calculateCuboidInertiaTensor = (halfWidth: number, halfHeight: number, halfDepth: number) : Vector3 => {
    const xInt = (halfWidth**3) * halfHeight * halfDepth;
    const yInt = (halfHeight**3) * halfDepth * halfWidth;
    const zInt = (halfDepth**3) * halfWidth * halfHeight;
    return Vec3.multiply([yInt + zInt, zInt + xInt, xInt + yInt], 8 / 3);
};