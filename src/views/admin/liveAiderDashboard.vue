<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Šodienas progress</h1>
        <h3>{{dateFormatted}} - {{dayTxt}}</h3>
      </v-col>
      <v-col cols="12">
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
      <template v-if="!progressBar">
        <v-col cols="12" lg="4" md="6" v-for="(aider, aiderId) in displayValues" :key="aiderId">
          <v-card>
            <v-card-title>
              {{aidersData[aiderId].displayName}}
              <v-spacer></v-spacer>
              <v-btn fab dark x-small color="green" v-if="showIcon(aiderId)">
                <v-icon dark>timer</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <vue-svg-gauge
                :value="aider.total-aider.open"
                :min="0"
                :max="aider.total"
                :inner-radius="75"
                :separatorStep="0"
                :gauge-color="[{ offset: 0, color: '#827090'}, { offset: 100, color: '#DED9E1'}]"
              ></vue-svg-gauge>
              <v-list>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>Uzdevumi: {{aider.total-aider.open}}/{{aider.total}}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <!-- live visit data -->
                <v-list-item>
                  <v-list-item-content v-if="liveVisitSession[aiderId]">
                    <template v-if="liveVisitSession[aiderId].visitOn">
                      <v-list-item-title>Pašlaik vizītē pie</v-list-item-title>
                      <v-list-item-subtitle>Klients {{liveVisitSession[aiderId].client}}</v-list-item-subtitle>
                      <v-list-item-subtitle>Ilgums {{showTimer(liveVisitSession[aiderId].visitStartAt.seconds)}}</v-list-item-subtitle>
                    </template>
                  </v-list-item-content>
                </v-list-item>
                <!-- visits -->
                <v-list-item>
                  <v-list-item-content>
                    <template>
                      <v-list-item-title>Paredzētās vizītes (kopā {{visitsPerAider[aiderId].total}}):</v-list-item-title>
                      <!-- loop shifts -->
                      <template v-for="(shiftName, shiftNr) in shiftsToTxt">
                        <!-- loop clients -->
                        <v-list-item-subtitle
                          :key="shiftNr"
                          v-if="visitsPerAider[aiderId][shiftNr].length>0"
                        >
                          {{shiftName}}:
                          <ul>
                            <li
                              v-for="(client) in visitsPerAider[aiderId][shiftNr]"
                              :key="client"
                            >{{client}}</li>
                          </ul>
                        </v-list-item-subtitle>
                      </template>
                    </template>
                  </v-list-item-content>
                </v-list-item>

                <!-- completed visits -->
                <v-list-item v-if="visitsCompletedToday[aiderId]">
                  <v-list-item-content>
                    <v-list-item-title>Pabeigtās vizītes (kopā {{visitsCompletedToday[aiderId].length}}):</v-list-item-title>
                    <v-list-item-subtitle
                      v-for="visit in visitsCompletedToday[aiderId]"
                      :key="visit"
                    >{{visit}}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <!-- sudo view -->
                <v-list-item v-if="sudo">
                  <v-list-item-content v-if="liveVisitSession[aiderId]">
                    <v-list-item-subtitle>VisitOn: {{liveVisitSession[aiderId].visitOn}}</v-list-item-subtitle>
                    <v-list-item-subtitle>Client: {{liveVisitSession[aiderId].client}}</v-list-item-subtitle>
                    <v-list-item-subtitle>User: {{liveVisitSession[aiderId].user}}</v-list-item-subtitle>
                    <v-list-item-subtitle>visitClientId: {{liveVisitSession[aiderId].visitClientId}}</v-list-item-subtitle>
                    <v-list-item-subtitle>visitLocation: {{liveVisitSession[aiderId].visitLocation}}</v-list-item-subtitle>
                    <v-list-item-subtitle>visitStartAt: {{liveVisitSession[aiderId].visitStartAt}}</v-list-item-subtitle>
                    <v-list-item-subtitle
                      v-if="liveVisitSession[aiderId].browser"
                    >browser: {{liveVisitSession[aiderId].browser.browser}}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </template>
    </v-row>

    <!--Progress bar -->
    <v-row v-if="progressBar">
      <v-progress-linear :indeterminate="true"></v-progress-linear>
    </v-row>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { VueSvgGauge } from 'vue-svg-gauge';

