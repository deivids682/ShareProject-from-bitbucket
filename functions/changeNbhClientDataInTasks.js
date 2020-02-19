//IF DATA IS CHANGED IN CLIENT PROFILE, THE CHANGES ARE REFLECTED IN TASKS

const admin = require('firebase-admin');

module.exports.changeLifePlanTasks = async function(
  clientId,
  oldValue,
  newValue
) {
  return new Promise(resolve => {
    try {
      const db = admin.firestore();
      const newTasks = newValue.clientLifePlanTasks;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      var updatePromises = [];

      db.collection('taskArchive')
        .where('clientId', '==', clientId)
        .where('lpTaskDate', '>=', today)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            const thisTask = doc.id;
            //split id to get clientId and taskId
            var splits = doc.id.split('-');
            var clientId = splits[0];
            var taskId = splits[splits.length - 1];

            var task = doc.data();
            var taskName =
              task.clientName +
              ' ' +
              task.lpTaskFormatDate +
              ' ' +
              task.lpTaskNumber +
              ' ' +
              task.lpTaskName;

            //delete if not in client tasks
            if (newTasks.indexOf(taskId) === -1) {
              var updProm = db
                .collection('taskArchive')
                .doc(thisTask)
                .delete();

              updatePromises.push(updProm);
            }
          });

          Promise.all(updatePromises)
            .then(() => {
              resolve('end main Promise');
              return 'promises updated';
            })
            .catch(error => {
              console.log(error);
            }); //end catch error;;
          return 'tasks updated';
        })
        .catch(error => {
          console.log(error);
        }); //end catch error;

      return 'life plan tasks changed';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.changeName = async function(clientId, oldValue, newValue) {
  return new Promise(resolve => {
    try {
      const db = admin.firestore();
      const newName = newValue.clientName;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      var updatePromises = [];
      var taskPromise = db
        .collection('taskArchive')
        .where('lpTaskDate', '>=', today)
        .where('clientId', '==', clientId)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            //change name
            var update = {
              clientName: newName,
              lastUpdate: new Date(),
              updatedBy: newValue.lastUser + ' - change name',
            };

            var updProm = db
              .collection('taskArchive')
              .doc(doc.id)
              .update(update);

            updatePromises.push(updProm);
          });

          console.log('prieksh share', updatePromises.length);

          Promise.all(updatePromises)
            .then(() => {
              console.log('Promise.all.then... end');
              resolve('end main Promise');
              return 'promises updated';
            })
            .catch(error => {
              console.log(error);
            }); //end catch error;;

          return 'name changed';
        });
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.changeDistrict = async function(clientId, oldValue, newValue) {
  return new Promise(resolve => {
    try {
      const db = admin.firestore();
      const newDistrict = newValue.clientDistrict;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      var shiftPromise = db
        .collection('residences')
        .doc(newDistrict)
        .collection('shifts')
        .where('shiftDate', '>=', today)
        .get();

      var taskPromise = db
        .collection('taskArchive')
        .where('lpTaskDate', '>=', today)
        .where('clientId', '==', clientId)
        .get();

      var districtPromise = db
        .collection('residences')
        .doc(newDistrict)
        .get();

      var updatePromises = [];

      Promise.all([districtPromise, shiftPromise, taskPromise])
        .then(values => {
          //new district data
          const newDistrictData = values[0].data();
          //change district information also in client profile
          console.log(
            'new district ',
            newDistrictData.name,
            '  ',
            newDistrictData.color
          );
          var profilePromise = db
            .collection('clients')
            .doc(clientId)
            .update({
              clientDistrictName: newDistrictData.name,
              clientColor: newDistrictData.color,
            });
          updatePromises.push(profilePromise);

          //get responsible for new district
          var shiftKeys = [];
          values[1].forEach(doc => {
            const shiftData = doc.data();
            const shiftDate = shiftData.formatDate;

            //loop shifts
            const shiftNrs = Object.keys(shiftData.responsibleForShifts);
            for (var sh = 0; sh < shiftNrs.length; sh++) {
              const key = newDistrict + '.' + shiftDate + '.' + sh;
              shiftKeys[key] = shiftData.responsibleForShifts[sh];
            }
          });

          //assign new responsible for tasks
          values[2].forEach(doc => {
            const taskData = doc.data();
            const date = taskData.lpTaskFormatDate;
            const shiftNr = taskData.lpTaskShiftNumber;
            const newShiftKey = newDistrict + '.' + date + '.' + shiftNr;
            const newResponsible = shiftKeys[newShiftKey];

            const update = {
              clientDistrict: newDistrict,
              shiftKey: newShiftKey,
              responsible: newResponsible,
              lastUpdate: new Date(),
              updatedBy: newValue.lastUser + ' - change district',
            };

            //write in db
            var updatePromise = db
              .collection('taskArchive')
              .doc(doc.id)
              .update(update);

            updatePromises.push(updatePromise);
          });

          console.log('district change promises', updatePromises.length);

          Promise.all(updatePromises)
            .then(() => {
              console.log('Promise.all.then... end');
              resolve('end main Promise');
              return 'promises updated';
            })
            .catch(error => {
              console.log(error);
            }); //end catch error;;
          return 'district changed';
        })
        .catch(error => {
          console.log(error);
        }); //end catch error;
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};
