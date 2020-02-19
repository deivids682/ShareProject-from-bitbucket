const admin = require('firebase-admin');

module.exports.copyTasks = async function() {
  return new Promise(async resolve => {
    try {
      const shiftPeriod = 6;
      console.log('start shifts and tasks');

      const today = new Date();
      //const today = new Date(2019, 10, 15);
      console.log('today ', today);
      today.setHours(0, 0, 0);
      const formatToday = formatDate(today);
      const yesterday = addDays(today, -1);
      const formatYesterday = formatDate(yesterday);
      const newDate = addDays(today, shiftPeriod);
      const formatNewDate = formatDate(newDate);

      //construct new shift key
      var newShiftKey = constructShiftKey(newDate);

      //get all neighborhoods
      var db = admin.firestore();
      var shiftsL = {};

      const neighborhoods = await db.collection('residences').get();

      var nbhKeys = [];
      neighborhoods.forEach(nbh => {
        nbhKeys.push(nbh.id);
      });

      //loop neigborhoods to copy last day
      var responsible = {};
      /* eslint-disable no-await-in-loop */
      for (var nb = 0; nb < nbhKeys.length; nb++) {
        const nbhId = nbhKeys[nb];
        responsible[nbhId] = {};
        var shiftSnap = await db
          .collection('residences')
          .doc(nbhId)
          .collection('shifts')
          .orderBy('shiftDate', 'desc')
          .limit(1)
          .get();

        shiftSnap.forEach(shift => {
          var shiftData = shift.data();

          //modify data for new shift
          shiftData['day'] = newDate.getDay();
          shiftData['shiftDate'] = newDate;
          shiftData['formatDate'] = formatNewDate;

          //store in object
          responsible[nbhId][newShiftKey] = shiftData.responsibleForShifts;

          //write in db
          db.collection('residences')
            .doc(nbhId)
            .collection('shifts')
            .doc(newShiftKey)
            .set(shiftData);
        });
      } //end for neighborhood
      /* eslint-enable no-await-in-loop */

      //COPY TASKS PART
      //get clients to copy only active or paused
      const clientsSnap = await db.collection('clients').get();
      var clients = {};
      clientsSnap.forEach(client => {
        clients[client.id] = client.data();
      });
      //get residences for bfh house tasks
      var resSnap = await db
        .collection('residences')
        .where('service', '==', 'bfh')
        .get();
      resSnap.forEach(client => {
        clients[client.id] = client.data();
      });

      //get tasks that were yesterday, modify and then copy them to newDate
      const yesterdayTasks = await db
        .collection('taskArchive')
        .where('lpTaskFormatDate', '==', formatYesterday)
        .get();

      var taskCounter = 0;
      var taskPromises = [];
      yesterdayTasks.forEach(task => {
        taskCounter++;
        const oldTaskKey = task.id;
        const taskData = task.data();

        //postpone task?
        if (taskData.status === 'postponed') {
          taskCounter++;
          var postpNewShiftKey = constructShiftKey(today);

          //add postponed task to tomorrow
          var postpProm = addNewTask(
            true,
            today,
            formatToday,
            clients,
            responsible,
            taskData,
            oldTaskKey,
            postpNewShiftKey
          );
          taskPromises.push(postpProm);
        }

        //copy new task to db
        var tProm = addNewTask(
          false,
          newDate,
          formatNewDate,
          clients,
          responsible,
          taskData,
          oldTaskKey,
          newShiftKey
        );
        taskPromises.push(tProm);
      }); //end for each task

      await Promise.all(taskPromises);

      var endMessage = 'copied ' + taskCounter + ' tasks';
      console.log(endMessage + ' Resovle promise');
      resolve('end main Promise');
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

async function addNewTask(
  isPostponed,
  ntNewDate,
  ntFormatNewDate,
  clients,
  responsible,
  taskData,
  oldTaskKey,
  newShiftKey
) {
  return new Promise(async resolve => {
    try {
      var ntTaskData = Object.assign({}, taskData);
      var db = admin.firestore();
      //construct new key
      const newTaskKey = constructTaskKey(ntTaskData, newShiftKey, oldTaskKey);

      if (ntTaskData.lpTaskNumber === 2102) {
        console.log(
          'add task ',
          isPostponed,
          newTaskKey,
          ntNewDate,
          ntFormatNewDate,
          newShiftKey,
          ntTaskData
        );
      }

      //modify for new task
      ntTaskData['status'] = 'open';

      ntTaskData['lpTaskFormatDate'] = ntFormatNewDate;
      ntTaskData['lpTaskDate'] = ntNewDate;
      //generate keys
      //shiftKey
      ntTaskData['shiftKey'] =
        ntTaskData['clientDistrict'] +
        '.' +
        ntFormatNewDate +
        '.' +
        ntTaskData['lpTaskShiftNumber'];
      //clientShiftKey
      ntTaskData['clientShiftKey'] =
        ntTaskData['clientId'] +
        '.' +
        ntFormatNewDate +
        '.' +
        ntTaskData['lpTaskShiftNumber'];

      //soloTaskKey
      ntTaskData['soloTaskKey'] =
        ntTaskData['lpTaskId'] +
        '.' +
        ntTaskData['clientId'] +
        '.' +
        ntFormatNewDate +
        '.' +
        ntTaskData['lpTaskShiftNumber'];

      //delete keys
      delete ntTaskData['closedAt'];
      delete ntTaskData['closedBy'];
      delete ntTaskData['location'];

      // delete fields
      delete ntTaskData['photoUrl'];
      delete ntTaskData['comment'];
      delete ntTaskData['numberOfParticipants'];

      if (!isPostponed && typeof ntTaskData.postponed !== 'undefined') {
        delete ntTaskData['postponed'];
      }

      //if latecheck
      if (typeof ntTaskData.latecheck !== 'undefined') {
        delete ntTaskData['latecheck'];
      }

      //timestamp
      ntTaskData['lastUpdate'] = new Date();
      if (isPostponed) {
        ntTaskData['updatedBy'] = 'Auto postpone task';
        //add postpone note
        const postNote = {
          date: ntTaskData.lpTaskFormatDate,
          responsible: ntTaskData.responsible,
        };
        if (typeof ntTaskData.postponed === 'undefined') {
          ntTaskData['postponed'] = [postNote];
        } else {
          ntTaskData.postponed.push(postNote);
        }
      } else {
        ntTaskData['updatedBy'] = 'Auto copy task';
      }

      //get who is responsible that day
      //console.log('client ', taskData.clientName, 'newShifteKey ', newShiftKey, 'responsible ', responsible)
      //if not solo task, get responsible, else - don't change the responsible user
      if (!ntTaskData.soloTask) {
        if (isPostponed) {
          // check if has defined client shift key
          const clientShiftKey =
            ntTaskData.clientId +
            '.' +
            ntFormatNewDate +
            '.' +
            ntTaskData.lpTaskShiftNumber;
          var clientShiftKeyDoc = await db
            .collection('clientShiftKeys')
            .doc(clientShiftKey)
            .get();

          if (clientShiftKeyDoc.exists) {
            ntTaskData['responsible'] = clientShiftKeyDoc.data().responsible;
          } else {
            //get default responsible for client district, that shift
            const shiftId = ntNewDate.toISOString().substr(0, 10);
            var shift = await db
              .collection('residences')
              .doc(ntTaskData.clientDistrict)
              .collection('shifts')
              .doc(shiftId)
              .get();

            ntTaskData['responsible'] = shift.data().responsibleForShifts[
              ntTaskData.lpTaskShiftNumber
            ];
          }
        } else {
          ntTaskData['responsible'] =
            responsible[ntTaskData.clientDistrict][newShiftKey][
              ntTaskData.lpTaskShiftNumber
            ];
        }
      }

      //write in db only active or paused
      if (
        clients[ntTaskData.clientId].clientStatus !== 'stopped' &&
        clients[ntTaskData.clientId].clientStatus !== 'deleted'
      ) {
        await db
          .collection('taskArchive')
          .doc(newTaskKey)
          .set(ntTaskData);
      }

      resolve('task in db');
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
}

function inputData(data) {
  return data;
}
function constructTaskKey(taskData, newShiftKey, oldTaskKey) {
  const clientId = taskData.clientId;
  const shiftNr = taskData.lpTaskShiftNumber;
  const taskId = oldTaskKey.split('-').pop();
  return clientId + '-' + newShiftKey + '-' + shiftNr + '-' + taskId;
}

function formatDate(inpDate) {
  var shiftDate = new Date(inpDate);
  const year = shiftDate.getFullYear();
  var month = shiftDate.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  var date = shiftDate.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  return date + '.' + month + '.' + year + '.';
}

function constructShiftKey(inpDate) {
  var shiftDate = new Date(inpDate);
  const year = shiftDate.getFullYear();
  var month = shiftDate.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  var date = shiftDate.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  return year + '-' + month + '-' + date;
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
