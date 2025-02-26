export interface Point {
	x: number;
	y: number;
}
export type Polygon = Array<Point>;

// Computes the convex hull of a set of points using an O(n log n) algorithm
export function computeConvexHull<P extends Point>(points: Readonly<Array<P>>): Array<P> {
	// Create a copy and sort points
	const sortedPoints: Array<P> = [...points].sort(comparePoints);
	return computeConvexHullSorted(sortedPoints);
}

// Computes the convex hull assuming points are already sorted by x-coordinate
// This implementation runs in O(n) time
export function computeConvexHullSorted<P extends Point>(points: Readonly<Array<P>>): Array<P> {
	// Handle edge cases
	if (points.length <= 1) {
		return [...points];
	}

	// Implement Andrew's monotone chain algorithm
	// Process points to create the top part of the hull
	const topChain: Array<P> = [];

	for (const currentPoint of points) {
		// Remove points that make a non-right turn
		while (topChain.length >= 2) {
			const p1 = topChain[topChain.length - 1];
			const p2 = topChain[topChain.length - 2];

			if (!p1 || !p2) break;

			// Check if we need to remove the middle point using cross product
			const crossProduct =
				(p1.x - p2.x) * (currentPoint.y - p2.y) - (p1.y - p2.y) * (currentPoint.x - p2.x);

			if (crossProduct < 0) break;
			topChain.pop();
		}

		topChain.push(currentPoint);
	}

	// Remove the last point as it will be added in the bottom chain
	if (topChain.length > 0) {
		topChain.pop();
	}

	// Process points in reverse to create the bottom part of the hull
	const bottomChain: Array<P> = [];

	for (let i = points.length - 1; i >= 0; i--) {
		const currentPoint = points[i];
		if (!currentPoint) continue;

		// Remove points that make a non-right turn
		while (bottomChain.length >= 2) {
			const p1 = bottomChain[bottomChain.length - 1];
			const p2 = bottomChain[bottomChain.length - 2];

			if (!p1 || !p2) break;

			// Check if we need to remove the middle point
			if ((p1.x - p2.x) * (currentPoint.y - p2.y) - (p1.y - p2.y) * (currentPoint.x - p2.x) < 0)
				break;
			bottomChain.pop();
		}

		bottomChain.push(currentPoint);
	}

	// Remove the last point to avoid duplication
	if (bottomChain.length > 0) {
		bottomChain.pop();
	}

	// Handle special case with only one point
	if (topChain.length === 1 && bottomChain.length === 1) {
		const topPoint = topChain[0];
		const bottomPoint = bottomChain[0];

		if (topPoint && bottomPoint && topPoint.x === bottomPoint.x && topPoint.y === bottomPoint.y) {
			return topChain;
		}
	}

	// Combine the two chains to form the complete hull
	return [...topChain, ...bottomChain];
}

// Comparator function for sorting points
export function comparePoints(a: Point, b: Point): number {
	// First sort by x-coordinate
	if (a.x !== b.x) {
		return a.x < b.x ? -1 : 1;
	}

	// If x-coordinates are equal, sort by y-coordinate
	if (a.y !== b.y) {
		return a.y < b.y ? -1 : 1;
	}

	// Points are equal
	return 0;
}
