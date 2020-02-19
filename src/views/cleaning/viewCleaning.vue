<template>
  <div>
    <h1>Tīrīšana</h1>

    <!-- general data -->
    <v-layout row wrap>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title>
            <h3>Klients: {{cleaningData.clientName}}</h3>
          </v-card-title>
          <v-card-text>
            <li style="list-style-type: none;">Adrese: {{cleaningData.clientAddress}}</li>
            <li style="list-style-type: none;">Datums: {{cleaningData.dateFormatted}}</li>
            <li style="list-style-type: none;">Atbildīgais: {{cleaningData.responsibleName}}</li>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>

    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <br />
    <v-layout wrap row v-if="!progressBar">
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title>
            <h3>Uzdevumi</h3>
          </v-card-title>
          <v-list>
            <v-list-group v-for="(taskObject, index) in sortedTasks" :key="index" no-action>
              <template v-slot:activator>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      <v-icon>{{taskStatus(taskObject.key)}}</v-icon>
                      {{taskObject.value.text}}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>

              <!-- task -->
              <h3 style="padding-left:20px">{{taskObject.value.text}}</h3>

              <!-- before -->
              <span @click="startQuickPhoto(taskObject.key, 'photoBefore')">
                <quick-photo
                  :cleaningId="cleaningId"
                  :taskId="taskObject.key"
                  :beforeOrAfter="'photoBefore'"
                  :currentUser="currentUser"
                  :currPhotoUrl="taskObject.value['photoBefore']"
                  :taskTitle="taskObject.value.text"
                ></quick-photo>
              </span>

              <!-- after -->
              <span @click="startQuickPhoto(taskObject.key, 'photoAfter')">
                <quick-photo
                  :cleaningId="cleaningId"
                  :taskId="taskObject.key"
                  :beforeOrAfter="'photoAfter'"
                  :currentUser="currentUser"
                  :currPhotoUrl="taskObject.value['photoAfter']"
                  :taskTitle="taskObject.value.text"
                ></quick-photo>
              </span>
            </v-list-group>
          </v-list>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" small text outlined @click="resetTasks()">
              <v-icon left>refresh</v-icon>Atjaunot uzdevumus
            </v-btn>
          </v-card-actions>
        </v-card>
        <br />
      </v-flex>
    </v-layout>

    <!-- comment -->
    <v-layout wrap row v-if="!progressBar">
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title>
            <h3>Komentāri</h3>
          </v-card-title>

          <v-card-text>
            <v-textarea
              v-model="cleaningData.comment"
              label="Pievienot komentāru"
              @change="updateComment()"
            ></v-textarea>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <!-- last update -->
    <v-layout wrap>
      <v-flex xs12>
        <br />
        <v-divider></v-divider>
        <small>
          <span
            style="font-style: italic"
            v-if="typeof cleaningData.updatedAt != 'undefined'"
          >Pēdējo reizi atjaunoja {{cleaningData.updatedByName}} {{formatDate(cleaningData.updatedAt.seconds)}}</span>
        </small>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

import BackBtn from '@/comp/BackBtn.vue';
import QuickPhoto from '@/comp/QuickPhoto.vue';

