import { Vector3 } from './types';
import * as Vec3 from './vec3';
import { FaceObject } from './face-rendering';
import { calculateOffsetCuboidSymmetricInertia } from './rigidbody-rotation';

interface THandleShape {
    halfWidth: number, 
    height: number, 
    depth: number, 
    sweepSize: number
}

export const createTHandleFaces = (shapeData: THandleShape) : FaceObject[] => {
    const { halfWidth, height, depth, sweepSize } = shapeData;
    //don't change the order! it's important for correct occlusion when rendering
    return [

        {
            transform: {
                orientation: [1, 0, 0, 0, 0, 1, 0, -1, 0],
                position: [sweepSize, height - sweepSize, 0],
            },
            polygon: [
                [0, sweepSize],
                [halfWidth - sweepSize, sweepSize],
                [halfWidth - sweepSize, -sweepSize],
                [0, -sweepSize]
            ]
        },
        {
            transform: {
                orientation: [-1, 0, 0, 0, 0, 1, 0, -1, 0],
                position: [-sweepSize, height - sweepSize, 0],
            },
            polygon: [
                [0, sweepSize],
                [halfWidth - sweepSize, sweepSize],
                [halfWidth - sweepSize, -sweepSize],
                [0, -sweepSize]
            ]
        },

        //bottom side
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, 1, 0, 0],
                position: [sweepSize, 0, 0],
            },
            polygon: [
                [sweepSize, height - sweepSize],
                [sweepSize, -depth],
                [-sweepSize, -depth],
                [-sweepSize, height - sweepSize]
            ]
        },
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, -1, 0, 0],
                position: [-sweepSize, 0, 0],
            },
            polygon: [
                [sweepSize, height - sweepSize],
                [sweepSize, -depth],
                [-sweepSize, -depth],
                [-sweepSize, height - sweepSize]
            ]
        },

        
        {
            transform: {
                orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                position: [0, 0, sweepSize],
            },
            polygon: [
                [halfWidth, height + sweepSize],
                [halfWidth, height - sweepSize],
                [sweepSize, height - sweepSize],
                [sweepSize, -depth],
                [-sweepSize, -depth],
                [-sweepSize, height - sweepSize],
                [-halfWidth, height - sweepSize],
                [-halfWidth, height + sweepSize],
            ]
        },
        {
            transform: {
                orientation: [1, 0, 0, 0, 1, 0, 0, 0, -1],
                position: [0, 0, -sweepSize],
            },
            polygon: [
                [halfWidth, height + sweepSize],
                [halfWidth, height - sweepSize],
                [sweepSize, height - sweepSize],
                [sweepSize, -depth],
                [-sweepSize, -depth],
                [-sweepSize, height - sweepSize],
                [-halfWidth, height - sweepSize],
                [-halfWidth, height + sweepSize],
            ]
        },

        //top
        {
            transform: {
                orientation: [1, 0, 0, 0, 0, 1, 0, 1, 0],
                position: [0, height + sweepSize, 0],
            },
            polygon: [
                [halfWidth, sweepSize],
                [halfWidth, -sweepSize],
                [-halfWidth, -sweepSize],
                [-halfWidth, sweepSize]
            ]
        },
        //bottom
        {
            transform: {
                orientation: [1, 0, 0, 0, 0, 1, 0, -1, 0],
                position: [0, -depth, 0],
            },
            polygon: [
                [sweepSize, sweepSize],
                [sweepSize, -sweepSize],
                [-sweepSize, -sweepSize],
                [-sweepSize, sweepSize]
            ]
        },

        //top side
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, 1, 0, 0],
                position: [halfWidth, height, 0],
            },
            polygon: [
                [sweepSize, sweepSize],
                [sweepSize, -sweepSize],
                [-sweepSize, -sweepSize],
                [-sweepSize, sweepSize]
            ]
        },
        {
            transform: {
                orientation: [0, 0, 1, 0, 1, 0, -1, 0, 0],
                position: [-halfWidth, height, 0],
            },
            polygon: [
                [sweepSize, sweepSize],
                [sweepSize, -sweepSize],
                [-sweepSize, -sweepSize],
                [-sweepSize, sweepSize]
            ]
        },

        
    ]
};

export const createCenteredTHandle = (halfWidth: number, height: number, sweepSize: number) : THandleShape => {
    const centerY = calculateTHandleMassCenter(halfWidth, height, 0, sweepSize)[1];
    return {
        halfWidth, sweepSize,
        height: height - centerY, 
        depth: centerY
    }
};

export const calculateTHandleInertiaTensor = (shapeData: THandleShape) : Vector3 => {
    const { halfWidth, height, depth, sweepSize } = shapeData;
    return Vec3.add(
        calculateOffsetCuboidSymmetricInertia([-sweepSize, -depth, -sweepSize], [sweepSize * 2, height - sweepSize + depth, sweepSize * 2]),
        calculateOffsetCuboidSymmetricInertia([-halfWidth, height - sweepSize, -sweepSize], [halfWidth * 2, sweepSize * 2, sweepSize * 2])
    );
};

export const calculateTHandleMassCenter = (halfWidth: number, height: number, depth: number, sweepSize: number) : Vector3 => {
    const bottomCuboidSize = [sweepSize * 2, sweepSize * 2, depth + height - sweepSize];
    const topCuboidSize = [halfWidth * 2, sweepSize * 2, sweepSize * 2];
    const bottomCuboidVolume = bottomCuboidSize[0] * bottomCuboidSize[1] * bottomCuboidSize[2];
    const topCuboidVolume = topCuboidSize[0] * topCuboidSize[1] * topCuboidSize[2];
    const volumeSum = bottomCuboidVolume + topCuboidVolume;
    const topY = height;
    const bottomY = (height - depth) / 2;
    return [0, (topY * topCuboidVolume + bottomY * bottomCuboidVolume) / volumeSum, 0];
};