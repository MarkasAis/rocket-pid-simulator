import Vec2 from "./vec2";

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

    static lineBoxIntersect(start, end, bounds) {
        let intersections = [];
    
        // Helper function to add intersection if within segment and box bounds
        function addIntersection(pos, t) {
            if (0 <= t && t <= 1 && Maths.pointBoxIntersect(pos, bounds)) {
                intersections.push(pos);
            }
        }
    
        // Check intersection with left edge (x = minX)
        if (start.x !== end.x) {
            let t = (bounds.min.x - start.x) / (end.x - start.x);
            let y = start.y + t * (end.y - start.y);
            addIntersection(new Vec2(bounds.min.x, y), t);
        }
    
        // Check intersection with right edge (x = maxX)
        if (start.x !== end.x) {
            let t = (bounds.max.x - start.x) / (end.x - start.x);
            let y = start.y + t * (end.y - start.y);
            addIntersection(new Vec2(bounds.max.x, y), t);
        }
    
        // Check intersection with bottom edge (y = minY)
        if (start.y !== end.y) {
            let t = (bounds.min.y - start.y) / (end.y - start.y);
            let x = start.x + t * (end.x - start.x);
            addIntersection(new Vec2(x, bounds.min.y), t);
        }
    
        // Check intersection with top edge (y = maxY)
        if (start.y !== end.y) {
            let t = (bounds.max.y - start.y) / (end.y - start.y);
            let x = start.x + t * (end.x - start.x);
            addIntersection(new Vec2(x, bounds.max.y), t);
        }
    
        // Find the closest intersection
        let closestIntersection = null;
        let closestDist = Number.POSITIVE_INFINITY;
        
        if (intersections.length !== 0) {
            for (let i of intersections) {
                let dist = Math.hypot(i.x - start.x, i.y - start.y);
                if (dist <  closestDist) {
                    closestIntersection = i;
                    closestDist = dist;
                }
            }
        }
    
        return {
            intersections: intersections,
            closest: closestIntersection
        };
    }

    static pointBoxIntersect(pos, bounds) {
        return pos.x >= bounds.min.x && pos.x <= bounds.max.x && pos.y >= bounds.min.y && pos.y <= bounds.max.y;
    }
}