export default {
  data() {
    return {
      progressBar: true,
      cleaningId: this.$route.params.cleaningId,
      clientId: this.$route.params.clientId,
      cleaningData: {},
      clientData: {},
      cleaningTasks: {},
      currentUser: null,

      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  components: {
    BackBtn,
    QuickPhoto,
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();

    vm.currentUser = vm.currentUserData;

    //load cleaning data
    db.collection('cleanings')
      .doc(vm.cleaningId)
      .onSnapshot(function(doc) {
        vm.cleaningData = Object.assign({}, doc.data());
      });

    //initialize all necessary prommises
    var clientData = db
      .collection('clients')
      .doc(vm.clientId)
      .get();
    var cleaningTasksPromise = db.collection('cleaningTasks').get();

    //wait for all data to load and only then work with it
    Promise.all([clientData, cleaningTasksPromise]).then(function(values) {
      //clientData
      vm.clientData = Object.assign({}, values[0].data());

      //cleaning tasks
      const cleaningTasksSnapshot = values[1];
      var cleaningTasksL = {};
      cleaningTasksSnapshot.forEach(function(doc) {
        cleaningTasksL[doc.id] = doc.data();
      });
      vm.cleaningTasks = Object.assign({}, cleaningTasksL);

      //if doesn't have tasks added yet, then add a.k.a opening view first time
      if (typeof vm.cleaningData.tasks == 'undefined') {
        vm.addCleaningTasks(vm.clientData, vm.cleaningTasks);
      } else {
        //don't add tasks
        //data is loaded
        vm.progressBar = false;
      }
    });
  },
  computed: {
    sortedTasks: function() {
      var vm = this;

      //sort tasks by text value
      if (typeof vm.cleaningData.tasks != 'undefined') {
        var arr = [];
        var prop;
        var obj = vm.cleaningData.tasks;
        for (prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            arr.push({
              key: prop,
              value: obj[prop],
            });
          }
        }

        arr.sort(function(a, b) {
          var x = a.value.text.toLowerCase();
          var y = b.value.text.toLowerCase();
          return x < y ? -1 : x > y ? 1 : 0;
        });
        return arr; // returns array
      } else {
        return {};
      }
    },
  },
  methods: {
    resetTasks() {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm(
        'Visa saglabātā uzdevumu informācija tiks izdzēsta! Tiešām vēlies atjaunot uzdevumus?'
      );
      if (conf) {
        try {
          //reset tasks
          vm.addCleaningTasks(vm.clientData, vm.cleaningTasks);
          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Uzdevumi atjaunoti!';
          vm.snackbar = true;
        } catch (error) {
          console.log(error);
        }
      }
    },
    taskStatus(taskId) {
      var vm = this;
      const taskData = vm.cleaningData.tasks[taskId];
      var icon = 'check_box_outline_blank';
      if (taskData.photoBefore != '' && taskData.photoAfter != '') {
        icon = 'check_box';
      }
      return icon;
    },
    updateComment() {
      var vm = this;
      var db = firebase.firestore();

      db.collection('cleanings')
        .doc(vm.cleaningId)
        .update({
          comment: vm.cleaningData.comment,
        })
        .then(() => {
          //save update info
          vm.updatedBy();
        });

      //enable snackbar
      vm.snackbarColor = 'success';
      vm.snackbarTxt = 'Komentārs saglabāts!';
      vm.snackbar = true;
    },
    updatedBy() {
      var vm = this;
      var db = firebase.firestore();

      //save update info
      db.collection('cleanings')
        .doc(vm.cleaningId)
        .update({
          updatedAt: new Date(),
          updatedById: vm.currentUser.userId,
          updatedByName: vm.currentUser.displayName,
        });
    },
    startQuickPhoto(taskId, beforeOrAfter) {
      var vm = this;
      vm.photoDialogTaskId = taskId;
      vm.photoDialogBeforeOrAfter = beforeOrAfter;
    },
    addCleaningTasks(clientData, cleaningTasks) {
      var vm = this;
      var db = firebase.firestore();

      //loop selected client tasks and add info
      var selectedTasks = {};
      const clientTasks = clientData.clientTasks;
      for (var task in clientTasks) {
        const taskStatus = clientTasks[task].status;
        //add if status true
        if (taskStatus) {
          selectedTasks[task] = {
            text: cleaningTasks[task].cleaningTaskText,
            photoBefore: '',
            photoAfter: '',
            status: false,
          };
        }
      }

      //save in local and in db
      vm.cleaningData['tasks'] = selectedTasks;
      db.collection('cleanings')
        .doc(vm.cleaningId)
        .update({
          tasks: selectedTasks,
        })
        .then(() => {
          //save update info
          vm.updatedBy();
        });

      //data is loaded
      vm.progressBar = false;
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

      if (min < 10) {
        min = '0' + min;
      }

      return day + '.' + month + '.' + year + ' ' + hour + ':' + min;
    },
  },
};
</script>

