import { Vector3, Vector2 } from '../lib/types';
import * as Vec3 from '../lib/vec3';

export const randomVector = (maxMag: number = 2) : Vector3 => [0, 1, 2].map(() => (Math.random() - 0.5) * maxMag) as Vector3;
export const randomColor = () : string => `rgb(${[0, 1, 2].map(() => Math.round(Math.random() * 255)).join(",")})`;
export const randomRange = (min: number, max: number) => min + (max - min) + Math.random();
export const scaleVector = (scale: number) => ((vec: Vector2) => [vec[0] * scale, vec[1] * scale]);
export const randomUnitVector = () : Vector3 => Vec3.normalize([0, 1, 2].map(() => Math.random() - 0.5) as Vector3);

export const createArray = (length: number): any[] => {
    const arr = [];
    for (let i = 0; i < length; i++){
        arr[i] = i;
    }
    return arr;
};
