<template>
  <v-container>
    <v-row>
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
      <v-col class="d-flex" cols="12" md="4">
        <v-select
          :items="companies"
          item-text="title"
          v-model="company"
          label="Uzņemums"
          :error="companyError"
          :rules="rulesRequired"
          return-object
        ></v-select>
      </v-col>
      <v-col cols="12" md="4" class="text-md-right">
        <v-btn color="accent" @click="calculateReports()">Sagatavot atskaiti</v-btn>
      </v-col>
      <v-col cols="12" md="12" class="text-md-right">
        <v-btn @click="saveAsXlsx()" v-if="reportData.length > 0">Exportēt uz .xlsx</v-btn>
      </v-col>
      <v-col cols="12" v-if="reportData.length > 0">
        <v-data-table :headers="headers" :items="reportData"></v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import PreparingReport from '@/comp/PreparingReport.vue';
import undefined from 'firebase/firestore';
const fetch = require('node-fetch');

export default {
  data() {
    return {
      companies: [],
      profiles: {},
      company: null,
      reportData: [],
      clients: [],
      companyError: false,
      reportDialog: false,
      monthDialog: false,
      searchValue: null,
      date: new Date().toISOString().substr(0, 7),
      thisMonth: new Date().toISOString().substr(0, 7),
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      rulesRequired: [value => !!value || 'Nepieciešams aizpildīt.'],
      options: {},
      headers: [
        "prieksh share"
      ],
    };
  },
  components: {
    PreparingReport,
  },

  async created() {
    let db = firebase.firestore();
    this.progressBar = true;

    let companiesSnapshot = await db.collection('companies').get();

    let companiesL = [];
    companiesSnapshot.forEach(function(doc) {
      let data = doc.data();
      data['id'] = doc.id;
      companiesL.push(data);
    });
    this.companies = companiesL;
    this.progressBar = false;
  },

  methods: {
    async saveAsXlsx() {
      const [year, month] = this.date.split('-');
      console.log(this.reportData);
      const ACCESS_TOKEN = //TODO need to create api call to Oauth2 to genereate token; now posible to generete manualy using https://developers.google.com/oauthplayground/
        'AEu4IL2tDoqTDv269CbAEpwNW5F4CVcJFkVLRa5cTkcP4s6D74EYIPXY6HyqeMHuXnadhmhgRg2b09X43a1tgZc6z96T0GyimeQenDlgwlhe2ppn1MYBlIqFoaTYPSckfvBb_4Fu_Fbu5qiyXo7dktuywELeQoWuYQ9rHXnRO72kzVHw4vXQYNM6KNIYTFg2QKi6WL7qGrVDalYTgS5q8HBstNdqFWwGzh44AzhIKyMwQ61KSRIwLLdGAZ0qaLzijjztrD_gtqh2alM3qD0tdYjKa_ozYXPcUOjPF-6xkbm9Ea6tQjsXo3QJSl_CKdw-VMV8D2fNfWB92KD5u9fYd8G-EiPTb6iZa1XJwQkpctRBuBagiregKQR7DlKluQYqYjwxGiXU2BuKDvORmHl-8j63kngb3_weG0HVhhwWrX83RpmNmZbWtz-estUiOxrKtB-B6qCGO6dtXcznU_tfVkqWRhAPwB_zqQ';
      let create = await this.createSheet(
        `Rigas Domes atskaite par ${year}. gada ${month} mēnesi, Uzņēmuma nosaukums: ${this.company}`,
        ACCESS_TOKEN
      );
      let update = await this.updateSheet(
        create.spreadsheetId,
        ACCESS_TOKEN,
        this.reportData
      );
      let format = await this.formatSheet(create.spreadsheetId, ACCESS_TOKEN);
      window.open(create.spreadsheetUrl);
    },

    async updateSheet(id, token, data) {
      const preperedData = this.prepereData(data);

      //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request
      //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate?apix_params=%7B%22spreadsheetId%22%3A%221zxcVOmOKzPEmOgJ9ENKf4QgQ5xaRjlidXdr4KABXq6c%22%2C%22resource%22%3A%7B%22valueInputOption%22%3A%22RAW%22%2C%22data%22%3A%5B%7B%22range%22%3A%22A2%22%2C%22values%22%3A%5B%5B%22test%22%2C%22test2%22%5D%5D%7D%5D%7D%7D
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate?alt=json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            data: preperedData,
          }),
        }
      );

      return await response.json();
    },

    async formatSheet(id, token) {
      //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate?apix_params=%7B%22spreadsheetId%22%3A%221ro-lr68vMgP3jX0N9QXZ-xd32me_Pff0Y14XhZA61h8%22%2C%22resource%22%3A%7B%22requests%22%3A%5B%7B%22repeatCell%22%3A%7B%22range%22%3A%7B%22startRowIndex%22%3A0%2C%22endRowIndex%22%3A11%2C%22startColumnIndex%22%3A0%2C%22endColumnIndex%22%3A1%7D%2C%22cell%22%3A%7B%22userEnteredFormat%22%3A%7B%22wrapStrategy%22%3A%22WRAP%22%2C%22borders%22%3A%7B%7D%7D%7D%2C%22fields%22%3A%22userEnteredFormat.wrapStrategy%22%7D%7D%5D%7D%7D
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate?alt=json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requests: [
              {
                repeatCell: {
                  range: {
                    startRowIndex: 0,
                    endRowIndex: 11,
                    // startColumnIndex: 0,
                    //endColumnIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      wrapStrategy: 'WRAP',
                    },
                  },
                  fields: 'userEnteredFormat.wrapStrategy',
                },
              },
            ],
          }),
        }
      );

      return await response.json();
    },

    prepereData(data) {
      let header = [];
      this.headers.forEach(title => {
        header.push(title.text);
      });
      header.push('Piezīmes');

      let sheet = [
        {
          majorDimension: 'ROWS',
          range: 'A1',
          values: [header],
        },
        {
          majorDimension: 'ROWS',
          range: 'B2',
          values: [
            [
              '1',
              '2',
              '3',
              '4',
              '5=3*4',
              '6',
              '7',
              '8',
              '9',
              '10=8*9',
              '11=5-(6+7)-10',
              '12',
              '13',
            ],
          ],
        },
      ];

      let row = 2;
      data.forEach(client => {
        sheet.push({
          majorDimension: 'ROWS',
          range: `A${++row}`,
          values: [
            [
              `${client.count}`,
              `${client.personalCode !== undefined ? client.personalCode : ''}`,
              `${client.clientName}`,
              `${client.avgDayPrice}`,
              `${client.daysAtBfh}`,
              `${client.monthPrice}`,
              `${client !== undefined ? client : ''}`,
              `${client.otherIncome !== undefined ? client.otherIncome : ''}`,
              `${client.offDayCount}`,
              `${client.foodCostsPerDay}`,
              `${client.monthlyOffFee}`,
              `${client.OutstandingMoney}`,
              `${client.OMoneyRDReturn}`,
            ],
          ],
        });
      });

      return sheet;
    },

    async createSheet(title, token) {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            properties: {
              title: title,
            },
          }),
        }
      );
      return await response.json();
    },

    //https://stackoverflow.com/questions/36292726/how-to-get-first-and-last-day-of-current-week-when-days-are-in-different-months
    getStartOfWeek(d) {
      d = new Date(d);
      let day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      return new Date(d.setDate(diff));
    },

    getEndOfWeek(date) {
      date = this.getStartOfWeek(date);
      date.setDate(date.getDate() + 6);
      return date;
    },

    async getProfilesById(id, firstDayOf, lastDayOf) {
      let db = firebase.firestore();

      let profilesSnapshot = await db
        .collection('clients')
        .doc(id)
        .collection('profiles')
        .where('wStartDate', '>=', firstDayOf)
        .where('wStartDate', '<=', lastDayOf)
        .get();

      let profilesByClients = {};
      profilesSnapshot.forEach(function(doc) {
        let data = doc.data();
        data['id'] = doc.id;
        profilesByClients[doc.id] = data;
      });
      return profilesByClients;
    },

    async calculateReports() {
      this.reportData = [];
      this.reportDialog = true;
      let clients = await this.prepareData();

      let profilesL = {};
      for await (let client of clients) {
        let firstDayOf = this.getStartOfWeek(client.firstDateForReport);
        let lastDayOf = this.getEndOfWeek(client.lastDateForReport);
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
        let profiles = await this.getProfilesById(
          client.id,
          firstDayOf,
          lastDayOf
        );
        profilesL[client.id] = profiles;
      }
      let clientObject = {};
      clients.forEach(client => {
        clientObject[client.id] = client;
        clientObject[client.id]['profiles'] = profilesL[client.id];
      });
      let overalPrice = 0;
      for (const client in clientObject) {
        const profiles = clientObject[client].profiles;
        let firstItem = Object.values(profiles)[0];
        let { [Object.keys(profiles).pop()]: lastItem } = profiles;

        if (firstItem !== undefined) {
          let tim1 = firstItem.wEndDate.seconds * 1000;
          let dr = clientObject[client].firstDateForReport;
          let tim2 = dr.getTime();
          let timeDiff = Math.abs(tim1 - tim2);

          const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          overalPrice += diffDays * parseFloat(firstItem.invoicePricePerDay);
        }

        for (const profile in profiles) {
          if (
            profiles[profile] !== firstItem &&
            profiles[profile] !== lastItem
          ) {
            overalPrice += 7 * parseFloat(profiles[profile].invoicePricePerDay);
          }
        }
        if (lastItem !== undefined) {
          let tim = lastItem.wEndDate.seconds * 1000;
          let dr2 = clientObject[client].lastDateForReport;
          let tim3 = dr2.getTime();
          let timeDiff2 = Math.abs(tim3 - tim);

          const diffDays2 = Math.ceil(timeDiff2 / (1000 * 60 * 60 * 24));

          overalPrice += diffDays2 * parseFloat(lastItem.invoicePricePerDay);
        }

        let timF = clientObject[client].firstDateForReport.getTime();
        let timE = clientObject[client].lastDateForReport.getTime();

        let timeDiffAll = Math.abs(timE - timF);
        const daysAtBfh = Math.ceil(timeDiffAll / (1000 * 60 * 60 * 24));

        clientObject[client]['monthPrice'] = overalPrice.toFixed(2);
        clientObject[client]['daysAtBfh'] = daysAtBfh;
        clientObject[client]['avgDayPrice'] = (overalPrice / daysAtBfh).toFixed(
          2
        );

        clientObject[client]['monthlyOffFee'] =
          clientObject[client].offDayCount !== 0
            ? 5.5 * clientObject[client].offDayCount
            : 0.0;

        clientObject[client]['foodCostsPerDay'] = 5.5;
        if (clientObject[client].pension !== undefined) {
          clientObject[client]['prieksh share'] =
            clientObject[client].pension * 0.85;
        }

        clientObject[client]['OutstandingMoney'] = (
          overalPrice -
          (clientObject[client].pesion85 !== undefined
            ? clientObject[client].pesion85
            : 0 +
              parseFloat(
                clientObject[client].otherIncome !== undefined
                  ? clientObject[client].otherIncome
                  : 0
              )) -
          clientObject[client].monthlyOffFee
        ).toFixed(2);

        clientObject[client]['OMoneyRDReturn'] =
          clientObject[client].OutstandingMoney < 640
            ? clientObject[client].OutstandingMoney
            : 640;
      }

      let count = 0;
      for (const client in clientObject) {
        if (clientObject[client].avgDayPrice !== '0.00') {
          count++;
          clientObject[client]['count'] = count;
          this.reportData.push(clientObject[client]);
        }
      }
      this.reportDialog = false;
    },

    async prepareData() {
      if (this.company == null) {
        this.companyError = true;
      } else {
        this.companyError = false;
        let db = firebase.firestore();

        let clientsSnapshot = await db
          .collection('clients')
          .where('clientServices', '==', 'bfh')
          .where('clientForCompany', '==', this.company.id)
          .orderBy('clientName')
          .get();

        let clientsL = [];
        const [year2, month2] = this.date.split('-');
        clientsSnapshot.forEach(function(doc) {
          let data = doc.data();
          data['id'] = doc.id;

          let [year, month, day] = doc.data().bfhEnterDate.split('-');
          let enterDate = new Date();
          enterDate.setFullYear(year, month - 1, day);
          data['enterDate'] = new Date(enterDate);

          let firstDayInMonth = new Date(year2, month2 - 1, 1);

          if (data.enterDate >= firstDayInMonth) {
            data['firstDateForReport'] = data.enterDate;
          } else {
            data['firstDateForReport'] = firstDayInMonth;
          }

          if (
            data.rdSupportDateRaw !== undefined &&
            data.rdSupportDateRaw !== null
          ) {
            let rdSupportDate = new Date(data.rdSupportDateRaw.seconds * 1000);

            if (rdSupportDate >= data.firstDateForReport) {
              data['firstDateForReport'] = rdSupportDate;
            }
          }

          let lastDayInMonth = new Date();
          lastDayInMonth = new Date(year2, month2, 0);
          data['lastDateForReport'] = lastDayInMonth;

          if (data.leftDate !== undefined && data.leftDate !== null) {
            let [year, month, day] = data.leftDate.split('-');
            let leftDate = new Date();
            leftDate.setFullYear(year, month - 1, day);
            data['leftDateRaw'] = new Date(leftDate);

            if (data.lastDateForReport >= data.leftDateRaw) {
              data['lastDateForReport'] = data.leftDateRaw;
            }
          }

          if (data.deathDate !== undefined && data.deathDate !== null) {
            let [year, month, day] = data.deathDate.split('-');
            let deathDate = new Date();
            deathDate.setFullYear(year, month - 1, day);
            data['deathDateRaw'] = new Date(deathDate);

            if (data.lastDateForReport >= data.deathDateRaw) {
              data['lastDateForReport'] = data.deathDateRaw;
            }
          }
          clientsL.push(data);
        });

        let clientdataL = {};
        clientsL.forEach(async function(client) {
          let snapshot = await db
            .collection('residentOffDays')
            .where('clientId', '==', client.id)
            .where('offDate', '>=', client.firstDateForReport)
            .where('offDate', '<=', client.lastDateForReport)
            .get();
          clientdataL[client.id] = client;
          clientdataL[client.id]['offDayCount'] = snapshot.size;
        });

        this.clients = Object.assign({}, clientdataL);

        return clientsL;
      }
    },
  },
};
</script>
