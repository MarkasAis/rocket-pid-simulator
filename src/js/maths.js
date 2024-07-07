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
}