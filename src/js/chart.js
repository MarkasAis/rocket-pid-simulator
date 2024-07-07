import Maths from "./maths";

class Chart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.padding = 20;
        this.tickLength = 10;
        this.labelFontSize = 15;
        this.labelMargin = 5;

        this.xAxis = {
            startValue: 10,
            endValue: 0,
            ticks: [ 10, 8, 6, 4, 2, 0 ],
            labelSpace: 10
        };

        this.yAxis = {
            startValue: -5,
            endValue: 5,
            ticks: [ -5, -2.5, 0, 2.5, 5 ],
            labelSpace: 100
        };

        this.rawData = [];

        this.computeParams();
    }

    computeParams() {
        this.bounds = {
            xMin: this.padding + this.yAxis.labelSpace + this.labelMargin + this.tickLength,
            xMax: this.canvas.width - this.padding,
            yMin: this.padding,
            yMax: this.canvas.height - this.padding - this.xAxis.labelSpace - this.labelMargin - this.tickLength
        };

        this.width = this.bounds.xMax - this.bounds.xMin;
        this.height = this.bounds.yMax - this.bounds.yMin;
    }

    addData(time, value) {
        this.rawData.push({
            time: time,
            y: value
        });
    }

    updateData() {
        this.data = [];

        for (let d of this.rawData) {
            let x = (Date.now() - d.time) / 1000;
            if (!Maths.inRange(this.xAxis.startValue, this.xAxis.endValue, x)) continue;
            this.data.push({ x: x, y: d.y });
        }

        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;

        for (let d of this.data) {
            minY = Math.min(minY, d.y);
            maxY = Math.max(maxY, d.y);
        }

        let scale = this.computeNiceScale(minY, maxY, 5);
        this.yAxis.startValue = scale.min;
        this.yAxis.endValue = scale.max;
        this.yAxis.ticks = [];
        for (let t = scale.min; t <= scale.max; t += scale.tickSpacing)
        this.yAxis.ticks.push(t);
    }


    /**
     * Instantiates a new instance of the NiceScale class.
     *
     *  min the minimum data point on the axis
     *  max the maximum data point on the axis
     */
    computeNiceScale(min, max, maxTicks=10) {
        let range = this.computeNiceNum(max - min, false);
        let tickSpacing = this.computeNiceNum(range / (maxTicks - 1), true);
        let niceMin = Math.floor(min / tickSpacing) * tickSpacing;
        let niceMax = Math.ceil(max / tickSpacing) * tickSpacing;

        return {
            tickSpacing: tickSpacing,
            min: niceMin,
            max: niceMax
        };
    }

    /**
     * Returns a "nice" number approximately equal to range Rounds
     * the number if round = true Takes the ceiling if round = false.
     *
     *  localRange the data range
     *  round whether to round the result
     *  a "nice" number to be used for the data range
     */
    computeNiceNum(localRange, round) {
        let exponent = Math.floor(Math.log10(localRange));
        let fraction = localRange / Math.pow(10, exponent);
        let niceFraction = 0;

        if (round) {
            if (fraction < 1.5) niceFraction = 1;
            else if (fraction < 3) niceFraction = 2;
            else if (fraction < 7) niceFraction = 5;
            else niceFraction = 10;
        } else {
            if (fraction <= 1) niceFraction = 1;
            else if (fraction <= 2) niceFraction = 2;
            else if (fraction <= 5) niceFraction = 5;
            else niceFraction = 10;
        }

        return niceFraction * Math.pow(10, exponent);
    }

    chartToScreenX(x) {
        return Maths.map(this.xAxis.startValue, this.xAxis.endValue, this.bounds.xMin, this.bounds.xMax, x);
    }

    chartToScreenY(y) {
        return Maths.map(this.yAxis.startValue, this.yAxis.endValue, this.bounds.yMax, this.bounds.yMin, y);
    }

    render() {
        this.updateData();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#000';
        this.ctx.font = `${this.labelFontSize}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        for (let t of this.xAxis.ticks) {
            let x = this.chartToScreenX(t);
            this.ctx.fillRect(x, this.bounds.yMin, 1, this.height + this.tickLength);
            this.ctx.fillText(t, x, this.bounds.yMax + this.tickLength + this.labelMargin);
        }

        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let t of this.yAxis.ticks) {
            let y = this.chartToScreenY(t);
            this.ctx.fillRect(this.bounds.xMin - this.tickLength, y, this.width + this.tickLength, 1);
            if (Math.abs(t) < 1e-10) t = 0;
            let label = t.toPrecision(3);
            this.ctx.fillText(label, this.bounds.xMin - this.tickLength - this.labelMargin, y);
        }

        this.ctx.strokeStyle = '#000';
        this.ctx.beginPath();
        for (let i = 0; i < this.data.length; i++) {
            let x = this.chartToScreenX(this.data[i].x);
            let y = this.chartToScreenY(this.data[i].y);

            if (i == 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }
}

const chart = new Chart(document.getElementById('chart'));
chart.render();

export function addData(value) {
    let time = Date.now();
    chart.addData(time, value);
    chart.render();
}