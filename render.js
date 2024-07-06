const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cameraScale = 50;

function worldToScreenPos(worldPos) {
    let center = new Vec2(canvas.width, canvas.height).mult(0.5);
    worldPos = worldPos.clone().reflectY().mult(cameraScale);
    return Vec2.add(center, worldPos);
}

function worldToScreenSize(worldSize) {
    return Vec2.mult(worldSize, cameraScale);
}

function circle(pos, r, color = '#000') {
    let screenPos = worldToScreenPos(pos);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, r, 0, 2 * Math.PI);
    ctx.fill();
}

function line(start, end, thickness, color = '#000') {
    let screenStart = worldToScreenPos(start);
    let screenEnd = worldToScreenPos(end);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
    ctx.stroke();
}

function ray(start, dir, thickness, color = '#000') {
    let end = Vec2.add(start, dir);
    line (start, end, thickness, color);
}

function rect(pos, size, angle, color = '#000') {
    const screenPos = worldToScreenPos(pos);
    const screenSize = worldToScreenSize(size);

    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(-angle);
    ctx.fillRect(-screenSize.width / 2, -screenSize.height / 2, screenSize.width, screenSize.height);
    ctx.restore();
}