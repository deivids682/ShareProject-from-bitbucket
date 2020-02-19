//TRIGGERS
//verify / delete visits 1am
//reset visit sessions 1:05 am
//analyze tasks 1:10am
//dailyReport 3am
//copyShiftsAndTasks 4am
//BFH weekly profiling - every monday 4am

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const os = require('os');
const fs = require('fs');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const env = 'testing';
//const env = 'production';

//import functions
//prieksh share
const changeClientDataInTasks = require('./changeNbhClientDataInTasks');
const verifyVisits = require('./verifyVisits');
const changeResponsibleInTasks = require('./changeResponsibleInTasksNbh');
const autoCopyTasks = require('./autoCopyTasks');
const analyzeTasks = require('./analyzeTasks');
const changeInDistrictData = require('./changeInDistrictData');
const changedUserData = require('./changedUserData');
const changesInTaskCatalog = require('./changesInTaskCatalog.js');
const analyzeIncidents = require('./analyzeIncidents.js');
const vitalsEmergency = require('./alertForVitalsEmergency.js');
const calculateWeeklyProfilesBFH = require('./calculateWeeklyProfilesBFH.js');

////////////////////////////////////////////////
//ALLERT FOR VITALS EMERGENCY
////////////////////////////////////////////////
exports.alertForVitalsEmergency = functions.https.onRequest(
  async (req, res) => {
    try {
      await vitalsEmergency.alertForVitalsEmergency();
      return res.status(200).send('alertsForVitalsEmergency end!');
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
);

////////////////////////////////////////////////
//CALCULATE WEEKLY PROFILES BFH
////////////////////////////////////////////////
exports.calculateWeeklyProfilesBFH = functions.https.onRequest(
  async (req, res) => {
    try {
      await calculateWeeklyProfilesBFH.calculateWeeklyProfilesBFH();
      return res.status(200).send('prieksh share end!');
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    } //end catch error
  }
);

////////////////////////////////////////////////
//INCIDENTS
////////////////////////////////////////////////
//ALERT FOR APP ICIDENTS
exports.alertForIncidents = functions.https.onRequest(async (req, res) => {
  try {
    await analyzeIncidents.alertForAppIncidents();
    return res.status(200).send('alertForAppIncidents end!');
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } //end catch error
});

////////////////////////////////////////////////
//HOUSE VISITS
////////////////////////////////////////////////
//VISIT VERIFYER
exports.deletedVisitVerifyer = functions.firestore
  .document('visits/{visitId}')
  .onDelete(async (snap, context) => {
    // Get an object representing the document
    const deletedValue = snap.data();
    const visitId = context.params.visitId;
    console.log('visitId ', visitId);

    // perform desired operations ...
    console.log('deleted visit...');
    var deletePromise = verifyVisits.adjustVisitsInDailyReports(
      visitId,
      deletedValue,
      false
    );
    var visitMetricsPromise = verifyVisits.adjustVistiMetrics(
      visitId,
      deletedValue,
      false
    );

    await Promise.all([deletePromise, visitMetricsPromise]);

    return 'end all';
  });

exports.addedVisit = functions.firestore
  .document('visits/{visitId}')
  .onCreate(async (snap, context) => {
    const createdValue = snap.data();
    const visitId = context.params.visitId;
    console.log('new visitId ', visitId);

    var addPromise = verifyVisits.adjustVisitsInDailyReports(
      visitId,
      createdValue,
      true
    );
    var visitMetricsPromise = verifyVisits.adjustVistiMetrics(
      visitId,
      createdValue,
      true
    );
    await Promise.all([addPromise, visitMetricsPromise]);

    return 'end all';
  });

exports.verifyYesterdaysVisits = functions.https.onRequest(async (req, res) => {
  try {
    console.log('verifyYesterdaysVisits start...');
    await verifyVisits.verifyVisits();
    return res.status(200).send('verifyYesterdaysVisits end!');
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } //end catch error
});

//STOP ALL VISITS, RESET USERVISITSESSIONS
exports.resetUserVisitsSessions = functions.https.onRequest(
  async (req, res) => {
    try {
      console.log('resetUserVisitSessions start...');
      var db = admin.firestore();
      await db
        .collection('visits')
        .doc('userVisitSessions')
        .set({
          resetForNewDay: true,
          resetAt: new Date(),
          resetBy: 'Function resetUserVisitsSessions',
        });

      return res.status(200).send('resetUserVisitSessions end!');
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    } //end catch error
  }
);

////////////////////////////////////////////////
//CHANGES IN DISTRICT DATA
////////////////////////////////////////////////
//CHANGE DISTRICT DATA => CHANGE IT IN CLIENT PROFILE
exports.changeInDistrictDataTrig = functions.firestore
  .document('residences/{districtId}')
  .onUpdate(async (change, context) => {
    const oldValue = change.before.data();
    const newValue = change.after.data();
    const districtId = context.params.districtId;

    //trigger task change if district name
    if (oldValue.name !== newValue.name) {
      //wait till all data is changed
      await changeInDistrictData.changedDistrictName(districtId, newValue);
    }
    //trigger task change if district color
    if (oldValue.color !== newValue.color) {
      await changeInDistrictData.changedDistrictColor(districtId, newValue);
    }

    //trigger task change if district color
    if (oldValue.rooms !== newValue.rooms) {
      await changeInDistrictData.changedRooms(districtId, oldValue, newValue);
    }

    return 'end all';
  });

////////////////////////////////////////////////
//CHANGES IN CLIENT DATA
////////////////////////////////////////////////
//WHEN CLIENT DISTRICT, NAME, OR SELECTED LIFE PLANS CHANGED -> CHANGE TASK DATA
exports.changeNbhClientDistrictTrig = functions.firestore
  .document('clients/{clientId}')
  .onUpdate(async (change, context) => {
    const oldValue = change.before.data();
    const newValue = change.after.data();
    const clientId = context.params.clientId;

    //trigger task change if district changed
    if (oldValue.clientDistrict !== newValue.clientDistrict) {
      //wait till all tasks are changed
      await changeClientDataInTasks.changeDistrict(
        clientId,
        oldValue,
        newValue
      );
    } else if (oldValue.clientName !== newValue.clientName) {
      //wait till all tasks are changed
      await changeClientDataInTasks.changeName(clientId, oldValue, newValue);
    } else if (oldValue.clientLifePlanTasks !== newValue.clientLifePlanTasks) {
      //change life plan tasks => delete scheduled tasks that are no longer in selected tasks
      await changeClientDataInTasks.changeLifePlanTasks(
        clientId,
        oldValue,
        newValue
      );
    } else {
      console.log('nothing to change');
      return 'nothing to change';
    }

    return 'end all';
  });

////////////////////////////////////////////////
//CHANGES TASK DATA
////////////////////////////////////////////////
//WHEN TASK CATALOG CHANGED -> UPDATE
exports.changedTaskCatalogTrig = functions.firestore
  .document('neighborhoodTasks/{taskId}')
  .onWrite(async (change, context) => {
    const oldValue = change.before.data();
    // If the document does not exist, it has been deleted.
    const newValue = change.after.exists ? change.after.data() : null;
    const taskId = context.params.taskId;

    //task deleted
    if (!newValue) {
      //wait till all tasks are changed
      await changesInTaskCatalog.taskDeleted(taskId, oldValue);
    } else {
      if (oldValue) {
        //changed name, number, type, everyday, or social
        if (newValue.taskName !== oldValue.taskName) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskName,
            'prieksh share'
          );
        }
        if (newValue.taskNumber !== oldValue.taskNumber) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskNumber,
            'prieksh share'
          );
        }
        if (newValue.taskType !== oldValue.taskType) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskType,
            'prieksh share'
          );
        }
        if (newValue.taskEveryday !== oldValue.taskEveryday) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskEveryday,
            'prieksh share'
          );
        }
        if (newValue.taskSocial !== oldValue.taskSocial) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskSocial,
            'prieksh share'
          );
        }
        if (newValue.taskDirect !== oldValue.taskDirect) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskDirect,
            'prieksh share'
          );
        }
        if (newValue.taskCognitive !== oldValue.taskCognitive) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskCognitive,
            'prieksh share'
          );
        }
        if (newValue.taskCodingGroup !== oldValue.taskCodingGroup) {
          await changesInTaskCatalog.taskDetailsChanged(
            taskId,
            newValue.taskCodingGroup,
            'prieksh share'
          );
        }
        //recalculate numbers
        if (newValue.taskGroup !== oldValue.taskGroup) {
          await changesInTaskCatalog.taskGroupChanged(newValue, oldValue);
        }
      }
    }

    return 'end all';
  });

