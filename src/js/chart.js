import Maths from "./maths";
import Utils from "./utils";

class Chart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.options = {
            xAxis: {
                title: 'x',
                labelSpace: 10,
                range: 'auto',
                inverted: false,
                minRange: 0
            },
            yAxis: {
                title: 'y',
                labelSpace: 50,
                range: 'auto',
                inverted: false,
                minRange: 0
            },
            style: {
                chartColor: '#ffffff33',
                labelColor: '#fff',
                plotColors: [ '#21E5E5', '#F25FB7' ]
            },

            padding: 20,
            tickLength: 10,

            labelFont: {
                size: 12,
                weight: 100,
                family: 'Inter'
            },
            labelMargin: 5,

            titleFont: {
                size: 14,
                weight: 200,
                family: 'Inter'
            },
            titleMargin: 5,

            headerFont: {
                size: 18,
                weight: 50,
                family: 'Inter'
            },
            headerMargin: 10,
            header: 'Chart',

            rangeDecreaseCooldown: 5,
            rangeDecreaseThreshold: 0.35,
            rangeIncreaseThreshold: 1.2,

            processData: (_, data) => data
        }

        this.options = Utils.mergeDeep(this.options, options);

        this.xAxis = {
            range: this.options.xAxis.range,
            ticks: this.options.xAxis.ticks,
            lastDecreaseTime: 0
        };

        this.yAxis = {
            range: this.options.yAxis.range,
            ticks: this.options.yAxis.ticks,
            lastDecreaseTime: 0
        };

        this.rawData = [];
        this.computeParams();
    }

    computeParams() {
        this.bounds = {
            xMin: this.options.padding + this.options.titleFont.size + this.options.titleMargin + this.options.yAxis.labelSpace + this.options.labelMargin + this.options.tickLength,
            xMax: this.canvas.width - this.options.padding,
            yMin: this.options.padding + this.options.headerFont.size + this.options.headerMargin,
            yMax: this.canvas.height - this.options.padding - this.options.titleFont.size - this.options.titleMargin - this.options.xAxis.labelSpace - this.options.labelMargin - this.options.tickLength
        };

        this.width = this.bounds.xMax - this.bounds.xMin;
        this.height = this.bounds.yMax - this.bounds.yMin;
    }

    addData(...data) {
        for (let i = 0; i < data.length; i++) {
            if (i >= this.rawData.length) {
                this.rawData.push([]);
            }
            this.rawData[i].push(data[i]);
        }
    }

    updateData() {
        this.data = [];
        for (let i = 0; i < this.rawData.length; i++) {
            let processed = this.options.processData(this, this.rawData[i]);
            let wrapped = this.wrapData(processed);
            this.data.push(wrapped);
        }

        if (this.options.xAxis.range == 'auto') this.updateAutoRange(true);
        if (this.options.yAxis.range == 'auto') this.updateAutoRange(false);
    }

    wrapData(data) {
        if (this.options.xAxis.wrap) {
            let wrapRange = this.options.xAxis.wrap.max - this.options.xAxis.wrap.min;

            for (let d of data) {
                d.wrapX = Math.floor(Maths.inverseLerp(this.options.xAxis.wrap.min, this.options.xAxis.wrap.max, d.x));
                d.x -= wrapRange * d.wrapX;
            }
        } else {
            for (let d of data) {
                d.wrapX = 0;
            }
        }

        if (this.options.yAxis.wrap) {
            let wrapRange = this.options.yAxis.wrap.max - this.options.yAxis.wrap.min;

            for (let d of data) {
                d.wrapY = Math.floor(Maths.inverseLerp(this.options.yAxis.wrap.min, this.options.yAxis.wrap.max, d.y));
                d.y -= wrapRange * d.wrapY;
            }
        } else {
            for (let d of data) {
                d.wrapY = 0;
            }
        }

        return data;
    }

    updateAutoRange(isX) {
        let axisName = isX ? 'xAxis' : 'yAxis';
        let axisOptions = this.options[axisName];
        let axis = this[axisName];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        let dataExists = false;

        for (let dataset of this.data) {
            for (let d of dataset) {
                let value = isX ? d.x : d.y;
                min = Math.min(min, value);
                max = Math.max(max, value);
                dataExists = true;
            }
        }

        if (!dataExists) {
            min = 0;
            max = 0;
        } else {
            let range = max - min;

            if (min < axis.range.min || max > axis.range.max) {
                let offset = range * this.options.rangeIncreaseThreshold * 0.5;
                min -= offset;
                max += offset;
            } else {
                if (axis.lastDecreaseTime) {
                    let duration = (Date.now() - axis.lastDecreaseTime) / 1000;
                    if (duration < this.options.rangeDecreaseCooldown) return;
                }
                axis.lastDecreaseTime = Date.now();

                let containingRange = axis.range.max - axis.range.min;
                if (range > this.options.rangeDecreaseThreshold * containingRange) return;
            }
        }

        let range = max - min;
        if (range < axisOptions.minRange) {
            let margin = (axisOptions.minRange - range) * 0.5;
            min -= margin;
            max += margin;
        }

        let scale = this.computeNiceScale(min, max, 5);
        axis.range = {
            min: scale.min,
            max: scale.max
        };

        axis.ticks = [];
        for (let i = 0; i < scale.tickCount; i++) {
            let t = i / (scale.tickCount - 1);
            axis.ticks.push(Maths.lerp(scale.min, scale.max, t));
        }
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
        let tickCount = Math.round(range / tickSpacing) + 1;

        return {
            tickSpacing: tickSpacing,
            tickCount: tickCount,
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
        let t = Maths.inverseLerp(this.xAxis.range.min, this.xAxis.range.max, x);
        if (this.options.xAxis.inverted) t = 1 - t;
        return Maths.lerp(this.bounds.xMin, this.bounds.xMax, t);
    }

    chartToScreenY(y) {
        let t = Maths.inverseLerp(this.yAxis.range.min, this.yAxis.range.max, y);
        if (this.options.yAxis.inverted) t = 1 - t;
        return Maths.lerp(this.bounds.yMax, this.bounds.yMin, t);
    }

    fontToString(font) {
        return `${font.weight} ${font.size}px ${font.family}`;
    }

    render() {
        this.updateData();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = this.fontToString(this.options.labelFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.options.style.labelColor;

        this.ctx.strokeStyle = this.options.style.chartColor;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let t of this.xAxis.ticks) {
            let x = this.chartToScreenX(t);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.bounds.yMin);
            this.ctx.lineTo(x, this.bounds.yMax + this.options.tickLength);
            this.ctx.stroke();
            this.ctx.fillText(t, x, this.bounds.yMax + this.options.tickLength + this.options.labelMargin);
        }
        
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let t of this.yAxis.ticks) {
            let y = this.chartToScreenY(t);
            this.ctx.fillStyle = this.options.style.chartColor;
            this.ctx.beginPath();
            this.ctx.moveTo(this.bounds.xMin - this.options.tickLength, y);
            this.ctx.lineTo(this.bounds.xMax, y);
            this.ctx.stroke();

            if (Math.abs(t) < 1e-10) t = 0;
            let label = t.toFixed(1);
            this.ctx.fillStyle = this.options.style.labelColor;
            this.ctx.fillText(label, this.bounds.xMin - this.options.tickLength - this.options.labelMargin, y);
        }

        this.ctx.lineWidth = 3;

        for (let i = 0; i < this.data.length; i++) {
            let dataset = this.data[i];
            this.ctx.strokeStyle = this.options.style.plotColors[i % this.options.style.plotColors.length];

            this.ctx.beginPath();
            for (let i = 0; i < dataset.length; i++) {
                if (i > 0 && (dataset[i-1].wrapX != dataset[i].wrapX || dataset[i-1].wrapY != dataset[i].wrapY)) {
                    this.renderWrap(dataset[i-1], dataset[i]);
                }

                let x = this.chartToScreenX(dataset[i].x);
                let y = this.chartToScreenY(dataset[i].y);
                if (i > 0) this.ctx.lineTo(x, y);
                else this.ctx.moveTo(x, y);
            }
            this.ctx.stroke();
        }

        this.ctx.font = this.fontToString(this.options.titleFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        let centerX = (this.bounds.xMin + this.bounds.xMax) * 0.5;
        let centerY = (this.bounds.yMin + this.bounds.yMax) * 0.5;

        this.ctx.fillText(this.options.xAxis.title, centerX, this.bounds.yMax + this.options.tickLength + this.options.labelMargin + this.options.xAxis.labelSpace + this.options.titleMargin);

        this.ctx.save();
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.translate(-centerY, this.bounds.xMin - this.options.tickLength - this.options.labelMargin - this.options.yAxis.labelSpace - this.options.titleMargin);
        this.ctx.fillText(this.options.yAxis.title, 0, 0);
        this.ctx.restore();

        this.ctx.font = this.fontToString(this.options.headerFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(this.options.header, centerX, this.bounds.yMin - this.options.headerMargin);
    }

    renderWrap(start, end) {
        let dwX = end.wrapX - start.wrapX;
        let dwY = end.wrapY - start.wrapY;

        let rangeX = this.options.xAxis.wrap ? this.options.xAxis.wrap.max - this.options.xAxis.wrap.min : 0;
        let rangeY = this.options.yAxis.wrap ? this.options.yAxis.wrap.max - this.options.yAxis.wrap.min : 0;

        let toX = end.x + dwX * rangeX;
        let toY = end.y + dwY * rangeY;
        
        let fromX = start.x - dwX * rangeX;
        let fromY = start.y - dwY * rangeY;

        let wrapBounds = {
            xMin: this.xAxis.range.min,
            xMax: this.xAxis.range.max,
            yMin: this.yAxis.range.min,
            yMax: this.yAxis.range.max,
        }

        if (this.options.xAxis.wrap) {
            wrapBounds.xMin = this.options.xAxis.wrap.min;
            wrapBounds.xMax = this.options.xAxis.wrap.max;
        }

        if (this.options.yAxis.wrap) {
            wrapBounds.yMin = this.options.yAxis.wrap.min;
            wrapBounds.yMax = this.options.yAxis.wrap.max;
        }

        let intersectTo = Maths.lineBoxIntersect(start.x, start.y, toX, toY, wrapBounds.xMin, wrapBounds.xMax, wrapBounds.yMin, wrapBounds.yMax).closest;
        if (intersectTo != null) {
            toX = intersectTo.x;
            toY = intersectTo.y;
        }

        let intersectFrom = Maths.lineBoxIntersect(fromX, fromY, end.x, end.y, wrapBounds.xMin, wrapBounds.xMax, wrapBounds.yMin, wrapBounds.yMax).closest;
        if (intersectFrom != null) {
            fromX = intersectFrom.x;
            fromY = intersectFrom.y;
        }


        this.ctx.lineTo(this.chartToScreenX(toX), this.chartToScreenY(toY));
        this.ctx.moveTo(this.chartToScreenX(fromX), this.chartToScreenY(fromY));
        this.ctx.lineTo(this.chartToScreenX(end.x), this.chartToScreenY(end.y));
    }
}

