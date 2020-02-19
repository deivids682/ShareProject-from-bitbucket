<template>
  <v-container>
    <h1>Dienas uzdevumi</h1>

    <!-- no coordinates error -->
    <v-layout wrap v-if="!progressBar">
      <v-flex xs12 v-if="noCoordinateClients.length > 0">
        <v-alert :value="true" type="error">
          Trūkst adrešu koordinātes:
          <ul>
            <li v-for="(clientId, index) in noCoordinateClients" :key="index">
              <v-icon
                color="error"
                v-if="clients[clientId].hasRecentHealthProblems != null && clients[clientId].hasRecentHealthProblems"
              >warning</v-icon>
              {{clients[clientId].clientName}}
            </li>
          </ul>
        </v-alert>
      </v-flex>
    </v-layout>
    <!-- date and day -->
    <v-layout narrow>
      <v-flex xs12>
        {{formatDate}} - {{dayTxt}}
        <br />
        <span v-if="!progressBar">
          <label>Aizvērtie uzdevumi</label>
          <v-btn class="narrow-btn" icon @click="toggleClosed()">
            <v-icon color="accent" v-if="!showAlsoCompletedTasks">toggle_off</v-icon>
            <v-icon color="success" v-if="showAlsoCompletedTasks">toggle_on</v-icon>
          </v-btn>
        </span>
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
    <v-layout wrap v-if="!progressBar" class="mb-5">
      <v-flex xs12 sm6 offset-sm3>
        <v-text-field
          v-model="searchValue"
          append-icon="search"
          label="Meklēt"
          single-line
          hide-details
          clearable
        ></v-text-field>
      </v-flex>
    </v-layout>

    <!-- my cleanings -->
    <list-my-cleanings :currentUser="currentUser" :today="today" :tomorrow="tomorrow"></list-my-cleanings>

    <!-- dont have tasks -->
    <template v-if="!haveTasks && !progressBar">
      <v-layout row>
        <v-flex xs12 sm6 offset-sm3>
          <v-card>
            <v-list>
              <v-list-item>
                <v-list-item-title>Nav uzdevumu</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-flex>
      </v-layout>
    </template>

    <!-- myTasks -->
    <template v-if="haveTasks && !progressBar">
      <v-layout row>
        <v-flex xs12 sm6 offset-sm3>
          <!-- visit dialog -->
          <v-layout row justify-center v-if="nbhTasks">
            <v-btn large color="accent" dark @click.stop="openVisitDialog()" v-if="!visitOn">
              <v-icon left>play_arrow</v-icon>Sākt vizīti
            </v-btn>
            <v-btn large color="error" @click.stop="endVisit()" v-else>
              <v-icon left>stop</v-icon>
              Beigt vizīti {{visitTime}}
            </v-btn>

            <v-dialog v-model="visitDialog" persistent max-width="400">
              <v-card>
                <v-card-title class="headline">Klienti apkārtnē</v-card-title>
                <v-card-text>
                  <v-radio-group v-model="visitClientId">
                    <v-radio
                      v-for="(client, clientId) in clientsInRange"
                      :key="clientId"
                      :label="client.clientName"
                      :value="clientId"
                    ></v-radio>
                  </v-radio-group>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="error" text outlined @click="cancelVisitDialog()">Atcelt</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn v-if="visitClientId != null" color="success" @click="startVisit()">
                    <v-icon left>play_arrow</v-icon>Sākt
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-layout>

          <!-- list shifts -->
          <template v-for="(shift,shiftId) in shiftsToTxt">
            <v-card :key="shiftId" v-if="clientsByShifts[shiftId].length > 0">
              <!-- shift toolbar -->
              <v-toolbar color="primary" dark id="width">
                <v-toolbar-title>{{shift}}</v-toolbar-title>
                <v-spacer></v-spacer>
                <span v-if="multipleCheckout">
                  <span v-if="dirOrIdir == 'Tiešs'">
                    <v-btn class="narrow-btn" icon @click="updateStatus('assisted')">
                      <v-icon>people</v-icon>
                    </v-btn>
                    <v-btn class="narrow-btn" icon @click="updateStatus('supervised')">
                      <v-icon>visibility</v-icon>
                    </v-btn>
                    <v-btn class="narrow-btn" icon @click="updateStatus('independent')">
                      <v-icon>person</v-icon>
                    </v-btn>
                  </span>
                  <span v-if="dirOrIdir == 'Netiešs'">
                    <v-btn class="narrow-btn" icon @click="updateStatus('doneIdr')">
                      <v-icon>check_circle_outline</v-icon>
                    </v-btn>
                  </span>
                </span>
                <v-btn icon @click="multipleCheckout = !multipleCheckout">
                  <v-icon v-if="multipleCheckout">check_box</v-icon>
                  <v-icon v-if="!multipleCheckout">check_box_outline_blank</v-icon>
                </v-btn>
              </v-toolbar>
              <v-toolbar
                v-if="multipleCheckout"
                color="accent"
                dark
                v-bind:style="`position: fixed; z-index: 12; bottom: 0; margin-bottom: 36px; width:${widthCalculation}px`"
              >
                <v-spacer></v-spacer>
                <span>
                  <span v-if="dirOrIdir == 'Tiešs'">
                    <v-btn class="narrow-btn" icon @click="updateStatus('assisted')">
                      <v-icon>people</v-icon>
                    </v-btn>
                    <v-btn class="narrow-btn" icon @click="updateStatus('supervised')">
                      <v-icon>visibility</v-icon>
                    </v-btn>
                    <v-btn class="narrow-btn" icon @click="updateStatus('independent')">
                      <v-icon>person</v-icon>
                    </v-btn>
                  </span>
                  <span v-if="dirOrIdir == 'Netiešs'">
                    <v-btn class="narrow-btn" icon @click="updateStatus('doneIdr')">
                      <v-icon>check_circle_outline</v-icon>
                    </v-btn>
                  </span>
                </span>
              </v-toolbar>

              <v-list subheader v-for="(client, clientId) in filteredItems" :key="clientId">
                <!-- list each client -->

                <!-- case why we use style, because main nav also sticky -> https://codepen.io/gotson/pen/EqeXoB?editors=1000 -->
                <template v-if="showClient(clientId, shiftId)">
                  <v-subheader class="client-title">
                    {{client}}
                    <v-spacer></v-spacer>
                    <!-- buttons for incident, health, money -->
                    <!-- <span>
                      <v-btn
                        class="narrow-btn"
                        icon
                        @click="newBodyVitals(clientId, client, 'new')"
                      >
                        <v-icon color="grey darken-1">local_hospital</v-icon>
                      </v-btn>
                      <v-btn class="narrow-btn" icon @click="newIncident(clientId, client, 'new')">
                        <v-icon color="grey darken-1">error</v-icon>
                      </v-btn>
                      <v-btn class="narrow-btn" icon @click>
                    <v-icon color="grey darken-1">monetization_on</v-icon>
                      </v-btn>
                    </span>-->
                  </v-subheader>

                  <!-- list tasks for this client in this shift -->
                  <template v-for="(task, taskId) in myTasks">
                    <template v-if="showAlsoCompletedTasks || task.status == 'open'">
                      <v-list-item
                        v-if="task.lpTaskShiftNumber == shiftId && task.clientId == clientId"
                        :key="taskId"
                      >
                        <v-list-item-content
                          @click.stop="goToTask(taskId)"
                          v-bind:class="chechoutTasks(clientId, taskId)"
                        >
                          <v-list-item-subtitle>
                            <!-- closed task icons -->
                            <span v-if="task.status == 'assisted'">
                              <v-icon small>people</v-icon>
                            </span>
                            <span v-if="task.status == 'supervised'">
                              <v-icon small>visibility</v-icon>
                            </span>
                            <span v-if="task.status == 'independent'">
                              <v-icon small>person</v-icon>
                            </span>
                            <span v-if="task.status == 'canceled'">
                              <v-icon small>cancel</v-icon>
                            </span>
                            <span v-if="task.status == 'postponed'">
                              <v-icon small>fast_forward</v-icon>
                            </span>
                            <span v-if="task.status == 'doneIdr'">
                              <v-icon small>check_circle_outline</v-icon>
                            </span>
                            <!-- task number -->
                            <span
                              :class="'task-group-'+task.lpTaskNumber.toString().slice(0,1)"
                            >{{task.lpTaskNumber}}</span>
                            <!-- task name -->
                            {{task.lpTaskName}}
                            <!-- postponed -->
                            <span v-if="typeof task.postponed != 'undefined'">
                              (
                              <v-icon>fast_forward</v-icon>)
                            </span>
                          </v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action
                          v-if="multipleCheckout && inactiveRow(taskId) != 'inactiveRow'"
                        >
                          <v-btn
                            class="narrow-btn"
                            icon
                            @click="updateSelectedTasks(clientId,taskId)"
                            v-if="!task.lpTaskSocial"
                          >
                            <v-icon
                              color="blue lighten-2"
                              v-if="selectedTask(clientId,taskId) == true && !task.lpTaskSocial"
                            >check_box</v-icon>
                            <v-icon
                              color="blue lighten-2"
                              v-if="selectedTask(clientId,taskId) == false && !task.lpTaskSocial"
                            >check_box_outline_blank</v-icon>
                          </v-btn>
                        </v-list-item-action>
                      </v-list-item>
                      <!-- end if show also closed -->
                    </template>
                    <!-- end list tasks for this client in this shift -->
                  </template>
                  <!-- end if client life plan on pause -->
                </template>
              </v-list>

              <!-- reset todays tasks -->
              <v-card-actions v-if="admin && environment == 'TESTING' && path != '/'">
                <v-spacer></v-spacer>
                <v-btn color="error" outlined @click="resetTodaysTasks()">
                  <v-icon left>refresh</v-icon>Reset today's tasks
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-flex>
      </v-layout>

      <!-- one task dialog -->
      <one-task-dialog
        v-if="showOneTaskDialog"
        :taskData="oneTaskDataForDialog"
        :users="users"
        :currentUserId="currentUser"
        :equipment="equipment"
        :taskId="oneTaskId"
        :dirOrIdir="myTasks[oneTaskId].lpTaskDirect"
        @close="closeOneTaskDialog"
      ></one-task-dialog>
    </template>
  </v-container>
