<template>
  <!-- copy life plan -->
  <v-dialog v-model="copyLifePlanDialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="headline">Kopēt dzīves plānu</v-card-title>
      <v-row>
        <v-col cols="12" v-if="progressBar">
          <v-progress-linear :indeterminate="true"></v-progress-linear>
        </v-col>
      </v-row>
      <template v-if="!progressBar">
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <h3>Izvēlēties rezidentu, no kura pārkopēt plānu</h3>
            </v-col>
            <v-col cols="12">
              <v-select
                :items="residentsSelect"
                label="Rezidenti"
                v-model="selectedRes"
                return-object
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="error" text @click="closeLifePlanDialog()">Atcelt</v-btn>

          <v-btn color="primary" text @click="copyLifePlan()">Kopēt Plānu</v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  props: ['copyLifePlanDialog', 'service', 'clientId'],
  data() {
    return {
      //copy life plan
      residentsSelect: [],
      residentData: {},
      selectedRes: null,
      progressBar: false,
    };
  },
  async created() {
    var vm = this;

    //get resident data

    vm.progressBar = true;

    var db = firebase.firestore();

    var resSnap = await db
      .collection('clients')
      .where('clientServices', '==', vm.service)
      .where('clientStatus', '==', 'active')
      .orderBy('clientName')
      .get();

    var residentDataL = {};
    resSnap.forEach(res => {
      vm.residentsSelect.push({
        value: res.id,
        text: res.data().clientName,
      });
      residentDataL[res.id] = res.data();
    });
    vm.residentData = Object.assign({}, residentDataL);

    vm.progressBar = false;
  },

  methods: {
    async copyLifePlan() {
      var vm = this;
      var conf = confirm(
        'Vai pārkopēt dzīves plānu no ' + vm.selectedRes.text + '?'
      );
      if (conf) {
        vm.progressBar = true;

        var resData = vm.residentData[vm.clientId];
        var sourceResId = vm.selectedRes.value;
        var db = firebase.firestore();
        //get future tasks for this client  and delete
        var today = new Date();
        today.setHours(0, 0, 0);

        var getDataPromises = [];

        //get shifts
        var shiftsSnap = db
          .collection('residences')
          .doc(resData.clientDistrict)
          .collection('shifts')
          .where('shiftDate', '>', today)
          .get();
        getDataPromises.push(shiftsSnap);

        //get tasks to copy
        var futureTasksSnap = db
          .collection('taskArchive')
          .where('clientId', '==', sourceResId)
          .where('lpTaskDate', '>', today)
          .get();
        getDataPromises.push(futureTasksSnap);

        //get tasks to delete
        var getTasksToDelete = db
          .collection('taskArchive')
          .where('clientId', '==', vm.clientId)
          .where('lpTaskDate', '>', today)
          .get();
        getDataPromises.push(getTasksToDelete);

        var values = await Promise.all(getDataPromises);

        //write batch
        var batch = db.batch();

        //shifts
        var responsible = {};
        values[0].forEach(shift => {
          responsible[
            shift.data().formatDate
          ] = shift.data().responsibleForShifts;
        });

        //copy tasks
        var copyTasks = {};
        var copyTaskIds = [];
        values[1].forEach(task => {
          var taskData = task.data();
          //update info
          taskData.clientDistrict = resData.clientDistrict;
          taskData.clientId = vm.clientId;
          taskData.clientName = resData.clientName;
          taskData.clientShiftKey =
            vm.clientId +
            '.' +
            taskData.lpTaskFormatDate +
            '.' +
            taskData.lpTaskShiftNumber;
          taskData.comment = '';
          taskData.photoUrl = '';
          if (!taskData.soloTask) {
            taskData.responsible =
              responsible[taskData.lpTaskFormatDate][
                taskData.lpTaskShiftNumber
              ];
          }
          taskData.shiftKey =
            resData.clientDistrict +
            '.' +
            taskData.lpTaskFormatDate +
            '.' +
            taskData.lpTaskShiftNumber;
          taskData.soloTaskKey =
            taskData.lpTaskId +
            '.' +
            vm.clientId +
            '.' +
            taskData.lpTaskFormatDate +
            '.' +
            taskData.lpTaskShiftNumber;
          taskData.status = 'open';
          taskData.updatedBy =
            vm.currentUserData.displayName +
            ' copied life plan from ' +
            vm.residentData[sourceResId].clientName;

          //write to db
          const [day, month, year] = taskData.lpTaskFormatDate.split('.');

          var docId =
            vm.clientId +
            '-' +
            year +
            '-' +
            month +
            '-' +
            day +
            '-' +
            taskData.lpTaskShiftNumber +
            '-' +
            taskData.lpTaskId;

          var docRef = db.collection('taskArchive').doc(docId);
          copyTaskIds.push(docId);
          batch.set(docRef, taskData);
        });

        //delete tasks
        values[2].forEach(task => {
          if (copyTaskIds.indexOf(task.id) == -1) {
            var deleteRef = db.collection('taskArchive').doc(task.id);
            batch.delete(deleteRef);
          }
        });

        //get task list and copy
        var clientRef = db.collection('clients').doc(vm.clientId);
        batch.update(clientRef, {
          clientLifePlanTasks: vm.residentData[sourceResId].clientLifePlanTasks,
        });

        //commit changes
        await batch.commit();

        //close dialog
        vm.progressBar = false;
        vm.closeLifePlanDialog();
      }
    },
    closeLifePlanDialog() {
      this.selectedRes = null;
      this.$emit('closeLifePlanDialog');
    },
  },
};
</script>