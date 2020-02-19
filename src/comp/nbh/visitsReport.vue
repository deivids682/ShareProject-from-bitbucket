<template>
  <v-container>
    <v-layout row wrap>
      <!--Progress bar -->
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>

      <!-- snackbar -->
      <v-flex xs12>
        <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
          {{ snackbarTxt }}
          <v-btn dark text @click="snackbar = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-flex>

      <!-- report feedback -->
      <preparing-report v-if="reportDialog"></preparing-report>

      <!-- choose period, worker -->
      <v-flex xs12 sm6 lg5 offset-sm3>
        <v-card>
          <v-card-title>
            <h3>Parametri</h3>
          </v-card-title>
          <v-card-text>
            <!-- Date from -->
            <v-menu
              v-model="menuDateFrom"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="dateFromFormatted"
                  label="Datums no"
                  prepend-icon="event"
                  readonly
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker v-model="dateFrom" @input="menuDateFrom = false" first-day-of-week="1"></v-date-picker>
            </v-menu>
            <!-- Date to -->
            <v-menu
              v-model="menuDateTo"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="dateToFormatted"
                  label="Datums līdz"
                  prepend-icon="event"
                  readonly
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker v-model="dateTo" @input="menuDateTo = false" first-day-of-week="1"></v-date-picker>
            </v-menu>
            <!-- employees or clients -->
            <v-radio-group v-model="radioGroup" @change="switchSelectors()">
              <v-radio label="Darbinieki" value="aiders"></v-radio>
              <v-radio label="Klienti (aktīvie)" value="clients"></v-radio>
            </v-radio-group>
            <!-- selectorId -->
            <v-select
              v-model="selectorId"
              :items="selectItems"
              item-text="displayName"
              item-value="id"
              prepend-icon="mood"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              v-if="selectorId != null"
              text
              outlined
              color="gray"
              @click="getVisits()"
            >Sagatavot</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <!-- show results -->
      <v-flex xs12 sm6 lg5 offset-sm3>
        <br />
        <h3>Rezultāti</h3>

        <v-list two-line>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-subtitle>
                <h3>Galvenie dati</h3>
              </v-list-item-subtitle>
              <v-list-item-subtitle>Vizītes kopā: {{ totalVisits }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="radioGroup == 'aiders'">
            <v-list-item-content>
              <v-list-item-subtitle>
                <v-icon color="success">check</v-icon>
                Aizvērti visi uzdevumi dienas: {{ correctDays.length }}
                <li>Vizītes: {{ correctDaysVisits }}</li>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="radioGroup == 'aiders'">
            <v-list-item-content>
              <v-list-item-subtitle>
                <v-icon color="error">error</v-icon>
                Nav aizvērti visi uzdevumi dienas: {{ errorDays.length }}
                <li>Vizītes: {{ errorDaysVisits }}</li>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>
          <v-subheader>Vizītes pa dienām</v-subheader>
          <template v-for="(report, reportId) in filteredReports">
            <v-list-item :key="reportId" v-if="report.visits > 0">
              <v-list-item-content>
                <v-list-item-title>
                  <v-icon v-if="report.tasksOpen == 0" color="success">check</v-icon>
                  <v-icon v-else color="error">error</v-icon>
                  <!-- link to daily report -->
                  <a
                    :href="
                      'prieksh share' +
                        reportId
                    "
                    target="_blank"
                  >{{ reportId }}</a>
                </v-list-item-title>
                <v-list-item-subtitle>Vizītes: {{ report.visits }}</v-list-item-subtitle>
                <v-list-item-subtitle>
                  Neaizvērti uzdevumi:
                  {{ report.tasksOpen }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>

          <v-divider></v-divider>
          <v-subheader>Vizītes detalizēti</v-subheader>
          <v-list-item v-for="(visit, visitId) in filteredVisits" :key="visitId">
            <v-list-item-content>
              <v-list-item-title>
                {{ visit.dateFormatted }}
                <span
                  v-if="users[visit.user]"
                >{{ users[visit.user].displayName }} pie</span>
                {{ visit.clientName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ visit.duration }} (no
                {{ closeTime(visit.startAt.seconds) }} līdz
                {{ closeTime(visit.endAt.seconds) }})
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import PreparingReport from '@/comp/PreparingReport.vue';

export default {
  data() {
    return {
      progressBar: true,
      reportDialog: false,
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      //pick parameters
      //date from
      yesterday: null,
      dateFrom: null,
      dateFromRaw: null,
      dateFromFormatted: null,
      menuDateFrom: false,
      //date to
      dateTo: null,
      dateToRaw: null,
      dateToFormatted: null,
      menuDateTo: false,
      radioGroup: 'aiders',
      //selectorId
      selectorId: null,
      selectItems: [],
      helpers: [{ id: 'all', displayName: 'Kopā' }],
      clients: [{ id: 'all', displayName: 'Kopā' }],
      users: {},
      //get visits
      filteredVisits: {},
      totalVisits: 0,
      errorDays: [],
      errorDaysVisits: 0,
      correctDays: [],
      correctDaysVisits: 0,
      filteredReports: {},
    };
  },
  components: {
    PreparingReport,
  },
  watch: {
    //format dates
    //+3 hours for GMT+0300 (Eastern European Summer Time)
    dateFrom(val) {
      this.dateFromFormatted = this.formatDate(this.dateFrom);
      this.dateFromRaw = this.rawDate(this.dateFrom, 3, 0, 0, 1);
    },
    dateTo(val) {
      this.dateToFormatted = this.formatDate(this.dateTo);
      this.dateToRaw = this.rawDate(this.dateTo, 26, 59, 59, 0);
    },
  },
  created() {
    var vm = this;
    var db = firebase.firestore();
    vm.progressBar = true;

    //set time
    //date from
    var yesterday = new Date().setHours(26, 59, 59, 0) - 86400000;
    vm.yesterday = yesterday;
    vm.dateFrom = new Date(yesterday).toISOString().substr(0, 10);
    vm.dateFromRaw = new Date(yesterday).setHours(3, 0, 0, 1);
    vm.dateFromFormatted = vm.formatDate(vm.dateFrom);

    //date to
    vm.dateTo = new Date(yesterday).toISOString().substr(0, 10);
    vm.dateToRaw = new Date(yesterday).setHours(26, 59, 59, 0);
    vm.dateToFormatted = vm.formatDate(vm.dateTo);

    //get helpers
    var usersL = {};
    db.collection('users')
      .where('role', 'array-contains', 'aider')
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          var data = doc.data();
          data['id'] = doc.id;
          vm.helpers.push(data);
          vm.selectItems = vm.helpers;
          usersL[doc.id] = data;
        });
        //data loaded
        vm.users = Object.assign({}, usersL);
        vm.progressBar = false;
      });
  },
  methods: {
    async switchSelectors() {
      var vm = this;
      vm.selectorId = null;
      if (vm.radioGroup == 'aiders') {
        vm.selectItems = vm.helpers;
      } else if (vm.radioGroup == 'clients') {
        //check if load clients

        if (vm.clients.length < 2) {
          vm.progressBar = true;
          var db = firebase.firestore();

          var clientsSnap = await db
            .collection('clients')
            .where('clientServices', '==', 'neighborhood')
            .where('clientStatus', '==', 'active')
            .get();

          clientsSnap.forEach(function(doc) {
            var data = doc.data();
            data['id'] = doc.id;
            data['displayName'] = data.clientName;
            vm.clients.push(data);
          });
          //data loaded
          vm.progressBar = false;
        }

        vm.selectItems = vm.clients;
      } //end if clients
    },
    async getVisits() {
      var vm = this;
      var db = firebase.firestore();

      //get daily reports for that period
      //loop dates, only if dateFrom < dateTo
      var reportPromises = [];
      var reports = {};
      if (vm.dateFromRaw < vm.dateToRaw && vm.dateToRaw <= vm.yesterday) {
        // start feedback
        vm.reportDialog = true;
        var reportDate = vm.dateFromRaw;
        while (reportDate < vm.dateToRaw) {
          //format date
          var formatDate = vm.formatDate(
            new Date(reportDate).toISOString().substr(0, 10)
          );
          //create data holder
          reports[formatDate] = { visits: 0, tasksOpen: 0 };

          //get data
          var promise = db
            .collection('dailyReports')
            .doc(formatDate)
            .get();
          reportPromises.push(promise);

          //add one day in ms
          reportDate += 86400000;
        }

        //analyze data when all promisses added
        var values = await Promise.all(reportPromises);

        //loop reports and add data to object
        vm.errorDays = [];
        vm.correctDays = [];
        for (var i = 0; i < reportPromises.length; i++) {
          var repId = values[i].id;
          var reportData = values[i].data();

          if (vm.radioGroup == 'aiders') {
            var employeeStats = reportData.userQuickStats[vm.selectorId];
            //or get all stats
            if (vm.selectorId == 'all') {
              employeeStats = reportData.totalQuickStats;
            }

            if (typeof employeeStats != 'undefined') {
              var open = employeeStats.open;
              var totalTasks = employeeStats.total;

              //count error days
              if (totalTasks > 0) {
                if (open > 0) {
                  vm.errorDays.push(repId);
                } else {
                  //correct day
                  vm.correctDays.push(repId);
                }
                //add data
                reports[repId].tasksOpen = open;
              }
            }
          }
          vm.filteredReports = Object.assign({}, reports);
        } //end employee stats

        //list visits
        vm.totalVisits = 0;
        vm.errorDaysVisits = 0;
        vm.correctDaysVisits = 0;

        var selector = 'user';
        if (vm.radioGroup == 'clients') {
          selector = 'clientId';
        }

        var colRef = db
          .collection('visits')
          .where('startAt', '>=', new Date(vm.dateFromRaw))
          .where('startAt', '<=', new Date(vm.dateToRaw))
          .where(selector, '==', vm.selectorId)
          .orderBy('startAt');

        //or get all stats
        if (vm.selectorId == 'all') {
          colRef = db
            .collection('visits')
            .where('startAt', '>=', new Date(vm.dateFromRaw))
            .where('startAt', '<=', new Date(vm.dateToRaw))
            .orderBy('startAt');
        }

        var visitsSnap = await colRef.get();
        if (visitsSnap.size > 0) {
          var filteredVisitsL = {};
          visitsSnap.forEach(function(doc) {
            filteredVisitsL[doc.id] = doc.data();
            //add visit count
            vm.totalVisits++;
            var repId = doc.data().dateFormatted;
            reports[repId].visits++;
            //count correct day visits
            if (vm.correctDays.indexOf(repId) != -1) {
              vm.correctDaysVisits++;
            }

            //count error day visits
            if (vm.errorDays.indexOf(repId) != -1) {
              vm.errorDaysVisits++;
            }
          });
          //assign data
          vm.filteredVisits = Object.assign({}, filteredVisitsL);
        }
        vm.reportDialog = false;
      } else if (vm.dateToRaw > vm.yesterday) {
        // not closed period
        //enable snackbar
        vm.snackbarColor = 'error';
        vm.snackbarTxt = 'Jāizvēlas līdz noslēgtam dienām!';
        vm.snackbar = true;
      } else {
        //   wrong period
        //enable snackbar
        vm.snackbarColor = 'error';
        vm.snackbarTxt = 'Nepareizs periods!';
        vm.snackbar = true;
      }
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
    rawDate(date, h, m, s, ms) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      var monthRaw = month - 1;
      return new Date(year, monthRaw, day).setHours(h, m, s, ms);
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
  },
};
</script>
