import * as firebase from 'firebase/app';
import 'firebase/firestore';
let list = [{}];

export let houseAndRezidentTasks = () => {
  return new Promise(async function(resolve, reject) {
    console.log('houseAndRezidentTasks start');
    console.log('await import');
    await excelImport();
    let houseAndRezidentTasks = [];

    console.log('list ', Object.keys(list).length);

    list.forEach(tasks => {
      if (
        tasks['Task Type'] == 'Group (House)' ||
        tasks['Task Type'] == 'Individual (Resident)'
      ) {
        houseAndRezidentTasks.push(tasks);
      }
    });

    console.log('after house and resident');

    console.log('task count', houseAndRezidentTasks.length);
    let db = firebase.firestore();
    var batch = db.batch();
    houseAndRezidentTasks.forEach(task => {
      var taskName = task['Nosaukums'];
      const i = taskName.indexOf(' ');
      if (i == 4) {
        taskName = taskName.slice(i).trim();
      }

      const ref = db.collection('neighborhoodTasks').doc();

      var data = {
        taskType:
          task['Task Type'] == 'Individual (Resident)' ? 'Rezidenta' : 'Mājas',
        taskDirect: task['Direct or Indirect'] == 'DRC' ? 'Tiešs' : 'Netiešs',
        service: 'bfh',
        taskOperationsGroup: task['Operations Group'] || '',
        taskGroup: task['Task Group'] || '',
        taskCodingGroup: task['Task Coding Group'] || '',
        taskName: taskName || '',
        taskTime: task['Sākuma laiks'] || '',
        taskEveryday: task['Everyday task'] || false,
        taskSocial: task['Social'] || false,
        taskActive: true,
        taskNumber: 0,
      };

      batch.set(ref, data);
    });

    console.log('commit batch');
    await batch.commit();

    resolve('ok');
  });
};

function excelImport() {
  return new Promise(function(resolve, reject) {
    let url =
      'prieksh share';
    let oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'arraybuffer';
    oReq.onload = function(e) {
      let arraybuffer = oReq.response;

      let data = new Uint8Array(arraybuffer);
      let arr = new Array();
      for (let i = 0; i != data.length; ++i)
        arr[i] = String.fromCharCode(data[i]);
      let bstr = arr.join('');

      let workbook = XLSX.read(bstr, {
        type: 'binary',
      });

      let first_sheet_name = workbook.SheetNames[0];

      let worksheet = workbook.Sheets[first_sheet_name];
      list = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
      });
      var status = oReq.status;
      if (status == 200) {
        resolve(status);
      } else {
        reject(status);
      }
    };
    oReq.send();
  });
}
