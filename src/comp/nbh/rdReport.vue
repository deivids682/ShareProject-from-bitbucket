<template>
  <v-container>
    <v-row>
      <!-- <v-btn @click="prepDataForHistoricClients()" v-if="sudo"
        >Prep Hist Data</v-btn
      >-->

      <!-- report feedback -->
      <preparing-report v-if="reportDialog"></preparing-report>
      <!-- snackbar -->
      <v-col cols="12">
        <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
          {{ snackbarTxt }}
          <v-btn dark text @click="snackbar = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-col>
      <v-col cols="12" md="4" class="text-md-left">
        <v-dialog
          ref="dialog"
          v-model="monthDialog"
          :return-value.sync="date"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="date"
              label="Atskaite par mēnesi"
              prepend-icon="event"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker v-model="date" type="month" min="2019-10" :max="thisMonth">
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="monthDialog = false">Atcelt</v-btn>
            <v-btn text color="primary" @click="$refs.dialog.save(date)">Saglabāt</v-btn>
          </v-date-picker>
        </v-dialog>
      </v-col>
      <v-col cols="12" md="4" class="text-md-center">
        <v-btn color="accent" @click="prepareReport()">sagatavot atskaiti</v-btn>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" md="4" class="text-md-right">
        <v-btn @click="saveAsXlsx()" v-if="tableData.length > 0">Exportēt uz .xlsx</v-btn>
      </v-col>
      <v-col cols="12" lg="4" v-if="tableData.length > 0">
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
      <v-col cols="12" v-if="tableData.length > 0 && !reportDialog">
        <table id="report-table">
          <template v-for="(row, rowNr) in tableData">
            <tr v-if="showRow(row.value, row.data)" :key="rowNr" :class="row.style">
              <td v-for="(cell, colNr) in row.data" :key="colNr">
                <!-- aiders -->
                {{ cell }}
              </td>
            </tr>
          </template>
        </table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
//export to xlsx
//https://www.npmjs.com/package/xlsx-populate
import XlsxPopulate from 'xlsx-populate';

import PreparingReport from '@/comp/PreparingReport.vue';

