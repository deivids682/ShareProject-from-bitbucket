<template>
  <v-container id="dashboard-container">
    <h1>Dienas atskaite</h1>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>

    <!-- present data -->
    <v-layout v-if="!progressBar" wrap>
      <!-- titles -->
      <v-flex xs12>
        <h2>{{dailyReportData.id}}</h2>
        <h3>{{dailyReportData.dayText}}</h3>
      </v-flex>

      <!-- total stats -->
      <v-layout wrap row>
        <v-flex xs12 md6 lg6>
          <list-stats
            v-if="newVersionVisits"
            :statsData="dailyReportData.totalQuickStats"
            :visits="dailyReportData.visits.allVisits"
            :total="true"
          ></list-stats>
          <list-stats
            v-if="!newVersionVisits"
            :statsData="dailyReportData.totalQuickStats"
            :visits="{}"
            :total="false"
          ></list-stats>
        </v-flex>
        <!-- chart -->
        <v-flex xs12 md6 lg6>
          <div class="chart-container" style="height:400px">
            <v-card>
              <v-layout align-center justify-center fill-height v-if="!chartDataLoaded">
                <v-progress-circular :size="70" :width="7" indeterminate></v-progress-circular>
              </v-layout>
              <daily-chart
                v-if="chartDataLoaded"
                :chartdata="{labels: chartLabels, datasets: chartData.totalQuickStats}"
              ></daily-chart>
            </v-card>
          </div>
        </v-flex>
      </v-layout>

      <!-- INCIDENTS -->
      <v-flex xs12 v-if="Object.keys(incidents).length > 0">
        <h3 class="section-title">Incidenti</h3>
        <v-layout wrap v-for="(inc, incId, index) in incidents" :key="incId">
          <v-flex xs12 class="name-flex">
            <strong>{{inc.clientName}}</strong>
            - {{inc.incident}}
            <br />
            Pievnienoja: {{ userData[inc.createdBy].displayName }} plkst. {{closeTime(inc.createdAt.seconds)}}
            <span
              v-if="typeof inc.updatedBy != 'undefined'"
            >
              <br />
              Laboja: {{ userData[inc.updatedBy].displayName }} {{formatDateFromRaw(inc.updatedAt.seconds)}} plkst. {{closeTime(inc.updatedAt.seconds)}}
              <br />
            </span>
            <br />Komentārs:
            <span class="task-comment">{{inc.comment}}</span>
          </v-flex>
          <!-- photo -->
          <v-flex xs12 v-if="inc.photoUrl != null">
            <v-img :src="inc.photoUrl" max-width="350px" contain position="center left"></v-img>
            <br />
          </v-flex>
          <v-flex xs12>
            <v-divider v-if="index != Object.keys(incidents).length-1"></v-divider>
            <br />
          </v-flex>
        </v-layout>
      </v-flex>

      <!-- VITALS -->
      <v-flex xs12 v-if="Object.keys(vitals).length > 0">
        <h3 class="section-title">Veselības dati</h3>
        <v-layout wrap v-for="(vit, vitId, index) in vitals" :key="vitId">
          <v-flex xs12>
            <v-layout row class="name-flex">
              <v-flex xs12>
                <strong>{{vit.clientName}}</strong>
                <br />
                Pievnienoja: {{ userData[vit.createdBy].displayName }} plkst. {{closeTime(vit.createdAt.seconds)}}
                <br />
                <span v-if="typeof vit.updatedBy != 'undefined'">
                  Laboja: {{ userData[vit.updatedBy].displayName }} {{formatDateFromRaw(vit.updatedAt.seconds)}} plkst. {{closeTime(vit.updatedAt.seconds)}}
                  <br />
                </span>
              </v-flex>
            </v-layout>

            <!-- list measurements -->
            <ul>
              <template v-for="(mData, mName) in vit.vitals">
                <li :key="mName" v-if="mData != 0">
                  {{mName}}: {{mData}}
                  <br />
                </li>
              </template>
            </ul>
            <span class="task-comment" v-if="vit.comment != null">Komentārs: {{vit.comment}}</span>
          </v-flex>

          <v-flex xs12>
            <v-divider v-if="index != Object.keys(vitals).length-1"></v-divider>
            <br />
          </v-flex>
        </v-layout>
      </v-flex>

      <!-- PHOTOS -->
      <v-flex xs12 v-if="photoTasks.length > 0">
        <h3 class="section-title">Foto</h3>
        <v-layout row v-for="(task, index) in photoTasks" :key="index">
          <!-- loop all task photos, show task name, responsible name, task time, photo -->
          <v-flex xs12>
            <p class="name-flex">
              <strong>
                <!-- client name -->
                <span>{{task.clientName}} -</span>
                <!-- shift -->
                <span>{{shiftsToTxt[task.lpTaskShiftNumber]}}:</span>
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
                <span v-if="task.status == 'open'">
                  <v-icon small color="error">error</v-icon>
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
              </strong>
              <!-- closed by -->
              <br />
              <span
                v-if="typeof userData[task.closedBy] != 'undefined'"
              >{{userData[task.closedBy].displayName }}</span>
              <!-- close time -->
              <span v-if="task.status != 'open'">, plkst. {{closeTime(task.closedAt.seconds)}}</span>
              <!-- comment -->
              <span v-if="task.comment != ''" class="task-comment">
                <br />
                Komentārs: {{task.comment}}
              </span>
            </p>
            <!-- photo -->
            <v-img :src="task.photoUrl" max-width="350px" contain position="center left"></v-img>
            <br />
            <v-divider v-if="index != photoTasks.length-1"></v-divider>
            <br />
          </v-flex>
        </v-layout>
      </v-flex>

      <!-- user stats -->
      <v-flex xs12>
        <h3 class="section-title">Darbinieki</h3>
        <v-layout wrap v-for="(userStats, userId) in dailyReportData.userQuickStats" :key="userId">
          <!-- if had tasks or visits -->
          <template v-if="showUserStats( userStats.total, newVersionVisits, userId)">
            <v-flex xs12 class="name-flex">
              <v-card-title primary-title>
                <h4>
                  <span v-if="userStats.open > 0">
                    <v-icon color="error">error</v-icon>
                  </span>
                  <span
                    v-if="typeof userData[userId] != 'undefined'"
                  >{{userData[userId].displayName}}</span>
                  <span v-else>{{[userId]}}</span>
                </h4>
              </v-card-title>
            </v-flex>

            <v-flex xs12 md6 lg6>
              <list-stats
                v-if="newVersionVisits"
                :statsData="userStats"
                :visits="dailyReportData.visits.visitsByUsers[userId]"
                :total="true"
              ></list-stats>
              <list-stats
                v-if="!newVersionVisits"
                :statsData="userStats"
                :visits="{}"
                :total="false"
              ></list-stats>
            </v-flex>
            <!-- chart -->
            <v-flex xs12 md6 lg6>
              <div class="chart-container" style="height:400px">
                <v-card>
                  <v-layout align-center justify-center fill-height v-if="!chartDataLoaded">
                    <v-progress-circular :size="70" :width="7" indeterminate></v-progress-circular>
                  </v-layout>
                  <daily-chart
                    :chartdata="{labels: chartLabels, datasets: chartData[userId]}"
                    v-if="chartDataLoaded"
                  ></daily-chart>
                </v-card>
              </div>
            </v-flex>
            <!-- visits -->
            <v-flex xs12>
              <br />
              <h3>Vizītes</h3>
              <ul>
                <li
                  v-for="(visit, visitId) in sortVisits(dailyReportData.visits.visitsByUsers[userId])"
                  :key="visitId"
                >{{closeTime(visit.startAt.seconds)}} - {{visit.clientName}} {{visit.duration}}</li>
              </ul>
            </v-flex>

            <!-- user map -->
            <template v-if="newVersionVisits">
              <v-flex
                xs12
                v-if="Object.keys(dailyReportData.visits.visitsByUsers[userId]).length > 0"
              >
                <br />
                <h3>Karte</h3>
                <GmapMap
                  :center="maps[userId].mapCenter"
                  :zoom="12"
                  style="width: 100%; height: 400px"
                >
                  <gmap-info-window
                    :options="infoOptions"
                    :position="infoWindowPos"
                    :opened="infoWinOpen"
                    @closeclick="infoWinOpen=false"
                  >{{infoContent}}</gmap-info-window>
                  <GmapMarker
                    v-for="(m, i) in maps[userId].userMarkers"
                    :key="i"
                    :position="m.position"
                    :clickable="true"
                    :icon="'http://www.googlemapsmarkers.com/v1/'+clientData[m.clientId].clientColor+'/'"
                    @click="toggleInfoWindow(m,i)"
                  />
                </GmapMap>
              </v-flex>
            </template>
            <v-flex xs12 style="margin-top: 40px">
              <v-divider></v-divider>
            </v-flex>
          </template>
        </v-layout>
      </v-flex>

      <!-- client stats -->
      <v-flex xs12>
        <h3 class="section-title">Klienti</h3>
        <v-layout
          wrap
          v-for="(clientStats, clientId) in dailyReportData.clientQuickStats"
          :key="clientId"
        >
          <template v-if="clientStats.total > 0">
            <v-flex xs12 class="name-flex">
              <v-card-title primary-title>
                <h4>{{dailyReportData.clientAllTasks[clientId].clientName}}</h4>
              </v-card-title>
            </v-flex>

            <v-flex xs12 md6 lg6>
              <list-stats
                v-if="newVersionVisits"
                :statsData="clientStats"
                :visits="dailyReportData.visits.visitsByClient[clientId]"
                :total="false"
              ></list-stats>
              <list-stats
                v-if="!newVersionVisits"
                :statsData="clientStats"
                :visits="{}"
                :total="false"
              ></list-stats>
            </v-flex>
            <!-- chart -->
            <v-flex xs12 md6 lg6>
              <div class="chart-container" style="height:400px">
                <v-card>
                  <v-layout align-center justify-center fill-height v-if="!chartDataLoaded">
                    <v-progress-circular :size="70" :width="7" indeterminate></v-progress-circular>
                  </v-layout>
                  <daily-chart
                    :chartdata="{labels: chartLabels, datasets: chartData[clientId]}"
                    v-if="chartDataLoaded"
                  ></daily-chart>
                </v-card>
              </div>
            </v-flex>
          </template>
        </v-layout>
      </v-flex>

      <!-- client tasks detailed -->
      <v-flex xs12>
        <h3 class="section-title">Detalizēta uzdevumu atskaite</h3>
        <!-- loop clients, shifts, tasks -->
        <v-layout v-for="(clientData, clientId) in dailyReportData.clientAllTasks" :key="clientId">
          <v-flex xs12 v-if="dailyReportData.clientQuickStats[clientId].total > 0">
            <h4 class="client-detail-title">{{clientData.clientName}}</h4>

            <!-- loop shifts -->
            <v-layout v-for="shiftNr in numberOfShifts" :key="shiftNr" wrap>
              <v-flex xs12>
                <h5 class="shift-detail-title">
                  {{shiftsToTxt[shiftNr-1]}}
                  <!-- get responsible for that shift -->
                  <span
                    v-if="getResponsibleForShift(clientId,shiftNr-1) != 'na'"
                  >- atbildīgs {{getResponsibleForShift(clientId,shiftNr-1)}}</span>
                </h5>
              </v-flex>
              <!-- loop tasks -->
              <v-flex xs12 v-for="(task, taskId) in clientData.tasks" :key="taskId">
                <v-layout v-if="shiftNr-1 == task.lpTaskShiftNumber" wrap>
                  <v-flex xs12>
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
                    <span v-if="task.status == 'open'">
                      <v-icon small color="error">error</v-icon>
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
                    <!-- close time -->
                    <span v-if="task.status != 'open'">(plkst. {{closeTime(task.closedAt.seconds)}})</span>

                    <!-- comments -->
                    <span
                      v-if="typeof task.latecheck != 'undefined'"
                      class="task-latecheck"
                    >#latecheck</span>
                    <span v-if="task.comment != ''" class="task-comment">Komentārs: {{task.comment}}</span>

                    <!-- different user -->
                    <template v-if="task.status != 'open'">
                      <span
                        v-if="task.responsible != task.closedBy"
                        class="task-comment"
                      >Aizvēra: {{userData[task.closedBy] ? userData[task.closedBy].displayName : 'cits lietotājs'}}</span>
                    </template>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
            <v-divider></v-divider>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import DailyChart from '@/comp/DailyChart.vue';
