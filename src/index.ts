import { FaceObject, pathPolygon, projectFaces } from './face-rendering';
import { inverse, multiplyVector } from '../lib/mat3x3';
import { CameraSettings, createCamSettingsFromCanvas, projectPoint, viewportToCanvas } from './render';
import { simulate } from './rigidbody-rotation';
import { calculateTHandleInertiaTensor, createCenteredTHandle, createTHandleFaces } from './shapes/T-shape';
import { getRayFacesIntersection, handlePointerDown, handlePointerDrag, handlePointerUp, Ray, screenPointToWorldRay } from './rigidbody-interaction';
import { inverseTransformPoint, inverseTransformTransform, Transform, transformPoint, transformTransform } from '../lib/transform';
import { Matrix3, Vector2, Vector3 } from '../lib/types';
import { createArray, randomUnitVector } from './util';
import * as Vec2 from '../lib/vec2';
import * as Vec3 from '../lib/vec3';
import { createLShapeFaces, createCenteredLShapeFaces, calculateLShapeInertiaTensor, createLShapeFacesAndInertiaTensor } from './shapes/L-shape';
import { createFaces, createUShape } from './shapes/U-shape';

const canvas = document.body.querySelector("canvas");
const ctx = canvas.getContext("2d");
const updateCanvasSize = () => {
	const widthPx = window.innerWidth;
	const heightPx = window.innerHeight;
	const scalePx = window.devicePixelRatio || 1;
	Object.assign(canvas.style, {
		width: `${widthPx}px`,
		height: `${heightPx}px`
	});
	Object.assign(canvas, { 
		width: widthPx * scalePx, 
		height: heightPx * scalePx 
	});
	// ctx.setTransform(scalePx, 0, 0, scalePx, 0, 0);
};
updateCanvasSize();

const isTouchDevice = () => "ontouchstart" in document.documentElement;

const mapRange = (range1: [number, number], range2: [number, number], value: number): number => {
	const relVal = value - range1[0];
	const scale = (range2[1] - range2[0]) / (range1[1] - range1[0]);
	return range2[0] + relVal * scale;
};
const onresize = () => {
    updateCanvasSize();
	const screenSize = (window.innerWidth + window.innerHeight) / 2;
    const targetPlaneSize = mapRange([700, 1200], [2.5, 3], screenSize);
    const defaultOriginZ = -1700;
    const planeScale = targetPlaneSize / Math.min(canvas.offsetWidth, canvas.offsetHeight);
    camera.settings = {
        originZ: defaultOriginZ * planeScale,
		planeWidthHalf: canvas.offsetWidth * planeScale / 2,
		planeHeightHalf: canvas.offsetHeight * planeScale / 2
    };
};
window.onresize = onresize;


const camOrbitRadius = 0.04;//12;
const camera : {transform: Transform, settings: CameraSettings} = {
    transform: {
        orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        position: [0, 0, -camOrbitRadius]
    },
    settings: createCamSettingsFromCanvas(-5, 0.003, canvas)
};


// const tHandleSize = createCenteredTHandle(0.9, 0.58, 0.19);
// const faces = createTHandleFaces(tHandleSize);
// const inertiaTensor = calculateTHandleInertiaTensor(tHandleSize);

const LShapeSize = { length: 1.5, height: 0.3, width: 0.3 };
const LShape = createLShapeFacesAndInertiaTensor(LShapeSize);
const faces = LShape.faces;
const inertiaTensor = LShape.inertiaTensor;

// const UShape = createUShape({ width: 1.8, height: 0.9, thickness: 0.35 });
// const faces = UShape.faces;
// const inertiaTensor = UShape.inertiaTensor;



const renderObject: {transform: Transform, faces: FaceObject[]} = {
    transform: {
        orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        position: [0, 0, 0],
    },
	faces
};

const starAngleSpan = 1;
const stars : { strength: number, position: Vector3 }[] = createArray(1000).map(() => {
	const sinDirAngle = Math.random() * Math.PI * 2;
	const sinDir: Vector2 = [
		Math.sin(sinDirAngle),
		Math.cos(sinDirAngle)
	];
	const starAngle = Math.random() * starAngleSpan;
	const starDirection = [
		...Vec2.multiply(sinDir, Math.sin(starAngle)),
		Math.cos(starAngle)
	] as Vector3;
    return {
		strength: Math.random(),
		position: Vec3.multiply(starDirection, 10000)
    }
});


//rotation simulation ###
interface RigidbodyState {
	angularVelocity: Vector3,
	orientation: Matrix3
};
let rigidbodyState: RigidbodyState = {
	angularVelocity: [0, 0, 0],
	orientation: [
		1, 0, 0,
		0, 1, 0,
		0, 0, 1
	]
};
// let rigidbodyState: RigidbodyState = {
// 	angularVelocity: Vec3.multiply(randomUnitVector(), 1),
// 	orientation: [
// 		0.879614796247949, 0.1049866657888861, -0.4639564744975621, 
// 		0.010446319108088221, 0.9708419604927488, 0.23949271839392078, 
// 		0.475571955269409, -0.21550797607780264, 0.8528702290548698
// 	]
// };
const simulateRigidbody = (deltaTime: number) => {
	const steps = Math.round(deltaTime / 0.002);
	const simDeltaTime = deltaTime / steps;
	for (let i = 0; i < steps; i++) {
		rigidbodyState = simulate(rigidbodyState, inertiaTensor, simDeltaTime);
	}
};



