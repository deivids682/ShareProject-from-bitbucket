//CALCULATE WEEKLY PROFILES FOR BFH, TRIGGERS ON MONDAYS
const findGir = require('./JSON/GirCodes.js');
const admin = require('firebase-admin');

module.exports.calculateWeeklyProfilesBFH = async function() {
  return new Promise(async resolve => {
    try {
      console.log('START calculate weekly profiles BFH...');
      var start = new Date();
      var db = admin.firestore();
      var batch = db.batch();
      let rdSupport = 640;
      let today = new Date();
      let dayToday = today.getDay();
      //one week from yesterday
      var wEndDate = new Date(Date.now() - 1 * 86400000).setHours(23, 59, 59);
      var wStartDate = new Date(Date.now() - 7 * 86400000).setHours(0, 0, 0);

      wEndDate = new Date(wEndDate);
      wStartDate = new Date(wStartDate);

      //FOR TEST

      //get clients
      let clientsSnap = await db
        .collection('clients')
        .where('clientServices', '==', 'bfh')
        .get();

      //analyze clients
      let analyzePromises = [];
      clientsSnap.forEach(async client => {
        let c = client.data();
        let clientId = client.id;

        var periodStart = wStartDate;
        //check if entered later
        if (new Date(c.bfhEnterDate) > periodStart) {
          periodStart = new Date(c.bfhEnterDate);
        }

        var periodEnd = wEndDate;
        //check if died or left
        if (c.deathDate) {
          periodEnd =
            periodEnd < new Date(c.deathDate)
              ? periodEnd
              : new Date(c.deathDate);
        }
        if (c.leftDate) {
          periodEnd =
            periodEnd < new Date(c.leftDate) ? periodEnd : new Date(c.leftDate);
        }
        periodStart.setHours(0, 0, 0);
        periodEnd.setHours(23, 59, 59);
        var periodDays = Math.floor(
          (periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24) + 1
        );

        if (periodDays < 0) {
          periodDays = 0;
        }

        //analyze only active clients
        if (periodDays > 0) {
          let prom = analyzeClient(
            db,
            rdSupport,
            clientId,
            c,
            periodStart,
            periodEnd,
            periodDays,
            wStartDate,
            wEndDate
          );
          analyzePromises.push(prom);
        } //end if active client
      }); //end for client

      console.log('await all clients');
      var values = await Promise.all(analyzePromises);

      values.forEach(save => {
        batch.set(save.ref, save.profile);
      });

      //commit only if monday
      console.log('Day today ', dayToday, dayToday === 1);
      if (dayToday === 1) {
        console.log('await commit batch');
        await batch.commit();
      }

      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fininsh ', took, ' sec');

      console.log('END calculate weekly profiles BFH');
      resolve('end main Promise');
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

function analyzeClient(
  db,
  rdSupport,
  clientId,
  c,
  periodStart,
  periodEnd,
  periodDays,
  wStartDate,
  wEndDate
) {
  return new Promise(async resolve => {
    try {
      //get data
      //incidents solved AND confirmed
      var getIncidents = db
        .collection('incidents')
        .where('date', '>=', periodStart)
        .where('date', '<=', periodEnd)
        .where('incidentStatus', '==', 'confirmed')
        .where('incidentSolved', '==', true)
        .where('clientId', '==', clientId)
        .get();

      var getOffDays = db
        .collection('residentOffDays')
        .where('offDate', '>=', periodStart)
        .where('offDate', '<=', periodEnd)
        .where('clientId', '==', clientId)
        .get();

      var getResidence = db
        .collection('residences')
        .doc(c.clientDistrict)
        .get();

      var getPriceData = db
        .collection('priceGroups')
        .doc(c.clientPriceGroup)
        .get();

      var getTasks = db
        .collection('taskArchive')
        .where('lpTaskDate', '>=', periodStart)
        .where('lpTaskDate', '<=', periodEnd)
        .where('clientId', '==', clientId)
        .get();

      var values = await Promise.all([
        getIncidents,
        getOffDays,
        getResidence,
        getPriceData,
        getTasks,
      ]);

      var countIncidents = values[0].size;
      var countOffDays = values[1].size;

      var assistanceValues = { assisted: 3, supervised: 2, independent: 1 };
      var assitanceValKeys = Object.keys(assistanceValues);
      var taskGroups = girCountObject();

      var taskKeys = Object.keys(taskGroups);

      //loop trough tasks
      var tasks = {};
      values[4].forEach(task => {
        const t = task.data();
        tasks[task.id] = t;
        var taskSubgroup = t.lpTaskCodingGroup;

        var taskName = t.taskName;
        if (
          assitanceValKeys.indexOf(t.status) !== -1 &&
          taskSubgroup !== 'prieksh share'
        ) {
          //add value
          taskGroups[taskSubgroup]['Score'] += assistanceValues[t.status];
          //add counter
          taskGroups[taskSubgroup]['Counter'] += 1;
        } //end if task

        //if cognitive assesment task
        if (
          t.lpTaskCognitive === true &&
          assitanceValKeys.indexOf(t.status) !== -1
        ) {
          //add value
          taskGroups['cognitiveValue']['Score'] += assistanceValues[t.status];
          //add counter
          taskGroups['cognitiveValue']['Counter'] += 1;
        }
      }); //end for tasks

      //calculate results
      let cannotCalculateGIR = false;
      let cannotCalculateValuesCount = 0;
      for (var key = 0; key < taskKeys.length; key++) {
        if (taskGroups[taskKeys[key]]['Counter'] !== 0) {
          var value =
            taskGroups[taskKeys[key]]['Score'] /
            taskGroups[taskKeys[key]]['Counter'];
          value = Math.round(value);
          taskGroups[taskKeys[key]]['Result'] = value;
        } else {
          taskGroups[taskKeys[key]]['Result'] = 1;
          cannotCalculateValuesCount++;
        }
      }
      if (cannotCalculateValuesCount === taskKeys.length) {
        cannotCalculateGIR = true;
      }

      var calcGir = '';
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];
      calcGir += taskGroups['prieksh share']['Result'];

      var girRaw = null;

      var cognitiveValue = taskGroups['cognitiveValue']['Result'];

      findGir.girCode.forEach(gir => {
        if (gir.A === calcGir) {
          girRaw = gir.B;
        }
      });

      //if has incidents, reduce value
      var girAfterIncidents = girRaw;
      if (countIncidents > 0) {
        girAfterIncidents = parseInt(girRaw) - 1;
      }
      //find dependency profile
      var profileBeforeCognitive = null;
      findGir.girAlfabeticProfiling.forEach(x => {
        if (parseInt(x.gir) === parseInt(girAfterIncidents)) {
          profileBeforeCognitive = x.value;
        }
      });

      var profileAfterCognitive = profileBeforeCognitive;
      //if cogValue = 2 && profile value 6 => profile B
      //if cogValue = 3 && profile value 6 => profile D
      if (cognitiveValue === 2 && girAfterIncidents === 6) {
        profileAfterCognitive = 'C';
      }
      if (cognitiveValue === 3 && girAfterIncidents === 6) {
        profileAfterCognitive = 'D';
      }
      if (cognitiveValue === 3 && girAfterIncidents === 5) {
        profileAfterCognitive = 'D';
      }

      const beds = values[2].data().rooms[c.bfhRoom.roomId].beds;
      var dpPriceName = profileAfterCognitive + beds;
      let dpPriceLevel = profileAfterCognitive;
      const dpPricePerDay = values[3].data().prices[dpPriceName];

      //CALCULATE INCOME PROFILE AND BONUS PACKS
      //MAX PAY = 90% pension + (if) RD support + extra pay
      let pensionPart = c.pension * 0.9 || 0.0;
      let clientRdSupport = 0.0;
      if (c.rdSupportDateRaw) {
        if (new Date(c.rdSupportDateRaw.seconds * 1000) < periodEnd) {
          clientRdSupport = rdSupport;
        }
      }
      let ipMaxPayMonth = pensionPart + clientRdSupport + c.clientPay;
      let ipMaxPayDay = (ipMaxPayMonth / 30.5).toFixed(2);

      //find max income profile
      let pricesData = values[3].data();
      let pricesKeys = Object.keys(pricesData.prices);
      let pricesValues = Object.values(pricesData.prices);

      //get only prices for beds
      let ipPriceName = 'J' + beds;
      let ipPriceLevel = 'J';
      let ipPricePerDay = pricesData.prices[ipPriceName];
      for (var p = 0; p < pricesKeys.length; p++) {
        let pKey = pricesKeys[p];
        if (pKey.indexOf(beds) !== -1) {
          let difference = ipMaxPayDay - pricesValues[p];
          if (difference < 0) {
            ipPriceName = pKey;
            ipPriceLevel = ipPriceName[0];
            ipPricePerDay = pricesValues[p];
            break;
          }
        }
      }

      let invoicePriceName = dpPriceName;
      let invoicePriceLevel = dpPriceLevel;
      let invoicePricePerDay = dpPricePerDay;
      //compare if any bonus packs
      let newBonusPacks = 0;
      if (ipPricePerDay > dpPricePerDay) {
        //find income value
        let incomeValue = 0;
        let dependencyValue = 0;
        findGir.girAlfabeticProfiling.forEach(x => {
          if (x.value === ipPriceLevel) {
            incomeValue = x.gir;
          }
          if (x.value === dpPriceLevel) {
            dependencyValue = x.gir;
          }
        });
        if (!cannotCalculateGIR) {
          newBonusPacks = dependencyValue - incomeValue;
        }

        invoicePriceName = ipPriceName;
        invoicePriceLevel = ipPriceLevel;
        invoicePricePerDay = ipPricePerDay;
      }

      //CANNOT CALCULATE GIR
      let comment = '';
      if (cannotCalculateGIR) {
        invoicePriceName = c.clientProfile + beds;
        invoicePriceLevel = c.clientProfile;
        invoicePricePerDay = pricesData.prices[invoicePriceName];
        newBonusPacks = 0;
        comment = 'prieksh share';
      }

      //IF FIRST TWO WEEKS AFTER AGREEMENT, USE PROFILE FROM AGREEMENT
      //days between
      let entered = new Date(c.bfhEnterDate);
      let daysFromAgreement =
        (periodStart.getTime() - entered.getTime()) / (1000 * 3600 * 24);

      if (daysFromAgreement < 14) {
        invoicePriceName = c.clientProfile + beds;
        invoicePriceLevel = c.clientProfile;
        invoicePricePerDay = pricesData.prices[invoicePriceName];
        newBonusPacks = 0;
        comment = 'prieksh share';
      }

      var weeklyProfile = {
        bedsPerRoom: beds, //from residence
        clientPay: c.clientPay || 0.0,
        cognitiveValue: cognitiveValue,
        comment: comment,
        dateEntered: new Date(c.bfhEnterDate),
        dateLeft: c.leftDate ? new Date(c.leftDate) : null,
        daysStayed: periodDays,
        dpBeforeCognitive: profileBeforeCognitive,
        dpDependencyProfile: profileAfterCognitive,
        dpPriceLevel: dpPriceLevel,
        dpPriceName: dpPriceName,
        dpPricePerDay: dpPricePerDay,
        girAfterIncidents: girAfterIncidents,
        girRaw: girRaw,
        girSequence: calcGir,
        ipPriceLevel: ipPriceLevel,
        ipPriceName: ipPriceName,
        ipPricePerDay: ipPricePerDay,
        incidents: countIncidents,
        invoicePriceLevel: invoicePriceLevel,
        invoicePriceName: invoicePriceName,
        invoicePricePerDay: invoicePricePerDay,
        newBonusPacks: newBonusPacks,
        offDays: countOffDays,
        pension: c.pension || 0.0,
        priceGroupId: c.clientPriceGroup,
        priceGroupName: values[3].data().name,
        residenceId: c.clientDistrict,
        residenceName: c.clientDistrictName,
        roomId: c.bfhRoom.roomId,
        roomName: c.bfhRoom.roomName,
        updatedAt: new Date(),
        updatedBy: 'prieksh share',
        wEndDate: wEndDate,
        wStartDate: wStartDate,
        xTaskGroups: taskGroups,
        xAllTasks: tasks,
      };

      const profileKey =
        formatDateReport(wStartDate) + '-' + formatDateReport(wEndDate);

      var saveRef = db
        .collection('clients')
        .doc(clientId)
        .collection('profiles')
        .doc(profileKey);

      console.log('resolve client ', clientId, weeklyProfile);

      resolve({ ref: saveRef, profile: weeklyProfile });
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
}

function girCountObject() {
  return {
    'prieksh share': { Score: 0, Counter: 0, Result: 0 },
    'prieksh share': {
      Score: 0,
      Counter: 0,
      Result: 0,
    },
    'prieksh share': { Score: 0, Counter: 0, Result: 0 },
    'prieksh share': { Score: 0, Counter: 0, Result: 0 },
    'prieksh share': { Score: 0, Counter: 0, Result: 0 },
    'prieksh share': { Score: 0, Counter: 0, Result: 0 },
    'prieksh share': {
      Score: 0,
      Counter: 0,
      Result: 0,
    },
    cognitiveValue: { Score: 0, Counter: 0, Result: 0 },
  };
}
function formatDateReport(inpDate) {
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
