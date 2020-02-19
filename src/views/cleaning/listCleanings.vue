<template>
  <v-container>
    <h1>Tīrīšanas</h1>
    <!-- new cleaning dialog -->
    <v-layout row justify-center>
      <v-btn color="info" @click.stop="cleaningDialog = true">
        <v-icon left>room_service</v-icon>Ieplānot jaunu tīrīšanu
      </v-btn>

      <v-dialog v-model="cleaningDialog" persistent max-width="400">
        <v-card>
          <v-card-title class="headline">Jauna tīrīšana</v-card-title>
          <v-card-text>
            <!-- client -->
            <v-flex xs12>
              <v-select
                v-model="newCleaningClient"
                :items="clientsSelect"
                label="Klients"
                prepend-icon="face"
                return-object
                single-line
              ></v-select>
            </v-flex>
            <!-- responsible aider -->
            <v-flex xs12>
              <v-select
                v-model="newCleaningUser"
                :items="usersSelect"
                label="Atbildīgais"
                prepend-icon="room_service"
                return-object
                single-line
              ></v-select>
            </v-flex>
            <!-- date -->
            <v-flex xs12>
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="290px"
              >
                <template v-slot:activator="{ on }">
                  <v-text-field
                    v-model="newCleaningFormatDate"
                    label="Tīrīšanas datums"
                    prepend-icon="event"
                    readonly
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="newCleaningDate"
                  @input="dateMenu = false"
                  first-day-of-week="1"
                ></v-date-picker>
              </v-menu>
            </v-flex>
          </v-card-text>
          <v-card-actions>
            <v-btn color="error" text outlined @click="cancelCleaningDialog()">Atcelt</v-btn>
            <v-spacer></v-spacer>
            <v-btn v-if="validCleaningInfo()" color="success" @click="scheduleCleaning()">
              <v-icon left>add</v-icon>Pievienot
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>

    <!-- list cleanings -->
    <list-cleanings v-if="!progressBar" :cleanings="cleanings" :items="items"></list-cleanings>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import ListCleanings from '@/comp/ListAllCleanings.vue';

export default {
  data() {
    return {
      progressBar: true,

      //dialog
      cleaningDialog: false,
      dateMenu: false,
      newCleaningClient: null,
      newCleaningDate: null,
      newCleaningFormatDate: null,
      newCleaningUser: null,
      users: {},
      usersSelect: [],
      clients: {},
      clientsSelect: [],

      cleanings: {},
    };
  },
  components: {
    ListCleanings,
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();

    db.collection('cleanings')
      .orderBy('scheduledDate', 'desc')
      .onSnapshot(function(querySnapshot) {
        var cleaningsL = {};
        querySnapshot.forEach(function(doc) {
          cleaningsL[doc.id] = doc.data();
        });
        vm.cleanings = Object.assign({}, cleaningsL);
        vm.items = Object.keys(vm.cleanings);
      });

    //initialize all necessary prommises
    var usersPromise = db.collection('users').get();
    var clientsPromise = db
      .collection('clients')
      .orderBy('clientName')
      .where('clientServices', '==', 'cleaning')
      .where('clientStatus', '==', 'active')
      .get();

    //wait for all data to load and only then work with it
    Promise.all([usersPromise, clientsPromise]).then(function(values) {
      //users
      const userSnapshot = values[0];
      var usersL = {};
      userSnapshot.forEach(function(doc) {
        vm.usersSelect.push({ text: doc.data().displayName, value: doc.id });
        usersL[doc.id] = doc.data();
      });
      vm.users = Object.assign({}, usersL);

      //clients
      const clientsSnapshot = values[1];
      var clientsL = {};
      clientsSnapshot.forEach(function(doc) {
        clientsL[doc.id] = doc.data();
        vm.clientsSelect.push({ text: doc.data().clientName, value: doc.id });
      });
      vm.clients = Object.assign({}, clientsL);

      //data is loaded
      vm.progressBar = false;
    });
  },
  watch: {
    //format dates
    newCleaningDate(val) {
      this.newCleaningFormatDate = this.formatDate(this.newCleaningDate);
    },
  },
  methods: {
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
    resetNewCleaningForm() {
      var vm = this;
      vm.newCleaningClient = null;
      vm.newCleaningDate = null;
      vm.newCleaningFormatDate = null;
      vm.newCleaningUser = null;
    },
    cancelCleaningDialog() {
      var vm = this;
      vm.resetNewCleaningForm();
      vm.cleaningDialog = false;
    },
    validCleaningInfo() {
      var vm = this;
      if (
        vm.newCleaningClient != null &&
        vm.newCleaningDate != null &&
        vm.newCleaningUser != null
      ) {
        return true;
      } else {
        return false;
      }
    },
    scheduleCleaning() {
      var vm = this;
      var db = firebase.firestore();

      //   vm.progressBar = true;

      const [year, month, day] = vm.newCleaningDate.split('-');
      const rawMonth = parseInt(month) - 1;
      const scheduledDate = new Date(year, rawMonth, day, 3, 0, 0, 0);

      const clientData = vm.clients[vm.newCleaningClient.value];

      //add to db
      db.collection('cleanings').add({
        clientId: vm.newCleaningClient.value,
        clientName: vm.newCleaningClient.text,
        clientAddress: clientData.clientAddress,
        responsibleId: vm.newCleaningUser.value,
        responsibleName: vm.newCleaningUser.text,
        scheduledDate: scheduledDate,
        dateFormatted: vm.newCleaningFormatDate,
        createdAt: new Date(),
        createdBy: vm.currentUserData.displayName,
        comment: '',
      });

      //enable snackbar
      vm.snackbarColor = 'success';
      vm.snackbarTxt = 'Tīrīšana saglabāta!';
      vm.snackbar = true;

      vm.resetNewCleaningForm();
      vm.cleaningDialog = false;
    },
  },
};
</script>