//too late
//morning shift (0) after 4pm
//afternoon shift (1) after 8pm
//night shift (2) till midnight

const admin = require('firebase-admin');

module.exports.analyzeTasksForLateCheck = async function() {
  return new Promise(async resolve => {
    try {
      var db = admin.firestore();

      // for trigger
      //triggering 1am, Riga +3 hours from UTC time, thus for server is today === yesterday  in Riga
      const yesterday = new Date();
      const formatYesterday = formatDate(yesterday);

      //for testing
      // const today = new Date(2019, 7, 29);
      // const yesterday = addDays(today, -1);
      // const formatYesterday = formatDate(yesterday);

      //get morning tasks too late
      //morning shift (0) after 4pm Riga, 1pm server
      var lateMorning = new Date(yesterday.setHours(13, 0, 0, 0));
      //afternoon shift (1) till 8pm Riga, 5pm server
      var lateAfternoon = new Date(yesterday.setHours(17, 0, 0, 0));

      var tasksProm = [];
      //get tasks too late for morning (0)
      var morningProm = db
        .collection('taskArchive')
        .where('lpTaskFormatDate', '==', formatYesterday)
        .where('lpTaskShiftNumber', '==', '0')
        .where('closedAt', '>', lateMorning)
        .get();
      tasksProm.push(morningProm);

      //get tasks too late for afternoon (1)
      var afternoonProm = db
        .collection('taskArchive')
        .where('lpTaskFormatDate', '==', formatYesterday)
        .where('lpTaskShiftNumber', '==', '1')
        .where('closedAt', '>', lateAfternoon)
        .get();
      tasksProm.push(afternoonProm);

      var taskCollections = await Promise.all(tasksProm);

      taskCollections.forEach(tasks => {
        tasks.forEach(doc => {
          //add status latecheck
          db.collection('taskArchive')
            .doc(doc.id)
            .update({ latecheck: true });
        });
      });

      console.log('Resovle promise');
      resolve('end main Promise');
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

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

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
