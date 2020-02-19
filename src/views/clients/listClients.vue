<template>
  <v-container>
    <h1>Klientu saraksts</h1>

    <!-- no coordinates error -->
    <v-layout wrap v-if="!progressBar">
      <v-flex xs12 v-if="noCoordinateClients.length > 0">
        <v-alert :value="true" type="error">
          Trūkst adrešu koordinātes:
          <ul>
            <li
              v-for="(clientId, index) in noCoordinateClients"
              :key="index"
            >{{clientData[clientId].clientName}}</li>
          </ul>
        </v-alert>
      </v-flex>
    </v-layout>

    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>

    <v-layout wrap>
      <!-- search -->
      <v-flex xs12 md6 lg4>
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-flex>
      <v-spacer></v-spacer>
      <!-- filter clients -->
      <v-flex xs12 md6 lg4>
        <v-dialog v-model="filterDialog" max-width="600px">
          <template v-slot:activator="{ on }">
            <v-btn text outlined color="grey darken-1" v-on="on">
              Atlasīt klientus
              <v-icon right>filter_list</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">Atlasīt klientus</span>
            </v-card-title>
            <v-card-text>
              <v-container grid-list-md>
                <v-layout wrap>
                  <v-flex xs12>
                    <h3>Klienta statuss</h3>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterStatus" label="Aktīvs" value="active"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterStatus" label="Apturēts" value="paused"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterStatus" label="Izslēgts" value="stopped"></v-checkbox>
                  </v-flex>
                  <v-flex xs12>
                    <h3>Pakalpojumi</h3>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterServices" label="Aprūpe mājās" value="neighborhood"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterServices" label="Tīrīšana" value="cleaning"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterServices" label="Residence" value="bfh"></v-checkbox>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="filterDialog = false">Aizvērt</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-flex>
    </v-layout>
    <!-- clients -->
    <v-layout v-if="!progressBar">
      <v-container fluid grid-list-sm>
        <v-layout row wrap>
          <template v-for="(client, clientId) in displayValues">
            <v-flex :key="clientId" xs12 md6 lg4 v-if="showClient(client)">
              <v-card :color="'#'+client.clientColor" class="client-card">
                <v-card-title
                  @click="viewClientProfile(clientId, client.clientName)"
                  primary
                  class="title"
                  primary-title
                >
                  <v-icon color="error" v-if="client.clientStatus == 'paused'">pause_circle_outline</v-icon>
                  <v-icon color="error" v-if="client.clientStatus == 'stopped'">stop</v-icon>
                  {{client.clientName}}
                </v-card-title>
                <v-card-text @click="viewClientProfile(clientId)">
                  {{ client.clientAddress }}
                  <br />
                  {{ serviceToTxt[client.clientServices] }}
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="newBodyVitals(clientId, client.clientName, 'new')"
                    small
                    outlined
                    v-if="typeof client.clientLifePlanTasks != 'undefined'"
                  >
                    <v-icon left>local_hospital</v-icon>Veselība
                  </v-btn>
                  <v-btn
                    @click="newIncident(clientId, client.clientName, 'new')"
                    small
                    outlined
                    v-if="typeof client.clientLifePlanTasks != 'undefined'"
                  >
                    <v-icon left>error</v-icon>Incidents
                  </v-btn>
                  <v-btn v-if="admin" icon @click="deleteClient(clientId)">
                    <v-icon>delete_forever</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-flex>
          </template>
        </v-layout>
      </v-container>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import BackBtn from '@/comp/BackBtn.vue';

export default {
  data() {
    return {
      clientData: {},
      noCoordinateClients: [],
      progressBar: true,
      searchValue: null,

      //filter clients
      filterDialog: false,
      filterStatus: ['active'],
      filterServices: ['neighborhood'],

      serviceToTxt: {
        cleaning: 'Tīrīšana',
        neighborhood: 'Aprūpe mājās',
        bfh: 'Residence',
      },
      userHeaders: [
        { text: 'Vārds, uzvārds', align: 'left', value: 'clientName' },
        {
          text: 'Adrese',
          value: 'clientAddress',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Rīki',
          align: 'center',
          sortable: false,
        },
      ],
    };
  },
  components: {
    BackBtn,
  },
  created() {
    var vm = this;

    var db = firebase.firestore();
    //get client data
    vm.getClients();
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.clientData);
          for (var t = 0; t < ids.length; t++) {
            if (
              vm.clientData[ids[t]].clientName
                .toLowerCase()
                .indexOf(vm.searchValue.toLowerCase()) !== -1
            ) {
              displayL[ids[t]] = vm.clientData[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.clientData);
        }
      } else {
        displayL = Object.assign({}, vm.clientData);
      }

      return displayL;
    },
  },
  methods: {
    showClient(clientData) {
      var vm = this;
      //check filter status
      var showByStatus = false;
      if (vm.filterStatus.indexOf(clientData.clientStatus) != -1) {
        showByStatus = true;
      }
      //check if has any services
      var showByServices = false;
      if (vm.filterServices.indexOf(clientData.clientServices) != -1) {
        showByServices = true;
      }

      return showByStatus && showByServices;
    },
    getClients() {
      var vm = this;

      var db = firebase.firestore();
      //get client data
      var clientDataL = {};
      db.collection('clients')
        .orderBy('clientName')
        .onSnapshot(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            clientDataL[doc.id] = doc.data();
            if (
              doc.data().clientServices.indexOf('neighborhood') != -1 ||
              doc.data().clientServices.indexOf('cleaning') != -1
            ) {
              if (typeof doc.data().clientAddressCoordinates == 'undefined') {
                vm.noCoordinateClients.push(doc.id);
              }
            }
          });
          vm.clientData = Object.assign({}, clientDataL);
          if (vm.currentUserData != '') {
            vm.progressBar = false;
          }
        });
    },
    viewClientProfile(clientId, clientName) {
      // view client profile programmatically
      this.$router.push({
        name: 'clientprofile',
        params: { id: clientId, clientName: clientName },
      });
    },
    newIncident(clientId, clientName, incId) {
      // view client profile programmatically
      this.$router.push({
        name: 'incident',
        params: { id: clientId, clientName: clientName, incId: incId },
      });
    },
    newBodyVitals(clientId, clientName, vitalsId) {
      // view client profile programmatically
      this.$router.push({
        name: 'vitals',
        params: { id: clientId, clientName: clientName, vitalsId: vitalsId },
      });
    },
    deleteClient(id) {
      var vm = this;
      var r = confirm('Tiešām vēlies izdzēst?');
      if (r == true) {
        try {
          var db = firebase.firestore();

          db.collection('clients')
            .doc(id)
            .delete();

          //refresh view
          vm.getClients();
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
}; //end export default
</script>

<style>
.client-card {
  margin: 2px;
  min-width: 150px;
}
</style>
