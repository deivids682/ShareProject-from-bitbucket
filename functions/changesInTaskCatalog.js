const admin = require('firebase-admin');

module.exports.taskDeleted = async function(taskId, oldValue) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      var batch = db.batch();
      var batchWrites = 0;
      const batchLimit = 500;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      var reset = resetNumbering(oldValue.taskGroup, oldValue.service);

      //get data
      //update task list in client profiles
      var clientsSnap = db
        .collection('clients')
        .where('prieksh share', 'array-contains', taskId)
        .get();

      //update if residences life plan task was deleted
      var resSnap = db
        .collection('residences')
        .where('prieksh share', 'array-contains', taskId)
        .get();

      var tasksSnap = db
        .collection('taskArchive')
        .where('lpTaskId', '==', taskId)
        .where('lpTaskDate', '>=', today)
        .get();

      var values = await Promise.all([clientsSnap, resSnap, tasksSnap]);

      //update clients
      values[0].forEach(client => {
        var arr = client.data().clientLifePlanTasks;
        var taskIndx = arr.indexOf(taskId);
        arr.splice(taskIndx, 1);
        var upd = { clientLifePlanTasks: arr };
        if (batchWrites < batchLimit) {
          var ref = db.collection('clients').doc(client.id);
          batch.update(ref, upd);
          batchWrites++;
        } else {
          db.collection('clients')
            .doc(client.id)
            .update(upd);
        }
      });

      //update houses
      values[2].forEach(task => {
        if (batchWrites < batchLimit) {
          var ref = db.collection('taskArchive').doc(task.id);
          batch.delete(ref);
          batchWrites++;
        } else {
          db.collection('taskArchive')
            .doc(task.id)
            .delete();
        }
      });

      //delete tasks
      values[1].forEach(res => {
        var arr = res.data().houseLifePlanTasks;
        var taskIndx = arr.indexOf(taskId);
        arr.splice(taskIndx, 1);
        var upd = { houseLifePlanTasks: arr };
        if (batchWrites < batchLimit) {
          var ref = db.collection('residences').doc(res.id);
          batch.update(ref, upd);
          batchWrites++;
        } else {
          db.collection('residences')
            .doc(res.id)
            .update({ upd });
        }
      });

      await Promise.all([batch.commit(), reset]);

      resolve('taskDeleted end Promise');
      return 'end changes';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.taskDetailsChanged = async function(taskId, newValue, field) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      var tasksSnap = await db
        .collection('taskArchive')
        .where('lpTaskId', '==', taskId)
        .where('lpTaskDate', '>=', today)
        .get();

      var updatePromises = [];
      tasksSnap.forEach(task => {
        var updProm = db
          .collection('taskArchive')
          .doc(task.id)
          .update({
            [field]: newValue,
          });
        updatePromises.push(updProm);
      });

      await Promise.all(updatePromises);

      resolve('taskDetailsChanged end Promise');
      return 'end changes';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.taskGroupChanged = async function(newValue, oldValue) {
  return new Promise(async resolve => {
    try {
      var resetNew = resetNumbering(newValue.taskGroup, newValue.service);
      var resetOld = resetNumbering(oldValue.taskGroup, oldValue.service);

      await Promise.all([resetNew, resetOld]);

      resolve('taskDetailsChanged end Promise');
      return 'end changes';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

async function resetNumbering(taskGroup, service) {
  return new Promise(async resolve => {
    const db = admin.firestore();

    //update task list in client profiles
    var tasksSnap = await db
      .collection('neighborhoodTasks')
      .orderBy('taskNumber')
      .where('taskGroup', '==', taskGroup)
      .where('service', '==', service)
      .get();

    //generate task auto number
    var groupIndex = taskGroup.indexOf('.');
    var groupNumber = parseInt(taskGroup.slice(0, groupIndex));

    var updatePromises = [];
    tasksSnap.forEach(task => {
      groupNumber++;
      updatePromises.push(
        db
          .collection('neighborhoodTasks')
          .doc(task.id)
          .update({
            taskNumber: groupNumber,
          })
      );
    });
    await Promise.all(updatePromises);
    resolve('numbers changed');
  }); //end promise
}
