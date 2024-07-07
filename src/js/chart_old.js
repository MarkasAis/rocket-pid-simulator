// import Chart from 'chart.js/auto'
// import 'chartjs-adapter-date-fns'

// const chart = new Chart(
//     document.getElementById('chart-old'),
//     {
//         type: 'line',
//         data: {
//             labels: [],
//             datasets: [{
//                 label: 'Angle',
//                 data: [],
//                 fill: false,
//                 borderColor: 'rgb(75, 192, 192)',
//                 // tension: 0.1
//             } ]
//         },
//         options: {
//             animation: {
//                 duration: 0
//             },
//             elements: {
//                 point: {
//                     pointStyle: false
//                 }
//             },
//             scales: {
//                 x: {
//                     type: 'time',
//                     time: {
//                         unit: 'second'
//                     }
//                 }
//             },
//             parsing: false
//         }
//     }
// );
  
// let counter = 0;

// export function addData(value) {
//     let data = { time: Date.now(), y: value };
//     // console.log(data.x);
//     // let size = chart.data.labels.length+1;
//     // chart.data.labels.push(counter++);
//     chart.data.datasets[0].data.push(data);

//     for (let d of chart.data.datasets[0].data) {
//         d.x = d.time - Date.now();
//     }

//     // if (size > 200) {
//         // chart.data.labels.shift();
//         // chart.data.datasets[0].data.shift();
//     // }

//     chart.update();
// }