//interaction test ###
let intersectionTransform: Transform = null;
let updateInteraction: ((deltaTime: number) => void) = null; 
let updateIntersection: (() => void) = null;
{
	let curPointer: Vector2 = null;
	let curRay: Ray = null;
	let curIntersection = null;
	let curState = null;
	let isDragging = false;
	
	const updateIntersectionByEvent = (e) => {
		curPointer = [e.offsetX, e.offsetY];
		updateIntersection();
	};
	updateIntersection = () => {
		if (!curPointer) return;
		curRay = screenPointToWorldRay(curPointer, canvas, camera.transform, camera.settings);
		curIntersection = getRayFacesIntersection(renderObject.transform, renderObject.faces, curRay);
		if (curIntersection) {
			intersectionTransform = transformTransform(renderObject.transform)(curIntersection.intersectionTransform);
		}
		else {
			intersectionTransform = null;
		}
	};
	const updatePointerDrag = (deltaTime: number) => {
		const result = handlePointerDrag(curRay, rigidbodyState.orientation, curState, deltaTime);
		curState = result.state;
		rigidbodyState.orientation = result.transform;
	};
	updateInteraction = (deltaTime: number) => {
		if (isDragging) {
			updatePointerDrag(deltaTime);
		}
	};

	canvas.addEventListener("pointermove", e => {
		updateIntersectionByEvent(e);
	});
	canvas.addEventListener("pointerdown", e => {
		updateIntersectionByEvent(e);
		if (!curIntersection) return;
		rigidbodyState.angularVelocity = [0, 0, 0];
		isDragging = true;
		curState = handlePointerDown(curIntersection, rigidbodyState.orientation);
	});
	document.addEventListener("pointerup", e => {
		if (!isDragging) return;
		if (isTouchDevice()){
			curPointer = null;
			intersectionTransform = null;
		}
		isDragging = false;
		const angularVelocity = handlePointerUp(curState);
		rigidbodyState.angularVelocity = multiplyVector(inverse(rigidbodyState.orientation), angularVelocity);
		curState = null;
	});
}
const renderMouseIntersectionPoint = (project, toCanvas) => {
	if (!intersectionTransform) return;

	const camSpaceTrans = inverseTransformTransform(camera.transform)(intersectionTransform);
	const discTripod: Vector2[] = [
		[0, 0, 0] as Vector3,
		[1, 0, 0] as Vector3,
		[0, 1, 0] as Vector3
	].map(transformPoint(camSpaceTrans)).map(project).map(toCanvas);

	const origin = discTripod[0];
	const axis1 = Vec2.subtract(discTripod[1], discTripod[0]);
	const axis2 = Vec2.subtract(discTripod[2], discTripod[0]);

	ctx.save();
	ctx.transform(axis1[0], axis1[1], axis2[0], axis2[1], origin[0], origin[1]);
	ctx.beginPath();
	ctx.arc(0, 0, 0.08, 0, Math.PI * 2);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.lineWidth = 2;
	ctx.strokeStyle = "white";
	ctx.stroke();
	ctx.restore();

	ctx.save();
	ctx.translate(origin[0], origin[1]);
	ctx.beginPath();
	ctx.arc(0, 0, 2, 0, Math.PI * 2);
	ctx.fillStyle = "white";
	ctx.fill();
	ctx.restore();
};

const backgroundColor = "rgb(24, 26, 27)";

const renderStars = (toCanvas: Function, project: Function) => {
    const inverseTransformFunc = inverseTransformPoint(camera.transform);
    ctx.save();
    for (const star of stars){
        const position = inverseTransformFunc(star.position);
        if (position[2] < 8500) continue;
        const screenPoint = toCanvas(project(position));
        ctx.fillStyle = "white";
        ctx.globalAlpha = star.strength;
        ctx.fillRect(screenPoint[0], screenPoint[1], 2, 2);
    }
    ctx.restore();
};

const renderRenderObject = (toCanvas: (p: Vector2) => Vector2) => {
    const localObjTransform = inverseTransformTransform(camera.transform)(renderObject.transform);
    const transformToLocalObj = transformTransform(localObjTransform);
    const localFaces = renderObject.faces.map(face => {
        return { ...face, transform: transformToLocalObj(face.transform) }
    });
    const renderableFaces = projectFaces(localFaces, camera.settings).map(face => face.map(toCanvas));

    for (const face of renderableFaces){
        
        pathPolygon(ctx, face);
        ctx.fillStyle = backgroundColor;
        ctx.fill();

        pathPolygon(ctx, face);
        Object.assign(ctx, {
            lineWidth: 2,
            lineJoin: "round",
            strokeStyle: "#acacad"
        })
        ctx.stroke();
    }
};


const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const toCanvas = viewportToCanvas(canvas);
    const project = projectPoint(camera.settings);

    renderStars(toCanvas, project);

	renderObject.transform.orientation = rigidbodyState.orientation;
	renderRenderObject(toCanvas);

	renderMouseIntersectionPoint(project, toCanvas);

    ctx.restore();
};

const startLoop = () => {
	let prevTime = 0;
	const loop = () => {
		const curTime = window.performance.now();
		const deltaTime = (curTime - prevTime) / 1000;
		prevTime = curTime;
		updateIntersection();
		updateInteraction(deltaTime);
		simulateRigidbody(deltaTime);
		render();
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};


const main = () => {
    onresize();
    startLoop();
};
main();