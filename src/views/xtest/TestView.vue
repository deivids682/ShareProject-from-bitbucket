<template>
  <v-container>
    <h1>Test view</h1>
    <!-- BUTTONS -->
    <template v-if="sudo">
      <v-row>Delete future tasks</v-row>
      <v-row>
        <v-btn block color="success" @click="deleteFutureTasks()">Delete future tasks</v-btn>
      </v-row>
      <v-row>Delete BFH test houses</v-row>
      <v-row>
        <v-btn
          block
          color="success"
          @click="deleteTestHousesAndClients()"
        >Delete BFH Residences And Clients</v-btn>
      </v-row>

      <v-row>Generate Test Profiling Data (Dec 10, 2019)</v-row>
      <v-row>
        <v-btn
          block
          color="success"
          @click="generateTestProfilingData()"
        >Generate Test Profiling Data</v-btn>
      </v-row>
      <v-row>Import BFH Task Catalog (Dec 10, 2019)</v-row>
      <v-row>
        <v-btn block color="accent" @click="deleteTasks()">1. Delete BFH Tasks</v-btn>
      </v-row>
      <v-row>
        <v-btn block color="accent" @click="importTasks()">2. Import Tasks</v-btn>
      </v-row>
      <v-row>
        <v-btn block color="accent" @click="cognitiveTasks()">3. Add Cognitive Task Status</v-btn>
      </v-row>
      <v-row>*Calculate visit metrics for old clients</v-row>
      <v-row>
        <v-btn
          block
          color="accent"
          @click="calculateVisitMetrics()"
        >Calculate visit metrics for old clients</v-btn>
      </v-row>

      <v-row>Old tasks add service neighborhood</v-row>
      <v-row>
        <v-btn block color="accent" @click="oldTasksAddService()">Old tasks add service neighborhood</v-btn>
      </v-row>
      <v-row>Update client profiles and delet tasks that are not in task catalog</v-row>
      <v-row>
        <v-btn
          block
          color="accent"
          @click="updateClientProfilesTaskCatalog()"
        >Update client profiles and delet tasks that are not in task catalog</v-btn>
      </v-row>
      <v-row>Add task info to task archive</v-row>
      <v-row>
        <v-btn block color="accent" @click="addTaskInfoToOldTasks()">Add task info to task archive</v-btn>
      </v-row>

      <v-row>Restore client data</v-row>
      <v-row>
        <v-btn
          block
          color="accent"
          @click="saveLocallyClientData()"
        >1. Save locally client lost data</v-btn>
      </v-row>
      <v-row>
        <v-btn block color="accent" @click="restoreClientData()">2. Restore client</v-btn>
      </v-row>
      <!-- OLD -->
    </template>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { Slider } from 'vue-color';
import QuickPhoto from '@/comp/QuickPhoto.vue';

import { env } from '@/helpers/firebaseConfig.js';

import { houseAndRezidentTasks } from '../../helpers/exportFromExcel';

