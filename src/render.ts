import { Vector3, Vector2 } from './types';

//projection ###

export interface CameraSettings {
    originZ: number,
    planeWidthHalf: number, 
    planeHeightHalf: number
}
export const createCamSettingsFromCanvas = (originZ: number, planeScale: number, canvas: any) => {
    return {
        originZ,
        planeWidthHalf: canvas.width * planeScale / 2,
        planeHeightHalf: canvas.height * planeScale / 2
    };
};
export const projectPoint = (cam: CameraSettings) => {
    return (point: Vector3) : Vector2 => {
        const c = 1 / (1 + point[2] / -cam.originZ);
        return [
            c * point[0] / cam.planeWidthHalf,
            c * point[1] / cam.planeHeightHalf
        ]
    } 
};
export const projectPoints = (cam: CameraSettings) => ((points: Vector3[]) => points.map(projectPoint(cam)));
export const viewportToCanvas = (canvas: any) => ((point: Vector2) : Vector2 => ([point[0] * canvas.width / 2, point[1] * canvas.height / 2]));

