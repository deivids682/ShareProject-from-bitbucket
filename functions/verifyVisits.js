const admin = require('firebase-admin');

module.exports.adjustVisitsInDailyReports = async function(
  visitId,
  visitValue,
  newVisit
) {
  return new Promise(async resolve => {
    try {
      //when deleted older than today visit, delete also visit stats in that daily report
      const dailyReportId = visitValue.dateFormatted;
      const db = admin.firestore();

      var dailyRep = await db
        .collection('dailyReports')
        .doc(dailyReportId)
        .get();

      if (dailyRep.exists) {
        //delete visit in report data and then update report
        var reportData = dailyRep.data();
        var userId = visitValue.user;
        var clientId = visitValue.clientId;

        if (newVisit) {
          //add visit in report
          reportData.visits.allVisits[visitId] = visitValue;
          reportData.visits.visitsByClient[clientId][visitId] = visitValue;
          reportData.visits.visitsByUsers[userId][visitId] = visitValue;
        } else {
          //delete visit in report
          delete reportData.visits.allVisits[visitId];
          delete reportData.visits.visitsByClient[clientId][visitId];
          delete reportData.visits.visitsByUsers[userId][visitId];
        }

        //save data
        await db
          .collection('dailyReports')
          .doc(dailyReportId)
          .set(reportData);
        console.log('visit deleted from report');
      } else {
        // doc.data() will be undefined in this case
        console.log('No daily report with id ', dailyReportId);
      }

      resolve('visit deleted end Promise');
      return;
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.adjustVistiMetrics = async function(
  visitId,
  visitValue,
  newVisit
) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      //calculate visit duration
      const clientId = visitValue.clientId;
      const visitDuration =
        visitValue.endAt.seconds - visitValue.startAt.seconds;

      //get client
      const clientRef = db.collection('clients').doc(clientId);
      var client = await clientRef.get();
      var clientVisitDurations = [];
      var clientVisitTotalSeconds = 0;
      if (client.data().visitDurations) {
        clientVisitDurations = client.data().visitDurations;
        clientVisitTotalSeconds = client.data().visitTotalSeconds;
      }

      //if adding new visit
      if (newVisit) {
        clientVisitDurations.push(visitDuration);
        clientVisitTotalSeconds += visitDuration;
      } else {
        //deleted
        clientVisitDurations.splice(
          clientVisitDurations.indexOf(visitDuration),
          1
        );
        clientVisitTotalSeconds -= visitDuration;
      }
      //update
      clientRef.update({
        visitDurations: clientVisitDurations,
        visitTotalSeconds: clientVisitTotalSeconds,
      });

      //for rd monthly report
      var visitDate = new Date(visitValue.startAt.seconds * 1000);
      //get visit starting time to analyze for late visits
      const visitHour = visitDate.getHours();
      //const visitHour = 18; //for testing

      var weekKey = getWeekKey(visitDate);
      var month = visitDate.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var monthKey = visitDate.getFullYear() + '-' + month;
      var monthDoc = await db
        .collection('nbhRdMonthlyReports')
        .doc(monthKey)
        .get();

      //if new month
      if (monthDoc.exists) {
        var monthData = monthDoc.data();
        //update
        if (newVisit) {
          //if new client
          if (!monthData[clientId]) {
            monthData[clientId] = { clientName: visitValue.clientName };
          }
          //if new week
          if (!monthData[clientId][weekKey]) {
            monthData[clientId][weekKey] = {
              week: weekKey,
              visits: 0,
              lateVisits: 0,
              visitsSec: 0,
              timeTasks: 0,
              aiders: [],
              orderByDate: visitDate.getTime(),
            };
          }
          //update data
          //store data
          monthData[clientId][weekKey].visits++;
          monthData[clientId][weekKey].visitsSec += visitDuration;
          // if late visit
          if (visitHour >= 18) {
            monthData[clientId][weekKey].lateVisits++;
          }
          //aiders
          if (
            monthData[clientId][weekKey].aiders.indexOf(visitValue.user) === -1
          ) {
            monthData[clientId][weekKey].aiders.push(visitValue.user);
          }
        } else {
          //exists and delete, but update only if client and if week
          if (monthData[clientId]) {
            if (monthData[clientId][weekKey]) {
              //store data
              monthData[clientId][weekKey].visits--;
              monthData[clientId][weekKey].visitsSec -= visitDuration;
              // if late visit
              if (visitHour >= 18) {
                monthData[clientId][weekKey].lateVisits--;
              }
              //aiders don't recalculate
            }
          }
        }
        //save in db
        db.collection('nbhRdMonthlyReports')
          .doc(monthKey)
          .set(monthData, { merge: true });
      } else {
        //doesn't exist. then only add
        if (newVisit) {
          var setObj = {
            [clientId]: {
              clientName: visitValue.clientName,
              [weekKey]: {
                week: weekKey,
                visits: 1,
                lateVisits: visitHour >= 18 ? 1 : 0,
                visitsSec: visitDuration,
                timeTasks: 0,
                aiders: [visitValue.user],
                orderByDate: visitDate.getTime(),
              },
            },
          };
          //save in db
          console.log('save new ', monthKey, setObj);
          db.collection('nbhRdMonthlyReports')
            .doc(monthKey)
            .set(setObj);
        } //end if add new month
      } //end if doesn't exist month

      resolve('visit deleted end Promise');
      return;
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

function getWeekKey(date) {
  var day = date.getDay();
  if (day === 0) {
    day = 7;
  }
  var daysFromMonday = 1 - day;
  var monday = addDays(date, daysFromMonday);
  var daysToSunday = 7 - day;
  var sunday = addDays(date, daysToSunday);

  //chech if short week
  if (date.getMonth() !== monday.getMonth()) {
    monday = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  if (date.getMonth() !== sunday.getMonth()) {
    sunday = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  return formatDate(monday) + '-' + formatDate(sunday);
}
// exports the variables and functions above so that other modules can use them
module.exports.getWeekKey = getWeekKey;

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

module.exports.verifyVisits = async function() {
  return new Promise(async resolve => {
    try {
      //delete visits from date based on rules
      const db = admin.firestore();
      var visitsToDelete = [];

      //generate date
      //triggering 1am, Riga +3 hours from UTC time, thus for server is today === yesterday  in Riga
      const today = new Date();
      //const today = new Date(2019, 7, 1); //to clean up more days
      today.setHours(0, 0, 0, 0);

      console.log('get visits from yesterday to now', today);

      var visitsQuery = await db
        .collection('visits')
        .where('startAt', '>', today)
        .get();

      var visitsByUsers = {};

      visitsQuery.forEach(doc => {
        const visitUser = doc.data().user;
        //new user
        if (typeof visitsByUsers[visitUser] === 'undefined') {
          visitsByUsers[visitUser] = {
            visitKeys: [],
            visitData: {},
            visitsToDelete: {},
          };
        }

        //store visit to user
        visitsByUsers[visitUser].visitKeys.push(doc.id);
        visitsByUsers[visitUser].visitData[doc.id] = doc.data();
      });

      //loop visits and verify against the rules
      //loop users
      var userKeys = Object.keys(visitsByUsers);

      for (var u = 0; u < userKeys.length; u++) {
        const userId = userKeys[u];
        const userVisitKeys = visitsByUsers[userId].visitKeys;
        const userVisitData = visitsByUsers[userId].visitData;
        //if more than 1 visit
        if (userVisitKeys.length > 1) {
          //start from second visit, because analyze against previous one
          for (var v = 1; v < userVisitKeys.length; v++) {
            var thisVisitId = userVisitKeys[v];
            var thisVisitData = userVisitData[thisVisitId];
            var thisClient = thisVisitData.clientId;
            var prevVisitId = userVisitKeys[v - 1];
            var prevVisitData = userVisitData[prevVisitId];
            var prevClient = prevVisitData.clientId;

            //evaluate
            var durationBetweenVisits =
              thisVisitData.startAt.seconds - prevVisitData.endAt.seconds;

            //delete visit if
            //1. duration between visits is less than 30 min (1800 sec)
            //2. it is the same client

            if (durationBetweenVisits < 1800 && thisClient === prevClient) {
              //add to delete visits
              visitsToDelete.push(thisVisitId);
              //add to store visits data
              visitsByUsers[userId].visitsToDelete[thisVisitId] = thisVisitData;
            }
          } //end for visits
        } //end if more than 1 visit for the user
      } //end for user keys

      //store deleted visit data for later analysis
      var deleteDate = formatDate(today);
      var setObj = {
        date: deleteDate,
        deletedVisitsAll: visitsToDelete,
        visitsData: visitsByUsers,
      };
      await db
        .collection('deletedVisits')
        .doc(deleteDate)
        .set(setObj);

      //loop visits to delete
      //delete unverified visits
      console.log(visitsToDelete.length, ' visits to delete ', visitsToDelete);
      var deletePromises = [];
      for (var d = 0; d < visitsToDelete.length; d++) {
        var delProm = db
          .collection('visits')
          .doc(visitsToDelete[d])
          .delete();
        deletePromises.push(delProm);
        console.log('delete ', visitsToDelete[d]);
      }

      await Promise.all(deletePromises);
      console.log('awaited Promise.all');

      //end
      console.log('visits verified / deleted');
      resolve('visits verified end Promise');
      return;
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