export const DataProcessors = {
    timeProcessor: (chart, data) => {
        let processed = [];
        for (let d of data) {
            let x = (Date.now() - d.time) / 1000;
            if (!Maths.inRange(chart.xAxis.range.min, chart.xAxis.range.max, x)) continue;
            processed.push({ x: x, y: d.y });
        }
        return processed;
    }
}

let baseOptions = {
    xAxis: {
        title: 'Time (sec)',
        range: {
            min: 0,
            max: 10
        },
        inverted: true,
        ticks: [ 10, 8, 6, 4, 2, 0 ]
    },
    processData: DataProcessors.timeProcessor
};

let angleOptions = Utils.mergeDeep({
    yAxis: {
        title: 'degrees',
        range: {
            min: -180,
            max: 180
        },
        wrap: {
            min: -180,
            max: 180
        },
        ticks: [ -180, -90, 0, 90, 180 ]
    },
    header: 'Angle'
}, baseOptions);
const angleChart = new Chart(document.getElementById('angle-chart'), angleOptions);

let altitudeOptions = Utils.mergeDeep({
    yAxis: {
        title: 'm',
        minRange: 2
    },
    header: 'Altitude'
}, baseOptions);
const altitudeChart = new Chart(document.getElementById('altitude-chart'), altitudeOptions);

let xPositionOptions = Utils.mergeDeep({
    yAxis: {
        title: 'm',
        minRange: 2
    },
    header: 'X Position'
}, baseOptions);
const xPositionChart = new Chart(document.getElementById('x-position-chart'), xPositionOptions);

let xVelocityOptions = Utils.mergeDeep({
    yAxis: {
        title: 'm/s',
        minRange: 2
    },
    header: 'X Velocity'
}, baseOptions);
const xVelocityChart = new Chart(document.getElementById('x-velocity-chart'), xVelocityOptions);


render();

export function addData(data) {
    let time = Date.now();
    angleChart.addData({ time: time, y: data.angle }, { time: time, y: data.motorAngle });
    altitudeChart.addData({time: time, y: data.position.y});
    xPositionChart.addData({time: time, y: data.position.x});
    xVelocityChart.addData({time: time, y: data.velocity.x});
    render();
}

function render() {
    angleChart.render();
    altitudeChart.render();
    xPositionChart.render();
    xVelocityChart.render();
}