export default {
  components: {
    VueSvgGauge,
  },
  data() {
    return {
      progressBar: true,
      searchValue: null,
      now: new Date(),
      today: null,
      tomorrow: null,
      dateFormatted: null,
      dayTxt: null,
      aidersData: {},
      liveVisitSession: {},
      tasksPerAider: {},
      visitsPerAider: {},
      visitsCompletedToday: {},
      shiftsToTxt: { 0: 'Rīts', 1: 'Pusdiena', 2: 'Vakars' },
      daysToTxt: {
        0: 'Svētdiena',
        1: 'Pirmdiena',
        2: 'Otrdiena',
        3: 'Trešdiena',
        4: 'Ceturdiena',
        5: 'Piektdiena',
        6: 'Sestdiena',
      },
    };
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();
    //update now every second
    setInterval(() => (vm.now = new Date()), 1000);

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
    vm.dateFormatted = vm.formatDate(today);
    vm.dayTxt = vm.daysToTxt[today.getDay()];

    //get aiders
    var aidersProm = db
      .collection('users')
      .where('role', 'array-contains', 'aider')
      .get();

    var pausedClientsProm = db
      .collection('clients')
      .where('clientStatus', '==', 'paused')
      .get();

    var stoppedClientsProm = db
      .collection('clients')
      .where('clientStatus', '==', 'stopped')
      .get();

    var deletedClientsProm = db
      .collection('clients')
      .where('clientStatus', '==', 'deleted')
      .get();

    var values = await Promise.all([
      aidersProm,
      pausedClientsProm,
      stoppedClientsProm,
      deletedClientsProm,
    ]);
    var aiders = values[0];
    var aidersDataL = {};
    aiders.forEach(aider => {
      aidersDataL[aider.id] = aider.data();
    });
    vm.aidersData = Object.assign({}, aidersDataL);

    var inactiveClients = values[1];
    var inactiveClientsIds = [];
    inactiveClients.forEach(client => {
      inactiveClientsIds.push(client.id);
    });

    var stoppedClients = values[2];
    stoppedClients.forEach(client => {
      inactiveClientsIds.push(client.id);
    });

    var deletedClients = values[3];
    deletedClients.forEach(client => {
      inactiveClientsIds.push(client.id);
    });

    //get tasks
    db.collection('taskArchive')
      .where('lpTaskDate', '>=', vm.today)
      .where('lpTaskDate', '<=', vm.tomorrow)
      .onSnapshot(tasksSnap => {
        var tasksPerAiderL = {};
        var visitsPerAiderL = {};
        tasksSnap.forEach(task => {
          const taskData = task.data();
          //if active client
          if (inactiveClientsIds.indexOf(taskData.clientId) == -1) {
            //tasks per user
            if (!tasksPerAiderL[taskData.responsible]) {
              tasksPerAiderL[taskData.responsible] = { total: 0, open: 0 };
            }
            tasksPerAiderL[taskData.responsible].total += 1;
            if (taskData.status == 'open') {
              tasksPerAiderL[taskData.responsible].open += 1;
            }

            //visits per client
            //if client has task in shift per aider
            if (!visitsPerAiderL[taskData.responsible]) {
              visitsPerAiderL[taskData.responsible] = {
                0: [],
                1: [],
                2: [],
                total: 0,
              };
            }
            var visitArr =
              visitsPerAiderL[taskData.responsible][taskData.lpTaskShiftNumber];
            if (visitArr.indexOf(taskData.clientName) == -1) {
              visitArr.push(taskData.clientName);
              visitsPerAiderL[taskData.responsible].total++;
            }
          } //end if active cllient
        });
        //update objects
        vm.tasksPerAider = Object.assign({}, tasksPerAiderL);
        vm.visitsPerAider = Object.assign({}, visitsPerAiderL);
      });

    //get live visits from today
    db.collection('visits')
      .where('dateFormatted', '==', vm.dateFormatted)
      .orderBy('startAt')
      .onSnapshot(visitsSnap => {
        var visitsCompletedTodayL = {};
        visitsSnap.forEach(visit => {
          const visitData = visit.data();
          //visits per user
          if (!visitsCompletedTodayL[visitData.user]) {
            visitsCompletedTodayL[visitData.user] = [];
          }
          const formatVisitTxt =
            vm.closeTime(visitData.startAt.seconds) +
            ' ' +
            visitData.clientName +
            ' ' +
            visitData.duration;
          visitsCompletedTodayL[visitData.user].push(formatVisitTxt);
        });
        vm.visitsCompletedToday = Object.assign({}, visitsCompletedTodayL);
      });

    //live visit session
    db.collection('visits')
      .doc('userVisitSessions')
      .onSnapshot(doc => {
        vm.liveVisitSession = Object.assign({}, doc.data());
      });

    vm.progressBar = false;
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.tasksPerAider);
          for (var t = 0; t < ids.length; t++) {
            var searchBy =
              vm.aidersData[ids[t]].displayName + vm.aidersData[ids[t]].email;
            if (
              searchBy.toLowerCase().indexOf(vm.searchValue.toLowerCase()) !==
              -1
            ) {
              displayL[ids[t]] = vm.tasksPerAider[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.tasksPerAider);
        }
      } else {
        displayL = Object.assign({}, vm.tasksPerAider);
      }

      return displayL;
    },
  },
  methods: {
    formatDate(inpDate) {
      var shiftDate = new Date(inpDate);
      const year = shiftDate.getFullYear();
      var month = shiftDate.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var date = shiftDate.getDate();
      if (date < 10) {
        date = '0' + date;
      }
      return date + '.' + month + '.' + year + '.';
    },
    showIcon(aiderId) {
      var vm = this;
      var showTimerIcon = false;

      if (vm.liveVisitSession[aiderId]) {
        if (
          vm.liveVisitSession[aiderId].visitOn &&
          parseInt(vm.now.getTime() / 1000) % 2 == 0
        ) {
          showTimerIcon = true;
        }
      }

      return showTimerIcon;
    },
    showTimer(startTime) {
      var vm = this;
      var secondsPassed = vm.now.getTime() / 1000 - startTime;
      var hours = parseInt(secondsPassed / 3600);
      secondsPassed = secondsPassed % 3600; // seconds remaining after extracting hours
      var minutes = parseInt(secondsPassed / 60);
      var seconds = Math.round(secondsPassed % 60);

      var visitTime =
        hours +
        ':' +
        (minutes < 10 ? '0' + minutes : minutes) +
        ':' +
        (seconds < 10 ? '0' + seconds : seconds);

      return visitTime;
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

        if (seconds >= 60) {
          seconds = 0;
          minutes++;
          if (minutes >= 60) {
            minutes = 0;
            hours++;
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
    closeTime(closedTime) {
      const closeedAt = new Date(closedTime * 1000);

      var hours = closeedAt.getHours();
      if (hours < 10) {
        hours = '0' + hours;
      }
      var minutes = closeedAt.getMinutes();
      if (minutes < 10) {
        minutes = '0' + minutes;
      }

      return hours + ':' + minutes;
    },
  },
};
</script>

<style scoped>
.inner-text {
  height: 100%;
  width: 100%;
}
</style>