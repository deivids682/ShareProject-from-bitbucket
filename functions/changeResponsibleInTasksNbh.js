

const admin = require('firebase-admin');

module.exports.districtResponsibleChanged = async function(
  districtId,
  newValue,
  oldValue
) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      var shiftKeys = Object.keys(newValue.responsibleForShifts);
      var changePromises = [];
      for (var shift = 0; shift < shiftKeys.length; shift++) {
        //only if responsible changed for that shiftNr
        if (
          oldValue.responsibleForShifts[shift] !==
          newValue.responsibleForShifts[shift]
        ) {
          const shiftDate = newValue.formatDate;
          const shiftKey = districtId + '.' + shiftDate + '.' + shift;
          const newResponsible = newValue.responsibleForShifts[shift];

          console.log('shiftKey ', shiftKey);

          /* eslint-disable no-await-in-loop */
          //get data
          //overwrite client shift keys
          console.log('before get data');

          //update tasks, but not solo tasks
          var tasksSnap = db
            .collection('taskArchive')
            .where('shiftKey', '==', shiftKey)
            .where('soloTask', '==', false)
            .get();

          var clientShiftKeysSnap = db
            .collection('clientShiftKeys')
            .where('districtId', '==', districtId)
            .where('dateFormatted', '==', shiftDate)
            .where('shiftNr', '==', shift)
            .get();

          var dataPromises = await Promise.all([
            tasksSnap,
            clientShiftKeysSnap,
          ]);
          console.log('after Promise.all get data');

          console.log('before update data');
          var taskUpdate = updateTasks(
            dataPromises[0],
            newResponsible,
            newValue.updatedBy,
            districtId,
            'district'
          );

          var clientShiftKeyUpdate = overwriteClientShiftKeys(
            dataPromises[1],
            newResponsible,
            newValue.updatedBy
          );

          await Promise.all([taskUpdate, clientShiftKeyUpdate]);
          console.log('after update data district');
          /* eslint-enable no-await-in-loop */
        } //end if changed shift
      } //end for shift

      resolve('tasks disitrict responsible changed end Promise');
      return 'end changes';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.clientShiftKeyChanged = async function(shiftKey, newValue) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();

      var newResponsible = newValue.responsible;

      //get tasks to change, but not solo tasks
      var tasksSnap = await db
        .collection('taskArchive')
        .where('clientShiftKey', '==', shiftKey)
        .where('soloTask', '==', false)
        .get();

      console.log('before updateTasks');
      await updateTasks(
        tasksSnap,
        newResponsible,
        newValue.updatedBy,
        newValue.clientId,
        'client'
      );
      console.log('after update tasks');
      resolve('tasks clientShiftKeyChanged end Promise');
      return 'end changes';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

function updateTasks(
  tasksSnap,
  newResponsible,
  updatedBy,
  updateTargetId,
  updateName
) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();

      //update each task
      var changePromises = [];
      tasksSnap.forEach(doc => {
        const taskId = doc.id;
        var chProm = db
          .collection('taskArchive')
          .doc(taskId)
          .update({
            responsible: newResponsible,
            lastUpdate: new Date(),
            updatedBy:
              updatedBy +
              ' - change shift for ' +
              updateName +
              ' ' +
              updateTargetId,
          });

        changePromises.push(chProm);
      });

      console.log('update tasks promises length ', changePromises.length);

      await Promise.all(changePromises)
        .then(() => {
          console.log('all task update promises updated... end');
          resolve('tasks updated end Promise');
          return 'end updates';
        })
        .catch(error => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
}

function overwriteClientShiftKeys(
  clientShiftKeysSnap,
  newResponsible,
  updatedBy
) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();

      //update each task
      var changePromises = [];
      clientShiftKeysSnap.forEach(doc => {
        const clShiftKey = doc.id;
        var chProm = db
          .collection('clientShiftKeys')
          .doc(clShiftKey)
          .update({
            responsible: newResponsible,
            lastUpdate: new Date(),
            setManual: false,
            updatedBy: updatedBy,
          });

        changePromises.push(chProm);
      });

      console.log(
        'overwrite client shift keys promises length ',
        changePromises.length
      );

      await Promise.all(changePromises)
        .then(() => {
          console.log('all overwrite promises updated... end');
          resolve('tasks updated end Promise');
          return 'end updates';
        })
        .catch(error => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
}
