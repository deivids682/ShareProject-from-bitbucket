<template>
  <v-container>
    <!-- test btn -->
    <!-- <v-layout row wrap>
      <v-btn @click="testFn()">test</v-btn>
    </v-layout>-->
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

    <!-- Pipeline from draw.io -->
    <v-layout row>
      <v-flex xs12>
        <pipeline></pipeline>
        <br />
        <br />
        <v-divider></v-divider>
      </v-flex>
    </v-layout>
    <!--DIALOG TO ADD NEW/EDIT ENTRY -->
    <v-layout row>
      <v-dialog v-model="dialog" width="500" class="text-xs-center">
        <!--dialog btn -->
        <template v-slot:activator="{ on }">
          <v-btn dark color="primary" v-on="on" @click="resetForNewEntry()">New</v-btn>
        </template>

        <!--dialog form -->
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Sistēmas labojumi</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-text-field
                v-model="featureTitle"
                label="Feature"
                :rules="[() => !!featureTitle || 'Nepieciešams norādīt']"
              ></v-text-field>

              <v-select
                :items="statuses"
                v-model="updateStatus"
                label="Status"
                :rules="[() => !!updateStatus || 'Nepieciešams norādīt']"
              ></v-select>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn color="error" text @click="deleteEntry(editEntryId)" v-if="wantToEditEntry">
              <v-icon small>delete_forever</v-icon>
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="dialog = false">Aizvērt</v-btn>
            <v-btn color="primary" text @click="saveEntry(wantToEditEntry)">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
    <!-- LIST ENTRIES  -->
    <v-layout row wrap justify-center>
      <v-flex v-for="status in statuses" :key="status" lg3 md6 xs12>
        <br />
        <p class="status-title">
          <span :class="status.replace(' ','-')">{{status}}</span>
        </p>

        <!-- list entries for that status -->
        <v-list-item
          v-for="(entry, entryId) in groupedStatuses[status]"
          :key="entryId"
          class="status-tile"
        >
          <v-list-item-content @click="editEntry(entryId)">
            <p class="status-txt">
              {{entry.featureTitle}}
              <span v-if="entry.updateStatus == 'completed'">
                <br />
                {{formatDate(entry.createdAt.seconds)}}
              </span>
              <span v-if="entry.updateStatus != 'completed'">
                <br />
                <span :class="entry.updateStatus.replace(' ','-')">{{entry.updateStatus}}</span>
              </span>
            </p>
          </v-list-item-content>
        </v-list-item>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import pipeline from '@/comp/SystemPipeline.vue';

