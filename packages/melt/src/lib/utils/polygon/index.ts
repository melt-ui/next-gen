export * from "./hull";

import { computeConvexHull, type Point, type Polygon } from "./hull";

export function getPointsFromEl(el: HTMLElement): Array<Point> {
	const rect = el.getBoundingClientRect();
	return [
		{ x: rect.left, y: rect.top },
		{ x: rect.right, y: rect.top },
		{ x: rect.right, y: rect.bottom },
		{ x: rect.left, y: rect.bottom },
	];
}

export function computeConvexHullFromElements(els: Array<HTMLElement>): Array<Point> {
	const points = els.flatMap((el) => getPointsFromEl(el));
	return computeConvexHull(points);
}

export function pointInPolygon(point: Point, polygon: Polygon) {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const pi = polygon[i];
		const pj = polygon[j];
		if (!pi || !pj) continue;

		const xi = pi.x;
		const yi = pi.y;
		const xj = pj.x;
		const yj = pj.y;

		const intersect =
			yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}
