<template>
  <v-container class="elevation-1">
    <v-layout row wrap>
      <h3>Atzīmēt veicamos uzdevumus</h3>
    </v-layout>
    <v-layout row>
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
          <v-list-item
            v-for="(task, taskId) in displayTasks"
            :key="taskId"
            @click="addClientTask(taskId, task.cleaningTaskText, false)"
          >
            <v-list-item-action>
              <!-- if not defined -->
              <div v-if="typeof clientTasks[taskId] === 'undefined'">
                <v-icon>check_box_outline_blank</v-icon>
              </div>
              <div v-if="typeof clientTasks[taskId] !== 'undefined'">
                <v-icon v-if="clientTasks[taskId].status == false">check_box_outline_blank</v-icon>
                <v-icon v-if="clientTasks[taskId].status == true">check_box</v-icon>
              </div>
            </v-list-item-action>

            <v-list-item-content>
              <v-list-item-title>{{task.cleaningTaskText}}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from "firebase/app";
import "firebase/firestore";


export default {
  data() {
    return {
      clientId: "",
      allTasks: {},
      clientTasks: {},
      searchValue: ""
    };
  },
  created() {
    var vm = this;
    vm.clientId = this.$route.params.clid;

    //get list of tasks
    var db = firebase.firestore();

    var allTasksL = {};
    db.collection("cleaningTasks")
      .orderBy("cleaningTaskText")
      .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          //push data to array
          allTasksL[doc.id] = doc.data();
        });
        vm.allTasks = Object.assign({}, allTasksL);
      });

    //get already selected tasks if exist
    db.collection("clients")
      .doc(this.$route.params.clid)
      .onSnapshot(function(doc) {
        vm.clientTasks = Object.assign({}, doc.data().clientTasks);
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
    }
  },
  methods: {
    addNewTask(){
        try {
          var db = firebase.firestore();

          db.collection("cleaningTasks").add({
            cleaningTaskText: this.searchValue,
          })
          
        } catch (error) {
          console.log(error);
        }
    },
    addClientTask(taskId, cleaningTaskText, status) {
      //get curent status of
      var vm = this;
      var clientId = this.$route.params.clid;

      if (typeof vm.clientTasks[taskId] !== "undefined") {
        status = vm.clientTasks[taskId].status;
      }

      var db = firebase.firestore();
      var taskRoute = db
        .collection("clients")
        .doc(clientId)
        .update({
          ["clientTasks." + taskId + ".cleaningTaskText"]: cleaningTaskText,
          ["clientTasks." + taskId + ".status"]: !status
        });
    }
  }
}; //end export default
</script>