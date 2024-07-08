import Vec2 from "./vec2";

export default class Bounds {
    constructor(minX, minY, maxX, maxY) {
        this.min = new Vec2(minX, minY);
        this.max = new Vec2(maxX, maxY);
    }

    get width() {
        return this.max.x - this.min.x;
    }

    get height() {
        return this.max.y - this.min.y;
    }

    get center() {
        return Vec2.mult(Vec2.add(this.min, this.max), 0.5);
    }
}