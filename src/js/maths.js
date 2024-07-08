export default class Maths {
    static lerp(a, b, t) {
        return (b-a) * t + a;
    }

    static inverseLerp(a, b, value) {
        return (value - a) / (b - a);
    }

    static map(fromA, fromB, toA, toB, fromValue) {
        let t = this.inverseLerp(fromA, fromB, fromValue);
        return this.lerp(toA, toB, t);
    }

    static inRange(a, b, value) {
        if (a < b) return a <= value && value <= b;
        return b <= value && value <= a;
    }

    static lineBoxIntersect(x1, y1, x2, y2, minX, maxX, minY, maxY) {
        let intersections = [];
    
        // Helper function to add intersection if within segment and box bounds
        function addIntersection(tx, ty, t) {
            if (0 <= t && t <= 1 && minX <= tx && tx <= maxX && minY <= ty && ty <= maxY) {
                intersections.push({ x: tx, y: ty });
            }
        }
    
        // Check intersection with left edge (x = minX)
        if (x1 !== x2) {  // Avoid division by zero
            let t = (minX - x1) / (x2 - x1);
            let y = y1 + t * (y2 - y1);
            addIntersection(minX, y, t);
        }
    
        // Check intersection with right edge (x = maxX)
        if (x1 !== x2) {  // Avoid division by zero
            let t = (maxX - x1) / (x2 - x1);
            let y = y1 + t * (y2 - y1);
            addIntersection(maxX, y, t);
        }
    
        // Check intersection with bottom edge (y = minY)
        if (y1 !== y2) {  // Avoid division by zero
            let t = (minY - y1) / (y2 - y1);
            let x = x1 + t * (x2 - x1);
            addIntersection(x, minY, t);
        }
    
        // Check intersection with top edge (y = maxY)
        if (y1 !== y2) {  // Avoid division by zero
            let t = (maxY - y1) / (y2 - y1);
            let x = x1 + t * (x2 - x1);
            addIntersection(x, maxY, t);
        }
    
        // Find the closest intersection
        let closestIntersection = intersections.length === 0 ? null : intersections.reduce((closest, current) => {
            let closestDist = Math.hypot(closest.x - x1, closest.y - y1);
            let currentDist = Math.hypot(current.x - x1, current.y - y1);
            return currentDist < closestDist ? current : closest;
        });
    
        return {
            intersections: intersections,
            closest: closestIntersection
        };
    }
}