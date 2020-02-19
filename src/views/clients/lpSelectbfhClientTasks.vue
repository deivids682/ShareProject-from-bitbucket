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
      .where('service', '==', 'bfh')
      .where('taskType', '==', 'Rezidenta')
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
  margin-top: 1rem;
}
</style>
