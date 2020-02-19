<template>
  <v-row align="center" justify="center">
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <v-col cols="12">
      <v-card-text>
        <!--Progress bar -->
        <v-row>
          <v-col cols="12" v-if="progressBar">
            <v-progress-linear :indeterminate="true"></v-progress-linear>
          </v-col>
        </v-row>
        <!-- OUT days -->
        <v-flex xs12>
          <h2>Izbraukuma dienas</h2>
          <!-- search -->
          <v-flex xs12 lg4>
            <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
          </v-flex>
          <v-data-table
            :headers="headers"
            :items="residentOffDays"
            :search="searchValue"
            sort-by="lastUpdated"
            class="elevation-1"
          ></v-data-table>
        </v-flex>
        <br />

        <v-flex xs12>
          <h2>Incidenti</h2>
          <!-- buttons -->
          <v-layout wrap>
            <v-btn
              @click="newIncident(clientId, clientData.clientName, 'new', clientData.clientServices)"
              color="primary"
            >
              <v-icon left>error</v-icon>Pievienot incidentu
            </v-btn>
          </v-layout>
          <br />
          <list-data :collectionName="'incidents'" :key="'incidents'" :collectionData="incidents"></list-data>
        </v-flex>
        <!-- VITALS -->
        <v-flex xs12>
          <h2 class="mt-4">Veselības dati</h2>
          <!-- buttons -->
          <v-layout wrap>
            <v-btn @click="newBodyVitals(clientId, clientData.clientName, 'new')" color="primary">
              <v-icon left>local_hospital</v-icon>Veselība
            </v-btn>
            <v-btn class="ml-2" @click="exportToPDF()" color="primary">
              <v-icon left>print</v-icon>Sagatavot atskaiti
            </v-btn>
          </v-layout>
          <br />
          <list-data :collectionName="'bodyVitals'" :key="'bodyVitals'" :collectionData="vitals"></list-data>
        </v-flex>
      </v-card-text>
    </v-col>
  </v-row>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
var pdfMake = require('pdfmake/build/pdfmake');
var pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var htmlToPdfmake = require('html-to-pdfmake');

//list table
import ListData from '@/comp/ListData.vue';

