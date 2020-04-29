import { Vector2 } from "./types";
import { isPointInPolygon } from "./t-handle-interaction";

const canvas = document.body.querySelector("canvas");
Object.assign(canvas, { width: window.innerWidth, height: window.innerHeight });
const ctx = canvas.getContext("2d");

const polygon: Vector2[] = [
	[-4, 2], [-2, -3], [1, -2], [1.5, 3], [0, 4]
];
let mousePoint: Vector2 = [0, 0];

const scale = 50;
const render = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(scale, scale);

	ctx.beginPath();
	ctx.moveTo(...polygon[0]);
	polygon.slice(1).forEach(p => ctx.lineTo(...p));
	ctx.closePath();
	ctx.lineWidth = 0.03;
	ctx.strokeStyle = isPointInPolygon(polygon, mousePoint) ? "red" : "white";
	ctx.stroke();

	ctx.restore();
};
render();

canvas.addEventListener("mousemove", e => {
	mousePoint = [
		(e.offsetX - canvas.width / 2) / scale,
		(e.offsetY - canvas.height / 2) / scale
	];
	render();
});