////////////////////////////////////////////////
//CHANGES IN RESPONSIBLES
////////////////////////////////////////////////
//CHANGE RESPONSIBLE IN TASKS, WHEN CLIENT SHIFT KEY CHANGED
exports.changeResponsibleClientShiftKeyTrig = functions.firestore
  .document('clientShiftKeys/{shiftKey}')
  .onWrite(async (change, context) => {
    const newValue = change.after.data();

    //trigger task change client shift changed manually
    if (newValue.setManual) {
      const shiftKey = context.params.shiftKey;

      //wait till all tasks are changed
      await changeResponsibleInTasks.clientShiftKeyChanged(shiftKey, newValue);
      console.log('responsibles changed by clientShiftKey');
    } else {
      console.log('clientShiftKey changed automatically');
    }

    return 'end all';
  });

//CHANGE RESPONSIBLE IN TASKS, WHEN SHIFT SCHEDULE CHANGED
exports.changeNbhShiftsTrig = functions.firestore
  .document('residences/{districtId}/shifts/{shiftId}')
  .onUpdate(async (change, context) => {
    const db = admin.firestore();
    const districtId = context.params.districtId;
    const oldValue = change.before.data();
    const newValue = change.after.data();

    //wait till all tasks are changed
    await changeResponsibleInTasks.districtResponsibleChanged(
      districtId,
      newValue,
      oldValue
    );
    console.log('responsibles changed by districts');

    return 'end all';
  });

