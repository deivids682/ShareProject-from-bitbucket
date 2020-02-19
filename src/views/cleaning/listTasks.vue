<template>
  <v-container class="elevation-1">
    <v-layout row wrap justify-center>
      <h3>Tīrīšanas uzdevumi</h3>
    </v-layout>
    <!-- edit task form -->
    <v-layout row justify-center>
      <v-dialog v-model="dialog" max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Labot uzdevumu</span>
          </v-card-title>
          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field label="Uzdevums" required v-model="editTaskName"></v-text-field>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="dialog = false">Aizvērt</v-btn>
            <v-btn color="primary" text @click="updateTask()">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <!-- tasks -->
    <v-layout row justify-center>
      <v-card>
        <v-list dense>
          <v-list-item>
            <v-list-item-content>
              <v-text-field
                prepend-icon="search"
                clearable
                v-model="searchValue"
                :append-outer-icon="Object.keys(displayTasks).length ? '' : 'save'"
                @click:append-outer="addNewTask()"
              ></v-text-field>
            </v-list-item-content>
          </v-list-item>
          <!-- list all tasks -->
          <v-list-item v-for="(task, taskId) in displayTasks" :key="taskId">
            <v-list-item-content>
              <v-list-item-title>{{task.cleaningTaskText}}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action @click="editTask(taskId, task.cleaningTaskText)">
              <v-icon>edit</v-icon>
            </v-list-item-action>
            <v-list-item-action @click="deleteTask(taskId)">
              <v-icon>delete_forever</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data() {
    return {
      allTasks: {},
      searchValue: '',
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
      dialog: false,
      editTaskName: '',
      editTaskId: '',
    };
  },
  created() {
    var vm = this;

    //get list of tasks
    var db = firebase.firestore();

    var allTasksL = {};
    db.collection('cleaningTasks')
      .orderBy('cleaningTaskText')
      .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          //push data to array
          allTasksL[doc.id] = doc.data();
        });
        vm.allTasks = Object.assign({}, allTasksL);
      });
  },
  computed: {
    displayTasks: function() {
      var vm = this;
      var displayTasksL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var taskIds = Object.keys(vm.allTasks);
          for (var t = 0; t < taskIds.length; t++) {
            if (
              vm.allTasks[taskIds[t]].cleaningTaskText
                .toLowerCase()
                .indexOf(vm.searchValue.toLowerCase()) !== -1
            ) {
              displayTasksL[taskIds[t]] = vm.allTasks[taskIds[t]];
            }
          } //end for
        } else {
          displayTasksL = Object.assign({}, vm.allTasks);
        }
      } else {
        displayTasksL = Object.assign({}, vm.allTasks);
      }

      return displayTasksL;
    },
  },
  methods: {
    addNewTask() {
      try {
        var db = firebase.firestore();

        db.collection('cleaningTasks').add({
          cleaningTaskText: this.searchValue,
        });
      } catch (error) {
        console.log(error);
      }
    },
    updateTask() {
      var vm = this;
      try {
        var db = firebase.firestore();

        db.collection('cleaningTasks')
          .doc(vm.editTaskId)
          .update({
            cleaningTaskText: vm.editTaskName,
          })
          .then(function() {
            vm.dialog = false;
            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Uzdevums veiksmīgi labots!';
            vm.snackbar = true;
          });
      } catch (error) {
        console.log(error);
      }
    },
    closeEditTask() {
      var vm = this;
      vm.editTaskName = '';
      vm.editTask = '';
      vm.dialog = false;
    },
    editTask(taskId, oldTaskName) {
      var vm = this;
      vm.editTaskName = oldTaskName;
      vm.editTaskId = taskId;
      vm.dialog = true;
    },
    deleteTask(taskId) {
      var vm = this;

      var r = confirm('Tiešām vēlies izdzēst?');
      if (r == true) {
        try {
          var db = firebase.firestore();

          db.collection('cleaningTasks')
            .doc(taskId)
            .delete()
            .then(function() {
              //update tasks
              var allTasksL = {};
              db.collection('cleaningTasks')
                .orderBy('cleaningTaskText')
                .onSnapshot(function(querySnapshot) {
                  querySnapshot.forEach(function(doc) {
                    //push data to array
                    allTasksL[doc.id] = doc.data();
                  });
                  vm.allTasks = Object.assign({}, allTasksL);
                });

              //enable snackbar
              vm.snackbarColor = 'error';
              vm.snackbarTxt = 'Uzdevums veiksmīgi izdzēsts!';
              vm.snackbar = true;
            })
            .catch(function(error) {
              console.error('Error removing document: ', error);
            });
        } catch (error) {
          console.log(error);
        }
      } else {
      }
    },
  },
}; //end export default
</script>