export default {
  components: {
    pipeline,
  },
  data() {
    return {
      progressBar: true,
      //dialog
      valid: true,
      dialog: false,
      //task data
      featureTitle: null,
      updateStatus: null,

      //form
      form: {
        featureTitle: null,
        updateStatus: null,
      },
      statuses: ['no status', 'next up', 'in progress', 'completed'],
      //entries
      allEntries: {},
      wantToEditEntry: false,
      editEntryId: null,
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  }, //end data
  created() {
    var vm = this;

    //get list of tasks
    var db = firebase.firestore();

    db.collection('systemFeatures')
      .orderBy('createdAt', 'desc')
      .onSnapshot(function(querySnapshot) {
        var entriesL = {};
        querySnapshot.forEach(function(doc) {
          entriesL[doc.id] = doc.data();
        });
        vm.allEntries = Object.assign({}, entriesL);
        vm.progressBar = false;
      });
  },
  computed: {
    groupedStatuses: function() {
      var vm = this;
      var groupedStatusesL = {};

      for (var s = 0; s < vm.statuses.length; s++) {
        groupedStatusesL[vm.statuses[s]] = {};
      }

      //   loop entries
      const entries = Object.keys(vm.allEntries);

      for (var e = 0; e < entries.length; e++) {
        const entryStatus = vm.allEntries[entries[e]].updateStatus;
        groupedStatusesL[entryStatus][entries[e]] = vm.allEntries[entries[e]];
      }

      return groupedStatusesL;
    },
  },
  methods: {
    testFn() {
      var vm = this;
      var db = firebase.firestore();
      console.log('copy all tasks from clients to task-archive');

      //get clients
      db.collection('clients')
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            const clientId = doc.id;
            const clientName = doc.data().clientName;
            console.log('clientId ', clientId);

            //get tasks
            db.collection('clients')
              .doc(clientId)
              .collection('lifePlanTasks')
              .get()
              .then(snapshot => {
                snapshot.forEach(doc => {
                  const taskId = doc.id;
                  const newTaskId = clientId + '-' + taskId;
                  var data = doc.data();
                  data['clientId'] = clientId;
                  data['clientName'] = clientName;

                  //write in db
                  db.collection('taskArchive')
                    .doc(newTaskId)
                    .set(data);
                });
              });
          });
        });
    },
    formatDate(sec) {
      var date = new Date(sec * 1000);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hour = date.getHours();
      var min = date.getMinutes();

      if (min < 10) {
        min = '0' + min;
      }

      return day + '.' + month + '.' + year + ' ' + hour + ':' + min;
    },
    deleteEntry(entryId) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst uzdevumu?');
      if (conf) {
        try {
          vm.progressBar = true;
          var db = firebase.firestore();

          //delete task
          db.collection('systemFeatures')
            .doc(entryId)
            .delete()
            .then(function() {
              //enable snackbar
              vm.snackbarColor = 'error';
              vm.snackbarTxt = 'Uzdevums veiksmīgi izdzēsts!';
              vm.snackbar = true;
            });

          //reset form
          vm.$refs.form.reset();
          vm.dialog = false;
        } catch (error) {
          console.log(error);
        }
      }
    },
    resetForNewEntry() {
      var vm = this;
      //reset form
      vm.$refs.form.reset();
      vm.editEntryId = null;
      vm.wantToEditEntry = false;
    },
    editEntry(entryId) {
      var vm = this;
      //get task data from FB
      var db = firebase.firestore();
      db.collection('systemFeatures')
        .doc(entryId)
        .get()
        .then(function(doc) {
          var data = doc.data();
          vm.featureTitle = data.featureTitle;
          vm.updateStatus = data.updateStatus;

          vm.editEntryId = entryId;
          vm.dialog = true;
          vm.wantToEditEntry = true;
        });
    },
    saveEntry(wantToEditEntry) {
      if (this.$refs.form.validate()) {
        var vm = this;
        //if new entry
        if (!wantToEditEntry) {
          try {
            vm.progressBar = true;
            vm.dialog = false;

            //save to firebase
            var db = firebase.firestore();

            //get how many tasks alreadi in the group
            // add entry
            db.collection('systemFeatures')
              .add({
                featureTitle: vm.featureTitle,
                updateStatus: vm.updateStatus,
                createdAt: new Date(),
                createdBy: vm.currentUserData.userId,
              })
              .then(function(doc) {
                //close progress bar
                vm.progressBar = false;
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Uzdevums veiksmīgi pievienots!';
                vm.snackbar = true;
              });
          } catch (error) {
            console.log(error);
          }
        } else {
          // if edited entry
          try {
            vm.progressBar = true;
            vm.dialog = false;
            var db = firebase.firestore();

            // update task
            db.collection('systemFeatures')
              .doc(vm.editEntryId)
              .update({
                featureTitle: vm.featureTitle,
                updateStatus: vm.updateStatus,
                createdAt: new Date(),
                createdBy: vm.currentUserData.userId,
              })
              .then(function(doc) {
                //close progress bar
                vm.progressBar = false;
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Uzdevums veiksmīgi labots!';
                vm.snackbar = true;
              });
          } catch (error) {
            console.log(error);
          }
        }
      }
    },
  }, //end methods
};
</script>

<style>
.status-title {
  color: grey;
  font-size: 12px;
}
.status-tile {
  color: grey;
  border: 1px grey solid;
  border-radius: 5px;
  margin: 5px;
  padding-top: 10px;
  padding-bottom: 15px;
}
.status-txt {
  font-size: 12px;
  padding: 0px;
  margin: 0px;
  margin-bottom: 3px;
}
.no-status {
  background-color: #cfd8dc;
  padding: 1px 5px 1px 5px;
  border-radius: 6px;
}
.in-progress {
  background-color: pink;
  padding: 1px 5px 1px 5px;
  border-radius: 6px;
}
.next-up {
  background-color: #e6ee9c;
  padding: 1px 5px 1px 5px;
  border-radius: 6px;
}
.completed {
  background-color: #a5d6a7;
  padding: 1px 5px 1px 5px;
  border-radius: 6px;
}
</style>