import { Matrix3, Vector3, Vector2 } from './types';
import { Transform, inverseTransformPoint, inverseTransformTransform, transformTransform } from './transform';
import { multiplyMatrix, rotation, identity } from './mat3x3';
import * as Vec3 from './vec3';
import { simulate } from './rigidbody-rotation';
import { createCamSettingsFromCanvas, CameraSettings, viewportToCanvas, projectPoint } from './render';
import { createArray, randomUnitVector, randomRange } from './util';
import { pathPolygon, FaceObject, projectFaces } from './face-rendering';
import { createCenteredTHandle, createTHandleFaces, calculateTHandleInertiaTensor } from './t-handle';
import { createCuboidFaces, calculateCuboidInertiaTensor } from './cuboid';

const canvas = document.body.querySelector("canvas");
Object.assign(canvas, { width: window.innerWidth, height: window.innerHeight });
const ctx = canvas.getContext("2d");

const onresize = () => {
    Object.assign(canvas, { width: window.innerWidth, height: window.innerHeight });

    const targetPlaneSize = 5;
    const defaultOriginZ = -1700;
    const planeScale = targetPlaneSize / Math.min(canvas.width, canvas.height);
    camera.settings = {
        originZ: defaultOriginZ * planeScale,
        planeWidthHalf: canvas.width * planeScale / 2,
        planeHeightHalf: canvas.height * planeScale / 2
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


const cuboidSize: Vector3 = [randomRange(0.1, 1), randomRange(0.5, 2), randomRange(0.1, 1.2)];
//const cuboidSize: Vector3 = [0.8, 2, 0.1];
//const tHandleSize = createCenteredTHandle(0.9, 0.58, 0.19);
const renderObject: {transform: Transform, faces: FaceObject[]} = {
    transform: {
        orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        position: [0, 0, 0],
    },
    faces: createCuboidFaces(cuboidSize)
};

const stars : { strength: number, position: Vector3 }[] = createArray(1000).map(() => {
    return {
        strength: Math.random(),
        position: Vec3.multiply(randomUnitVector(), 10000)
    }
});



//camera orbit ###
{
    let camRotation = [0.4, 0];
    const applyRotation = () => {
        const rotationMatrix = multiplyMatrix(rotation([0, camRotation[1], 0]), rotation([-camRotation[0], 0, 0]));
        const camTransform : Transform = {
            orientation: rotationMatrix,
            position: Vec3.multiply(rotationMatrix.slice(6) as Vector3, -camOrbitRadius)
        };
        camera.transform = camTransform;
    };


    let mouseDown = false;
    canvas.addEventListener("pointerdown", e => mouseDown = true);
    document.addEventListener("pointerup", () => mouseDown = false);
    document.addEventListener("pointermove", e => {
        if (!mouseDown) return;
        const sens = 0.01;
        camRotation = [
            camRotation[0] + e.movementY * sens,
            camRotation[1] + e.movementX * sens
        ];
        applyRotation();
        render();
    });
    applyRotation();
}


//rotation simulation ###
let rigidbodyState: { angularVelocity: Vector3, orientation: Matrix3 };
let startSimulation: Function;
{
    const inertiaTensor = calculateCuboidInertiaTensor(...Vec3.multiply(cuboidSize, 0.5));
    //const inertiaTensor = calculateTHandleInertiaTensor(tHandleSize);
    rigidbodyState = {
        angularVelocity: Vec3.multiply(randomUnitVector(), 4),
        orientation: identity
    };

    let prevTime = 0;
    const loop = () => {
        requestAnimationFrame(loop);
        const curTime = window.performance.now();
        const deltaTime = (curTime - prevTime) / 1000;
        prevTime = curTime;
        const steps = Math.round(deltaTime / 0.002);
        const simDeltaTime = deltaTime / steps;
        for (let i = 0; i < steps; i++){
            rigidbodyState = simulate(rigidbodyState, inertiaTensor, simDeltaTime);
        }

        render();
    };
    startSimulation = loop;
}


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

const renderCuboid = (toCanvas: (p: Vector2) => Vector2) => {
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

    

    const toCanvas = viewportToCanvas(canvas);
    const project = projectPoint(camera.settings);

    renderStars(toCanvas, project);

    renderObject.transform.orientation = rigidbodyState.orientation;
    renderCuboid(toCanvas);
    

    ctx.restore();
};

const main = () => {
    onresize();
    requestAnimationFrame(() => startSimulation());
};
main();