import ListStats from '@/comp/ListStats.vue';

export default {
  data() {
    return {
      newVersionVisits: true,
      dailyReportData: {},
      photoTasks: [],
      userData: {},
      incidents: {},
      vitals: {},
      clientDataL: {},
      //map
      maps: {},
      infoContent: '',
      infoWindowPos: null,
      infoWinOpen: false,
      currentMidx: null,
      //optional: offset infowindow so it visually sits nicely on top of our marker
      infoOptions: {
        pixelOffset: {
          width: 0,
          height: -35,
        },
      },
      numberOfShifts: 3, //manualy change
      shiftsToTxt: { 0: 'Rīts', 1: 'Pusdiena', 2: 'Vakars' },
      progressBar: true,
      chartDataLoaded: false,

      chartLabels: [],
      chartData: {},
    };
  },
  components: {
    DailyChart,
    ListStats,
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();
    var reportId = this.$route.params.id;

    //initialize all necessary prommises
    var usersPromise = db.collection('users').get();

    var reportPromise = db
      .collection('dailyReports')
      .doc(reportId)
      .get();

    var incidentsPromise = db
      .collection('incidents')
      .where('dateFormatted', '==', reportId)
      .get();

    var vitalsPromise = db
      .collection('bodyVitals')
      .where('dateFormatted', '==', reportId)
      .get();

    var clientsPromise = db.collection('clients').get();

    //wait for all data to load and only then work with it
    Promise.all([
      usersPromise,
      reportPromise,
      incidentsPromise,
      vitalsPromise,
      clientsPromise,
    ]).then(function(values) {
      //users
      const userSnapshot = values[0];
      var usersL = {};
      userSnapshot.forEach(function(doc) {
        usersL[doc.id] = doc.data();
      });
      vm.userData = Object.assign({}, usersL);

      //report data
      var reportData = values[1].data();
      reportData['id'] = values[1].id;
      vm.dailyReportData = Object.assign({}, reportData);
      vm.createMapObject(reportData);
      vm.createPhotoTasks(reportData);
      vm.createChartData(reportData, db);

      //new version visits?
      if (typeof reportData.visits == 'undefined') {
        vm.newVersionVisits = false;
      }

      //incidents
      const incSnapshot = values[2];
      var incidentsL = {};
      incSnapshot.forEach(function(doc) {
        incidentsL[doc.id] = doc.data();
      });
      vm.incidents = Object.assign({}, incidentsL);

      //vitals
      const vitSnapshot = values[3];
      var vitalsL = {};
      vitSnapshot.forEach(function(doc) {
        vitalsL[doc.id] = doc.data();
      });
      vm.vitals = Object.assign({}, vitalsL);

      //clients
      const clientsSnapshot = values[4];
      var clientDataL = {};
      clientsSnapshot.forEach(function(doc) {
        clientDataL[doc.id] = doc.data();
      });
      vm.clientData = Object.assign({}, clientDataL);

      //data is loaded
      vm.progressBar = false;
    });
  },
  methods: {
    sortVisits(visitsObj) {
      var visitsArr = Object.values(visitsObj);
      visitsArr.sort(
        (a, b) => parseInt(a.startAt.seconds) - parseInt(b.startAt.seconds)
      );
      return visitsArr;
    },
    showUserStats(userStatsTotal, newVersionVisits, userId) {
      var vm = this;
      var showUser = false;

      if (newVersionVisits) {
        if (
          userStatsTotal > 0 ||
          Object.keys(vm.dailyReportData.visits.visitsByUsers[userId]).length >
            0
        ) {
          showUser = true;
        }
      } else {
        if (userStatsTotal > 0) {
          showUser = true;
        }
      }
      return showUser;
    },
    chartDataObj() {
      const chartDataObj = {
        open: 0,
        postponed: 0,
        canceled: 0,
        doneIdr: 0,
        independent: 0,
        supervised: 0,
        assisted: 0,
      };

      return chartDataObj;
    },
    statObj() {
      const statObj = [
        {
          type: 'bar',
          label: 'Neatzīmēti',
          data: [],
          backgroundColor: '#EF5350',
          fill: false,
        },
        {
          type: 'bar',
          label: 'Pārcelti',
          backgroundColor: '#B0BEC5',
          data: [],
        },
        {
          type: 'bar',
          label: 'Atcelti',
          backgroundColor: '#78909C',
          data: [],
        },
        {
          type: 'bar',
          label: 'Netiešie',
          backgroundColor: '#80CBC4',
          data: [],
        },
        {
          type: 'bar',
          label: 'Patstāvīgi',
          backgroundColor: '#81C784',
          data: [],
        },
        {
          type: 'bar',
          label: 'Uzraudzībā',
          backgroundColor: '#43A047',
          data: [],
        },
        {
          type: 'bar',
          label: 'Ar palīdzību',
          backgroundColor: '#2E7D32',
          data: [],
        },
      ];

      return statObj;
    },
    async createChartData(repData, db) {
      var vm = this;

      var repDate = repData.reportDate;

      var histRepSnapshot = await db
        .collection('dailyReports')
        .orderBy('reportDate', 'desc')
        .where('reportDate', '<=', new Date(repDate.seconds * 1000))
        .limit(7)
        .get(); //get last 7 reports

      //historical reports
      var histRepData = {};
      histRepSnapshot.forEach(function(doc) {
        histRepData[doc.id] = doc.data();
      });

      const reportKeys = Object.keys(histRepData).reverse();
      vm.chartLabels = reportKeys;

      const statKeys = Object.keys(vm.chartDataObj());

      //create chart object
      var chartDataL = {};
      chartDataL['totalQuickStats'] = vm.statObj();

      //loop clients from this report
      const lastReportIdx = reportKeys.length - 1;
      const lastReportClientData =
        histRepData[reportKeys[lastReportIdx]].clientQuickStats;
      const clientKeys = Object.keys(lastReportClientData);

      clientKeys.forEach(cl => {
        //only those who have stats
        if (lastReportClientData[cl].total > 0) {
          chartDataL[cl] = vm.statObj();
        }
      });

      //loop users from this report
      const lastReportUserData =
        histRepData[reportKeys[lastReportIdx]].userQuickStats;
      const userKeys = Object.keys(lastReportUserData);

      userKeys.forEach(userId => {
        chartDataL[userId] = vm.statObj();
      });

      //loop reports
      reportKeys.forEach(repKey => {
        //total stats
        const stats = histRepData[repKey].totalQuickStats;

        //loop statKeys
        statKeys.forEach((statKey, statIndx) => {
          chartDataL['totalQuickStats'][statIndx].data.push(stats[statKey]);

          //loop clients
          clientKeys.forEach(clientId => {
            const clientStats = histRepData[repKey].clientQuickStats[clientId];
            //only those who have stats
            if (lastReportClientData[clientId].total) {
              //check if has data in that report
              if (typeof clientStats != 'undefined') {
                chartDataL[clientId][statIndx].data.push(clientStats[statKey]);
              } else {
                //has no stats for that report
                chartDataL[clientId][statIndx].data.push(0);
              }
            }
          }); //end clients

          //loop users
          userKeys.forEach(userId => {
            const userStats = histRepData[repKey].userQuickStats[userId];
            //only those who have stats
            if (lastReportUserData[userId].total) {
              //check if has data in that report
              if (typeof userStats != 'undefined') {
                chartDataL[userId][statIndx].data.push(userStats[statKey]);
              } else {
                //has no stats for that report
                chartDataL[userId][statIndx].data.push(0);
              }
            }
          }); //end clients
        });
      }); //end for report

      //save
      vm.chartData = Object.assign({}, chartDataL);
      vm.chartDataLoaded = true;
    },
    getResponsibleForShift(clientId, shiftNr) {
      var vm = this;
      const responsibleId =
        vm.dailyReportData.responsibleForShifts[clientId][shiftNr];
      if (typeof responsibleId != 'undefined') {
        if (typeof vm.userData[responsibleId] != 'undefined') {
          return vm.userData[responsibleId].displayName;
        } else {
          return 'user undefined';
        }
      } else {
        return 'na';
      }
    },
    toggleInfoWindow: function(marker, idx) {
      this.infoWindowPos = marker.position;
      this.infoContent = marker.infoText;
      //check if its the same marker that was selected if yes toggle
      if (this.currentMidx == idx) {
        this.infoWinOpen = !this.infoWinOpen;
      }
      //if different marker set infowindow to open and reset current marker index
      else {
        this.infoWinOpen = true;
        this.currentMidx = idx;
      }
    },
    createPhotoTasks(data) {
      if (typeof data != 'undefined') {
        var vm = this;
        const clientKeys = Object.keys(data.clientAllTasks);
        //loop clients
        for (let ci in clientKeys) {
          const clientId = clientKeys[ci];
          const clientName = data.clientAllTasks[clientId].clientName;
          const clientTaskKeys = Object.keys(
            data.clientAllTasks[clientId].tasks
          );
          //loop client tasks
          for (let ti in clientTaskKeys) {
            const taskId = clientTaskKeys[ti];
            if (
              data.clientAllTasks[clientId].tasks[taskId].photoUrl.length > 0
            ) {
              var taskData = data.clientAllTasks[clientId].tasks[taskId];
              taskData['clientName'] = clientName;
              vm.photoTasks.push(taskData);
            }
          }
        } //end for clientKeys
      }
    },
    createMapObject(data) {
      var vm = this;
      if (typeof data.visits != 'undefined') {
        var mapsL = {};
        const userKeys = Object.keys(data.visits.visitsByUsers);
        //loop users
        for (var u = 0; u < userKeys.length; u++) {
          const userId = userKeys[u];

          //if has any location data
          if (Object.keys(data.visits.visitsByUsers[userId]).length > 0) {
            mapsL[userId] = {
              mapCenter: { lat: null, lng: null },
              userMarkers: [],
            };
            //loop visits to create markers
            const visitKeys = Object.keys(data.visits.visitsByUsers[userId]);
            for (
              var v = 0;
              v < Object.keys(data.visits.visitsByUsers[userId]).length;
              v++
            ) {
              const visitId = visitKeys[v];
              const visitData = data.visits.visitsByUsers[userId][visitId];
              const visitLocation = visitData.location;

              mapsL[userId].mapCenter.lat = visitLocation.latitude;
              mapsL[userId].mapCenter.lng = visitLocation.longitude;
              mapsL[userId].userMarkers.push({
                clientId: visitData.clientId,
                position: {
                  lat: visitLocation.latitude,
                  lng: visitLocation.longitude,
                },
                infoText:
                  visitData.clientName +
                  ' - ' +
                  visitData.duration +
                  ' (' +
                  vm.closeTime(visitData.startAt.seconds) +
                  ')',
              });
            } //end for visits
            //loop tasks to create markers
            // for (var t = 0; t < data.userGpsTasks[userId].length; t++) {
            //   const task = data.userGpsTasks[userId][t];
            //   const taskData =
            //     data.clientAllTasks[task.clientId].tasks[task.taskId];
            //   const taskLocation = taskData.location;
            //   mapsL[userId].mapCenter.lat = taskLocation.latitude;
            //   mapsL[userId].mapCenter.lng = taskLocation.longitude;
            //   mapsL[userId].userMarkers.push({
            //     clientId: task.clientId,
            //     position: {
            //       lat: taskLocation.latitude,
            //       lng: taskLocation.longitude
            //     },
            //     infoText:
            //       data.clientAllTasks[task.clientId].clientName +
            //       " - " +
            //       taskData.lpTaskNumber +
            //       " " +
            //       taskData.lpTaskName +
            //       " (" +
            //       vm.closeTime(taskData.closedAt.seconds) +
            //       ")"
            //   });
            // }
          } //end if has data
        } //end for users

        vm.maps = Object.assign({}, mapsL);

        return;
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
    formatDateFromRaw(seconds) {
      var date = new Date(seconds * 1000).toISOString().substr(0, 10);
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
  },
};
</script>

<style>
#dashboard-container {
  color: grey;
}
.no-bullet-ul {
  list-style-type: none;
  margin: 0;
}
.section-title {
  background-color: lightgray;
  margin-top: 20px;
}
.shift-detail-title {
  margin-top: 5px;
}
.client-detail-title {
  margin-top: 10px;
  background-color: #e3f2fd;
}
.task-comment {
  background-color: lightgoldenrodyellow;
}
.task-latecheck {
  background-color: lightsalmon;
  margin-right: 3px;
  margin-left: 3px;
}
.chart-container {
  margin-left: 10px;
}
.name-flex {
  background-color: #e3f2fd;
}
</style>




