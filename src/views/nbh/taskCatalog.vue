<template>
  <v-container>
    <h1>Uzdevumu katalogs</h1>
    <!-- task form -->
    <task-form
      :passedTaskId="taskFromTaskId"
      :equipmentAll="equipmentAll"
      :service="'neighborhood'"
      :openDialog="openDialog"
      :allTasks="allTasks"
      @closeDialog="openDialog = false"
      @resetTaskId="taskFromTaskId = 'new_task'"
      @progressFeedback="progressBar = !progressBar"
    ></task-form>

    <!--Progress bar -->
    <v-row v-if="progressBar">
      <v-progress-linear :indeterminate="true"></v-progress-linear>
    </v-row>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <list-tasks :tasks="allTasks" @deleteTask="deleteTask" @editTask="editTask" v-if="!progressBar"></list-tasks>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//views
import ListTasks from '@/comp/nbh/taskCatalogList.vue';
import TaskForm from '@/comp/nbh/addNewTask.vue';

export default {
  components: {
    ListTasks,
    TaskForm,
  },
  data() {
    return {
      progressBar: true,
      openDialog: false,
      equipmentAll: [],
      allTasks: {},
      taskFromTaskId: 'new_task',
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get list of tasks
    db.collection('neighborhoodTasks')
      .where('service', '==', 'neighborhood')
      .orderBy('taskNumber')
      .onSnapshot(function(querySnapshot) {
        var tasksL = {};
        querySnapshot.forEach(function(doc) {
          tasksL[doc.id] = doc.data();
        });
        vm.allTasks = Object.assign({}, tasksL);
        vm.progressBar = false;
      });

    //get equipment for select
    var equipmentL = [];
    db.collection('items')
      .orderBy('itemName')
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          equipmentL.push({ itemId: doc.id, itemName: doc.data().itemName });
        });
        vm.equipmentAll = equipmentL;
      });
  },
  methods: {
    deleteTask(taskId) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst uzdevumu?');
      if (conf) {
        try {
          vm.progressBar = true;
          var db = firebase.firestore();

          //delete task
          db.collection('neighborhoodTasks')
            .doc(taskId)
            .delete();
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Uzdevums veiksmīgi izdzēsts!';
          vm.snackbar = true;
        } catch (error) {
          console.log(error);
        }
      }
    },
    editTask(taskId) {
      var vm = this;
      vm.taskFromTaskId = taskId;
      vm.openDialog = true;
    },
  },
};
</script>