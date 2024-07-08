import Maths from "./maths";
import Utils from "./utils";
import Vec2 from "./vec2";
import Bounds from "./bounds";

class Chart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.options = {
            axis: {
                x: {
                    title: 'x',
                    labelSpace: 10,
                    range: 'auto',
                    inverted: false,
                    minRange: 0
                },
                y: {
                    title: 'y',
                    labelSpace: 50,
                    range: 'auto',
                    inverted: false,
                    minRange: 0
                },
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


        this.axis = {
            x: {
                range: this.options.axis.x.range,
                ticks: this.options.axis.x.ticks,
                lastDecreaseTime: 0
            },
            y: {
                range: this.options.axis.y.range,
                ticks: this.options.axis.y.ticks,
                lastDecreaseTime: 0
            }
        };



        this.rawData = [];
        this.computeParams();
    }

    computeParams() {
        this.bounds = new Bounds(
            this.options.padding + this.options.titleFont.size + this.options.titleMargin + this.options.axis.y.labelSpace + this.options.labelMargin + this.options.tickLength,
            this.options.padding + this.options.headerFont.size + this.options.headerMargin,
            this.canvas.width - this.options.padding,
            this.canvas.height - this.options.padding - this.options.titleFont.size - this.options.titleMargin - this.options.axis.x.labelSpace - this.options.labelMargin - this.options.tickLength
        );
    }

    updateRenderParams() {
        this.wrapBounds = new Bounds(
            this.axis.x.range.min,
            this.axis.y.range.min,
            this.axis.x.range.max,
            this.axis.y.range.max
        );

        if (this.options.axis.x.wrap) {
            this.wrapBounds.min.x = this.options.axis.x.wrap.min;
            this.wrapBounds.max.x = this.options.axis.x.wrap.max;
        }

        if (this.options.axis.y.wrap) {
            this.wrapBounds.min.y = this.options.axis.y.wrap.min;
            this.wrapBounds.max.y = this.options.axis.y.wrap.max;
        }
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
            let converted = this.convertData(processed);
            let wrapped = this.wrapData(converted);
            this.data.push(wrapped);
        }

        if (this.options.axis.x.range == 'auto') this.updateAutoRange(true);
        if (this.options.axis.y.range == 'auto') this.updateAutoRange(false);
    }

    convertData(data) {
        let converted = [];
        for (let d of data) {
            converted.push({ pos: new Vec2(d.x, d.y )});
        }
        return converted;
    }

    wrapData(data) {
        for (let d of data) {
            d.wrap = Vec2.zero;
        }

        if (this.options.axis.x.wrap) {
            let wrapRange = this.options.axis.x.wrap.max - this.options.axis.x.wrap.min;

            for (let d of data) {
                d.wrap.x = Math.floor(Maths.inverseLerp(this.options.axis.x.wrap.min, this.options.axis.x.wrap.max, d.pos.x));
                d.pos.x -= wrapRange * d.wrap.x;
            }
        }

        if (this.options.axis.y.wrap) {
            let wrapRange = this.options.axis.y.wrap.max - this.options.axis.y.wrap.min;

            for (let d of data) {
                d.wrap.y = Math.floor(Maths.inverseLerp(this.options.axis.y.wrap.min, this.options.axis.y.wrap.max, d.pos.y));
                d.pos.y -= wrapRange * d.wrap.y;
            }
        }

        return data;
    }

    updateAutoRange(isX) {
        let axisName = isX ? 'x' : 'y';
        let axisOptions = this.options.axis[axisName];
        let axis = this.axis[axisName];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        let dataExists = false;

        for (let dataset of this.data) {
            for (let d of dataset) {
                let value = isX ? d.pos.x : d.pos.y;
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
        let t = Maths.inverseLerp(this.axis.x.range.min, this.axis.x.range.max, x);
        if (this.options.axis.x.inverted) t = 1 - t;
        return Maths.lerp(this.bounds.min.x, this.bounds.max.x, t);
    }

    chartToScreenY(y) {
        let t = Maths.inverseLerp(this.axis.y.range.min, this.axis.y.range.max, y);
        if (this.options.axis.y.inverted) t = 1 - t;
        return Maths.lerp(this.bounds.max.y, this.bounds.min.y, t);
    }

    chartToScreenPos(pos) {
        return new Vec2(
            this.chartToScreenX(pos.x),
            this.chartToScreenY(pos.y)
        );
    }

    fontToString(font) {
        return `${font.weight} ${font.size}px ${font.family}`;
    }

    render() {
        this.updateData();
        this.updateRenderParams();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = this.fontToString(this.options.labelFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.options.style.labelColor;

        this.ctx.strokeStyle = this.options.style.chartColor;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let t of this.axis.x.ticks) {
            let x = this.chartToScreenX(t);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.bounds.min.y);
            this.ctx.lineTo(x, this.bounds.max.y + this.options.tickLength);
            this.ctx.stroke();
            this.ctx.fillText(t, x, this.bounds.max.y + this.options.tickLength + this.options.labelMargin);
        }
        
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let t of this.axis.y.ticks) {
            let y = this.chartToScreenY(t);
            this.ctx.fillStyle = this.options.style.chartColor;
            this.ctx.beginPath();
            this.ctx.moveTo(this.bounds.min.x - this.options.tickLength, y);
            this.ctx.lineTo(this.bounds.max.x, y);
            this.ctx.stroke();

            if (Math.abs(t) < 1e-10) t = 0;
            let label = t.toFixed(1);
            this.ctx.fillStyle = this.options.style.labelColor;
            this.ctx.fillText(label, this.bounds.min.x - this.options.tickLength - this.options.labelMargin, y);
        }

        this.ctx.lineWidth = 3;

        for (let i = 0; i < this.data.length; i++) {
            let dataset = this.data[i];
            this.ctx.strokeStyle = this.options.style.plotColors[i % this.options.style.plotColors.length];

            this.ctx.beginPath();
            for (let i = 0; i < dataset.length; i++) {
                if (i > 0) {
                    if (dataset[i-1].wrap.x != dataset[i].wrap.x || dataset[i-1].wrap.y != dataset[i].wrap.y) {
                        this.renderWrap(dataset[i-1], dataset[i]);
                    } else {
                        this.renderLine(dataset[i-1].pos, dataset[i].pos);
                    }
                } else {
                    let pos = this.chartToScreenPos(dataset[i].pos);
                    this.ctx.moveTo(pos.x, pos.y);
                }
            }
            this.ctx.stroke();
        }

        this.ctx.font = this.fontToString(this.options.titleFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        let center = this.bounds.center;

        this.ctx.fillText(this.options.axis.x.title, center.x, this.bounds.max.y + this.options.tickLength + this.options.labelMargin + this.options.axis.x.labelSpace + this.options.titleMargin);

        this.ctx.save();
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.translate(-center.y, this.bounds.min.x - this.options.tickLength - this.options.labelMargin - this.options.axis.y.labelSpace - this.options.titleMargin);
        this.ctx.fillText(this.options.axis.y.title, 0, 0);
        this.ctx.restore();

        this.ctx.font = this.fontToString(this.options.headerFont);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(this.options.header, center.x, this.bounds.min.y - this.options.headerMargin);
    }

    lineTo(pos) {
        let screenPos = this.chartToScreenPos(pos);
        this.ctx.lineTo(screenPos.x, screenPos.y);
    }

    moveTo(pos) {
        let screenPos = this.chartToScreenPos(pos);
        this.ctx.moveTo(screenPos.x, screenPos.y);
    }

    renderLine(start, end) {
        let startInside = Maths.pointBoxIntersect(start, this.wrapBounds);
        let endInside = Maths.pointBoxIntersect(end, this.wrapBounds);
        if (!startInside && !endInside) this.moveTo(end);
        else if (startInside && endInside) this.lineTo(end);
        else if (startInside && !endInside) {
            let intersect = Maths.lineBoxIntersect(start, end, this.wrapBounds).closest;
            if (intersect != null) {
                this.lineTo(intersect);
                this.moveTo(end);
            } else {
                this.lineTo(end);
            }
        } else if (!startInside && endInside) {
            let intersect = Maths.lineBoxIntersect(start, end, this.wrapBounds).closest;
            if (intersect != null) {
                this.moveTo(intersect);
                this.lineTo(end);
            } else {
                this.moveTo(end);
            }
        }
    }

    renderWrap(start, end) {
        let dw = Vec2.sub(end.wrap, start.wrap);

        let range = new Vec2(
            this.options.axis.x.wrap ? this.options.axis.x.wrap.max - this.options.axis.x.wrap.min : 0,
            this.options.axis.y.wrap ? this.options.axis.y.wrap.max - this.options.axis.y.wrap.min : 0
        );
        
        let offset = Vec2.mult(dw, range);
        let to = Vec2.add(end.pos, offset);
        let from = Vec2.sub(start.pos, offset);

        this.renderLine(start.pos, to);
        this.renderLine(from, end.pos);
    }
}

