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
                minRange: 0
            },
            yAxis: {
                title: 'y',
                labelSpace: 50,
                range: 'auto',
                minRange: 0
            },
            style: {
                chartColor: '#ffffff33',
                labelColor: '#fff',
                plotColor: '#21E5E5'
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
                size: 16,
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

            processData: (_, data) => data
        }

        this.options = Utils.mergeDeep(this.options, options);

        this.xAxis = {
            range: this.options.xAxis.range,
            ticks: this.options.xAxis.ticks
        };

        this.yAxis = {
            range: this.options.yAxis.range,
            ticks: this.options.yAxis.ticks
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

    addData(data) {
        this.rawData.push(data);
    }

    updateData() {
        this.data = this.options.processData(this, this.rawData);
        if (this.options.xAxis.range == 'auto') this.updateAutoRange(true);
        if (this.options.yAxis.range == 'auto') this.updateAutoRange(false);
    }

    updateAutoRange(isX) {
        let axisName = isX ? 'xAxis' : 'yAxis';
        let axisOptions = this.options[axisName];
        let axis = this[axisName];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (let d of this.data) {
            let value = isX ? d.x : d.y;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }

        if (this.data.length === 0) {
            min = 0;
            max = 0;
        }

        let range = max - min;
        if (range < axisOptions.minRange) {
            let margin = (axisOptions.minRange - range) * 0.5;
            min -= margin;
            max += margin;
        }

        let scale = this.computeNiceScale(min, max, 5);
        axis.range = {
            start: scale.min,
            end: scale.max
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
        return Maths.map(this.xAxis.range.start, this.xAxis.range.end, this.bounds.xMin, this.bounds.xMax, x);
    }

    chartToScreenY(y) {
        return Maths.map(this.yAxis.range.start, this.yAxis.range.end, this.bounds.yMax, this.bounds.yMin, y);
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

        this.ctx.strokeStyle = this.options.style.plotColor;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        for (let i = 0; i < this.data.length; i++) {
            let x = this.chartToScreenX(this.data[i].x);
            let y = this.chartToScreenY(this.data[i].y);

            if (i == 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

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
}

export const DataProcessors = {
    timeProcessor: (chart, data) => {
        let processed = [];
        for (let d of data) {
            let x = (Date.now() - d.time) / 1000;
            if (!Maths.inRange(chart.xAxis.range.start, chart.xAxis.range.end, x)) continue;
            processed.push({ x: x, y: d.y });
        }
        return processed;
    }
}

let options = {
    xAxis: {
        title: 'Time (s)',
        range: {
            start: 10,
            end: 0
        },
        ticks: [ 10, 8, 6, 4, 2, 0 ]
    },
    yAxis: {
        title: 'degrees',
        minRange: 2
    },
    header: 'Rocket Angle',
    processData: DataProcessors.timeProcessor
}
const chart = new Chart(document.getElementById('chart'), options);
chart.render();

export function addData(value) {
    let time = Date.now();
    chart.addData({ time: time, y: value });
    chart.render();
}