////////////////////////////////////////////////
//USERS
////////////////////////////////////////////////
exports.changeUserDataTrig = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const oldValue = change.before.data();
    const newValue = change.after.data();

    //wait till all for changes
    if (newValue.displayName !== oldValue.displayName) {
      await changedUserData.changedUserDisplayName(userId, newValue);
    }

    return 'end all';
  });

////////////////////////////////////////////////
//DAILY REPORTS
////////////////////////////////////////////////
//analyze for #latecheck tasks
exports.analyzeYesterdayTasks = functions.https.onRequest(async (req, res) => {
  try {
    console.log('analyzeYesterdayTasks start...');
    await analyzeTasks.analyzeTasksForLateCheck();
    console.log('analyzeYesterdayTasks end');
    return res.status(200).send('analyzeYesterdayTasks end!');
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } //end catch error
});

//COPY SHIFTS AND TASKS, POSTPONE, #LATECHECK
exports.copyShiftsAndTasks = functions.https.onRequest(async (req, res) => {
  try {
    console.log('copyShiftsAndTasks start...');
    await autoCopyTasks.copyTasks();
    return res.status(200).send('copyShiftsAndTasks end!');
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } //end catch error
});

//DAILY REPORTING
exports.dailyReport = functions.https.onRequest(async (req, res) => {
  try {
    var db = admin.firestore();
    //generate date
    const today = new Date();
    //const today = new Date(2019, 9, 27);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1
    );

    //format date
    var formatMonth = yesterday.getMonth() + 1;
    if (formatMonth < 10) {
      formatMonth = '0' + formatMonth;
    }
    var formatDate = yesterday.getDate();
    if (formatDate < 10) {
      formatDate = '0' + formatDate;
    }
    const formatYesterday =
      formatDate + '.' + formatMonth + '.' + yesterday.getFullYear() + '.';
    const dayText = getDayText(yesterday.getDay());

    var visitDate = yesterday;
    var weekKey = verifyVisits.getWeekKey(visitDate);
    var month = visitDate.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var monthKey = visitDate.getFullYear() + '-' + month;
    var monthRdDoc = await db
      .collection('nbhRdMonthlyReports')
      .doc(monthKey)
      .get();
    var monthRdReport = monthRdDoc.exists ? monthRdDoc.data() : null;

    // //get clients
    const clients = await db.collection('clients').get();
    var myTasksL = {};
    var clientKeys = [];
    clients.forEach(client => {
      clientKeys.push(client.id);
      myTasksL[client.id] = {
        clientName: client.data().clientName,
        tasks: {},
      };
    });

    //get tasks
    await db
      .collection('taskArchive')
      .where('lpTaskDate', '>=', yesterday)
      .where('lpTaskDate', '<', today)
      .where('service', '==', 'neighborhood')
      .orderBy('lpTaskDate')
      .orderBy('order')
      .get()
      .then(tasks => {
        tasks.forEach(task => {
          const clientId = task.data().clientId;
          //sprt tasks
          myTasksL[clientId].tasks[task.id] = task.data();
        });

        return;
      });

    //loop clients to store info about their daily report date or pause life plan day
    var pausedClients = [];
    var stoppedClients = [];
    clients.forEach(client => {
      const clientId = client.id;

      //
      const clientStatus = client.data().clientStatus;

      if (clientStatus === 'paused') {
        pausedClients.push(clientId);
        //add date of pauses
        db.collection('clients')
          .doc(clientId)
          .update({
            clientsPauseDates: admin.firestore.FieldValue.arrayUnion(
              formatYesterday
            ),
          });
      } else if (clientStatus === 'active') {
        //add report date, if has tasks
        if (Object.keys(myTasksL[clientId].tasks).length > 0) {
          //add report date
          db.collection('clients')
            .doc(clientId)
            .update({
              clientsDailyReports: admin.firestore.FieldValue.arrayUnion(
                formatYesterday
              ),
            });
        } //end if has tasks
      } else {
        //do nothing for stopped clients
        stoppedClients.push(clientId);
      }
    }); //end for clients

    //get users
    const users = await db.collection('users').get();
    var userData = {};

    users.forEach(user => {
      userData[user.id] = user.data().displayName;
    });

    //get visits
    var visitsL = {};
    await db
      .collection('visits')
      .where('startAt', '>=', yesterday)
      .where('startAt', '<', today)
      .orderBy('startAt')
      .get()
      .then(visits => {
        visits.forEach(visit => {
          visitsL[visit.id] = visit.data();
        });

        return;
      });

    // ANALYZE TASKS BY USERS AND CLIENTS
    new Promise((resolve, reject) => {
      resolve(
        analyzeData(
          myTasksL,
          clientKeys,
          userData,
          formatYesterday,
          db,
          dayText,
          yesterday,
          pausedClients,
          stoppedClients,
          visitsL,
          monthKey,
          weekKey,
          monthRdReport
        )
      );
    })
      .then(analyzedData => {
        console.log('return status');
        return res.status(200).send(analyzedData);
      })
      .catch(error => {
        console.log(error);
        res.status(500).send(error);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } //end catch error
});

function getDayText(dayNumber) {
  const daysToTxt = {
    0: 'Svētdiena',
    1: 'Pirmdiena',
    2: 'Otrdiena',
    3: 'Trešdiena',
    4: 'Ceturdiena',
    5: 'Piektdiena',
    6: 'Sestdiena',
  };

  return daysToTxt[dayNumber];
}

function statsObj() {
  const stats = {
    assisted: 0,
    supervised: 0,
    independent: 0,
    canceled: 0,
    postponed: 0,
    open: 0,
    total: 0,
    doneIdr: 0,
    visits: 0,
  };
  return stats;
}

async function analyzeData(
  myTasksL,
  clientKeys,
  userData,
  formatYesterday,
  db,
  dayText,
  reportDate,
  pausedClients,
  stoppedClients,
  visitsL,
  monthKey,
  weekKey,
  monthRdReport
) {
  totalQuickStats = statsObj();
  totalVisits = 0;
  var visitsData = { visitsByClient: {}, visitsByUsers: {} };
  const timeTasks = [2501, 2502, 2503, 2504, 2505, 2506, 2507];

  //prepare user quick stats
  const userKeys = Object.keys(userData);
  userQuickStats = {};
  userGpsTasks = {};
  var userVisits = {};
  for (var usr = 0; usr < userKeys.length; usr++) {
    const userId = userKeys[usr];
    userQuickStats[userId] = statsObj();
    userGpsTasks[userId] = [];
    userVisits[userId] = 0;
    visitsData.visitsByUsers[userId] = {};
  }

  //analyze by clients
  var clientQuickStats = {};
  var clientShiftResponsible = {};
  var taskCounter = 0;
  //loop tasks, get task status, add to stats
  for (var cl = 0; cl < clientKeys.length; cl++) {
    const clientId = clientKeys[cl];
    clientQuickStats[clientId] = statsObj();
    clientShiftResponsible[clientId] = {};
    var differentShifts = [];

    visitsData.visitsByClient[clientId] = {};

    //for rd report
    var timeTaskCounter = 0;

    //loop tasks for that client
    //analyze only those clients that are not on pause and not stopped and that have tasks
    if (
      pausedClients.indexOf(clientId) === -1 &&
      stoppedClients.indexOf(clientId) === -1
    ) {
      const clientTasks = Object.keys(myTasksL[clientId].tasks);
      for (var t = 0; t < clientTasks.length; t++) {
        taskCounter++;

        const taskId = clientTasks[t];
        const taskData = myTasksL[clientId].tasks[taskId];

        const taskStatus = taskData.status;
        //get responsible
        const responsible = taskData.responsible;
        //check if defined user
        if (
          typeof userQuickStats[responsible] === 'undefined' &&
          responsible !== ''
        ) {
          userQuickStats[responsible] = statsObj();
          userGpsTasks[responsible] = [];
          userVisits[responsible] = 0;
          visitsData.visitsByUsers[responsible] = {};
        }
        const shiftNr = taskData.lpTaskShiftNumber;
        clientShiftResponsible[clientId][shiftNr] = responsible;

        //console.log('task ', taskCounter, 'client ', clientId, 'taskId', taskId, 'responsible', responsible)

        //count visits and rd month report data
        if (
          taskStatus !== 'canceled' &&
          taskStatus !== 'postponed' &&
          taskStatus !== 'open'
        ) {
          if (timeTasks.indexOf(taskData.lpTaskNumber) > -1) {
            timeTaskCounter++;
          }

          //client stats
          if (differentShifts.indexOf(shiftNr) === -1) {
            differentShifts.push(shiftNr);

            //user visits
            const closedById = taskData.closedBy;
            userVisits[closedById]++;

            //total visits
            totalVisits++;
          }
        }

        //add stats
        clientQuickStats[clientId][taskStatus] += 1;
        clientQuickStats[clientId].total += 1;
        clientQuickStats[clientId].visits = differentShifts.length;
        if (responsible !== '') {
          userQuickStats[responsible][taskStatus] += 1;
          userQuickStats[responsible].total += 1;
          userQuickStats[responsible].visits = userVisits[responsible];
        }
        totalQuickStats[taskStatus] += 1;
        totalQuickStats.total += 1;
        totalQuickStats.visits = totalVisits;

        //add gps task key
        if (typeof taskData.location !== 'undefined') {
          const closedBy = taskData.closedBy;
          userGpsTasks[closedBy].push({
            taskId: taskId,
            clientId: clientId,
          });
        }
      } //end for tasks
    } //end if paused clients

    // update rd month report
    if (timeTaskCounter > 0) {
      //check if exsists month doc -> client -> week
      if (monthRdReport) {
        if (monthRdReport[clientId]) {
          if (monthRdReport[clientId][weekKey]) {
            monthRdReport[clientId][weekKey].timeTasks += timeTaskCounter;
          }
        }
      }
    }
  } //end for client key

  //analyze new visits

  var visitKeys = Object.keys(visitsL);
  for (var v = 0; v < visitKeys.length; v++) {
    const visitId = visitKeys[v];
    const visitData = visitsL[visitId];
    const clientId = visitData.clientId;
    const userId = visitData.user;

    visitsData.visitsByClient[clientId][visitId] = visitData;
    visitsData.visitsByUsers[userId][visitId] = visitData;
  }

  visitsData['allVisits'] = visitsL;

  // write all data in db
  await db
    .collection('nbhRdMonthlyReports')
    .doc(monthKey)
    .set(monthRdReport);

  await db
    .collection('dailyReports')
    .doc(formatYesterday)
    .set({
      clientQuickStats: clientQuickStats,
      userQuickStats: userQuickStats,
      totalQuickStats: totalQuickStats,
      userGpsTasks: userGpsTasks,
      clientAllTasks: myTasksL,
      createdAt: new Date(),
      dayText: dayText,
      reportDate: reportDate,
      responsibleForShifts: clientShiftResponsible,
      visits: visitsData,
    });

  //send email if in production
  if (env === 'production') {
    sendEmail(formatYesterday, totalQuickStats);
  }
  return 'data recorded';
}

//for email service
var mailgun = require('mailgun-js')({
  apiKey: 'prieksh share',
  domain: 'prieksh share',
});

const sendToAdmin =
  'prieksh share@gmail.com, prieksh share@gmail.com';
const sendToTest = 'prieksh share';

function sendEmail(reportDate, totalQuickStats) {
  const data = {
    from: 'prieksh share',
    to: sendToAdmin,
    subject: 'prieksh share ' + reportDate,
    html:
      "<p>prieksh share" +
      reportDate +
      "'>" +
      reportDate +
      '</a></p>' +
      '<br>' +
      '<h4>Kopsavlikums</h4>' +
      '<ul>' +
      '<li>Uzdevumi kopā ' +
      totalQuickStats.total +
      '</li>' +
      '<li>Neaizvērti ' +
      totalQuickStats.open +
      '</li>' +
      '<li>Atcelti ' +
      totalQuickStats.canceled +
      '</li>' +
      '<li>Pārcelti ' +
      totalQuickStats.postponed +
      '</li>' +
      '</ul>',
  };

  mailgun.messages().send(data, (error, body) => {
    console.log(body);
  });
}

//FORMAT IMAGES
exports.resizeImage = functions.storage.object().onFinalize(object => {
  // Your Google Cloud Platform project ID
  const projectId = 'prieksh share';

  // Creates a client
  const storage = new Storage({
    projectId: projectId,
  });

  //file information
  const bucket = object.bucket;
  const contentType = object.contentType;
  const filePath = object.name;
  const reversePath = filePath.split('/');
  const fileName = path.basename(filePath);

  if (path.basename(filePath).startsWith('resized-')) {
    console.log('We already renamed that file!');
    return;
  }

  const destBucket = storage.bucket(bucket);
  const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
  const metadata = {
    contentType: contentType,
  };
  return destBucket
    .file(filePath)
    .download({
      destination: tmpFilePath,
    })
    .then(() => {
      console.log('Image downloaded locally to', tmpFilePath);

      return spawn('convert', [
        tmpFilePath,
        '-resize',
        '500x500',
        '-auto-orient',
        tmpFilePath,
      ]);
    })
    .then(() => {
      console.log('Resize and orient created at', tmpFilePath);
      // We add a 'resized-' prefix to thumbnails file name. That's where we'll upload the thumbnail.
      const resizeFileName = `resized-${fileName}`;
      const resizeFilePath = path.join(path.dirname(filePath), resizeFileName);

      return destBucket
        .upload(tmpFilePath, {
          destination: resizeFilePath,
          predefinedAcl: 'publicRead',
          metadata: metadata,
        })
        .then(result => {
          const file = result[0];
          return file.getMetadata();
        })
        .then(results => {
          const metadata = results[0];
          console.log('medialink= ', metadata.mediaLink);

          console.log('revers path');
          console.log(reversePath);
          var clientId = reversePath[0];
          var clientCollection = reversePath[1];
          var clientCollectionId = reversePath[2];
          var updateField = reversePath[3];

          //case to store item images
          switch (reversePath[0]) {
            case 'items':
              //store photo url in items db
              return admin
                .firestore()
                .collection('items')
                .doc(reversePath[1])
                .update({
                  itemPhotoUrl: metadata.mediaLink,
                });

            case 'taskArchive':
              //store photo url in items db
              return admin
                .firestore()
                .collection('taskArchive')
                .doc(reversePath[1])
                .update({
                  photoUrl: metadata.mediaLink,
                });

            case 'residences':
              //store photo url in items db
              return admin
                .firestore()
                .collection('residences')
                .doc(reversePath[1])
                .update({
                  photoUrl: metadata.mediaLink,
                });

            case 'incidents':
              //store photo url in items db
              return admin
                .firestore()
                .collection('incidents')
                .doc(reversePath[1])
                .update({
                  photoUrl: metadata.mediaLink,
                });

            case 'prieksh share':
              //prieksh share
              return admin
                .firestore()
                .collection('prieksh share')
                .doc(reversePath[1])
                .update({
                  [reversePath[2]]: metadata.mediaLink,
                });

            case 'clientProfilePhoto':
              //store photo url in client profile db
              return admin
                .firestore()
                .collection('clients')
                .doc(reversePath[1])
                .update({
                  clientPhotoUrl: metadata.mediaLink,
                });

            case 'clientPassportPhoto':
              //store photo url in client profile db
              return admin
                .firestore()
                .collection('clients')
                .doc(reversePath[1])
                .update({
                  clientPassportPhotoUrl: metadata.mediaLink,
                });

            default:
              //store photo url cliens collection db
              return admin
                .firestore()
                .collection('clients')
                .doc(clientId)
                .collection(clientCollection)
                .doc(clientCollectionId)
                .update({
                  [updateField]: metadata.mediaLink,
                });
          }
        })
        .catch(error => {
          console.error(error);
        });
    })
    .then(() => fs.unlinkSync(tmpFilePath)) //remove temp file
    .then(() => destBucket.file(filePath).delete()); //delete old (big) file
});
