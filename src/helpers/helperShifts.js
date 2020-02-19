import * as firebase from 'firebase/app';
import 'firebase/firestore';

const periodLength = 7; //hardcode the length of period
const numberOfShifts = 3; //hardcode how many shifts per day

export const addDays = (date, days) => {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const getDistricts = (service, vm) => {
    return new Promise(async resolve => {
        try {
          let db = firebase.firestore();
         
          //get districts
          db.collection('residences')
            .where('service', '==', service)
            .orderBy('name')
            .get()
            .then(function(querySnapshot) {
              let districtsL = {};
              querySnapshot.forEach(function(doc) {
                //save district data
                districtsL[doc.id] = doc.data();
              });
              vm.districts = Object.assign({}, districtsL);

              resolve('districts loaded');
            });
        } catch (error) {
          console.log('get districts error: ', error);
        }
      }); //end promise;
};

export const createShifts = async (distId, vm) => {
    let db = firebase.firestore();
    //create shifts for days in vm.periodLength
    let shiftPromises = [];

    //generate keys, first -> today
    const today = new Date();

    for (let d = 0; d < periodLength; d++) {
      //generate shift date
      const shiftDate = addDays(today, d);
      //construct key
      const year = shiftDate.getFullYear();
      let month = shiftDate.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      let date = shiftDate.getDate();
      if (date < 10) {
        date = '0' + date;
      }
      const day = shiftDate.getDay();
      const key = year + '-' + month + '-' + date;
      const formatDate = date + '.' + month + '.' + year + '.';

      //generate responsible for shifts
      let responsibleForShifts = {};
      for (let rps = 0; rps < numberOfShifts; rps++) {
        //first responsible is district manager
        responsibleForShifts[rps] = vm.districtManagerId;
      }

      //add key to obj
      const shiftData = {
        shiftDate: shiftDate,
        day: day,
        formatDate: formatDate,
        responsibleForShifts: responsibleForShifts,
      };

      // write in db
      let shiftProm = db
        .collection('residences')
        .doc(distId)
        .collection('shifts')
        .doc(key)
        .set(shiftData);

      shiftPromises.push(shiftProm);
    }
    await Promise.all(shiftPromises);

    await getDistricts(vm.service || 'neighborhood', vm);
    vm.progressBar = false;
  };