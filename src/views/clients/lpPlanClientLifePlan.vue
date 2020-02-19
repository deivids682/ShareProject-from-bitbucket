<template>
  <v-container>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <v-layout row wrap v-if="!progressBar">
      <v-card width="100%">
        <v-card-title
          class="headline"
        >{{typeOfTask == 'residences' ? clientInfo.name :clientInfo.clientName}} - dzīves plāns</v-card-title>

        <v-btn-toggle v-model="btnToggle" dark style="margin-left:15px" mandatory>
          <v-btn small color="accent" @click="soloPlanning = false">Pamata plānošana</v-btn>
          <v-btn small color="accent" @click="soloPlanning = true">Individuālā plānošana</v-btn>
        </v-btn-toggle>

        <v-card-text>
          <div id="table-div">
            <table id="task-table">
              <!-- header -->
              <thead id="task-table-header">
                <tr>
                  <th v-for="head in headers" :key="head.text">{{head.text}}</th>
                </tr>
              </thead>
              <!-- task names -->
              <tbody>
                <tr v-for="task in clientTaskIds" :key="task">
                  <th class="headcol">
                    <span
                      :class="'task-group-'+tasks[task].taskNumber.toString().slice(0,1)"
                    >{{tasks[task].taskNumber}}</span>
                    - {{tasks[task].taskName}}
                  </th>
                  <td class="m-dropdown" v-if="serviceData === 'bfh' && typeOfTask === 'clients'">
                    <template>
                      <div class="align-center">TEST</div>
                    </template>
                  </td>
                  <!-- cells for planning -->
                  <!-- regular planning -->
                  <template v-if="!soloPlanning">
                    <td v-for="(cell, rowIndx) in cellRow" class="check-task-td" :key="rowIndx">
                      <v-checkbox
                        class="align-center justify-center"
                        :color="isSoloTask(clientId+'-'+cell+'-'+task) ? 'primary':'secondary'"
                        :input-value="cells[clientId+'-'+cell+'-'+task]"
                        @change="changeTaskStatus(cell, task)"
                      ></v-checkbox>
                    </td>
                  </template>
                  <!-- solo planning -->
                  <template v-if="soloPlanning">
                    <td v-for="(cell, rowIndx) in cellRow" class="check-task-td" :key="rowIndx">
                      <v-btn
                        x-small
                        depressed
                        :color="isSoloTask(clientId+'-'+cell+'-'+task) ? 'primary':'secondary'"
                        v-if="cells[clientId+'-'+cell+'-'+task]"
                        @click.stop="planSolo(clientId+'-'+cell+'-'+task)"
                      >{{isSoloTask(clientId+'-'+cell+'-'+task) ? getUserName(clientId+'-'+cell+'-'+task):'X'}}</v-btn>
                      <!-- inactive -->
                      <v-icon
                        v-if="!cells[clientId+'-'+cell+'-'+task]"
                        color="grey"
                      >check_box_outline_blank</v-icon>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card-text>
      </v-card>

      <!-- edit solo task dialog -->
      <v-dialog v-model="planSoloTaskDialog" max-width="600" persistent>
        <v-card v-if="planSoloTaskDialog">
          <v-card-title class="headline">Individuālā uzdevuma plānošana</v-card-title>

          <v-card-text>
            <v-layout wrap>
              <v-flex xs12>
                <h3>
                  Uzdevums:
                  <span
                    :class="'task-group-'+planSoloTaskData.taskNumber.toString().slice(0,1)"
                  >{{planSoloTaskData.taskNumber}}</span>
                  - {{planSoloTaskData.taskName}}
                </h3>
              </v-flex>
              <v-flex xs12>
                Atbildīgais:
                <v-select v-model="planSoloTaskData.responsible" :items="usersSelectObj"></v-select>
              </v-flex>
              <v-flex xs12>
                <v-checkbox
                  v-model="planSoloTaskData.soloTask"
                  :label="'Turpmāk vienmār šajā nedēļas dienā un maiņā nozīmēt par atbildīgo ' + users[planSoloTaskData.responsible].displayName"
                ></v-checkbox>
              </v-flex>
            </v-layout>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="error" text @click="resetPlanSoloDialog()">Atcelt</v-btn>

            <v-btn color="primary" text @click="saveSoloTask()">Salgabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  props: ['service', 'typeOfTask'],
  data() {
    return {
      clientId: null,
      houseId: null,
      clientDistrict: null,
      houseDistrict: null,
      clientInfo: {},
      houseInfo: {},
      clientTaskIds: [],
      houseTaskIds: [],
      progressBar: true,
      btnToggle: 0,
      soloPlanning: false,
      items: ['test', 'test2', 'test3'],
      tasks: {},
      lifePlanTasks: {},
      lifePlanTaskData: {},
      planSoloTaskDialog: false,
      planSoloTaskData: {
        taskId: null,
        taskNumber: null,
        taskName: null,
        responsible: null,
        soloTask: null,
      },
      users: {},
      usersSelectObj: [],
      taskIds: [],
      shifts: {},
      numbersToShifts: { 0: 'Rīts', 1: 'Pusdiena', 2: 'Vakars' },
      headers: [
        {
          text: 'Uzdevumi',
          align: 'left',
          sortable: false,
          value: 'taskName',
        },
      ],
      cells: {},
      cellRow: [],
      serviceData: this.service || 'neighborhood',
      valueOfTask: this.typeOfTask || 'clients',
    };
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();
    var today = new Date();
    today.setHours(0, 0, 0);

    //get passed client id
    vm.clientId = this.$route.params.clid;

    //client
    // get client info
    var clientSnap = await db
      .collection(vm.valueOfTask)
      .doc(vm.clientId)
      .get();

    vm.clientInfo = Object.assign({}, clientSnap.data());
    vm.clientDistrict = clientSnap.data().clientDistrict;

    let dataPromises = [];
    //get list of tasks
    let numberOfTasks = null;

    if (vm.valueOfTask == 'residences') {
      numberOfTasks = vm.clientInfo.houseLifePlanTasks.length;
      vm.clientDistrict = vm.clientId;
      vm.clientInfo.houseLifePlanTasks.forEach(taskId => {
        var taskProm = db
          .collection('neighborhoodTasks')
          .doc(taskId)
          .get();
        dataPromises.push(taskProm);
      });
    } else {
      numberOfTasks = vm.clientInfo.clientLifePlanTasks.length;
      vm.clientInfo.clientLifePlanTasks.forEach(taskId => {
        var taskProm = db
          .collection('neighborhoodTasks')
          .doc(taskId)
          .get();
        dataPromises.push(taskProm);
      });
    }
    //get shifs for clients district
    var shiftsProm = db
      .collection('residences')
      .doc(vm.valueOfTask == 'residences' ? vm.clientId : vm.clientDistrict)
      .collection('shifts')
      .orderBy('shiftDate', 'desc')
      .where('shiftDate', '>=', today)
      .get();
    dataPromises.push(shiftsProm);

    //get clients life plan tasks
    var archiveProm = db
      .collection('taskArchive')
      .where('lpTaskDate', '>=', today)
      .where('clientId', '==', vm.clientId)
      .get();
    dataPromises.push(archiveProm);

    //users
    var usersProm = db
      .collection('users')
      .where('role', 'array-contains', 'aider')
      .get();
    dataPromises.push(usersProm);

    //wait all promises to load
    var values = await Promise.all(dataPromises);

    //tasks
    var tasksL = {};
    for (var i = 0; i < numberOfTasks; i++) {
      var doc = values[i];
      tasksL[doc.id] = doc.data();
      vm.taskIds.push(doc.id);
    }

    vm.tasks = Object.assign({}, tasksL);

    //shifts
    var querySnapshot = values[numberOfTasks];
    var shiftsL = {};
    querySnapshot.forEach(function(doc) {
      shiftsL[doc.id] = doc.data();
    });
    vm.shifts = Object.assign({}, shiftsL);

    //archive
    var querySnapshot = values[numberOfTasks + 1];
    var lifePlanTasksL = {};
    var lifePlanTaskDataL = {};
    querySnapshot.forEach(function(doc) {
      lifePlanTasksL[doc.id] = doc.data().status;
      lifePlanTaskDataL[doc.id] = doc.data();
    });
    vm.lifePlanTasks = Object.assign({}, lifePlanTasksL);
    vm.lifePlanTaskData = Object.assign({}, lifePlanTaskDataL);

    //users
    var querySnapshot = values[numberOfTasks + 2];
    var usersL = {};
    querySnapshot.forEach(function(doc) {
      usersL[doc.id] = doc.data();
      vm.usersSelectObj.push({ value: doc.id, text: doc.data().displayName });
    });
    vm.users = Object.assign({}, usersL);

    //data loaded, create table
    vm.createHeadersAndCells();
  },
  watch: {
    // whenever changes, this function will run
    typeOfTask: function(typeOfTask) {
      this.valueOfTask = typeOfTask;
    },
  },
  methods: {
    planSolo(taskId) {
      var vm = this;
      const taskData = vm.lifePlanTaskData[taskId];
      //form data
      vm.planSoloTaskData = Object.assign(
        {},
        {
          taskId: taskId,
          taskNumber: taskData.lpTaskNumber,
          taskName: taskData.lpTaskName,
          responsible: taskData.responsible,
          soloTask: taskData.soloTask,
        }
      );

      //open dialog
      vm.planSoloTaskDialog = true;
    },
    saveSoloTask() {
      var vm = this;
      var db = firebase.firestore();
      const taskId = vm.planSoloTaskData.taskId;

      //set changes locally
      vm.lifePlanTaskData[taskId].responsible = vm.planSoloTaskData.responsible;
      vm.lifePlanTaskData[taskId].soloTask = vm.planSoloTaskData.soloTask;

      //send to db
      var updateObj = {
        soloTask: vm.planSoloTaskData.soloTask,
        responsible: vm.planSoloTaskData.responsible,
        lastUpdate: new Date(),
        updatedBy:
          vm.currentUserData.displayName +
          ' life plan individual planning update',
      };

      db.collection('taskArchive')
        .doc(taskId)
        .update(updateObj);

      //reset and close dialog
      vm.resetPlanSoloDialog();
    },
    resetPlanSoloDialog() {
      var vm = this;
      //close dialog
      vm.planSoloTaskDialog = false;
      //reset form
      vm.planSoloTaskData = Object.assign(
        {},
        {
          taskId: null,
          taskNumber: null,
          taskName: null,
          responsible: null,
          soloTask: null,
        }
      );
    },
    getUserName(taskId) {
      var vm = this;
      const taskResponsible = vm.lifePlanTaskData[taskId].responsible;
      return vm.users[taskResponsible].displayName;
    },

    isSoloTask(taskId) {
      var vm = this;
      if (typeof vm.lifePlanTaskData[taskId] == 'undefined') {
        return false;
      } else {
        return vm.lifePlanTaskData[taskId].soloTask;
      }
    },
    async changeTaskStatus(cellKey, taskId) {
      var vm = this;
      var db = firebase.firestore();
      const clientId = vm.clientId;

      //full cell key
      const fullKey = clientId + '-' + cellKey + '-' + taskId;
      // change local cell status
      vm.cells[fullKey] = !vm.cells[fullKey];
      const newStatus = vm.cells[fullKey];

      if (newStatus == true) {
        const shiftRef = cellKey.split('-');
        const shiftId = shiftRef[0] + '-' + shiftRef[1] + '-' + shiftRef[2];
        const shiftNr = shiftRef[3];

        //generate keys
        //task keys
        const shiftKey =
          vm.clientDistrict +
          '.' +
          vm.shifts[shiftId].formatDate +
          '.' +
          shiftNr;
        const clientShiftKey =
          clientId + '.' + vm.shifts[shiftId].formatDate + '.' + shiftNr;
        const soloTaskKey = taskId + '.' + clientShiftKey;
        const isSoloTask = false;

        //get responsible
        var shiftResponsible = vm.shifts[shiftId].responsibleForShifts[shiftNr];
        //if clientShiftKey exists, then from that key, else default responsible
        var clientShiftKeyDoc = await db
          .collection('clientShiftKeys')
          .doc(clientShiftKey)
          .get();

        if (clientShiftKeyDoc.exists) {
          shiftResponsible = clientShiftKeyDoc.data().responsible;
        }

        let setObj = null;
        if (vm.valueOfTask == 'residences') {
          setObj = {
            clientId: vm.clientId,
            clientDistrict: vm.clientId,
            clientName: vm.clientInfo.name,
            lpTaskDate: vm.shifts[shiftId].shiftDate,
            lpTaskFormatDate: vm.shifts[shiftId].formatDate,
            lpTaskShiftNumber: shiftNr,
            lpTaskId: taskId,
            lpTaskName: vm.tasks[taskId].taskName,
            lpTaskNumber: vm.tasks[taskId].taskNumber,
            lpTaskType: vm.tasks[taskId].taskType,
            lpTaskEveryday: vm.tasks[taskId].taskEveryday,
            lpTaskSocial: vm.tasks[taskId].taskSocial,
            lpTaskDirect: vm.tasks[taskId].taskDirect,
            lpTaskCognitive: vm.tasks[taskId].taskCognitive,
            lpTaskCodingGroup: vm.tasks[taskId].taskCodingGroup,
            order: vm.tasks[taskId].taskTime,
            responsible: shiftResponsible,
            shiftKey: shiftKey,
            soloTaskKey: soloTaskKey,
            soloTask: isSoloTask,
            equipment: vm.tasks[taskId].taskEquipment || '',
            service: vm.serviceData,
            status: 'open',
            comment: '',
            photoUrl: '',
            lastUpdate: new Date(),
            updatedBy:
              vm.currentUserData.displayName + ' life plan default set',
          };
        } else {
          setObj = {
            clientId: vm.clientId,
            clientName: vm.clientInfo.clientName,
            clientDistrict: vm.clientInfo.clientDistrict,
            lpTaskDate: vm.shifts[shiftId].shiftDate,
            lpTaskFormatDate: vm.shifts[shiftId].formatDate,
            lpTaskShiftNumber: shiftNr,
            lpTaskId: taskId,
            lpTaskName: vm.tasks[taskId].taskName,
            lpTaskNumber: vm.tasks[taskId].taskNumber,
            lpTaskType: vm.tasks[taskId].taskType,
            lpTaskEveryday: vm.tasks[taskId].taskEveryday,
            lpTaskSocial: vm.tasks[taskId].taskSocial,
            lpTaskDirect: vm.tasks[taskId].taskDirect,
            lpTaskCognitive: vm.tasks[taskId].taskCognitive,
            lpTaskCodingGroup: vm.tasks[taskId].taskCodingGroup,
            order: vm.tasks[taskId].taskTime,
            responsible: shiftResponsible,
            shiftKey: shiftKey,
            clientShiftKey: clientShiftKey,
            soloTaskKey: soloTaskKey,
            soloTask: isSoloTask,
            equipment: vm.tasks[taskId].taskEquipment || '',
            service: vm.serviceData,
            status: 'open',
            comment: '',
            photoUrl: '',
            lastUpdate: new Date(),
            updatedBy:
              vm.currentUserData.displayName + ' life plan default set',
          };
        }
        //add locally
        vm.lifePlanTaskData[fullKey] = setObj;

        // add task to db
        db.collection('taskArchive')
          .doc(fullKey)
          .set(setObj);
      } else {
        // delete task
        db.collection('taskArchive')
          .doc(fullKey)
          .delete();
      }
    },
    createHeadersAndCells() {
      var vm = this;
      const shifts = vm.shifts;
      const taskKeys = Object.keys(vm.tasks);

      var clientLifePlanTasks = vm.clientInfo.clientLifePlanTasks;
      if (vm.valueOfTask == 'residences') {
        clientLifePlanTasks = vm.clientInfo.houseLifePlanTasks;
      }

      var sortedTasks = [];
      //get tasks that are both for client, and in task list
      for (var tt = 0; tt < clientLifePlanTasks.length; tt++) {
        if (taskKeys.includes(clientLifePlanTasks[tt])) {
          sortedTasks.push(clientLifePlanTasks[tt]);
        }
      }

      //sort tasks
      sortedTasks.sort((a, b) =>
        vm.tasks[a].taskNumber > vm.tasks[b].taskNumber ? 1 : -1
      );
      vm.clientTaskIds = sortedTasks;

      var shiftKeys = Object.keys(shifts).reverse();
      var numberOfShifts = Object.keys(
        shifts[shiftKeys[0]].responsibleForShifts
      ).length;

      if (this.service === 'bfh' && this.typeOfTask === 'clients') {
        vm.headers.push({
          text: 'Ieteiktais palīdzības līmenis',
          align: 'left',
          sortable: false,
          value: 'assistanceLevel',
        });
      }
      //create object for header
      for (var sk = 0; sk < shiftKeys.length; sk++) {
        for (var nrsh = 0; nrsh < numberOfShifts; nrsh++) {
          //generate headers
          vm.headers.push({
            text:
              shifts[shiftKeys[sk]].formatDate +
              '\n\n' +
              vm.numbersToShifts[nrsh],
            align: 'left',
            sortable: false,
            value: shifts[shiftKeys[sk]].formatDate + '_' + nrsh,
            width: '10px',
          });
          //generate cell row
          const cellRowKey = [shiftKeys[sk]] + '-' + nrsh;
          vm.cellRow.push(cellRowKey);
          //construct model for task status change. Model key: clientId-date - shift - taskId
          //loop client tasks tasks
          for (var t = 0; t < vm.clientTaskIds.length; t++) {
            //add only tasks that are selected for this client
            if (taskKeys.includes(vm.clientTaskIds[t])) {
              const cellKey =
                vm.clientId +
                '-' +
                [shiftKeys[sk]] +
                '-' +
                nrsh +
                '-' +
                vm.clientTaskIds[t];
              //check if status already true i.e. task is already planned
              if (typeof vm.lifePlanTasks[cellKey] == 'undefined') {
                vm.cells[cellKey] = false;
              } else {
                vm.cells[cellKey] = true;
              }
            } //end if this task is selected for this client
          } //end for tasks
        } //end for number of shifts
      } //end for shift keys

      //done loading
      vm.progressBar = false;
    },
  },
};
</script>

<style>
#table-div {
  overflow: auto;
  position: relative;
  max-height: 800px;
}

#table-div table {
  position: relative;
  border-collapse: collapse;
}

#table-div td,
#table-div th {
  padding: 0.25em;
}

/* header row */
#table-div thead th {
  position: -webkit-sticky; /* for Safari */
  position: sticky;
  top: 0;
  background: #919294;
  color: #fff;
  z-index: 4;
  margin-top: 20px;
}

/* cell a1 */
#table-div thead th:first-child {
  left: 0;
  z-index: 5;
}

/* left column */
#table-div tbody th {
  position: -webkit-sticky; /* for Safari */
  position: sticky;
  left: 0;
  background: #fafafa;
  border-right: 1px solid #ccc;
  text-align: left;
  z-index: 2;
  font-weight: 400;
}

.check-task-td {
  border-right: #7a7a7a solid 1px;
  text-align: center;
}

.client-title-row {
  margin-top: 25px;
  border: solid 1px black;
}

.m-dropdown {
  position: relative;
  padding-left: 30px;
  min-width: 150px;
  z-index: 1;
  border-right: #7a7a7a solid 1px;
}
</style>
