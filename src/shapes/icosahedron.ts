import { Matrix3, Vector2, Vector3 } from "../../lib/types";
import * as Vec2 from '../../lib/vec2';
import * as Vec3 from '../../lib/vec3';
import { FaceObject } from "../face-rendering";
import { createArray } from "../util";

/*
	the icosahedron can be split into tetrahedron-like pieces. 
	why? 
	imagine shrinking the tetrahedron down to a point. 
	now do this in reverse: blow it up from a point. 
	each vertex traces out a straight line. 
	each face traces out a tetrahedron-like shape. 
	
	so the total volume of the icosahedron is the volume 
	of one such tetrahedron piece multiplied by the number of faces, 20. 
	when h is the distance from the center of a face to the center of the icosahedron, 
	the area of a face is: s^2 * sqrt(3) / 4 where s is the length of an edge. 
	the total volume of the icosahedron is: 5 * sqrt(3) * s^2 * h / 3

	what's its inertia tensor? 
	
	the inertia tensor is a coordinate-invariant, multilinear map from vectors to vectors. 
	it maps any angular-velocity to an angular-momentum vector. 
	symmetries of an object are automatically symmetries of the inertia tensor. 
	imagine we have an object with a certain symmetry and the objects inertia tensor. 
	then apply the symmetry-rotation of the object. it looks exactly the same after the rotation. 
	the inertia tensor is rotated with the object and matches exactly with a new tensor of the rotated object. 
	
	in the case of the icosahedron, any edge has two other mutually orthogonal edges. 
	let the angular velocity be at the center of those edges. 
	the angular momenta from 3 such orthogonal edges are also orthogonal by symmetry and are the same length. 
	this means the inertia tensor is completely symmetric and can be described by a single number, the inertia scalar. 

	the inertia scalar may be found by picking one axis and then summing over the squared distance of each point to the axis. 
	for example if we pick a icosahedron-vertex as the axis, there is a 5-fold symmetry and we would only need to calculate a fifth of the object. 
	

*/




const { sqrt, sin, cos, PI } = Math;
const SQRT3 = sqrt(3);

function circlePoint(angle: number): Vector2 {
	return [
		sin(angle), 
		cos(angle)
	]
}

const equiTriangle: [Vector2, Vector2, Vector2] = [
	[0, 1],
	[0.5 * SQRT3, -0.5],
	[-0.5 * SQRT3, -0.5]
];

function nGonCircumferenceFraction(n: number){
	return sqrt(2 - 2 * cos(2 * PI / n));
}

type IcosahedronGeometry = { vertices: Vector3[], triangles: [number, number, number][] };
function createIcosahedronGeometry(edgeSize: number): IcosahedronGeometry {
	//edge-length
	const s = edgeSize;
	const pentagonCircumFifth = nGonCircumferenceFraction(5);
	const tengonCircumTenth = nGonCircumferenceFraction(10);

	const pentagonDownScale = s / pentagonCircumFifth;
	const pentagonPoints = [0, 1, 2, 3, 4].map(ind => {
		return Vec2.multiply(circlePoint(2 * PI * ind / 5), pentagonDownScale)
	});
	
	const peakElevation = sqrt(s**2 - pentagonDownScale**2);
	const pentagonSeparation = sqrt(s**2 - (tengonCircumTenth * pentagonDownScale)**2) / 2;
	const halfHeight = pentagonSeparation + peakElevation;
	const rotatedPentagonPoints = [0, 1, 2, 3, 4].map(ind => {
		return Vec2.multiply(circlePoint(2 * PI * (ind * 0.2 + 0.1)), pentagonDownScale)
	});
	const vertices: Vector3[] = [
		[0, halfHeight, 0], 
		...pentagonPoints.map(p => [p[0], pentagonSeparation, p[1]] as Vector3),
		...rotatedPentagonPoints.map(p => [p[0], -pentagonSeparation, p[1]] as Vector3),
		[0, -halfHeight, 0],
	];
	const triangles: [number, number, number][] = [
		[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1],
		[11, 6, 7], [11, 7, 8], [11, 8, 9], [11, 9, 10], [11, 10, 6],
		[1, 2, 6], [2, 3, 7], [3, 4, 8], [4, 5, 9], [5, 1, 10],
		[6, 7, 2], [7, 8, 3], [8, 9, 4], [9, 10, 5], [10, 6, 1]
	];
	return { vertices, triangles }
}


function icoTriangleToFace(
	localTriangle: Vector2[], 
	geo: IcosahedronGeometry, triangleIndex: number): FaceObject {
	
	const verts = geo.vertices;
	const [i1, i2, i3] = geo.triangles[triangleIndex];
	const [v1, v2, v3] = [verts[i1], verts[i2], verts[i3]];
	const center = Vec3.divide(
		[
			v1[0] + v2[0] + v3[0], 
			v1[1] + v2[1] + v3[1],
			v1[2] + v2[2] + v3[2]
		] as Vector3, 
		3
	);
	const forward = Vec3.normalize(center);
	const up = Vec3.normalize(Vec3.subtract(v1, center));
	const right = Vec3.cross(up, forward);
	const matrix: Matrix3 = [
		...right, ...up, ...forward
	];
	return {
		transform: {
			position: center, 
			orientation: matrix
		}, 
		polygon: localTriangle
	}
}

export function createIcosahedronFaces(edgeSize: number){
	const icoGeo = createIcosahedronGeometry(edgeSize);
	const localTriangle = equiTriangle.map(v => Vec2.multiply(v, edgeSize / SQRT3));
	const faces = createArray(20).map(ind => icoTriangleToFace(localTriangle, icoGeo, ind));
	return faces;
}