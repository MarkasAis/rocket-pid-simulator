import Vec2 from "./vec2";
import Rigidbody2D from "./rb2d";
import * as render from './render'

export default class Rocket {
    constructor() {
        this.body = new Rigidbody2D(Vec2.zero, 0, 1, 1, new Vec2(0, -1));
        this.size = new Vec2(0.2, 0.6);
        this.centerOfThrust = new Vec2(0, -0.3);
        this.motorAngle = 0;
        this.thrustForce = 1.1;

        this.thrustAngle = 0;
        this.updateParams();
    }

    updateParams() {
        this.thrustAngle = this.body.angle + Math.PI/2 + this.motorAngle;
    }

    wrap(value, minBound, maxBound) {
        let rangeSize = maxBound - minBound + 1;
        if (value < minBound) {
            return maxBound - ((minBound - value - 1) % rangeSize);
        } else {
            return minBound + ((value - minBound) % rangeSize);
        }
    }

    update(dt) {
        this.body.applyForce(Vec2.fromAngle(this.thrustAngle).mult(this.thrustForce), this.centerOfThrust);
        this.body.update(dt);
        this.updateParams();

        // this.body.position.x = this.wrap(this.body.position.x, -6, 6)
        // this.body.position.y = this.wrap(this.body.position.y, -5, 5)
        this.body.position = Vec2.zero
    }

    render() {
        render.rect(this.body.position, this.size, this.body.angle);

        render.ray(this.body.position, this.body.velocity, 3, '#ff0000dd');
        render.ray(this.body.position, this.body.linearAcceleration, 3, '#00ff00dd');

        let worldThrust = Vec2.add(this.body.position, Vec2.rotateBy(this.centerOfThrust, this.body.angle));
        let thrustDir = Vec2.fromAngle(this.thrustAngle + Math.PI);
        render.ray(worldThrust, thrustDir, 3, '#0000ffdd');
    }
}