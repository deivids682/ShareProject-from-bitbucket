<template>
  <v-container id="dashboard-container">
    <h1>Dienas atskaites</h1>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <!-- dashboard -->
    <v-layout row wrap v-if="!progressBar">
      <!-- last day -->
      <v-flex xs12 md6 lg6>
        <h3>Iepriekšējā diena</h3>
        <h4>{{latestReport.dateId}}</h4>
        <br />
        <div>
          <list-stats
            :statsData="latestReport.totalQuickStats"
            :visits="latestReport.visits.allVisits"
            :total="true"
          ></list-stats>
        </div>
        <br />
        <v-divider></v-divider>
        <br />
        <!-- chart -->
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

      <!-- all reports -->
      <v-flex xs12 md6 lg6 class="report-list">
        <!-- list reports -->
        <h3>Atskaites</h3>
        <v-btn-toggle v-model="btnToggle" dark mandatory>
          <v-btn
            small
            color="accent"
            @click="getReports(reportLimit)"
          >Pēdējas {{reportLimit}} atskaites</v-btn>
          <v-btn small color="accent" @click="getReports('all')">Visas atskaites</v-btn>
        </v-btn-toggle>
        <br />
        <br />
        <v-layout
          v-for="(date, dateId) in dailyReports"
          :key="dateId"
          class="narrow"
          @click="viewReport(dateId)"
        >
          <v-flex xs12 class="client-task">{{dateId}} - {{date.dayText}}</v-flex>
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
      dailyReports: {},
      reportLimit: 10,
      btnToggle: 0,
      latestReport: {},
      progressBar: true,
      chartDataLoaded: false,
      chartData: {},
    };
  },
  components: {
    DailyChart,
    ListStats,
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get daily reports
    var dailyReportsL = {};
    var latestReportL = {};
    var oldDate = new Date(1900, 1, 1);
    db.collection('dailyReports')
      .orderBy('reportDate', 'desc')
      .limit(vm.reportLimit)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          dailyReportsL[doc.id] = doc.data();

          //get latest report
          const reportDate = new Date(doc.data().reportDate.seconds * 1000);
          if (reportDate > oldDate) {
            oldDate = reportDate;
            var data = doc.data();
            data['dateId'] = doc.id;
            vm.latestReport = Object.assign({}, data);
            vm.createChartData(data, db);
          }
        });
        vm.dailyReports = Object.assign({}, dailyReportsL);
        vm.progressBar = false;
      });
  },
  methods: {
    getReports(reportLimit) {
      var vm = this;
      var db = firebase.firestore();
      vm.progressBar = true;
      var reportRef = db
        .collection('dailyReports')
        .orderBy('reportDate', 'desc')
        .limit(vm.reportLimit);

      //get all reports
      if (reportLimit == 'all') {
        reportRef = db.collection('dailyReports').orderBy('reportDate', 'desc');
      }

      reportRef.get().then(function(querySnapshot) {
        var dailyReportsL = {};
        querySnapshot.forEach(function(doc) {
          dailyReportsL[doc.id] = doc.data();
        });
        vm.dailyReports = Object.assign({}, dailyReportsL);
        vm.progressBar = false;
      });
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

      //loop reports
      reportKeys.forEach(repKey => {
        //total stats
        const stats = histRepData[repKey].totalQuickStats;

        //loop statKeys
        statKeys.forEach((statKey, statIndx) => {
          chartDataL['totalQuickStats'][statIndx].data.push(stats[statKey]);
        });
      }); //end for report

      //save
      vm.chartData = Object.assign({}, chartDataL);
      vm.chartDataLoaded = true;
    },
    viewReport(dateId) {
      this.$router.push({ name: 'dailyreportone', params: { id: dateId } });
    },
  },
};
</script>

<style>
#dashboard-container {
  color: grey;
}
.report-list {
  padding-left: 20px;
}
.narrow {
  max-width: 400px;
}
.client-task {
  border-bottom: 1px solid lightgray;
  margin-bottom: 1px;
  padding-left: 3px;
  color: grey;
}
.no-bullet-ul {
  list-style-type: none;
  margin: 0;
}
</style>