export default {
  props: ['clientId', 'loadedClientData'],
  components: {
    ListData,
  },
  data() {
    return {
      //setup
      progressBar: true,
      residentOffDays: [],
      clientData: {},
      incidents: {},
      searchValue: '',
      pdfGen: false,
      vitals: {},
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      headers: [
        { text: 'Komentārs', value: 'comment' },
        { text: 'Izbraukuma diena', value: 'offDay' },
        { text: 'Pedējo reizi rediģēja', value: 'updatedBy' },
        { text: 'Rediģēšanas datums', value: 'lastUpdated' },
      ],
    };
  },

  async created() {
    let vm = this;
    let db = firebase.firestore();
    //get client data

    let incidentPromise = db
      .collection('incidents')
      .where('clientId', '==', vm.clientId)
      .orderBy('date', 'desc')
      .get();

    let vitalsPromise = db
      .collection('bodyVitals')
      .where('clientId', '==', vm.clientId)
      .orderBy('date', 'desc')
      .get();

    let residentOffDaysPromise = db
      .collection('residentOffDays')
      .where('service', '==', 'bfh')
      .where('clientId', '==', this.clientId)
      .get();

    let values = await Promise.all([
      incidentPromise,
      vitalsPromise,
      residentOffDaysPromise,
    ]);

    //incidents
    let incidentsL = {};
    values[0].forEach(function(doc) {
      incidentsL[doc.id] = doc.data();
    });
    vm.incidents = Object.assign({}, incidentsL);

    //vitals
    let vitalsL = {};
    values[1].forEach(function(doc) {
      vitalsL[doc.id] = doc.data();
    });
    vm.vitals = Object.assign({}, vitalsL);

    let residentOffDaysL = [];
    values[2].forEach(function(doc) {
      let data = doc.data();
      data['id'] = doc.id;
      residentOffDaysL.push(data);
    });
    this.residentOffDays = Object.assign([], residentOffDaysL);

    if (this.clientId != 'new_client') {
      vm.clientData = Object.assign({}, this.loadedClientData);
    }

    vm.progressBar = false;
  },

  methods: {
    toDataURL(src) {
      return new Promise(resolve => {
        if (typeof src == 'undefined' || src == '') {
          resolve('');
        } else {
          var img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = function() {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.naturalHeight;
            canvas.width = this.naturalWidth;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL();
            resolve({ image: dataURL, fit: [150, 150] });
          };
          img.src = src;
          if (img.complete || img.complete === undefined) {
            img.src =
              'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
            img.src = src;
          }
        }
      });
    },
    async exportToPDF() {
      this.progressBar = true;
      let vitals = [];
      const ids = Object.keys(this.vitals);

      ids.map(id => {
        vitals.push(this.vitals[id]);
      });
      let table = `<tr>
                  <th>Datums</th>
                  <th>Pulss</th>
                  <th>Spiediens A</th>
                  <th>Spiediens Z</th>
                  <th>Svars</th>
                  <th>Temperatūra</th>
                  <th>Cukura līmenis</th>
                </tr>`;
      let emergency = '';
      vitals.map(vital => {
        if (!vital.emergency) {
          table += `<tr>
              <td>${vital.dateFormatted}</td> 
              <td>${vital.vitals.Pulss}</td>
              <td>${vital.vitals['Spiediens A']}</td>
              <td>${vital.vitals['Spiediens Z']}</td>
              <td>${vital.vitals.Svars}</td>
              <td>${vital.vitals['Temperatūra']}</td>
              <td>${vital.vitals.Cukurs}</td>
            </tr>`;
        }
        if (vital.emergency) {
          emergency += `<p style="color: gray; font-weight: lighter; font-family: sans-serif; font-size: 16px;">
            ${vital.dateFormatted} ${vital.comment}
          </p>
          `;
        }
      });

      //prepare profile photo
      let profilePictureUrl =
        'prieksh share';

      if (this.clientData.clientPhotoUrl) {
        let convertImg = await this.toDataURL(this.clientData.clientPhotoUrl);
        if (convertImg.image) {
          profilePictureUrl = convertImg.image;
        }
      }

      let html = htmlToPdfmake(
        `<div>
            <h3 
              style="text-align: center;">
              ${this.clientData.clientName} 
              veselības datu atskaite uz 
              ${this.formatDateDDMMYYYY(new Date().toISOString().substr(0, 10))}
              </h3>
              <div style="margin-top: 30px;">
              <p>Rezidents: ${this.clientData.clientName}</p>
              <p>Dzimšanas datums: ${
                this.clientData.birthDate != null
                  ? this.formatDateDDMMYYYY(this.clientData.birthDate)
                  : 'NA'
              }<p>
              <p>Ienākšanas datums: ${this.clientData.bfhDateFormatted}<p>
              <img width="70" height="70" src="${profilePictureUrl}">
              </div>
              <h5 style="margin-top: 25px;">Ikdienas mērījumi</h5>
              <table>
                  ${table}
              </table>
              <div style="margin-top: 25px;">
                  <p 
                    style="color: #636360; 
                    font-weight: lighter; 
                    font-family: sans-serif; 
                    font-size: 20px;">
                    Ārkārtas gadījumi
                  </p>
                  ${emergency}
              </div>
          <div>
          </div>`
      );

      let docDefinition = {
        content: [html],
      };

      pdfMake.createPdf(docDefinition).download(
        `${this.clientData.clientName} veselības datu atskaite uz 
       ${this.formatDateDDMMYYYY(new Date().toISOString().substr(0, 10))}.pdf`
      );
      this.progressBar = false;
    },

    newBodyVitals(clientId, clientName, vitalsId) {
      // view client profile programmatically
      this.$router.push({
        name: 'vitals',
        params: {
          id: clientId,
          clientName: clientName,
          vitalsId: vitalsId,
        },
      });
    },
    newIncident(clientId, clientName, incId, clientServices) {
      // view client profile programmatically
      this.$router.push({
        name: 'incident',
        params: {
          id: clientId,
          clientName: clientName,
          incId: incId,
          clientServices: clientServices,
        },
      });
    },
    formatDateDDMMYYYY(date) {
      if (!date) return null;
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },

    formatDate(sec) {
      let date = new Date(sec * 1000);
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      let day = date.getDate();
      if (day < 10) {
        day = '0' + day;
      }
      let hour = date.getHours();
      let min = date.getMinutes();

      if (min < 10) {
        min = '0' + min;
      }

      return day + '.' + month + '.' + year + ' ' + hour + ':' + min;
    },
  },
};
</script>