export default {
  data() {
    return {
      reportDialog: false,
      monthDialog: false,
      searchValue: null,
      tableData: [],
      aiderData: {},
      date: new Date().toISOString().substr(0, 7),
      thisMonth: new Date().toISOString().substr(0, 7),
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  components: {
    PreparingReport,
  },
  methods: {
    showRow(rowValue, rowData) {
      var vm = this;
      var show = true;
      if (vm.searchValue && rowValue) {
        if (vm.searchValue.length > 2) {
          if (
            rowValue.toLowerCase().indexOf(vm.searchValue.toLowerCase()) === -1
          ) {
            show = false;
          }
        }
      }

      return show;
    },
    newClientRow(name) {
      //client data row, cell titles row
      return {
        style: 'newClientRow',
        value: name,
        data: [
          'Vārds',
          'Dzimšanas datums',
          'Adrese',
          'Tālrunis',
          '',
          '',
          '',
          '',
        ],
      };
    },
    emptyRow(name) {
      //client data row, cell titles row
      return {
        value: name,
        data: [],
      };
    },
    clientHeaderRow(name) {
      return {
        style: 'clientWeekHeaderRow',
        value: name,
        data: [],
      };
    },
    saveAsXlsx() {
      var vm = this;
      var title = 'prieksh share ' + vm.date;

      //report from to
      var repDates = vm.date.split('-');
      var repFrom = new Date(repDates[0], parseInt(repDates[1]) - 1, 1);
      var repTo = new Date(repDates[0], parseInt(repDates[1]), 0);
      var repTitleTxt = vm.formatDate(repFrom) + '-' + vm.formatDate(repTo);

      var reportArr = [['Atskaite par periodu'], [repTitleTxt], []];
      //add data rows

      for (var r = 0; r < vm.tableData.length; r++) {
        if (vm.showRow(vm.tableData[r].value)) {
          reportArr.push(vm.tableData[r].data);
        }
      }
      //add signatures
      reportArr.push(
        [],
        ['Datums: ' + vm.formatDate(repFrom)],
        [],
        []
      );
      const titleRowHeight = 50;
      XlsxPopulate.fromBlankAsync().then(workbook => {
        var lastRow = reportArr.length;
        var lastCol = reportArr[5].length;
        // Modify the workbook.
        var sheet = workbook.sheet('Sheet1');

        sheet.range(1, 1, lastRow, lastCol).value(reportArr);

        // format rows

        var newClientRow = 0;
        for (var r = 1; r < lastRow + 1; r++) {
          if (!sheet.cell(r, 1).value()) {
            newClientRow = r;
          }

          var dataRow = r - newClientRow;
          //format client header row
          if (dataRow == 0) {
            sheet.row(r).height(10);
          } else if (dataRow == 1 && r > 1 && lastRow - r > 3) {
            sheet
              .row(r)
              .style({
                bold: true,
                fill: 'b1b1b1',
                topBorder: true,
                bottomBorder: true,
              })
              .height(30);
          } else if (dataRow == 2) {
            sheet.cell(r, 1).style('bold', true);
            sheet.row(r).height(30);
          } else if (dataRow == 3) {
            sheet
              .row(r)
              .style({
                bold: true,
                fontSize: 10,
                fill: 'dddddd',
                topBorder: true,
                bottomBorder: true,
              })
              .height(60);
          } else {
            sheet
              .row(r)
              .style('fontSize', 10)
              .height(30);
          }

          if (r == 1) {
            sheet
              .row(r)
              .style({ fontSize: 14, bold: true })
              .height(30);
          }
          if (r == 2) {
            sheet.row(r).style('fontSize', 13);
          }
          if (lastRow - r <= 3) {
            sheet
              .row(r)
              .style({ fontSize: 10, bold: false })
              .height(15);
          }

          //format columns
          for (var c = 1; c < lastCol + 1; c++) {
            sheet
              .column(c)
              .width(20)
              .style({ wrapText: true, verticalAlignment: 'top' });

            //format cell
          } //end for col
        } //end for row

        //merge first to rows
        sheet
          .range(1, 1, 1, lastCol)
          .merged(true)
          .style({ horizontalAlignment: 'center' });
        sheet
          .range(2, 1, 2, lastCol)
          .merged(true)
          .style({ horizontalAlignment: 'center' });
        sheet.cell(1, 1).style({ horizontalAlignment: 'center' });

        // Write to file.
        workbook.outputAsync().then(function(blob) {
          if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            // If IE, you must uses a different method.
            window.navigator.msSaveOrOpenBlob(blob, title + '.xlsx');
          } else {
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            document.body.appendChild(a);
            a.href = url;
            a.download = title + '.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        });
      });
    },
    async prepareReport() {
      var vm = this;
      var db = firebase.firestore();
      //15 min per time task
      const additionalSecondsPerTimeTask = 15 * 60;
      var tableDataL = [];
      vm.reportDialog = true;

      //get report data
      var repProm = db
        .collection('nbhRdMonthlyReports')
        .doc(vm.date)
        .get();

      //get rd clients
      var clientsProm = db
        .collection('clients')
        .where('clientProfile', '==', 'Rīgas Dome')
        .get();

      var values = await Promise.all([repProm, clientsProm]);
      var reportData = values[0].data();

      var aiderPromises = [];
      var getAidersId = Object.keys(vm.aiderData);
      var aiderDataL = vm.aiderData;

      values[1].forEach(client => {
        const clientId = client.id;
        var clientData = client.data();
        var clientWeeks = reportData[clientId];

        //create table rows
        if (clientWeeks) {
          //new client row
          //name, birth date, address, telephone, soc center
          var clientTitleRow = {
            style: 'clientHeaderDataRow',
            value: clientData.clientName,
            data: [
              clientData.clientName,
              clientData.birthDateFormatted,
              clientData.clientAddress,
              clientData.contactPersonContacts,
              clientData.rsdDistrict,
            ],
          };

          tableDataL.push(vm.newClientRow(clientData.clientName));
          tableDataL.push(clientTitleRow);
          tableDataL.push(vm.clientHeaderRow(clientData.clientName));
          const weeks = Object.keys(clientWeeks);
          var totalVisitTime = 0;
          var totalLateVisits = 0;
          for (var w = 0; w < weeks.length; w++) {
            if (weeks[w] !== 'clientName') {
              const visitTime =
                parseInt(clientWeeks[weeks[w]].visitsSec) +
                parseInt(clientWeeks[weeks[w]].timeTasks) *
                  additionalSecondsPerTimeTask;
              const wLateVisits = clientWeeks[weeks[w]].lateVisits;
              //count total visit time for the month
              totalVisitTime += visitTime;
              totalLateVisits += wLateVisits;
              //time tasks
              var time = vm.formatTime(visitTime);

              tableDataL.push({
                style: 'clientWeekRow',
                value: clientData.clientName,
                data: [
                  weeks[w],
                  time,
                  clientWeeks[weeks[w]].aiders,
                  clientData.rsdEnvironmentPlan ? 'x' : '',
                  clientData.rsdSocializationDescription,
                  clientData.rsdMonitoringDescription,
                  clientData.rsdEquipment,
                  wLateVisits,
                  '',
                ],
              });
            }

            //get aider data
            if (clientWeeks[weeks[w]].aiders) {
              for (var a = 0; a < clientWeeks[weeks[w]].aiders.length; a++) {
                var aiderId = clientWeeks[weeks[w]].aiders[a];
                if (getAidersId.indexOf(aiderId) == -1) {
                  getAidersId.push(aiderId);
                  aiderPromises.push(
                    db
                      .collection('users')
                      .doc(aiderId)
                      .get()
                  );
                }
              }
            }
          } //end for weeks
          //month total row
          tableDataL.push({
            style: 'clientWeekRow',
            value: clientData.clientName,
            data: [
              'Kopā',
              vm.formatTime(totalVisitTime),
              '',
              '',
              '',
              '',
              '',
              totalLateVisits,
              '',
            ],
          });

          //insert empty row for new client
          tableDataL.push(vm.emptyRow(clientData.clientName));
        } //end for client
      });

      var aiderDocs = await Promise.all(aiderPromises);
      for (var ad = 0; ad < aiderPromises.length; ad++) {
        aiderDataL[aiderDocs[ad].id] = aiderDocs[ad].data();
      }
      vm.aiderData = Object.assign({}, aiderDataL);
      //rewrite aider ids to aider names
      vm.formatAiders(tableDataL);

      vm.reportDialog = false;
    },
    formatAiders(tableData) {
      var vm = this;
      //loop rows, if object, then format aiders
      var resArr = [];
      for (var r = 0; r < tableData.length; r++) {
        if (tableData[r].data) {
          if (typeof tableData[r].data[2] == 'object') {
            //format aiders
            var aiders = '';
            for (var i = 0; i < tableData[r].data[2].length; i++) {
              var aiderId = tableData[r].data[2][i];
              aiders += vm.aiderData[aiderId].displayName;
              if (i < tableData[r].data[2].length - 1) {
                aiders += ', ';
              }
            }
            tableData[r].data[2] = aiders;
            resArr.push(tableData[r]);
          } else {
            resArr.push(tableData[r]);
          }
        } else {
          resArr.push(tableData[r]);
        }
      }
      vm.tableData = [];
      vm.tableData = resArr;
    },
    async prepDataForHistoricClients() {
      var vm = this;
      var db = firebase.firestore();
      var batch = db.batch();
      const timeTasks = [2501, 2502, 2503, 2504, 2505, 2506, 2507];

      //from oct 1
      var firstDate = new Date(2019, 9, 1);
      var lastDate = new Date();
      var daysBetween = Math.round(
        (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      );

      //get visits from date
      var visitsSnap = await db
        .collection('visits')
        .where('startAt', '>=', firstDate)
        .get();
      console.log('visits size ', visitsSnap.size);

      var localDB = {};
      visitsSnap.forEach(visit => {
        const vdata = visit.data();
        const clientId = vdata.clientId;
        var visitDate = new Date(vdata.startAt.seconds * 1000);
        const visitHour = visitDate.getHours();
        var month = visitDate.getMonth() + 1;
        if (month < 10) {
          month = '0' + month;
        }
        var monthKey = visitDate.getFullYear() + '-' + month;
        var weekKey = vm.getWeekKey(visitDate);

        //store in local
        //if new month
        if (!localDB[monthKey]) {
          localDB[monthKey] = {};
        }
        //if new client
        if (!localDB[monthKey][clientId]) {
          localDB[monthKey][clientId] = { clientName: vdata.clientName };
        }
        //if new week
        if (!localDB[monthKey][clientId][weekKey]) {
          localDB[monthKey][clientId][weekKey] = {
            week: weekKey,
            visits: 0,
            lateVisits: 0,
            visitsSec: 0,
            timeTasks: 0,
            aiders: [],
            orderByDate: visitDate.getTime(),
          };
        }
        //store data
        localDB[monthKey][clientId][weekKey].visits++;
        const visitDurationInSec = vdata.endAt.seconds - vdata.startAt.seconds;
        localDB[monthKey][clientId][weekKey].visitsSec += visitDurationInSec;
        // if late visit
        if (visitHour >= 18) {
          localDB[monthKey][clientId][weekKey].lateVisits++;
        }
        //aiders
        if (
          localDB[monthKey][clientId][weekKey].aiders.indexOf(vdata.user) == -1
        ) {
          localDB[monthKey][clientId][weekKey].aiders.push(vdata.user);
        }
      });

      //get tasks from date
      var taskPromises = [];
      for (var i = 0; i < timeTasks.length; i++) {
        var tprom = db
          .collection('taskArchive')
          .where('closedAt', '>=', firstDate)
          .where('lpTaskNumber', '==', timeTasks[i])
          .get();
        taskPromises.push(tprom);
      }
      console.log('get tasks ', taskPromises.length);
      var values = await Promise.all(taskPromises);
      console.log('analyze tasks ');
      for (var v = 0; v < values.length; v++) {
        values[v].forEach(task => {
          var tdata = task.data();
          const clientId = tdata.clientId;
          var taskDate = new Date(tdata.lpTaskDate.seconds * 1000);
          var month = taskDate.getMonth() + 1;
          if (month < 10) {
            month = '0' + month;
          }
          var monthKey = taskDate.getFullYear() + '-' + month;
          var weekKey = vm.getWeekKey(taskDate);

          //save in local db
          if (localDB[monthKey][clientId]) {
            //if new week
            if (!localDB[monthKey][clientId][weekKey]) {
              localDB[monthKey][clientId][weekKey] = {
                week: weekKey,
                visits: 0,
                visitsSec: 0,
                timeTasks: 0,
                aiders: [],
                orderByDate: taskDate.getTime(),
              };
            }
            localDB[monthKey][clientId][weekKey].timeTasks++;
          }
        });
      }
      //save in db
      var monthKeys = Object.keys(localDB);
      console.log('save in db');

      for (var k = 0; k < monthKeys.length; k++) {
        var setRef = db.collection('nbhRdMonthlyReports').doc(monthKeys[k]);
        batch.set(setRef, localDB[monthKeys[k]]);
      }
      //write in db
      console.log('await batch');
      await batch.commit();
      console.log('fin');
    },
    getWeekKey(date) {
      var vm = this;
      var day = date.getDay();
      if (day === 0) {
        day = 7;
      }
      var daysFromMonday = 1 - day;
      var monday = vm.addDays(date, daysFromMonday);
      var daysToSunday = 7 - day;
      var sunday = vm.addDays(date, daysToSunday);

      //chech if short week
      if (date.getMonth() !== monday.getMonth()) {
        monday = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      if (date.getMonth() !== sunday.getMonth()) {
        sunday = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      }

      return vm.formatDate(monday) + '-' + vm.formatDate(sunday);
    },
    addDays(date, days) {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },
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

<style scoped>
#report-table {
  border-collapse: collapse;
}
#report-table tr {
  background-color: #fff;
}

.newClientRow td {
  color: #fff;
  line-height: 1.4;
  background-color: #827090;
  text-align: center;
}
.clientHeaderDataRow td {
  font-weight: 600;
}
.clientWeekHeaderRow td {
  line-height: 1.2;
  font-size: 0.9em;
  background-color: #ded9e1;
  text-align: center;
}

.clientWeekRow td {
  border-bottom: #827090 1px solid;
  font-weight: 300;
  font-size: 0.8em;
  text-align: center;
}
</style>