</template>
  
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/performance';

//detect browser
import Bowser from 'bowser';

import BackBtn from '@/comp/BackBtn.vue';
import ListMyCleanings from '@/comp/ListMyCleanings.vue';
import OneTaskDialog from '@/comp/MyTasksOneTaskDialog.vue';

import { env } from '@/helpers/firebaseConfig.js';

export default {
  props: ['service'],
  data() {
    return {
      progressBar: true,
      nbhTasks: false,
      path: this.$route.path,
      environment: null,
      currentUser: null,
      today: null,
      tomorrow: null,
      showAlsoCompletedTasks: false,
      formatDate: null,
      dayTxt: null,
      myTasks: {},
      clientsByShifts: {},
      clientNames: {},
      clients: {},
      noCoordinateClients: [],
      haveTasks: false,
      numberOfShifts: 3,
      shiftsToTxt: { 0: 'Rīts', 1: 'Pusdiena', 2: 'Vakars' },
      searchValue: null,
      //one task dialog
      oneTaskDataForDialog: {},
      oneTaskId: null,
      oneRawTaskId: null,
      showOneTaskDialog: false,
      users: {},
      equipment: {},

      //visit dialog
      visitDialog: false,
      visitUserPosition: null,

      //task checkout
      multipleCheckout: false,
      multipleSelectedTasks: [],
      daysToTxt: {
        0: 'Svētdiena',
        1: 'Pirmdiena',
        2: 'Otrdiena',
        3: 'Trešdiena',
        4: 'Ceturdiena',
        5: 'Piektdiena',
        6: 'Sestdiena',
      },
      //time visits
      visitOn: false,
      visitClientId: null,
      visitStartAt: null,
      visitLocation: null,
      visitTime: null,

      //visit time
      seconds: 0,
      minutes: 0,
      hours: 0,
      timer: null,

      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  components: {
    BackBtn,
    ListMyCleanings,
    OneTaskDialog,
  },
  async created() {
    //custom performance
    var vm = this;
    const perf = firebase.performance();
    var db = firebase.firestore();
    const path = vm.path;
    if (env == 'testing') {
      vm.environment = 'TESTING';
    }
    vm.currentUser = vm.currentUserData.userId;
    vm.users[vm.currentUser] = vm.currentUserData;

    const loadTaskListTrace = perf.trace('loadTaskListTrace');
    loadTaskListTrace.start();

    //generate clients by shifts obj
    var clientsByShiftsL = {};
    for (var sh = 0; sh < vm.numberOfShifts; sh++) {
      clientsByShiftsL[sh] = [];
    }
    vm.clientsByShifts = Object.assign({}, clientsByShiftsL);

    var today = new Date();
    //var today = new Date(2019, 7, 29);
    today.setHours(0, 0, 0);
    vm.today = today;
    var tomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );
    vm.tomorrow = tomorrow;

    //show date
    const date = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    vm.formatDate = date + '.' + month + '.' + year + '.';
    vm.dayTxt = vm.daysToTxt[today.getDay()];

    //get tasks live (my tasks or all tasks)
    vm.getTasks();

    //load other data
    var promises = [];

    //get user visit session data
    var visitSessionPromise = db
      .collection('visits')
      .doc('userVisitSessions')
      .get();
    promises.push(visitSessionPromise);

    //get client information
    var clientPromise = db.collection('clients').get();
    promises.push(clientPromise);

    var values = await Promise.all(promises);

    //visit session
    var userSessions = values[0].data();
    if (typeof userSessions[vm.currentUser] != 'undefined') {
      if (
        userSessions[vm.currentUser].visitOn &&
        userSessions[vm.currentUser].visitClientId != null
      ) {
        vm.visitOn = userSessions[vm.currentUser].visitOn;
        vm.visitClientId = userSessions[vm.currentUser].visitClientId;
        vm.visitStartAt = userSessions[vm.currentUser].visitStartAt;
        vm.visitLocation = userSessions[vm.currentUser].visitLocation;
      }
    }

    //see if continue timer
    if (vm.visitOn) {
      //http://sstut.com/javascript/convert-hours-minutes-seconds-to-milliseconds.php
      var secondsPassed = Date.now() / 1000 - vm.visitStartAt.seconds;
      vm.hours = parseInt(secondsPassed / 3600);
      secondsPassed = secondsPassed % 3600; // seconds remaining after extracting hours
      vm.minutes = parseInt(secondsPassed / 60);
      vm.seconds = Math.round(secondsPassed % 60);
      vm.startTimer();
    }

    //clients
    var clientsL = vm.clients;
    values[1].forEach(function(doc) {
      clientsL[doc.id] = doc.data();
      if (
        doc.data().clientServices == 'neighborhood' ||
        doc.data().clientServices == 'cleaning'
      ) {
        if (typeof doc.data().clientAddressCoordinates == 'undefined') {
          vm.noCoordinateClients.push(doc.id);
        }
      }
    });
    vm.clients = Object.assign({}, clientsL);

    //data loaded
    vm.progressBar = false;
    loadTaskListTrace.stop();
  },

  computed: {
    widthCalculation() {
      let width = document.getElementById('width').offsetWidth;
      return width;
    },

    filteredItems() {
      let clientNameArray = Object.entries(this.clientNames);
      let filtredClients = [];

      if (this.searchValue != null) {
        if (this.searchValue.length > 1) {
          filtredClients = clientNameArray.filter(client => {
            return client[1]
              .toLowerCase()
              .match(this.searchValue.toLowerCase());
          });
          let searchItem = {};
          filtredClients.forEach(([key, value]) => {
            searchItem[key] = value;
          });

          return searchItem;
        } else {
          return this.clientNames;
        }
      } else {
        return this.clientNames;
      }
    },

    clientsInRange: function() {
      var vm = this;
      //show clients active, neighborhood, and in range

      var clientsInRange = {};
      //if current position
      if (vm.visitUserPosition != null) {
        //loop clients
        for (var clientId in vm.clients) {
          const clientData = vm.clients[clientId];
          var addToClients = true;
          //if active
          if (clientData.clientStatus != 'active') {
            addToClients = false;
          }

          //if has neighborhood service
          if (clientData.clientServices != 'neighborhood') {
            addToClients = false;
          }

          //calculate distance
          if (typeof clientData.clientAddressCoordinates != 'undefined') {
            var distanceFromUser = vm.calculateDistance(
              clientData.clientAddressCoordinates.lat,
              clientData.clientAddressCoordinates.lng,
              vm.visitUserPosition.lat,
              vm.visitUserPosition.lng
            );
            if (distanceFromUser > 250) {
              addToClients = false;
            }
          } else {
            //no coordinates
            addToClients = false;
          }

          //add?
          if (addToClients) {
            clientsInRange[clientId] = vm.clients[clientId];
          }
        }
      } else {
        clientsInRange = {};
      }

      return clientsInRange;
    },
    dirOrIdir: function() {
      var vm = this;
      //decide on which to allow multiple select.
      if (vm.multipleSelectedTasks.length >= 1) {
        const fullId = vm.multipleSelectedTasks[0].taskId;
        return vm.myTasks[fullId].lpTaskDirect;
      } else {
        return 'not selected';
      }
    },
  },
  methods: {
    async resetTodaysTasks() {
      var vm = this;
      var conf = confirm(
        vm.currentUserData.displayName +
          ', tiešām vēlies nodzēst visus šodienas uzdevumus? Izmaiņas nebūs atgriežamas!'
      );
      if (conf) {
        vm.progressBar = true;
        var db = firebase.firestore();
        var batch = db.batch();
        var querySnapshot = await db
          .collection('taskArchive')
          .where('lpTaskDate', '>=', vm.today)
          .where('lpTaskDate', '<=', vm.tomorrow)
          .where('service', '==', vm.service)
          .get();

        querySnapshot.forEach(doc => {
          const taskId = doc.id;
          var data = doc.data();
          //reset data
          if (data.status != 'open') {
            data.status = 'open';
            data.photoUrl = '';
            data.comment = '';
            delete data.closedAt;
            delete data.closedBy;
            delete data.location;

            var taskRef = db.collection('taskArchive').doc(taskId);
            batch.set(taskRef, data);
          }
        });

        await batch.commit();
        vm.progressBar = false;
      }
    },
    toggleClosed() {
      var vm = this;
      vm.showAlsoCompletedTasks = !vm.showAlsoCompletedTasks;
      //update tasks
      vm.getTasks();
    },
    goToTask(taskId) {
      var vm = this;
      vm.oneTaskDataForDialog = vm.myTasks[taskId];
      vm.oneTaskId = taskId;
      vm.oneRawTaskId = vm.getRawTaskId(taskId);
      vm.showOneTaskDialog = true;
    },
    getRawTaskId(taskId) {
      //get direct or indirect task
      const sliceAt = taskId.lastIndexOf('-');
      return taskId.slice(sliceAt + 1);
    },
    closeOneTaskDialog(
      dialogUsers,
      equipmentInDialog,
      taskDataInDialog,
      taskId
    ) {
      var vm = this;
      vm.showOneTaskDialog = false;
      //update users
      if (vm.users != dialogUsers) {
        vm.users = Object.assign({}, dialogUsers);
      }
      //update equipment
      if (vm.equipment != equipmentInDialog) {
        vm.equipment = Object.assign({}, equipmentInDialog);
      }
      //save changes locally
      vm.myTasks[taskId] = taskDataInDialog;
    },
    getTasks() {
      //custom performance
      //measure get tasks load time
      const perf = firebase.performance();
      var vm = this;
      var db = firebase.firestore();
      var path = vm.path;
      vm.progressBar = true;
      var getResidences = false;

      const getTasksTrace = perf.trace('getTasksTrace');

      var myTasksL = {};
      var clientNamesL = {};
      if (path == '/') {
        getTasksTrace.start();
        getTasksTrace.putAttribute('path', 'myTasks');
        getTasksTrace.putAttribute(
          'showAlsoCompletedTasks',
          vm.showAlsoCompletedTasks.toString()
        );
        //only my tasks
        var colRef = db
          .collection('taskArchive')
          .where('lpTaskDate', '>=', vm.today)
          .where('lpTaskDate', '<=', vm.tomorrow)
          .where('responsible', '==', vm.currentUser)
          .where('status', '==', 'open');

        if (vm.showAlsoCompletedTasks) {
          colRef = db
            .collection('taskArchive')
            .where('lpTaskDate', '>=', vm.today)
            .where('lpTaskDate', '<=', vm.tomorrow)
            .where('responsible', '==', vm.currentUser);
        }

        colRef.get().then(async function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            const taskId = doc.id;

            const data = doc.data();
            myTasksL[taskId] = data;
            clientNamesL[data.clientId] = data.clientName;
            //add to clients by shifts
            if (
              vm.clientsByShifts[data.lpTaskShiftNumber].indexOf(
                data.clientId
              ) == -1
            ) {
              vm.clientsByShifts[data.lpTaskShiftNumber].push(data.clientId);
            }
            vm.haveTasks = true;

            //check if necessary visits btn
            if (data.service == 'neighborhood') {
              vm.nbhTasks = true;
            }
            //check if load residences
            if (data.lpTaskType == 'Mājas' && data.service == 'bfh') {
              getResidences = true;
            }
          });
          if (getResidences) {
            vm.progressBar = true;
            var clientsL = vm.clients;
            var resSnap = await db
              .collection('residences')
              .where('service', '==', 'bfh')
              .get();

            resSnap.forEach(doc => {
              clientsL[doc.id] = doc.data();
            });
            vm.clients = Object.assign({}, clientsL);
          }

          vm.myTasks = Object.assign({}, myTasksL);
          vm.clientNames = Object.assign({}, clientNamesL);
          vm.progressBar = false;
          getTasksTrace.stop();
        });
      } else {
        getTasksTrace.start();
        getTasksTrace.putAttribute('path', 'allTasks');
        getTasksTrace.putAttribute(
          'showAlsoCompletedTasks',
          vm.showAlsoCompletedTasks.toString()
        );
        //all tasks
        var colRef = db
          .collection('taskArchive')
          .where('lpTaskDate', '>=', vm.today)
          .where('lpTaskDate', '<=', vm.tomorrow)
          .where('service', '==', vm.service)
          .where('status', '==', 'open');
        if (vm.showAlsoCompletedTasks) {
          colRef = db
            .collection('taskArchive')
            .where('lpTaskDate', '>=', vm.today)
            .where('lpTaskDate', '<=', vm.tomorrow)
            .where('service', '==', vm.service);
        }

        colRef.get().then(async function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            const taskId = doc.id;
            const data = doc.data();
            myTasksL[taskId] = data;
            clientNamesL[data.clientId] = data.clientName;
            //add to clients by shifts
            if (
              vm.clientsByShifts[data.lpTaskShiftNumber].indexOf(
                data.clientId
              ) == -1
            ) {
              vm.clientsByShifts[data.lpTaskShiftNumber].push(data.clientId);
            }
            vm.haveTasks = true;

            //check if necessary visits btn
            if (data.service == 'neighborhood') {
              vm.nbhTasks = true;
            }
            //check if load residences
            if (vm.service == 'bfh' && data.lpTaskType == 'Mājas') {
              getResidences = true;
            }
          });

          if (getResidences) {
            vm.progressBar = true;
            var clientsL = vm.clients;
            var resSnap = await db
              .collection('residences')
              .where('service', '==', 'bfh')
              .get();

            resSnap.forEach(doc => {
              clientsL[doc.id] = doc.data();
            });
            vm.clients = Object.assign({}, clientsL);
          }

          vm.myTasks = Object.assign({}, myTasksL);
          vm.clientNames = Object.assign({}, clientNamesL);
          vm.progressBar = false;
          getTasksTrace.stop();
        });
      }
    },
    calculateDistance(lat1, lon1, lat2, lon2) {
      //https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
      // generally used geo measurement function
      var R = 6378.137; // Radius of earth in KM
      var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
      var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d * 1000; // meters
    },
    openVisitDialog() {
      var vm = this;
      //feedback that process is on
      vm.progressBar = true;
      //get geo location
      var location = navigator.geolocation.getCurrentPosition(
        function(position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          vm.visitUserPosition = { lat: lat, lng: lng };
          //process end
          vm.progressBar = false;
          vm.visitDialog = true;
        },
        function(error) {
          alert('Nevar noteikt koordinātes! Pārbaudīt GPS iestatījumus.');
          //process end
          vm.progressBar = false;
        }
      );
    },
    cancelVisitDialog() {
      var vm = this;
      //clear data
      vm.visitDialog = false;
      vm.visitClientId = null;
      vm.visitUserPosition = null;
    },
    showClient(clientId, shiftNr) {
      //if show client
      var vm = this;

      var showThisClient = true;

      //if doesnt have tasks in this shift
      if (vm.clientsByShifts[shiftNr].indexOf(clientId) == -1) {
        showThisClient = false;
      } else {
        //if life plan on pause or stopped
        if (typeof vm.clients[clientId] != 'undefined') {
          if (vm.clients[clientId].clientStatus != 'active') {
            showThisClient = false;
          }
        } else {
          showThisClient = false;
        }

        //if started visit to other client
        if (vm.visitClientId != null && vm.visitClientId != clientId) {
          showThisClient = false;
        }
      }

      return showThisClient;
    },
    startTimer() {
      var vm = this;
      this.timer = setInterval(() => {
        vm.seconds++;
        if (vm.seconds >= 60) {
          vm.seconds = 0;
          vm.minutes++;
          if (vm.minutes >= 60) {
            vm.minutes = 0;
            vm.hours++;
          }
        }

        vm.visitTime =
          vm.hours +
          ':' +
          (vm.minutes < 10 ? '0' + vm.minutes : vm.minutes) +
          ':' +
          (vm.seconds < 10 ? '0' + vm.seconds : vm.seconds);
      }, 1000);
    },
    stopTimer() {
      var vm = this;
      clearTimeout(vm.timer);
      vm.timer = null;
      vm.seconds = 0;
      vm.minutes = 0;
      vm.hours = 0;
      vm.visitTime = null;
    },
    updateVisitSession() {
      var vm = this;
      var db = firebase.firestore();

      var browser = Bowser.parse(window.navigator.userAgent);

      //save session in db
      db.collection('visits')
        .doc('userVisitSessions')
        .update({
          [vm.currentUser]: {
            visitOn: vm.visitOn,
            visitClientId: vm.visitClientId,
            client: vm.clients[vm.visitClientId]
              ? vm.clients[vm.visitClientId].clientName
              : null,
            visitStartAt: vm.visitStartAt,
            visitLocation: vm.visitLocation,
            user: vm.currentUserData.displayName,
            browser: browser ? browser : "didn't get browser data",
          },
        });
    },
    startVisit() {
      var vm = this;
      var db = firebase.firestore();

      vm.visitLocation = new firebase.firestore.GeoPoint(
        vm.visitUserPosition.lat,
        vm.visitUserPosition.lng
      );
      vm.visitStartAt = new Date();

      //save session in db
      vm.visitOn = true;

      vm.updateVisitSession();
      vm.startTimer();

      //close dialog
      vm.visitDialog = false;
    },
    endVisit() {
      var conf = confirm('Vai pārtraukt vizīti?');
      if (conf) {
        var vm = this;
        var db = firebase.firestore();

        const endAt = new Date();
        var startAt =
          typeof vm.visitStartAt.seconds == 'undefined'
            ? vm.visitStartAt
            : new Date(vm.visitStartAt.seconds * 1000);

        vm.stopTimer();
        //enable snackbar
        vm.snackbarColor = 'success';
        vm.snackbarTxt = 'Vizīte saglabāta!';
        vm.snackbar = true;

        //save visit data
        db.collection('visits').add({
          clientId: vm.visitClientId,
          clientName: vm.clients[vm.visitClientId].clientName,
          location: vm.visitLocation,
          startAt: vm.visitStartAt,
          endAt: endAt,
          dateFormatted: vm.formatVisitDate(
            startAt.toISOString().substr(0, 10)
          ),
          duration: vm.calculateVisitDuration(startAt, endAt),
          user: vm.currentUser,
        });

        //reset form
        vm.visitClientId = null;
        vm.visitLocation = null;
        vm.visitOn = false;
        vm.visitStartAt = null;

        vm.updateVisitSession();
      }
    },
    calculateVisitDuration(startAt, endAt) {
      var secondsPassed = endAt.getTime() / 1000 - startAt.getTime() / 1000;
      //hours
      var hours = parseInt(secondsPassed / 3600);
      secondsPassed = secondsPassed % 3600; // seconds remaining after extracting hours
      //minutes
      var minutes = parseInt(secondsPassed / 60);
      //seconds
      var seconds = Math.floor(secondsPassed % 60);

      return (
        hours +
        ':' +
        (minutes < 10 ? '0' + minutes : minutes) +
        ':' +
        (seconds < 10 ? '0' + seconds : seconds)
      );
    },
    formatVisitDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
    newIncident(clientId, clientName, incId) {
      // view client profile programmatically
      this.$router.push({
        name: 'incident',
        params: { id: clientId, clientName: clientName, incId: incId },
      });
    },
    newBodyVitals(clientId, clientName, vitalsId) {
      // view client profile programmatically
      this.$router.push({
        name: 'vitals',
        params: { id: clientId, clientName: clientName, vitalsId: vitalsId },
      });
    },
    selectedTask(clientId, taskId) {
      var vm = this;
      var selectedTask = false;
      if (vm.multipleSelectedTasks.length > 0) {
        //check if selected task
        vm.multipleSelectedTasks.forEach(taskObj => {
          if (taskObj.clientId == clientId && taskObj.taskId == taskId) {
            selectedTask = true;
          }
        });
      }

      return selectedTask;
    },
    updateSelectedTasks(clientId, taskId) {
      var vm = this;
      var obj = { clientId: clientId, taskId: taskId };
      if (vm.multipleSelectedTasks.length > 0) {
        //check if need to add or remove task
        var newTask = true;
        var oldTaskIndex = 0;
        //check if new task
        vm.multipleSelectedTasks.forEach((taskObj, taskIndex) => {
          if (
            taskObj.clientId == obj.clientId &&
            taskObj.taskId == obj.taskId
          ) {
            newTask = false;
            oldTaskIndex = taskIndex;
          }
        });

        //add if new task
        if (newTask) {
          vm.multipleSelectedTasks.push(obj);
        } else {
          vm.multipleSelectedTasks.splice(oldTaskIndex, 1);
        }
      } else {
        //add first task
        vm.multipleSelectedTasks.push(obj);
      }
    },
    inactiveRow(fullId) {
      var vm = this;
      if (vm.myTasks[fullId]) {
        const taskDirOrIdr = vm.myTasks[fullId].lpTaskDirect;
        if (taskDirOrIdr != vm.dirOrIdir && vm.dirOrIdir != 'not selected') {
          return 'inactiveRow';
        }
      } else {
        return 'inactiveRow';
      }
    },
    getTaskId(fullId) {
      const sliceAt = fullId.lastIndexOf('-');
      return fullId.slice(sliceAt + 1);
    },
    chechoutTasks(clientId, taskId) {
      var vm = this;
      const status = vm.myTasks[taskId].status;

      if (status != 'open') {
        return 'checkout';
      }
    },

    updateStatus(status) {
      var vm = this;
      var db = firebase.firestore();

      //vm.progressBar = true;

      //get geo location
      var location = navigator.geolocation.getCurrentPosition(function(
        position,
        error
      ) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        //go trough tasks update status, closedAt, closedBy
        for (var t = 0; t < vm.multipleSelectedTasks.length; t++) {
          const taskId = vm.multipleSelectedTasks[t].taskId;
        }

        //go trough tasks update status, closedAt, closedBy
        for (var t = 0; t < vm.multipleSelectedTasks.length; t++) {
          const taskId = vm.multipleSelectedTasks[t].taskId;
          //update status locally
          vm.myTasks[taskId].status = status;

          //write in db
          db.collection('taskArchive')
            .doc(taskId)
            .update({
              status: status,
              closedAt: new Date(),
              closedBy: vm.currentUser,
              location: new firebase.firestore.GeoPoint(latitude, longitude),
              lastUpdate: new Date(),
              updatedBy:
                vm.users[vm.currentUser].displayName +
                ' mainīja uzdevuma statusus (multiple)',
            });
        }

        vm.multipleSelectedTasks = [];
        vm.multipleCheckout = false;
        //vm.progressBar = false;
      });
    },
  },
};
</script>

<style>
.client-title {
  background-color: #afcce0 !important;
}
.timer-tile {
  background-color: #e0e6e9 !important;
}

.checkout {
  text-decoration: line-through;
  color: rgb(155, 154, 154);
}
.small-switch {
  margin: 0;
  padding: 0;
}
.v-navigation-drawer__content {
  z-index: 11 !important;
}
</style>