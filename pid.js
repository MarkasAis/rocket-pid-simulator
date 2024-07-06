class PID {
    constructor(targetValue, k0, k1, k2) {
        this.p = 0;
        this.i = 0;
        this.d = 0;

        this.k0 = k0;
        this.k1 = k1;
        this.k2 = k2;

        this.targetValue = targetValue;
        this.previousError = null;
    }

    update(currentValue, dt) {
        let error = this.targetValue - currentValue;
        this.p = error;
        this.i = error * dt;
        if (this.previousError !== null) this.d = (error - this.previousError) / dt;

        this.previousError = error;

        return this.p * this.k0 + this.i * this.k1 + this.d * this.k2;
    }
}