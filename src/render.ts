import { Vector3, Vector2 } from './types';

//projection ###

export interface CameraSettings {
    originZ: number,
    planeWidthHalf: number, 
    planeHeightHalf: number
}
export const createCamSettingsFromCanvas = (originZ: number, planeScale: number, canvas: HTMLCanvasElement) => {
    return {
        originZ,
        planeWidthHalf: canvas.offsetWidth * planeScale / 2,
        planeHeightHalf: canvas.offsetHeight * planeScale / 2
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
export const projectPoints = (cam: CameraSettings) => {
	return (points: Vector3[]) => {
		return points.map(projectPoint(cam));
	};
};
export const viewportToCanvas = (canvas: any) => {
	return (point: Vector2) : Vector2 => {
		return [
			point[0] * canvas.offsetWidth / 2, 
			point[1] * canvas.offsetHeight / 2
		];
	};
};