const admin = require('firebase-admin');

module.exports.alertForVitalsEmergency = async function() {
  return new Promise(async resolve => {
    try {
      console.log('START alert for Vitals Emergency...');
      var start = new Date();
      let db = admin.firestore();

      let todayDate = new Date(),
        date = new Date();
      const yesterday = formatDate(
        date.setTime(todayDate.getTime() - 24 * 60 * 60 * 1000)
      );

      vitalsSnap = await db
        .collection('bodyVitals')
        .where('dateFormatted', '==', yesterday)
        .where('emergency', '==', true)
        .get();

      let updatePromises = [];
      vitalsSnap.forEach(vitals => {
        let updProm = db
          .collection('clients')
          .doc(vitals.data().clientId)
          .update({ hasRecentHealthProblems: true });
        updatePromises.push(updProm);
      });
      await Promise.all(updatePromises);

      clientSnap = await db
        .collection('clients')
        .where('hasRecentHealthProblems', '==', true)
        .get();

      let emergencyClientIds = [];
      clientSnap.forEach(function(doc) {
        emergencyClientIds.push(doc.id);
      });

      let twoWeeksBeforToday = new Date();
      let dateNow = new Date();
      twoWeeksBeforToday.setTime(dateNow.getTime() - 24 * 60 * 60 * 1000 * 14);

      bodyVitalsAfterSnap = await db
        .collection('bodyVitals')
        .where('emergency', '==', true)
        .where('date', '>', twoWeeksBeforToday)
        .get();

      //push unique client ids with recent health issues
      let bodyVitalsNew = [];
      bodyVitalsAfterSnap.forEach(doc => {
        if (bodyVitalsNew.indexOf(doc.data().clientId) === -1) {
          bodyVitalsNew.push(doc.data().clientId);
        }
      });

      let i = 0;
      clientIdChangeStatus = [];
      emergencyClientIds.forEach(idO => {
        if (bodyVitalsNew.indexOf(idO) === -1) {
          clientIdChangeStatus.push(idO);
        }
      }); //end for each client with emergency;

      let updateClientPromises = [];
      clientIdChangeStatus.forEach(id => {
        let updProm = db
          .collection('clients')
          .doc(id)
          .update({ hasRecentHealthProblems: false });
        updateClientPromises.push(updProm);
      });
      await Promise.all(updateClientPromises);
      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fininsh ', took, ' sec');
      resolve('Clients status updated');
    } catch (e) {
      console.log(e);
    }
  }); //end promise
};

function formatDate(inpDate) {
  let shiftDate = new Date(inpDate);
  const year = shiftDate.getFullYear();
  let month = shiftDate.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  let date = shiftDate.getDate();

  if (date < 10) {
    date = '0' + date;
  }
  return date + '.' + month + '.' + year + '.';
}
