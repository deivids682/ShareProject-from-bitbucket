<template>
  <div>
    <v-container>
      <v-flex></v-flex>
      <v-flex>
        <v-container class="elevation-1">
          <h1>Tīrīšanas forma</h1>
          <!--Progress bar -->
          <v-layout row wrap>
            <v-flex xs12 v-if="!dataLoaded">
              <v-progress-linear :indeterminate="true"></v-progress-linear>
            </v-flex>
          </v-layout>
          <!-- if no tasks -->
          <v-layout justify-center v-if="Object.keys(tasks).length ==0 && dataLoaded">
            <i>
              Vispirms jāatzīmē veicamie tīrīšanas uzdevumi
              <router-link :to="{ name: 'cleaningtasksclient', params: { clid: clientId}}">
                <a>šeit</a>
              </router-link>
            </i>
          </v-layout>
          <!-- tasks -->
          <v-layout v-for="(task,key) in tasks" :key="key" row v-if="dataLoaded">
            <v-flex v-if="typeof clientTasks.tasks[key] != 'undefined'">
              <h3>{{tasks[key].cleaningTaskText}}</h3>
              <v-btn icon ripple @click="performTask(key, clientTasks.tasks[key].status)">
                <v-icon v-if="clientTasks.tasks[key].status == false">check_box_outline_blank</v-icon>
                <v-icon v-if="clientTasks.tasks[key].status == true">check_box</v-icon>
              </v-btn>
              <div v-if="clientTasks.tasks[key].status == true">
                <div :id="'photoInput'+key" v-if="clientTasks.tasks[key].photoUrl == ''">
                  <p>Pievienot foto:</p>
                  <input type="file" value="upload" :id="'file'+key" />
                  <v-btn small text @click="saveFile(key)" color="primary">Augšuplādēt</v-btn>
                  <v-progress-linear v-model="progressBarValue" :id="'progres'+key" hidden></v-progress-linear>
                </div>
                <div :id="'photoOutput'+key" v-if="clientTasks.tasks[key].photoUrl != '' ">
                  <v-img
                    :src="clientTasks.tasks[key].photoUrl"
                    -src="https://via.placeholder.com/150"
                    max-height="150px"
                    id="kitchenRoomPhoto"
                    contain
                    position="center left"
                  ></v-img>
                  <v-btn
                    id="deleteImageBtn"
                    text
                    small
                    color="red lighten-2"
                    @click="deletePhoto(key)"
                  >
                    <v-icon dark left>clear</v-icon>Dzēst
                  </v-btn>
                </div>
              </div>
              <br />
              <br />
              <v-divider></v-divider>
            </v-flex>
          </v-layout>
          <!-- comment -->
          <v-layout row wrap v-if="Object.keys(tasks).length !=0">
            <v-text-field v-model="comment" label="Komentāri" clearable box></v-text-field>
          </v-layout>
          <v-btn
            text
            small
            @click="saveComment()"
            v-if="Object.keys(tasks).length !=0"
          >Saglabāt komentāru</v-btn>
        </v-container>
      </v-flex>
      <v-flex></v-flex>
    </v-container>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

