<template>
  <v-container>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <v-layout wrap v-if="!progressBar">
      <v-flex xs12>
        <h3>{{clientData.clientName}} - dzīves plāna uzdevumi</h3>
      </v-flex>
      <v-flex xs12>
        <v-btn icon @click="printLifePlan()">
          <v-icon color="grey darken-1">print</v-icon>
        </v-btn>
      </v-flex>
      <!-- loop tasks to select -->
      <v-flex xs12 v-for="(task, taskId) in tasksInfo" :key="taskId" class="task-entry">
        <!-- checkbox -->
        <v-checkbox
          class="narrow-checkbox"
          hide-details
          v-model="clientTasks"
          :value="taskId"
          @change="updateClientTasks()"
        >
          <div slot="label">
            <span :class="'task-group-'+task.taskNumber.toString().slice(0,1)">{{task.taskNumber}}</span>
            {{task.taskName}}
          </div>
        </v-checkbox>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default {
  data() {
    return {
      progressBar: true,
      clientId: this.$route.params.clid,
      tasksInfo: {},
      clientData: {},
      clientTasks: [],
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();
    var clientId = this.$route.params.clid;

    //get all tasks
    var tasksInfoL = {};
    db.collection('neighborhoodTasks')
      .where('service', '==', 'neighborhood')
      .orderBy('taskNumber')
      .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          tasksInfoL[doc.id] = doc.data();
        });
        vm.tasksInfo = Object.assign({}, tasksInfoL);

        //get client tasks
        db.collection('clients')
          .doc(clientId)
          .get()
          .then(function(doc) {
            vm.clientData = Object.assign({}, doc.data());
            vm.clientTasks = doc.data().clientLifePlanTasks || [];

            //TODO: delete tasks that are not in the big task list

            vm.progressBar = false;
          });
      });
  },
  methods: {
    printLifePlan() {
      var vm = this;
      //generate file name 'name_surname_pn_akts.pdf'

      const fileName =
        vm.clientData.clientName
          .toLowerCase()
          .split(' ')
          .join('_') + '_dzives_plans.pdf';

      //horizontal line
      const horizontalLine = {
        canvas: [
          { type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 1 },
        ],
      };

      //generate list of tasks
      var taskList = [];
      for (var t = 0; t < vm.clientTasks.length; t++) {
        const taskId = vm.clientTasks[t];
        const taskNumber = vm.tasksInfo[taskId].taskNumber;
        const taskName = vm.tasksInfo[taskId].taskName;
        taskList.push(taskNumber + ' ' + taskName);
      }

      //generate form to sign given equipment
      var docDefinition = {
        content: [],
        defaultStyle: {
          fontSize: 10,
        },
        styles: {
          header: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
          },
          right: {
            alignment: 'right',
          },
          bold: {
            bold: true,
          },
          sectionHeader: {
            bold: true,
          },
        },
      };

      var now = new Date();

      var pdf = pdfMake.createPdf(docDefinition);
      pdf.download(fileName);
    },
    updateClientTasks() {
      var vm = this;
      var db = firebase.firestore();
      //update client task list
      db.collection('clients')
        .doc(vm.clientId)
        .update({
          clientLifePlanTasks: vm.clientTasks,
        });
    },
  },
};
</script>


<style>
.narrow-checkbox {
  margin: 0;
}
.task-entry {
  line-height: 1 !important;
  display: flex;
  justify-content: flex-start;
}
</style>