
import { Matrix3, Vector3 } from './types';
import { rotation as rotationMatrix, multiplyMatrix, multiplyVector, inverse as matrixInverse } from './mat3x3';
import * as Vec3 from './vec3';

interface Particle {
    position: Vector3,
    mass: number
}

export const calculateCuboidInertiaTensor = (halfWidth: number, halfHeight: number, halfDepth: number) : Vector3 => {
    const xInt = (halfWidth**3) * halfHeight * halfDepth;
    const yInt = (halfHeight**3) * halfDepth * halfWidth;
    const zInt = (halfDepth**3) * halfWidth * halfHeight;
    return Vec3.multiply([yInt + zInt, zInt + xInt, xInt + yInt], 8 / 3);
};

const addInertiaTensors = (a: Matrix3, b: Matrix3): Matrix3 => a.map((val1, index) => val1 + b[index]) as Matrix3;
const scaleInetiaTensor = (tensor: Matrix3, scale: number) => tensor.map(val => val * scale);
const calculateInertiaTensorOfParticle = (particle: Particle) : Matrix3 => {
    const { position } = particle;
    const xSquared = position[0]**2;
    const ySquared = position[1]**2;
    const zSquared = position[2]**2;
    const xyProd = position[0] * position[1];
    const yzProd = position[1] * position[2];
    const zxProd = position[2] * position[0];
    const tensor = [
        ySquared + zSquared, -xyProd, -zxProd,
        -xyProd, zSquared + xSquared, -yzProd,
        -zxProd, -yzProd, xSquared + zSquared
    ] as Matrix3;
    return scaleInetiaTensor(tensor, particle.mass) as Matrix3;
};
const calculateInertiaTensorOfparticles = (particles: Particle[]) : Matrix3 => particles.reduce((tensor: Matrix3, particle) => addInertiaTensors(tensor, calculateInertiaTensorOfParticle(particle)), [0, 0, 0, 0, 0, 0, 0, 0, 0]);

interface RigidbodyRotationState {
    orientation: Matrix3,
    angularVelocity: Vector3
};

export const simulate = (state: RigidbodyRotationState, inertiaTensor: Vector3, deltaTime: number) : RigidbodyRotationState => {
    //inertia-tensor and angular-velocity are relative to the orientation
    const { angularVelocity, orientation } = state;
    const rotatedFrame = rotationMatrix(Vec3.multiply(angularVelocity, deltaTime));
    const nextOrientation = multiplyMatrix(orientation, rotatedFrame);
    const angularAcceleration : Vector3 = [
        (angularVelocity[1] * angularVelocity[2] * (inertiaTensor[1] - inertiaTensor[2])) / inertiaTensor[0],
        (angularVelocity[2] * angularVelocity[0] * (inertiaTensor[2] - inertiaTensor[0])) / inertiaTensor[1],
        (angularVelocity[0] * angularVelocity[1] * (inertiaTensor[0] - inertiaTensor[1])) / inertiaTensor[2],
    ];
    const angularVelocityDelta = Vec3.multiply(angularAcceleration, deltaTime);
    const nextAngularVelocity = Vec3.add(angularVelocity, angularVelocityDelta)

    return {
        orientation: nextOrientation,
        angularVelocity: nextAngularVelocity
    };
};