export default {
  data() {
    return {
      tasks: {},
      clientTasks: {},
      comment: '',
      clientId: this.$route.params.clid,
      cleaningId: '',
      dataLoaded: false,

      progressBarValue: 0,
    };
  },
  created() {
    var vm = this;
    var clientId = this.$route.params.clid;
    var cleaningId = this.$route.params.cleaningId;
    var db = firebase.firestore();

    //get selected tasks for this client
    db.collection('clients')
      .doc(clientId)
      .get()
      .then(function(doc) {
        var selectedTasks = doc.data().clientTasks;

        // add new record for this cleaning task in db
        var tasksDb = {};

        var taskIds = Object.keys(selectedTasks);
        for (var t = 0; t < taskIds.length; t++) {
          var taskId = taskIds[t];
          //add only those which are selected true
          if (selectedTasks[taskId].status == true) {
            tasksDb[taskId] = {
              cleaningTaskText: selectedTasks[taskId].cleaningTaskText,
              status: false,
              photoUrl: '',
            };
          }
        }

        var cleaningDocRef = db
          .collection('clients')
          .doc(clientId)
          .collection('cleanings');

        //if new cleaning, add new record, else get old record
        if (cleaningId == '') {
          //assign selected tasks
          vm.tasks = Object.assign({}, tasksDb);

          cleaningDocRef
            .add({
              tasks: tasksDb,
              createdAt: new Date(),
              createdBy: vm.currentUserData.userId,
            })
            .then(function(docRef) {
              vm.cleaningId = docRef.id;

              cleaningDocRef.doc(docRef.id).onSnapshot(function(doc) {
                vm.clientTasks = Object.assign({}, doc.data());
                vm.dataLoaded = true;
              });
            });
          //end if new cleaning
        } else {
          cleaningDocRef.doc(cleaningId).onSnapshot(function(doc) {
            vm.clientTasks = Object.assign({}, doc.data());
            vm.tasks = Object.assign({}, doc.data().tasks);
            vm.cleaningId = cleaningId;
            vm.comment = vm.clientTasks.comment;
            vm.dataLoaded = true;
          });
        }
      });
  }, //end mounted
  methods: {
    performTask(taskId, currentTaskStatus) {
      var vm = this;
      var db = firebase.firestore();
      var clientId = this.$route.params.clid;

      var taskRef = db
        .collection('clients')
        .doc(clientId)
        .collection('cleanings')
        .doc(vm.cleaningId);

      taskRef.update({
        ['tasks.' + taskId + '.status']: !currentTaskStatus,
      });
    },
    saveComment() {
      var vm = this;
      var db = firebase.firestore();
      var clientId = this.$route.params.clid;

      var taskRef = db
        .collection('clients')
        .doc(clientId)
        .collection('cleanings')
        .doc(vm.cleaningId);

      taskRef.update({
        comment: vm.comment,
      });
    },
    deletePhoto(taskId) {
      //get references
      var clientId = this.$route.params.clid;

      var vm = this;
      var db = firebase.firestore();

      //define ref to store url in firebase
      var taskRef = db
        .collection('clients')
        .doc(clientId)
        .collection('cleanings')
        .doc(vm.cleaningId);

      taskRef.update({
        ['tasks.' + taskId + '.photoUrl']: '',
      });
    },
    saveFile(taskId) {
      try {
        //get references
        var clientId = this.$route.params.clid;
        var vm = this;
        var db = firebase.firestore();
        var cleaningId = vm.cleaningId;
        var key = taskId;

        //calculate ids
        var inputId = 'file' + key;
        var progrId = 'progres' + key;

        //unhide progress bar
        var progrBar = document.getElementById(progrId);
        progrBar.hidden = false;

        //get file
        var fileButton = document.getElementById(inputId);
        var file = fileButton.files[0];
        var filePath =
          clientId +
          '/cleanings/' +
          cleaningId +
          '/tasks.' +
          key +
          '.photoUrl/' +
          file.name;

        var storageRef = firebase.storage().ref(filePath);

        var uploadTask = storageRef.put(file);

        //define ref to store url in firebase
        var taskRef = db
          .collection('clients')
          .doc(clientId)
          .collection('cleanings')
          .doc(vm.cleaningId);

        uploadTask.on(
          'state_changed',

          function progress(snapshot) {
            var progr = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            vm.progressBarValue = progr;
          },

          function error(err) {
            console.log(err);
          },

          function complete(snapshot) {
            //hide input div
            progrBar.hidden = true;

            var storage = firebase.storage().ref();
            var url = storage
              .child(filePath)
              .getDownloadURL()
              .then(function(url) {
                //store url in clients file
                taskRef.update({
                  ['tasks.' + taskId + '.photoUrl']: url,
                });
              });
          }
        );
      } catch (error) {
        console.log(error);
      }
    }, //end save file
  }, //end methods
};
</script>