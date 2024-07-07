import Vec2 from "./vec2";
import Rocket from "./rocket";
import PID from "./pid";
import Input from './input'
import { ctx } from './render'
// import { addData } from "./chart_old";
import { addData } from './chart'

const gravity = new Vec2(0, -1);

let rocket = new Rocket();
let pid = new PID(0, 4, 0, -10);

let prevTime = null;

function tick(time) {
    if (prevTime != null) {
        let dt = (time - prevTime) / 300;
        update(dt);
        render();
    }

    prevTime = time;
    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

function update(dt) {
    // totalTime += dt;
   
    if (Input.getKeyDown('a')) {
        rocket.body.applyForce(Vec2.left, new Vec2(0, rocket.size.y * 0.5));
    }

    if (Input.getKeyDown('d')) {
        rocket.body.applyForce(Vec2.right, new Vec2(0, rocket.size.y * 0.5));
    }

    rocket.update(dt);
    let maxAngle = 5 * Math.PI / 180;
    rocket.motorAngle = clamp(pid.update(rocket.body.angle, dt), -maxAngle, maxAngle);    

    /// PID

    let radToDeg = 180 / Math.PI;

    addData({
        angle: rocket.body.angle * radToDeg,
        motorAngle: rocket.motorAngle * radToDeg,
        position: rocket.body.position
    });

    // pid.p = -angle;
    // motorAngle = pid.p * k[0] + pid.i * k[1], pid.d * [2]
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rocket.render();

    // triangle(pos, 10, angle);
    // rect(pos, new Vec2(0.2, 0.6), angle);

    // ray(pos, vel, 5, '#ff0000dd');
    // ray(pos, acc, 5, '#00ff00dd');
    
    // let thrustAngle = angle + motorAngle + Math.PI;
    // let thustDir = Vec2.up.rotateBy(thrustAngle);
    // ray (pos, thustDir, 5, '#0000ffdd')
}

const inputK0 = document.getElementById('k0');
const inputK1 = document.getElementById('k1');
const inputK2 = document.getElementById('k2');

inputK0.value = pid.k0;
inputK1.value = pid.k1;
inputK2.value = pid.k2;

inputK0.onchange = e => {
    pid.k0 = parseFloat(e.target.value);
}

inputK1.onchange = e => {
    pid.k1 = parseFloat(e.target.value);
}

inputK2.onchange = e => {
    pid.k2 = parseFloat(e.target.value);
}