export const DataProcessors = {
    timeProcessor: (chart, data) => {
        let enteredRange = false;
        let startIndex = -1;
        let endIndex = -1;
        let processed = [];

        function getTime(time) {
            return (Date.now() - time) / 1000;
        }

        function wrapData(index, time = null) {
            let d = data[index];
            if (time == null) time = getTime(d.time);
            return { x: time, y: d.y };
        }

        for (let i = 0; i < data.length; i++) {
            let x = getTime(data[i].time);
            let inRange = Maths.inRange(chart.axis.x.range.min, chart.axis.x.range.max, x);
            
            if (!enteredRange && inRange) {
                enteredRange = true;
                startIndex = i-1;
            }

            if (enteredRange && !inRange) {
                endIndex = i;
                break;
            }

            if (inRange) {
                processed.push(wrapData(i, x));
            }
        }

        if (startIndex !== -1) processed.unshift(wrapData(startIndex));
        if (endIndex !== -1) processed.push(wrapData(endIndex));
        return processed;
    }
}

let baseOptions = {
    axis: {
        x: {
            title: 'Time (sec)',
            range: {
                min: 0,
                max: 10
            },
            inverted: true,
            ticks: [ 10, 8, 6, 4, 2, 0 ]
        }
    },
    processData: DataProcessors.timeProcessor
};

let angleOptions = Utils.mergeDeep({
    axis: {
        y: {
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
        }
    },
    header: 'Angle'
}, baseOptions);
const angleChart = new Chart(document.getElementById('angle-chart'), angleOptions);

let altitudeOptions = Utils.mergeDeep({
    axis: { 
        y: {
            title: 'm',
            minRange: 2
        }
    },
    header: 'Altitude'
}, baseOptions);
const altitudeChart = new Chart(document.getElementById('altitude-chart'), altitudeOptions);

let xPositionOptions = Utils.mergeDeep({
    axis: {
        y: {
            title: 'm',
            minRange: 2
        }
    },
    header: 'X Position'
}, baseOptions);
const xPositionChart = new Chart(document.getElementById('x-position-chart'), xPositionOptions);

let xVelocityOptions = Utils.mergeDeep({
    axis: {
        y: {
            title: 'm/s',
            minRange: 2
        }
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