export default {
  data() {
    return {
      tasks: {},
      colors: '',
      visits: {},
      visitKeys: [],
      users: {},
    };
  },
  created() {
    this.colors = this.randomColor();
  },
  components: {
    'slider-picker': Slider,
    QuickPhoto,
  },
  methods: {
    async testFn() {
      var vm = this;
      console.log('test fn');
      //get all visits from august 1, 2019
      //vm.listVisits();

      var db = firebase.firestore();

      var snap = await db
        .collection('taskArchive')
        .where('service', '==', 'neighborhood')
        .get();
      console.log('snap ', snap.size);
    },
    async importTasks() {
      var start = new Date();
      console.log('importTasks start..', new Date());

      await houseAndRezidentTasks();
      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fin ', took, ' sec');
    },
    async deleteTasks() {
      var start = new Date();
      console.log('fixTaskNumbers start..', new Date());

      var db = firebase.firestore();
      var batch = db.batch();
      //get tasks
      var tasksSnap = await db
        .collection('neighborhoodTasks')
        .where('service', '==', 'bfh')
        .get();
      console.log('tasks ', tasksSnap.size);
      var tasks = {};
      var taskGroups = {};
      tasksSnap.forEach(t => {
        var ref = db.collection('neighborhoodTasks').doc(t.id);
        batch.delete(ref);
      });

      console.log('commit batch');
      await batch.commit();
      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fin ', took, ' sec');
    },
    async cognitiveTasks() {
      console.log('cognitiveTasks start..', new Date());
      var start = new Date();

      var db = firebase.firestore();
      var batch = db.batch();

      //get tasks
      var tasks = {};
      var tasksSnap = await db.collection('neighborhoodTasks').get();

      console.log('tasks ', tasksSnap.size);

      tasksSnap.forEach(t => {
        tasks[t.id] = t.data();
        var td = t.data();
        if (td.taskSocial != true) {
          td.taskSocial = false;
        }
        if (td.taskEveryday != true) {
          td.taskEveryday = false;
        }

        td.taskCognitive = false;

        var ref = db.collection('neighborhoodTasks').doc(t.id);
        batch.update(ref, td);
      });

      console.log('commit batch');
      await batch.commit();
      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fin ', took, ' sec');
    },
    async generateTestProfilingData() {
      var start = new Date();
      console.log('generate test profiling data start..', new Date());
      var db = firebase.firestore();
      var batch = db.batch();

      //get tasks
      var clientLifePlanTasks = [];
      var tasks = {};
      var tasksSnap = await db
        .collection('neighborhoodTasks')
        .where('service', '==', 'bfh')
        .where('taskType', '==', 'Rezidenta')
        .get();
      tasksSnap.forEach(t => {
        tasks[t.id] = t.data();
        clientLifePlanTasks.push(t.id);
      });

      //save tasks in client profile
      //get test clients
      var clientsSnap = await db
        .collection('clients')
        .where('clientServices', '==', 'bfh')
        .get();
      var clients = {};
      clientsSnap.forEach(client => {
        clients[client.id] = client.data();
        clients[client.id]['clientLifePlanTasks'] = clientLifePlanTasks;
        var clientRef = db.collection('clients').doc(client.id);
        //batch.update(clientRef, clients[client.id]);
      });

      var statuses = [
        'independent',
        'supervised',
        'independent',
        'assisted',
        'supervised',
        'independent',
        'canceled',
      ];

      //loop 1. clients, 2. tasks, 3. dates to generate tasks archive
      var forDaysAgo = 12;
      var setPromises = [];
      Object.keys(clients).forEach(clientId => {
        const c = clients[clientId];
        Object.keys(tasks).forEach(taskId => {
          const t = tasks[taskId];
          for (var d = 0; d < forDaysAgo; d++) {
            var date = new Date(Date.now() - d * 86400000);
            var task = this.emptyTask();
            task.clientDistrict = c.clientDistrict;
            task.clientId = clientId;
            task.clientName = c.clientName;
            task.lpTaskCognitive = t.taskCognitive;
            task.lpTaskCodingGroup = t.taskCodingGroup;
            task.lpTaskDate = date;
            task.lpTaskDirect = t.taskDirect;
            task.lpTaskEveryDay = t.taskEveryday;
            task.lpTaskFormatDate = this.formatDateReport(date);
            task.lpTaskId = taskId;
            task.lpTaskName = t.taskName;
            task.lpTaskNumber = t.taskNumber;
            task.lpTaskSocial = t.taskSocial;
            task.lpTaskType = t.taskType;
            task.order = t.taskTime;
            task.service = t.service;

            //cases
            switch (clientId) {
              case 'datas':
                task.status = 'assisted';
                break;
              case 'data':
                var n = Math.floor(Math.random() * statuses.length);
                task.status = statuses[n];
                break;
              case 'data':
                var n = Math.floor(Math.random() * statuses.length);
                task.status = statuses[n];
                break;
              default:
              // code block
            }

            //write to db
            const [day, month, year] = task.lpTaskFormatDate.split('.');

            var docId =
              clientId +
              '-' +
              year +
              '-' +
              month +
              '-' +
              day +
              '-' +
              task.lpTaskShiftNumber +
              '-' +
              task.lpTaskId;

            var prom = db
              .collection('taskArchive')
              .doc(docId)
              .set(task);
            setPromises.push(prom);
          } //loop dates
        });
      });
      //await batch.commit();

      console.log('await promises');
      await Promise.all(setPromises);

      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fin ', took, ' sec');
    },
    emptyTask() {
      return {
        clientDistrict: '',
        clientId: '',
        clientName: '',
        lpTaskCognitive: false,
        lpTaskDate: '',
        lpTaskDirect: '',
        lpTaskEveryDay: '',
        lpTaskFormatDate: '',
        lpTaskId: '',
        lpTaskName: '',
        lpTaskNumber: '',
        lpTaskShiftNumber: '0',
        lpTaskSocial: '',
        lpTaskType: '',
        order: '',
        responsible: 'data',
        service: '',
        soloTask: false,
        status: 'open',
      };
    },
    async deleteTestHousesAndClients() {
      if (env == 'testing') {
        console.log('env ', env, 'delete bfh houses and clients');
        var vm = this;
        var db = firebase.firestore();
        var shiftsBatch = db.batch();
        var residencesBatch = db.batch();
        var clientsBatch = db.batch();

        //get clients with service bfh
        var clientsSnap = await db
          .collection('clients')
          .where('clientServices', '==', 'bfh')
          .get();

        clientsSnap.forEach(doc => {
          console.log('delete clients', doc.id);
          var docRef = db.collection('clients').doc(doc.id);
          clientsBatch.delete(docRef);
        });

        //get residences and shift subcollections
        var ressnap = await db
          .collection('residences')
          .where('service', '==', 'bfh')
          .get();

        var shiftsPromises = [];
        var resIds = [];
        ressnap.forEach(async res => {
          console.log('delete res', res.id);
          var resRef = db.collection('residences').doc(res.id);
          residencesBatch.delete(resRef);

          //shifts
          var getShifts = db
            .collection('residences')
            .doc(res.id)
            .collection('shifts')
            .get();
          shiftsPromises.push(getShifts);
          resIds.push(res.id);
        });

        console.log('await promises');
        var values = await Promise.all(shiftsPromises);

        for (var s = 0; s < shiftsPromises.length; s++) {
          var shiftsSnap = values[s];
          var resId = resIds[s];
          shiftsSnap.forEach(shift => {
            console.log('delete shift', resId, shift.id);
            var shiftRef = db
              .collection('residences')
              .doc(resId)
              .collection('shifts')
              .doc(shift.id);
            shiftsBatch.delete(shiftRef);
          });
        }

        console.log('delete shifts batch');
        await shiftsBatch.commit();

        console.log('delete residences batch');
        await residencesBatch.commit();

        console.log('delete clients batch');
        await clientsBatch.commit();

        console.log('fin');
      }
    },
    async deleteFutureTasks() {
      if (env == 'testing') {
        var daysAhead = -1;
        var yesterday = new Date(Date.now() + daysAhead * 86400000);

        var vm = this;
        var db = firebase.firestore();

        var getTaskArchive = db
          .collection('taskArchive')
          .where('lpTaskDate', '>', yesterday)
          .get();
        console.log('await tasks');
        var values = await Promise.all([getTaskArchive]);
        console.log('tasks to delete ', values[0].size);
        var deletePromises = [];
        values[0].forEach(task => {
          var deleteProm = db
            .collection('taskArchive')
            .doc(task.id)
            .delete();
          deletePromises.push(deleteProm);
        });
        console.log('await delete');
        await Promise.all(deletePromises);
        console.log('fin');
      }
    },
    async calculateVisitMetrics() {
      var vm = this;
      var db = firebase.firestore();
      var batch = db.batch();

      //get clients
      var clientsSnap = await db
        .collection('clients')
        .where('clientServices', '==', 'neighborhood')
        .orderBy('clientName')
        .get();

      //loop clients
      var clientDataL = {};
      var clientIds = [];
      var visitsProm = [];
      clientsSnap.forEach(async client => {
        clientIds.push(client.id);
        clientDataL[client.id] = client.data();

        //get number of visits
        var promise = db
          .collection('visits')
          .where('clientId', '==', client.id)
          .get();
        visitsProm.push(promise);
      });

      var visitSnaps = await Promise.all(visitsProm);

      for (var c = 0; c < clientIds.length; c++) {
        const clientId = clientIds[c];
        const visitsSnap = visitSnaps[c];
        //count
        clientDataL[clientId]['numberOfVisits'] = visitsSnap.size;

        //calculate average duration and median
        var visitsInSeconds = 0;
        var visitDurations = [];
        visitsSnap.forEach(visit => {
          var visitDuration =
            visit.data().endAt.seconds - visit.data().startAt.seconds;
          visitsInSeconds += visitDuration;
          visitDurations.push(visitDuration);
        });

        var clientRef = db.collection('clients').doc(clientId);
        batch.update(clientRef, {
          visitTotalSeconds: visitsInSeconds,
          visitDurations: visitDurations,
        });
        console.log('finished client', clientId);
      }

      //save in db
      batch.commit();
    },

    restoreClientData() {
      var db = firebase.firestore();
      const restoreClientId = 'pF4KKlvSRsCW1E29wCLf';

      if (localStorage.getItem('storeClient')) {
        try {
          var userData = JSON.parse(localStorage.getItem('storeClient'));
          console.log('userData ', userData);
          db.collection('clients')
            .doc(restoreClientId)
            .set(userData);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log('couldnt get data');
      }
    },
    async saveLocallyClientData() {
      var vm = this;
      var db = firebase.firestore();
      const restoreClientId = 'data';

      var clientPr = await db
        .collection('clients')
        .doc(restoreClientId)
        .get();
      localStorage.setItem('storeClient', JSON.stringify(clientPr.data()));
      console.log(clientPr.data());
    },
    async addTaskInfoToOldTasks() {
      //get all tasks from a date
      var daysAhead = -1;
      var yesterday = new Date(Date.now() + daysAhead * 86400000);

      var vm = this;
      var db = firebase.firestore();

      //var getTasks = db.collection('neighborhoodTasks').get();
      var getTaskArchive = await db
        .collection('taskArchive')
        .where('lpTaskDate', '>', yesterday)
        .get();

      console.log('update tasks ', getTaskArchive.size);

      var updPromises = [];
      getTaskArchive.forEach(task => {
        const updateObject = {
          service: 'neighborhood',
        };
        var prom = db
          .collection('taskArchive')
          .doc(task.id)
          .update(updateObject);
        updPromises.push(prom);
      });
      console.log('await updates');
      await Promise.all(updPromises);
      console.log('fin');
    },
    //functions
    async updateClientProfilesTaskCatalog() {
      var vm = this;
      var db = firebase.firestore();

      console.log('updateClientProfilesTaskCatalog');
      var getTasks = db.collection('neighborhoodTasks').get();
      var getClients = db.collection('clients').get();
      var values = await Promise.all([getTasks, getClients]);

      var tasksData = {};
      values[0].forEach(task => {
        tasksData[task.id] = task.data();
      });

      var clientData = {};
      values[1].forEach(client => {
        clientData[client.id] = client.data();
      });

      const taskIds = Object.keys(tasksData);
      Object.keys(clientData).forEach(clientId => {
        if (clientData[clientId].clientLifePlanTasks) {
          const clientTasks = clientData[clientId].clientLifePlanTasks;
          for (var i = 0; i < clientTasks.length; i++) {
            const clientTaskId = clientData[clientId].clientLifePlanTasks[i];
            if (taskIds.indexOf(clientTaskId) == -1) {
              clientData[clientId].clientLifePlanTasks.splice(i, 1);
            }
          }
          db.collection('clients')
            .doc(clientId)
            .update({
              clientLifePlanTasks: clientData[clientId].clientLifePlanTasks,
            });
        }
      });
    },
    async oldTasksAddService() {
      var vm = this;
      var db = firebase.firestore();

      //get tasks
      var snap = await db.collection('neighborhoodTasks').get();
      snap.forEach(task => {
        db.collection('neighborhoodTasks')
          .doc(task.id)
          .update({
            service: 'neighborhood',
          });
      });
    },
    async userRolesToArray() {
      var vm = this;
      var db = firebase.firestore();

      //get users
      var snap = await db.collection('users').get();

      snap.forEach(user => {
        var currentRole = user.data().role;
        var newRole = 'admin';
        if (currentRole == 'Personāls') {
          newRole = 'aider';
        }

        db.collection('users')
          .doc(user.id)
          .update({ role: [newRole] });
      });
    },
    async mergeDistrictsToResidences() {
      var vm = this;
      var db = firebase.firestore();

      //get districts
      var dstr = db.collection('neighborhoodShifts').get();

      var values = await Promise.all([dstr]);

      //loop clients and add district name (for those who have cleaning or nbh)
      var districts = {};
      values[0].forEach(async doc => {
        const distId = doc.id;
        districts[distId] = doc.data();
        districts[distId]['name'] = doc.data().districtName;
        delete districts[distId]['districtName'];
        districts[distId]['service'] = 'neighborhood';
        districts[distId]['color'] = vm.randomColor();

        //save in db
        db.collection('residences')
          .doc(distId)
          .set(districts[distId]);

        //get shifts
        var shiftsSnap = await db
          .collection('neighborhoodShifts')
          .doc(distId)
          .collection('shifts')
          .get();
        shiftsSnap.forEach(shift => {
          //copy shifts
          db.collection('residences')
            .doc(distId)
            .collection('shifts')
            .doc(shift.id)
            .set(shift.data());
        });
      });
    },
    randomColor() {
      return '000000'.replace(/0/g, function() {
        return (~~(Math.random() * 16)).toString(16);
      });
    },
    async addDistrictName() {
      var db = firebase.firestore();

      //get districts
      var dstr = db.collection('neighborhoodShifts').get();

      //get clients
      var clients = db.collection('clients').get();

      var values = await Promise.all([dstr, clients]);

      //loop clients and add district name (for those who have cleaning or nbh)
      var districts = {};
      values[0].forEach(doc => {
        districts[doc.id] = doc.data();
      });

      values[1].forEach(cl => {
        const client = cl.data();
        const clientId = cl.id;

        console.log(clientId, client.clientName);

        if (
          client.clientServices.indexOf('cleaning') != -1 ||
          client.clientServices.indexOf('neighborhood') != -1
        ) {
          const districtName = districts[client.clientDistrict].districtName;
          db.collection('clients')
            .doc(clientId)
            .update({
              nbhClientDistrictName: districtName,
            });
        }
      });
    },
    saveInWebStorage() {
      //save string
      var saveArray = ['nbh', 'cleaning'];
      var parse = JSON.stringify(saveArray);
      sessionStorage.setItem('new key', parse);
    },
    async generateNewFieldsForOldClients() {
      var db = firebase.firestore();
      // get clients
      var clients = await db.collection('clients').get();

      //loop clients
      clients.forEach(async client => {
        const clientData = client.data();

        var updateObj = {};
        //Get residence color also for old clients
        const clientDistrict = client.data().clientDistrict;
        console.log(clientData.clientName, client.id, clientDistrict);

        var residence = await db
          .collection('residences')
          .doc(clientDistrict)
          .get();

        var resColor = residence.data().color;
        var resName = residence.data().name;
        updateObj['clientColor'] = resColor;
        updateObj['clientDistrictName'] = resName;

        //Select services array to string
        if (typeof clientData.clientServices == 'object') {
          const service = clientData.clientServices[0] || 'cleaning';
          updateObj['clientServices'] = service;
        }

        db.collection('clients')
          .doc(client.id)
          .update(updateObj);
      });
    },
    async fixDeletedVisitsInReports() {
      console.log('fixDeletedVisitsInReports...');
      var vm = this;
      var db = firebase.firestore();
      //get all deleted visits from date, check in reports if they are deleted there as well

      //get deleted visits data
      var date = new Date(2019, 7, 1);
      var formatDate = vm.formatDateReport(date);

      var deletedVisits = [];
      db.collection('deletedVisits')
        .doc(formatDate)
        .get()
        .then(doc => {
          const data = doc.data();
          deletedVisits = data.deletedVisitsAll;
        });

      //get reports
      //report dates
      var reportsPromises = [];
      for (var d = 0; d < 8; d++) {
        var reportDateRaw = new Date(date.getTime() + d * 86400000);
        var reportDateForm = vm.formatDateReport(reportDateRaw);
        var repProm = db
          .collection('dailyReports')
          .doc(reportDateForm)
          .get();
        reportsPromises.push(repProm);
      }

      var reports = await Promise.all(reportsPromises);

      var counter = 0;
      for (var r = 0; r < reports.length; r++) {
        const repData = reports[r].data();
        //loop deleted visits to see if they are in report
        for (var v = 0; v < deletedVisits.length; v++) {
          const visitId = deletedVisits[v];
          if (typeof repData.visits.allVisits[visitId] != 'undefined') {
            counter++;
            var visitData = repData.visits.allVisits[visitId];
            var clientId = visitData.clientId;
            var userId = visitData.user;

            //delete visits from report
            delete repData.visits.allVisits[visitId];
            delete repData.visits.visitsByClient[clientId][visitId];
            delete repData.visits.visitsByUsers[userId][visitId];
          }
        }

        //save report
        db.collection('dailyReports')
          .doc(reports[r].id)
          .set(repData);
      }
    },
    async generateDefaultResponsibleForClientShiftKeys() {
      //clientId.date.shiftNr
      console.log('generateDefaultResponsibleForClientShiftKeys...');
      var vm = this;
      var db = firebase.firestore();
      var today = new Date(new Date().setHours(0, 0, 0, 0));

      //get clients
      //gets also paused and stopped clients
      var clientSnap = await db
        .collection('clients')
        .where('clientServices', 'array-contains', 'neighborhood')
        .get();
      //loop clients get district Id => clientId
      var clientsByDistricts = {};
      clientSnap.forEach(client => {
        const clientId = client.id;
        const clientData = client.data();
        const clientDistrict = clientData.clientDistrict;

        //new districts
        if (typeof clientsByDistricts[clientDistrict] == 'undefined') {
          clientsByDistricts[clientDistrict] = [];
        }

        //push client to district
        //only active or paused clients
        if (
          clientData.clientStatus == 'active' ||
          clientData.clientStatus == 'paused'
        )
          clientsByDistricts[clientDistrict].push(clientId);
      });

      console.log(clientsByDistricts);

      //get neigborhoods
      var nbhSnap = await db.collection('neighborhoodShifts').get();

      //loop nbh to get shifts for today and further
      var updatePromises = [];
      nbhSnap.forEach(async nbh => {
        console.log(nbh.id);
        //get shifts
        var shiftProm = db
          .collection('neighborhoodShifts')
          .doc(nbh.id)
          .collection('shifts')
          .where('shiftDate', '>=', today)
          .get()
          .then(async querySnapshot => {
            //loop shifts
            querySnapshot.forEach(shift => {
              const shiftData = shift.data();
              //loop clients and responsibles
              console.log(clientsByDistricts[nbh.id]);
              for (var cl = 0; cl < clientsByDistricts[nbh.id].length; cl++) {
                const clientId = clientsByDistricts[nbh.id][cl];
                //loop responsoble
                const shifts = Object.keys(shiftData.responsibleForShifts);
                for (var r = 0; r < shifts.length; r++) {
                  const clientShiftKey =
                    clientId + '.' + shiftData.formatDate + '.' + r;

                  //save in db
                  const setObj = {
                    responsible: shiftData.responsibleForShifts[r],
                    updatedAt: new Date(),
                    updatedBy: 'MOK APP initial creation',
                  };
                  var updProm = db
                    .collection('clients')
                    .doc(clientId)
                    .collection('clientShifts')
                    .doc(clientShiftKey)
                    .set(setObj);
                  updatePromises.push(updProm);
                } //end shift data
              } //end for client in district
            }); //end for each shift;
            console.log('before await updates');
            await Promise.all(updatePromises);
            console.log('next nbh');
          }); //end then
      }); //end for each nbh
    },
    async generateClientShifteKeysAndSoloTaskKeysInTasks() {
      console.log('generateClientShifteKeysAndSoloTaskKeysInTasks...');
      var vm = this;
      var db = firebase.firestore();

      //get tasks from today forward
      var today = new Date(new Date().setHours(0, 0, 0, 0));
      var taskSnap = await db
        .collection('taskArchive')
        .where('lpTaskDate', '>', today)
        .get();

      var taskCounter = 0;
      var updatePromises = [];
      taskSnap.forEach(task => {
        taskCounter++;
        const taskId = task.id;
        const taskData = task.data();

        //clientId.date.shiftNr
        const clientShiftKey =
          taskData.clientId +
          '.' +
          taskData.lpTaskFormatDate +
          '.' +
          taskData.lpTaskShiftNumber;

        //taskNr.clientId.date.shiftNr
        const soloTaskKey = taskData.lpTaskNumber + '.' + clientShiftKey;

        //update
        var updateObj = {
          clientShiftKey: clientShiftKey,
          soloTaskKey: soloTaskKey,
          soloTask: false,
        };

        var updProm = db
          .collection('taskArchive')
          .doc(taskId)
          .update(updateObj);
        updatePromises.push = updProm;
      });

      console.log('wait to update all', taskCounter);
      await Promise.all(updatePromises);

      console.log('updated');
    },

    listVisits() {
      console.log('list visits...');
      var vm = this;
      var db = firebase.firestore();

      //start date
      var fromDate = new Date(2019, 7, 1, 0, 0, 0, 0);

      //get users
      db.collection('users')
        .get()
        .then(function(querySnapshot) {
          var usersL = {};
          querySnapshot.forEach(function(doc) {
            usersL[doc.id] = doc.data();
          });
          vm.users = Object.assign({}, usersL);
        });

      //get visits

      db.collection('visits')
        .where('startAt', '>', fromDate)
        .get()
        .then(function(querySnapshot) {
          var visitsL = {};
          querySnapshot.forEach(function(doc) {
            visitsL[doc.id] = doc.data();
            vm.visitKeys.push(doc.id);
          });
          vm.visits = Object.assign({}, visitsL);
        });
    },

    red(visitKeyIndex) {
      var vm = this;
      if (!visitKeyIndex) {
        return null;
      }

      //first element
      if (visitKeyIndex == 0) {
        return null;
      }

      var returnClass = null;
      var thisVisitId = vm.visitKeys[visitKeyIndex];
      var thisVisitData = vm.visits[thisVisitId];
      var prevVisitId = vm.visitKeys[visitKeyIndex - 1];
      var prevVisitData = vm.visits[prevVisitId];
      var durationBetween =
        thisVisitData.startAt.seconds - prevVisitData.endAt.seconds;

      //if next date, client, and user the same
      //duration between visits at least 30 min (1800 sec)
      if (
        thisVisitData.dateFormatted == prevVisitData.dateFormatted &&
        thisVisitData.clientId == prevVisitData.clientId &&
        thisVisitData.user == prevVisitData.user &&
        durationBetween < 1800
      ) {
        returnClass = 'red';
      }

      return returnClass;
    },

    formatDate(sec) {
      var date = new Date(sec * 1000);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var day = date.getDate();
      if (day < 10) {
        day = '0' + day;
      }
      var hour = date.getHours();
      var min = date.getMinutes();
      var sec = date.getSeconds();
      var ms = date.getMilliseconds();

      if (min < 10) {
        min = '0' + min;
      }

      if (sec < 10) {
        sec = '0' + sec;
      }

      return (
        day +
        '.' +
        month +
        '.' +
        year +
        ' ' +
        hour +
        ':' +
        min +
        ':' +
        sec +
        ':' +
        ms
      );
    },

    //update responsible for today and future tasks based on clients district and actual responsible
    async updateResponsible() {
      console.log('update respnosibles...');

      var vm = this;
      var db = firebase.firestore();

      var daysAhead = -1;
      var yesterday = new Date(Date.now() + daysAhead * 86400000);

      //get all clients
      var clientsSnap = await db.collection('clients').get();
      var clientDistricts = {};
      clientsSnap.forEach(client => {
        clientDistricts[client.id] = client.data().clientDistrict;
      });

      console.log('clientDistricts ', clientDistricts);

      //get shifts
      var districtsSnap = await db.collection('neighborhoodShifts').get();
      var districtPromises = [];
      var districtIds = [];

      districtsSnap.forEach(district => {
        var shiftSnap = db
          .collection('neighborhoodShifts')
          .doc(district.id)
          .collection('shifts')
          .where('shiftDate', '>', yesterday)
          .get();

        districtPromises.push(shiftSnap);
        districtIds.push(district.id);
      });

      Promise.all(districtPromises).then(async values => {
        var shiftRespnsibles = {};
        //loop values
        for (var v = 0; v < values.length; v++) {
          //shift snap
          var shiftSnap = values[v];
          var districtId = districtIds[v];
          //get shifts later than today
          shiftSnap.forEach(shift => {
            const shiftData = shift.data();
            const responsibles = shiftData.responsibleForShifts;
            const shiftNumbers = Object.keys(responsibles);

            //construct shift keys
            for (var shNr = 0; shNr < shiftNumbers.length; shNr++) {
              const shiftKey =
                districtId + '.' + shiftData.formatDate + '.' + shNr;
              //set responsible
              shiftRespnsibles[shiftKey] = responsibles[shiftNumbers[shNr]];
            }
          });
        }
        console.log('shiftKeys ', shiftRespnsibles);

        console.log('update tasks');
        //get all tasks for today and future
        var taskSnap = await db
          .collection('taskArchive')
          .where('lpTaskDate', '>', yesterday)
          .get();

        var taskCount = 1;

        taskSnap.forEach(task => {
          var taskId = task.id;
          var taskData = task.data();

          var taskClient = taskData.clientId;
          var clientDistrict = clientDistricts[taskClient];

          var newKey =
            clientDistrict +
            '.' +
            taskData.lpTaskFormatDate +
            '.' +
            taskData.lpTaskShiftNumber;

          var newResponsible = shiftRespnsibles[newKey];

          var update = {
            clientDistrict: clientDistrict,
            shiftKey: newKey,
            responsible: newResponsible,
          };

          console.log(taskCount, taskId, update);
          taskCount++;

          db.collection('taskArchive')
            .doc(taskId)
            .update(update);
        });
      });
    },

    //delete tasks that are not in lifeplan anymore
    deleteOldLifePlanTasks() {
      console.log('delete old life plan tasks start..');
      var vm = this;
      var db = firebase.firestore();

      var clientTasks = {};

      //get clients
      db.collection('clients')
        .where('clientServices', 'array-contains', 'neighborhood')
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //get tasks
            clientTasks[doc.id] = doc.data().clientLifePlanTasks;
          });

          //then analyze tasks
          //get all tasks from a date
          var daysAhead = -1;
          var yesterday = new Date(Date.now() + daysAhead * 86400000);

          db.collection('taskArchive')
            .where('lpTaskDate', '>', yesterday)
            .get()
            .then(function(querySnapshot) {
              querySnapshot.forEach(function(doc) {
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
                if (clientTasks[clientId].indexOf(taskId) == -1) {
                  console.log('delete ', thisTask, taskName);
                  // db.collection('taskArchive')
                  //   .doc(thisTask)
                  //   .delete();
                }
              });
            });
        });
    },

    //add shift keys
    addShiftKeys() {
      console.log('add shift keys start..');

      //get all tasks from a date
      var daysAhead = -1;
      var yesterday = new Date(Date.now() + daysAhead * 86400000);

      var vm = this;
      var db = firebase.firestore();

      //get clients
      db.collection('taskArchive')
        .where('lpTaskDate', '>', yesterday)
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //get key
            const data = doc.data();
            const districtId = data.clientDistrict;
            const shiftDate = data.lpTaskFormatDate;
            const shiftNr = data.lpTaskShiftNumber;
            const shiftKey = districtId + '.' + shiftDate + '.' + shiftNr;

            //update
            db.collection('taskArchive')
              .doc(doc.id)
              .update({
                shiftKey: shiftKey,
              });
          });
          console.log('updates sent');
        });
    },

    //add status to each client
    addStatus() {
      console.log('add status');

      //assign status = active to each client
      var vm = this;
      var db = firebase.firestore();

      //get clients
      db.collection('clients')
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //update
            db.collection('clients')
              .doc(doc.id)
              .update({
                clientStatus: 'active',
              });
          });
        });
    },
    calculateVisits() {
      console.log('calculate visits');

      //calculate visits to each daily report
      var vm = this;
      var db = firebase.firestore();

      db.collection('dailyReports')
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //reports
            const reportId = doc.id;
            const reportData = doc.data();
            var reportTotalClientVisits = 0;
            const reportRef = db.collection('dailyReports').doc(reportId);

            //loop users, create object to store visits
            var userVisits = {};
            for (var userId in reportData.userQuickStats) {
              userVisits[userId] = 0;
            }

            //analyze data
            for (var clientId in reportData.clientAllTasks) {
              //only clients that have tasks that day
              if (reportData.clientQuickStats[clientId].total > 0) {
                var differentShifts = [];
                const clientTasks = reportData.clientAllTasks[clientId].tasks;
                //loop tasks
                for (var taskId in clientTasks) {
                  const shiftNr = clientTasks[taskId].lpTaskShiftNumber;
                  const taskStatus = clientTasks[taskId].status;
                  //if closed task
                  if (
                    taskStatus != 'canceled' &&
                    taskStatus != 'postponed' &&
                    taskStatus != 'open'
                  ) {
                    //client stats
                    if (differentShifts.indexOf(shiftNr) == -1) {
                      differentShifts.push(shiftNr);

                      //user stats
                      const closedById = clientTasks[taskId].closedBy;
                      userVisits[closedById]++;
                    }
                  }
                } //end for client tasks

                const numberOfClientVisits = differentShifts.length;
                reportTotalClientVisits += differentShifts.length;

                //store client data
                // reportRef.update({
                //   ["clientQuickStats." +
                //   clientId +
                //   ".visits"]: numberOfClientVisits
                // });
              } //end if client has tasks
            } //end for clients

            //store report data
            //total visits
            // reportRef.update({
            //   ["totalQuickStats.visits"] : reportTotalClientVisits
            // })

            // for(var userId in userVisits){
            //   reportRef.update({
            //     ["userQuickStats."+userId+".visits"] : userVisits[userId]
            //   })
            // }
          }); //end daily report snapshot
        });
    },
    randomColor() {
      return '000000'.replace(/0/g, function() {
        return (~~(Math.random() * 16)).toString(16);
      });
    },
    clientColors() {
      console.log('client color');

      //assign color to each client
      var vm = this;
      var db = firebase.firestore();

      //get clients
      db.collection('clients')
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //
            const clientColor = vm.randomColor();
            db.collection('clients')
              .doc(doc.id)
              .update({
                clientColor: clientColor,
              });
          });
        });
    },
    showTaskData(taskId) {
      var vm = this;
      console.log(vm.tasks[taskId]);
    },
    async getAllTasks() {
      var vm = this;
      var db = firebase.firestore();
      console.log('get all tasks');

      var tasksSnap = await db
        .collection('taskArchive')
        .orderBy('lpTaskDate', 'desc')
        .limit(700)
        .get();

      var tasksL = {};
      tasksSnap.forEach(task => {
        tasksL[task.id] = task.data();
      });

      vm.tasks = Object.assign({}, tasksL);
    },
    async addClientDistrictToAllTasks() {
      var db = firebase.firestore();
      console.log('add client district to all tasks');
      //get all clients
      var clientsSnap = await db.collection('clients').get();

      var clientDistricts = {};
      clientsSnap.forEach(client => {
        clientDistricts[client.id] = client.data().clientDistrict;
      });

      //get all tasks
      var tasksSnap = await db
        .collection('taskArchive')
        .orderBy('lpTaskDate', 'desc')
        .limit(700)
        .get();

      tasksSnap.forEach(task => {
        const taskId = task.id;
        const clientId = task.data().clientId;
        const clientDist = clientDistricts[clientId];

        db.collection('taskArchive')
          .doc(taskId)
          .update({
            clientDistrict: clientDist,
          });
      });

      console.log('done');
    },
    formatDateReport(inpDate) {
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
    },
  },
};
</script>

<style>
.red {
  background-color: red;
}
</style>


