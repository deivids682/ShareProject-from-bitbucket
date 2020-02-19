<template>
  <v-container>
    <h1>Vizītes</h1>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <!-- snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="snackbarTimeout"
    >{{ snackbarTxt }}</v-snackbar>

    <!-- select how many data -->
    <v-layout row wrap>
      <v-flex xs12 v-if="!progressBar">
        <v-btn-toggle v-model="btnToggle" dark mandatory>
          <v-btn small color="accent" @click="getData(reportLimit)">Pēdējas {{reportLimit}} vizītes</v-btn>
          <v-btn small color="accent" @click="getData('all')">Visas vizītes</v-btn>
          <v-btn small color="accent" @click.stop="addVisit()">Pievienot vizīti</v-btn>
        </v-btn-toggle>
      </v-flex>
    </v-layout>
    <!-- list visits -->
    <list-data v-if="!progressBar" :collectionName="collection" :collectionData="visits"></list-data>
    <!-- add visit dialog -->
    <v-dialog v-model="visitDialog" persistent max-width="700">
      <v-card>
        <v-card-title class="headline">Pievienot vizīti</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation id="form">
            <v-row>
              <v-col cols="5">
                <v-text-field
                  v-model="visitData.explanationNr"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                  label="Paskaidrojuma Nr."
                ></v-text-field>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="5">
                <v-dialog
                  v-model="explanationDateDialog"
                  :return-value.sync="explanationDate"
                  persistent
                  width="290px"
                  ref="explDateDialog"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="visitData.explanationDateFormatted"
                      label="Paskaidrojuma datums"
                      :rules="[v => !!v || 'Nepieciešams norādīt']"
                      readonly
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="explanationDate"
                    scrollable
                    first-day-of-week="1"
                    :max="new Date().toISOString().substr(0, 10)"
                  >
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="explanationDateDialog = false">Cancel</v-btn>
                    <v-btn
                      text
                      color="primary"
                      @click="$refs.explDateDialog.save(explanationDate)"
                    >OK</v-btn>
                  </v-date-picker>
                </v-dialog>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <v-select
                  v-model="clientId"
                  :items="Object.values(clients)"
                  item-text="clientName"
                  item-value="id"
                  label="Klients"
                  single-line
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-select>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="5">
                <v-select
                  v-model="visitData.user"
                  :items="Object.values(users)"
                  item-text="displayName"
                  item-value="id"
                  label="Aprūpētājs"
                  single-line
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <v-dialog
                  v-model="visitDateDialog"
                  :return-value.sync="visitDate"
                  persistent
                  width="290px"
                  ref="vstDateDialog"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="visitData.visitDateFormatted"
                      label="Vizītes datums"
                      :rules="[v => !!v || 'Nepieciešams norādīt']"
                      readonly
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="visitDate"
                    scrollable
                    first-day-of-week="1"
                    :max="new Date().toISOString().substr(0, 10)"
                  >
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="visitDateDialog = false">Cancel</v-btn>
                    <v-btn text color="primary" @click="$refs.vstDateDialog.save(visitDate)">OK</v-btn>
                  </v-date-picker>
                </v-dialog>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="5">
                <v-dialog
                  ref="startTimeD"
                  v-model="startTimeDialog"
                  :return-value.sync="startTime"
                  persistent
                  width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="startTime"
                      label="Vizītes sākuma laiks"
                      readonly
                      v-on="on"
                      :rules="[v => !!v || 'Nepieciešams norādīt']"
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    v-if="startTimeDialog"
                    v-model="startTime"
                    format="24hr"
                    use-seconds
                  >
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="startTimeDialog = false">Cancel</v-btn>
                    <v-btn text color="primary" @click="$refs.startTimeD.save(startTime)">OK</v-btn>
                  </v-time-picker>
                </v-dialog>
              </v-col>
            </v-row>
            <v-row>
              <v-spacer></v-spacer>
              <v-col cols="5">
                <v-dialog
                  ref="endTimeD"
                  v-model="endTimeDialog"
                  :return-value.sync="endTime"
                  persistent
                  width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="endTime"
                      label="Vizītes beigu laiks"
                      readonly
                      v-on="on"
                      :rules="[v => !!v || 'Nepieciešams norādīt']"
                    ></v-text-field>
                  </template>
                  <v-time-picker v-if="endTimeDialog" v-model="endTime" format="24hr" use-seconds>
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="endTimeDialog = false">Cancel</v-btn>
                    <v-btn text color="primary" @click="$refs.endTimeD.save(endTime)">OK</v-btn>
                  </v-time-picker>
                </v-dialog>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text outlined @click="cancelVisitDialog()">Atcelt</v-btn>
          <v-btn color="success" @click="saveVisit()">
            <v-icon left>save</v-icon>Saglabāt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import ListData from '@/comp/ListData.vue';

