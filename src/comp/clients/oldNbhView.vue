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
      <v-card-actions v-if="admin || manager">
        <v-btn color="primary" :to="{ name: 'evaluation', params: { id: clientId, evId:'' }}">
          <v-icon>build</v-icon>Jauna Novērtēšana
        </v-btn>
        <v-btn color="primary" :to="{ name: 'clienttasks', params: { clid: clientId}}">
          <v-icon>done</v-icon>Dzīves plāna uzdevumi
        </v-btn>
        <v-btn
          color="primary"
          :to="{ name: 'lifeplan', params: { clid: clientId}}"
          v-if="typeof clientData.clientLifePlanTasks != 'undefined'"
        >
          <v-icon>list_alt</v-icon>Dzīves plāns
        </v-btn>
        <v-btn
          color="primary"
          v-if="admin || manager"
          class="margin-v-btn"
          @click.stop="copyLpDialog=true"
        >
          <v-icon>file_copy</v-icon>Pārkopēt dzīves plānu
        </v-btn>
      </v-card-actions>
      <v-card-text>
        <!--Progress bar -->
        <v-row>
          <v-col cols="12" v-if="progressBar">
            <v-progress-linear :indeterminate="true"></v-progress-linear>
          </v-col>
        </v-row>

        <!-- list daily reports -->
        <v-row v-if="clientReports.length > 0">
          <v-col cols="12">
            <h2>Dienas atskaites</h2>
          </v-col>
          <v-col cols="12">
            <list-data
              :collectionName="'clientReports'"
              :key="'clientReports'"
              :collectionData="clientReports"
              :clientID="clientId"
              :clientName="clientData.clientName"
              :clientColor="clientData.clientColor"
            ></list-data>
          </v-col>
        </v-row>

        <!-- list daily reports -->
        <v-row v-if="clientPauseDates.length > 0">
          <v-col cols="12">
            <h2>Neaktīvās dienas</h2>
          </v-col>
          <v-col cols="12">
            <list-data
              :collectionName="'inactiveDays'"
              :key="'inactiveDays'"
              :collectionData="clientPauseDates"
            ></list-data>
          </v-col>
        </v-row>

        <!-- list evaluations -->
        <v-row v-if="evaluations.length > 0">
          <v-col cols="12">
            <h2>Dzīvesvietas novērtējumi</h2>
          </v-col>

          <v-col cols="12">
            <v-data-table
              :items="evaluations"
              :page.sync="page"
              :items-per-page="itemsPerPage"
              @page-count="pageCount = $event"
              class="elevation-1"
            >
              <template v-slot:item="{item}">
                <tr>
                  <td class="text-left">{{ formatDate(item.timestamp.seconds)}}</td>
                  <td class="text-left">
                    <span
                      v-if="typeof users[item.createdBy] != 'undefined'"
                    >{{users[item.createdBy].displayName}}</span>
                  </td>
                  <td class="text-left">{{item.monthlyPrice}} EUR</td>
                  <td class="text-right">
                    <v-btn
                      id="viewClientBtn"
                      text
                      small
                      color="blue lighten-2"
                      :to="{ name: 'evaluation', params: { id: clientId, evId: item.id }}"
                    >
                      <v-icon dark left>remove_red_eye</v-icon>Skatīt
                    </v-btn>

                    <v-btn
                      id="reportBtn"
                      text
                      small
                      color="green lighten-2"
                      :to="{ name: 'equipmentreport', params: { clid: clientId, evid: item.id }}"
                    >
                      <v-icon dark left>camera_alt</v-icon>Atskaite
                    </v-btn>

                    <v-btn
                      id="deleteEvaluationBtn"
                      icon
                      @click="deleteRecord(clientId, item.id, 'evaluations')"
                    >
                      <v-icon dark color="red lighten-2">delete_forever</v-icon>
                    </v-btn>

                    <!-- report btn -->
                    <v-btn
                      :id="'printBtn'+item.id"
                      icon
                      @click="printReport(item.id, users[item.createdBy].displayName)"
                    >
                      <v-icon dark color="grey darken-2">print</v-icon>
                    </v-btn>
                    <!-- report progress icon -->
                    <v-fab-transition>
                      <v-btn v-show="showProgress" color="white" absolute top right fab>
                        <v-progress-circular indeterminate color="primary" class="progBar"></v-progress-circular>
                      </v-btn>
                    </v-fab-transition>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
    <!-- copy life plan -->
    <copy-life-plan
      v-if="copyLpDialog"
      :copyLifePlanDialog="copyLpDialog"
      :service="clientData.clientServices"
      :clientId="clientId"
      @closeLifePlanDialog="copyLpDialog=false"
    ></copy-life-plan>
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//pdf
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

//list table
import ListData from '@/comp/ListData.vue';
//copy life plan
import CopyLifePlan from '@/comp/clients/copyLifePlan.vue';

