<template>
  <v-container>
    <v-row align="center" justify="space-around">
      <!-- snackbar -->
      <v-col cols="12">
        <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
          {{ snackbarTxt }}
          <v-btn dark text @click="snackbar = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-col>

      <!-- report feedback -->
      <preparing-report v-if="reportDialog"></preparing-report>

      <v-col cols="12">
        <v-card-actions>
          <v-btn color="accent" @click="prepareReport()">sagatavot atskaiti</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="saveAsXlsx()" v-if="Object.keys(clientData).length > 0">Exportēt uz .xls</v-btn>
        </v-card-actions>
      </v-col>

      <v-col cols="12" v-if="Object.keys(clientData).length > 0">
        <v-data-table :headers="headers" :items="Object.values(clientData)" class="elevation-1"></v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
//export to xlsx
import zipcelx from 'zipcelx';

import PreparingReport from '@/comp/PreparingReport.vue';

export default {
  data() {
    return {
      reportDialog: false,
      clientData: {},
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      headers: [
        { text: 'Klients', value: 'clientName' },
        {
          text: 'Pirmais pakalpojuma sniegšanas datums',
          value: 'firstDate',
          align: 'center',
        },
        {
          text: 'Pēdējais pakalpojuma sniegšanas datums',
          value: 'lastDate',
          align: 'center',
        },
        {
          text: 'Kopējais pakalpojuma dienu skaits',
          value: 'totalDays',
          align: 'center',
        },
        {
          text: 'Pakalpojuma sniegšanas dienu skaits',
          value: 'activeDays',
          align: 'center',
        },
        {
          text: 'Neaktīvo dienu skaits',
          value: 'inactiveDays',
          align: 'center',
        },
        { text: 'Vizītes kopā', value: 'numberOfVisits', align: 'center' },
        { text: 'Vizītes vid. dienā', value: 'visitsPerDay', align: 'center' },
        {
          text: 'Vizītes vid. nedēļā',
          value: 'visitsPerWeek',
          align: 'center',
        },
        {
          text: 'Vizītes vid. mēnesī',
          value: 'visitsPerMonth',
          align: 'center',
        },
        {
          text: 'Vidējais vizītes ilgums',
          value: 'visitAverageSecondsFormat',
          align: 'center',
        },
        {
          text: 'Mediāna vizītes ilgums',
          value: 'visitMedianSecondsFormat',
          align: 'center',
        },
        { text: 'Klienta statuss', value: 'clientStatus', align: 'center' },
      ],
    };
  },
  components: {
    PreparingReport,
  },
  methods: {
    saveAsXlsx() {
      var vm = this;
      const filename = 'MOK-service-report-' + vm.formatDate();
      //header row
      var sheetData = [
        [
          {
            value: 'Klients',
            type: 'string',
          },
          {
            value: 'Pirmais pakalpojuma sniegšanas datums',
            type: 'string',
          },
          {
            value: 'Pēdējais pakalpojuma sniegšanas datums',
            type: 'string',
          },
          {
            value: 'Kopējais pakalpojuma dienu skaits',
            type: 'string',
          },
          {
            value: 'Pakalpojuma sniegšanas dienu skaits',
            type: 'string',
          },
          {
            value: 'Neaktīvo dienu skaits',
            type: 'string',
          },
          {
            value: 'Vizītes kopā',
            type: 'string',
          },
          {
            value: 'Vizītes vid. dienā',
            type: 'string',
          },
          {
            value: 'Vizītes vid. nedēļā',
            type: 'string',
          },
          {
            value: 'Vizītes vid. mēnesī',
            type: 'string',
          },
          {
            value: 'Vidējais vizītes ilgums',
            type: 'string',
          },
          {
            value: 'Vidējais vizītes ilgums, sec',
            type: 'string',
          },

          {
            value: 'Mediāna vizītes ilgums',
            type: 'string',
          },
          {
            value: 'Mediāna vizītes ilgums, sec',
            type: 'string',
          },

          {
            value: 'Klienta statuss',
            type: 'string',
          },
          {
            value: 'Profils',
            type: 'string',
          },
        ],
      ];

      //body data
      for (var clientId in vm.clientData) {
        const client = vm.clientData[clientId];
        sheetData.push([
          {
            value: client.clientName,
            type: 'string',
          },
          {
            value: client.firstDate,
            type: 'string',
          },
          {
            value: client.lastDate,
            type: 'string',
          },
          {
            value: client.totalDays,
            type: 'number',
          },
          {
            value: client.activeDays,
            type: 'number',
          },
          {
            value: client.inactiveDays,
            type: 'number',
          },
          {
            value: client.numberOfVisits,
            type: 'number',
          },
          {
            value: client.visitsPerDay,
            type: 'number',
          },
          {
            value: client.visitsPerWeek,
            type: 'number',
          },
          {
            value: client.visitsPerMonth,
            type: 'number',
          },
          {
            value: client.visitAverageSecondsFormat,
            type: 'string',
          },
          {
            value: client.visitAverageSeconds,
            type: 'number',
          },
          {
            value: client.visitMedianSecondsFormat,
            type: 'string',
          },
          {
            value: client.visitMedianSeconds,
            type: 'number',
          },
          {
            value: client.clientStatus,
            type: 'string',
          },
          {
            value: client.clientProfile,
            type: 'string',
          },
        ]);
      }

      //download
      const config = {
        filename: filename,
        sheet: {
          data: sheetData,
        },
      };

      zipcelx(config);
    },
    async prepareReport() {
      var vm = this;
      var db = firebase.firestore();

      vm.reportDialog = true;

      //get clients
      var clientsSnap = await db
        .collection('clients')
        .where('clientServices', '==', 'neighborhood')
        .orderBy('clientName')
        .get();

      //loop clients
      var clientDataL = {};
      var clientIds = [];
      var visitsProm = [];
      clientsSnap.forEach(async client => {
        clientIds.push(client.id);
        clientDataL[client.id] = client.data();
        //sort array
        var sortArr = [];
        if (clientDataL[client.id].clientsDailyReports) {
          sortArr = vm.sortByDate(clientDataL[client.id].clientsDailyReports);
        }
        //get first day, last day, total days
        clientDataL[client.id]['firstDate'] = vm.getFirstDate(sortArr);
        clientDataL[client.id]['lastDate'] = vm.getLastDate(sortArr);
        clientDataL[client.id]['activeDays'] = vm.getActiveDays(client.data());
        clientDataL[client.id]['inactiveDays'] = vm.getInactiveDays(
          client.data()
        );
        clientDataL[client.id]['totalDays'] =
          clientDataL[client.id]['activeDays'] +
          clientDataL[client.id]['inactiveDays'];

        //visits
        clientDataL[client.id]['numberOfVisits'] = client.data().visitDurations
          ? client.data().visitDurations.length
          : 0;

        clientDataL[client.id]['visitsPerDay'] = (
          clientDataL[client.id]['numberOfVisits'] /
          clientDataL[client.id]['activeDays']
        ).toFixed(2);
        clientDataL[client.id]['visitsPerWeek'] = (
          (clientDataL[client.id]['numberOfVisits'] /
            clientDataL[client.id]['activeDays']) *
          7
        ).toFixed(2);
        clientDataL[client.id]['visitsPerMonth'] = (
          (clientDataL[client.id]['numberOfVisits'] /
            clientDataL[client.id]['activeDays']) *
          30.5
        ).toFixed(2);

        clientDataL[client.id]['visitAverageSeconds'] = client.data()
          .visitTotalSeconds
          ? Math.floor(
              client.data().visitTotalSeconds /
                clientDataL[client.id]['numberOfVisits']
            )
          : 0;
        clientDataL[client.id]['visitAverageSecondsFormat'] = vm.formatTime(
          clientDataL[client.id]['visitAverageSeconds']
        );
        clientDataL[client.id]['visitMedianSeconds'] = vm.getMedianVisit(
          client.data().visitDurations
        );
        clientDataL[client.id]['visitMedianSecondsFormat'] = vm.formatTime(
          clientDataL[client.id]['visitMedianSeconds']
        );
      });

      vm.clientData = Object.assign({}, clientDataL);
      vm.reportDialog = false;
    },
    getMedianVisit(arr) {
      const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    },
    getInactiveDays(clientData) {
      if (clientData.clientsPauseDates) {
        return clientData.clientsPauseDates.length;
      } else {
        return 0;
      }
    },
    getActiveDays(clientData) {
      if (clientData.clientsDailyReports) {
        return clientData.clientsDailyReports.length;
      } else {
        return 0;
      }
    },
    getLastDate(sortArr) {
      if (sortArr.length > 0) {
        const length = sortArr.length;
        return sortArr[0];
      } else {
        return '-';
      }
    },
    getFirstDate(sortArr) {
      if (sortArr.length > 0) {
        const length = sortArr.length;
        return sortArr[length - 1];
      } else {
        return '-';
      }
    },
    sortByDate(array) {
      array.sort((a, b) => {
        a = this.createDate(a);
        b = this.createDate(b);
        return a > b ? -1 : a < b ? 1 : 0;
      });
      return array;
    },
    createDate(dateString) {
      var dateArr = dateString.split('.');
      var date = dateArr[0];
      var month = parseInt(dateArr[1]) - 1;
      var year = dateArr[2];
      return new Date(year, month, date);
    },
    formatDate() {
      var date = new Date().toISOString().substr(0, 10);
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}`;
    },
    formatTime(seconds) {
      if (!seconds) {
        return 'NA';
      }
      var secondsPassed = seconds;
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
  },
};
</script>