export default {
  data() {
    return {
      progressBar: true,
      reportLimit: 150,
      btnToggle: 0,
      collection: 'visits',
      visits: {},
      clients: {},
      users: {},
      //dialog add new visit
      visitDialog: false,
      visitData: {},
      explanationDateDialog: false,
      explanationDate: new Date().toISOString().substr(0, 10),
      visitDateDialog: false,
      visitDate: new Date().toISOString().substr(0, 10),
      clientId: null,
      startTimeDialog: false,
      startTime: null,
      endTimeDialog: false,
      endTime: null,
      valid: true,

      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  components: {
    ListData,
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get visits
    var visitsL = {};
    db.collection(vm.collection)
      .orderBy('startAt', 'desc')
      .limit(vm.reportLimit)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          //dont add session data
          if (doc.id != 'userVisitSessions') {
            visitsL[doc.id] = doc.data();
          }
        });
        vm.visits = Object.assign({}, visitsL);
        vm.progressBar = false;
      });
  },
  watch: {
    //format date
    explanationDate: function(val, oldVal) {
      this.visitData.explanationDateFormatted = this.formatDate(val);
    },
    visitDate: function(val, oldVal) {
      this.visitData.visitDateFormatted = this.formatDate(val);
    },
    clientId: function(val, oldVal) {
      if (this.clientId) {
        this.visitData['clientName'] = this.clients[this.clientId].clientName;
        this.visitData['clientId'] = this.clientId;
        this.visitData['location'] = this.clientId;
      }
    },
  },
  methods: {
    saveVisit() {
      if (this.$refs.form.validate()) {
        var vm = this;
        var db = firebase.firestore();

        //start time, end time, duration
        const [sthours, stminutes, stseconds] = vm.startTime.split(':');
        const [endhours, endminutes, endseconds] = vm.endTime.split(':');
        const [year, month, day] = vm.visitDate.split('-');
        var monthRaw = month - 1;
        const startAt = new Date(
          year,
          monthRaw,
          day,
          sthours,
          stminutes,
          stseconds
        );
        const endAt = new Date(
          year,
          monthRaw,
          day,
          endhours,
          endminutes,
          endseconds
        );

        if (endAt > startAt) {
          const duration = vm.calculateVisitDuration(startAt, endAt);
          const location = new firebase.firestore.GeoPoint(
            vm.clients[vm.clientId].clientAddressCoordinates.lat,
            vm.clients[vm.clientId].clientAddressCoordinates.lng
          );

          const saveObj = {
            clientId: vm.visitData.clientId,
            clientName: vm.visitData.clientName,
            dateFormatted: vm.visitData.visitDateFormatted,
            duration: duration,
            endAt: endAt,
            location: location,
            startAt: startAt,
            user: vm.visitData.user,
            explanationNr: vm.visitData.explanationNr,
            explanationDate: vm.visitData.explanationDateFormatted,
          };

          db.collection('visits').add(saveObj);
          vm.cancelVisitDialog();

          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Vizīte saglabāta!';
          vm.snackbar = true;
        } else {
          alert('Vizītes sākuma laiks vēlāks par beigu laiku!');
        }
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
    async getClientsAndUsers() {
      var vm = this;
      var db = firebase.firestore();

      if (Object.keys(vm.users).length == 0) {
        //get users and clients
        var userProm = db
          .collection('users')
          .where('role', 'array-contains', 'aider')
          .get();
        var clientsProm = db
          .collection('clients')
          .where('clientServices', '==', 'neighborhood')
          .get();

        var values = await Promise.all([userProm, clientsProm]);

        var usersL = {};
        values[0].forEach(user => {
          usersL[user.id] = user.data();
          usersL[user.id]['id'] = user.id;
        });

        vm.users = Object.assign({}, usersL);

        var clientsL = {};
        values[1].forEach(client => {
          clientsL[client.id] = client.data();
          clientsL[client.id]['id'] = client.id;
        });

        vm.clients = Object.assign({}, clientsL);
      }
    },
    addVisit() {
      var vm = this;
      vm.getClientsAndUsers();
      vm.visitDialog = true;
    },
    cancelVisitDialog() {
      this.visitDialog = false;
      this.visitData = Object.assign({}, {});
      this.explanationDate = new Date().toISOString().substr(0, 10);
      this.visitDate = new Date().toISOString().substr(0, 10);
      this.clientId = null;
      this.startTimeDialog = false;
      this.startTime = null;
      this.endTimeDialog = false;
      this.endTime = null;
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
    getData(queryLimit) {
      var vm = this;
      var db = firebase.firestore();
      vm.progressBar = true;
      var reportRef = db
        .collection(vm.collection)
        .orderBy('startAt', 'desc')
        .limit(vm.reportLimit);

      //get all reports
      if (queryLimit == 'all') {
        reportRef = db.collection(vm.collection).orderBy('startAt', 'desc');
      }

      reportRef.get().then(function(querySnapshot) {
        var dataL = {};
        querySnapshot.forEach(function(doc) {
          //dont add session data
          if (doc.id != 'userVisitSessions') {
            dataL[doc.id] = doc.data();
          }
        });
        vm.visits = Object.assign({}, dataL);
        vm.progressBar = false;
      });
    },
  },
};
</script>