export default {
  props: ['clientId', 'loadedClientData'],
  components: {
    ListData,
    CopyLifePlan,
  },
  data() {
    return {
      //setup
      progressBar: true,
      clientData: {},
      clientReports: [],
      clientPauseDates: [],
      evaluations: [],
      users: {},
      showProgress: false,
      //pagination
      page: 1,
      pageCount: 0,
      itemsPerPage: 10,
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      //copy life plan dialog
      copyLpDialog: false,
    };
  },

  async created() {
    var vm = this;
    var db = firebase.firestore();
    //get client data

    if (vm.clientId != 'new_client') {
      vm.clientData = Object.assign({}, vm.loadedClientData);
      vm.clientReports =
        typeof vm.clientData.clientsDailyReports != 'undefined'
          ? vm.clientData.clientsDailyReports.reverse()
          : [];

      vm.clientPauseDates =
        typeof vm.clientData.clientsPauseDates != 'undefined'
          ? vm.clientData.clientsPauseDates.reverse()
          : [];
    }

    var usersPromise = db.collection('users').get();

    var evPromise = db
      .collection('clients')
      .doc(vm.clientId)
      .collection('evaluations')
      .get();

    var values = await Promise.all([usersPromise, evPromise]);

    //users
    var usersL = {};
    values[0].forEach(function(doc) {
      usersL[doc.id] = doc.data();
    });
    vm.users = Object.assign({}, usersL);

    //evaluations
    values[1].forEach(doc => {
      //push data to array
      var data = doc.data();
      data['id'] = doc.id;
      vm.evaluations.push(data);
    });

    vm.progressBar = false;
  },
  methods: {
    printReport: async function(evId, userDisplayName) {
      var vm = this;
      // feedback
      vm.showProgress = true;

      //get evaluation data
      var db = firebase.firestore();
      var evaluationRef = db
        .collection('clients')
        .doc(vm.clientId)
        .collection('evaluations')
        .doc(evId);

      const doc = await evaluationRef.get();
      const evaluationData = doc.data();
      const roomQuestionData = evaluationData.rooms;
      const reportDate = vm.formatDate(
        new Date(evaluationData.timestamp.seconds)
      );

      //ROOM QUESTIONS
      //sort room questions keys by order
      const orderedRoomQuestions = vm.sortNestedObject(
        roomQuestionData,
        'order'
      );
      //create list
      var roomQuestionsList = [];

      for (let elem of orderedRoomQuestions) {
        //text
        var qText = elem.order + '. ' + elem.question;
        if (elem.status == true) {
          qText += ' - Jā';
        } else {
          qText += ' - Nē';
        }

        try {
          let photo64 = await vm.toDataURL(elem.roomPhoto);
          roomQuestionsList.push({
            stack: [{ text: qText, margin: [0, 10, 0, 0] }, photo64],
            unbreakable: true,
          });
        } catch (error) {
          console.log('error' + error);
        }
      }

      //EQUIPMENT QUESTIONS
      const allEquipment = evaluationData.selectedEquipment;
      const equipmentKeys = Object.keys(allEquipment);
      var equipmentQuestionsList = [];
      var order = 1;
      for (var i = 0; i < equipmentKeys.length; i++) {
        const key = equipmentKeys[i];
        //only selected equipment
        if (allEquipment[key].status == true) {
          //text
          var qText = order + '. ' + allEquipment[key].title;
          order++;

          try {
            let photo64 = await vm.toDataURL(allEquipment[key].afterPhoto);
            equipmentQuestionsList.push({
              stack: [{ text: qText, margin: [0, 10, 0, 0] }, photo64],
              unbreakable: true,
            });
          } catch (error) {
            console.log('error' + error);
          }
        }
      } //end for equipment key

      //generate file name 'name_surname_aprikojuma_atskaite.pdf'
      const fileName =
        vm.clientData.clientName
          .toLowerCase()
          .split(' ')
          .join('_') + '_aprikojuma_atskaite.pdf';

      //horizontal line
      const horizontalLine = {
        canvas: [
          { type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 1 },
        ],
      };

      //generate form to sign given equipment
      var docDefinition = {
        ///prieksh share
      };

      var now = new Date();

      var pdf = pdfMake.createPdf(docDefinition);
      pdf.download(fileName);
      vm.showProgress = false;
    },
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
              'prieksh share';
            img.src = src;
          }
        }
      });
    },
    sortNestedObject(object, selector) {
      //keys
      var keys = Object.keys(object);
      //object to array
      var arr = [];
      keys.forEach(function(key) {
        arr.push(object[key]);
      });

      //sort array
      arr.sort((a, b) => a[selector] - b[selector]);

      return arr;
    },
    formatDate(sec) {
      var date = new Date(sec * 1000);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var day = date.getDate();
      if (day < 10) {
        day = '0' + day;
      }
      var hour = date.getHours();
      var min = date.getMinutes();

      if (min < 10) {
        min = '0' + min;
      }

      return day + '.' + month + '.' + year + ' ' + hour + ':' + min;
    },
    deleteRecord(clientId, recordId, collectionName) {
      var vm = this;
      var r = confirm('Tiešām vēlies izdzēst?');
      if (r == true) {
        try {
          var db = firebase.firestore();

          db.collection('clients')
            .doc(clientId)
            .collection(collectionName)
            .doc(recordId)
            .delete();

          switch (collectionName) {
            case 'evaluations':
              vm.evaluations = []; //to reset table for new item
              db.collection('clients')
                .doc(clientId)
                .collection('evaluations')
                .get()
                .then(function(querySnapshot) {
                  querySnapshot.forEach(function(doc) {
                    //push data to array
                    var data = doc.data();
                    data['id'] = doc.id;
                    vm.evaluations.push(data);
                  });
                });
              break;
            case 'cleanings':
              vm.cleanings = []; //to reset table for new item
              db.collection('clients')
                .doc(clientId)
                .collection('cleanings')
                .get()
                .then(function(querySnapshot) {
                  querySnapshot.forEach(function(doc) {
                    //push data to array
                    var data = doc.data();
                    data['id'] = doc.id;
                    vm.cleanings.push(data);
                  });
                });
              break;
            default:
              break;
          }
        } catch (error) {
          console.log(error);
        }
      } else {
      }
    },
  },
};
</script>