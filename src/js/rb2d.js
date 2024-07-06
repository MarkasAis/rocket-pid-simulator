import Vec2 from "./vec2"

export default class Rigidbody2D {
    constructor(pos, angle, mass, inertia, gravity) {
        this.position = pos
        this.velocity = Vec2.zero
        this.angle = angle
        this.angularVelocity = 0

        this.gravity = gravity;
        this.mass = mass
        this.inertia = inertia
        this.forces = []

        this.linearAcceleration = 0
    }

    applyForce(force, point) {
        this.forces.push({ force, point });
    }

    update(dt) {
        this.linearAcceleration = this.gravity.clone();
        let angularAcceleration = 0;
        
        for (let { force, point } of this.forces) {
            this.linearAcceleration.add(Vec2.div(force, this.mass));
            let torque = Vec2.cross(point, force);
            angularAcceleration += torque / this.inertia;
        }

        this.velocity.add(Vec2.mult(this.linearAcceleration, dt));
        this.angularVelocity += angularAcceleration * dt;

        this.position.add(Vec2.mult(this.velocity, dt));
        this.angle += this.angularVelocity * dt;
        
        this.forces = [];
    }
}