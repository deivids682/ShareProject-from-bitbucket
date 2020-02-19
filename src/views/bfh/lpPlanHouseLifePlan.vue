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
        <h3>{{houseData.name}} - dzīves plāna uzdevumi</h3>
      </v-flex>
      <!-- loop tasks to select -->
      <v-flex xs12 v-for="(task, taskId) in tasksInfo" :key="taskId" class="task-entry">
        <!-- checkbox -->
        <v-checkbox
          class="narrow-checkbox"
          hide-details
          v-model="houseTasks"
          :value="taskId"
          @change="updateHouseTasks()"
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
      houseId: this.$route.params.houseId,
      tasksInfo: {},
      houseData: {},
      houseTasks: [],
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();
    var houseId = this.$route.params.houseId;

    //get all tasks
    var tasksInfoL = {};
    db.collection('neighborhoodTasks')
      .where('service', '==', 'bfh')
      .where('taskType', '==', 'Mājas')
      .orderBy('taskNumber')
      .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          tasksInfoL[doc.id] = doc.data();
        });
        vm.tasksInfo = Object.assign({}, tasksInfoL);

        db.collection('residences')
          .doc(houseId)
          .get()
          .then(function(doc) {
            vm.houseData = Object.assign({}, doc.data());
            vm.houseTasks = doc.data().houseLifePlanTasks || [];

            vm.progressBar = false;
          });
      });
  },
  methods: {
    updateHouseTasks() {
      var vm = this;
      var db = firebase.firestore();
      //update client task list
      db.collection('residences')
        .doc(vm.houseId)
        .update({
          houseLifePlanTasks: vm.houseTasks,
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