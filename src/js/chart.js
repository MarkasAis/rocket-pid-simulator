import Chart from 'chart.js/auto'

const chart = new Chart(
    document.getElementById('chart'),
    {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Angle',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            } ]
        },
        options: {
            animation: {
                duration: 0
            },
            elements: {
                point: {
                    pointStyle: false
                }
            }
        }
    }
);
  
let counter = 0;

export function addData(newData) {
    let size = chart.data.labels.length+1;
    chart.data.labels.push(counter++);
    chart.data.datasets[0].data.push(newData);

    if (size > 200) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}
