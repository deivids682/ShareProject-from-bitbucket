<template>
  <v-container>
    <h1>Klientu reģistrs</h1>

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
                    <v-checkbox v-model="filterServices" label="Rezidence" value="bfh"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterServices" label="Aprūpe mājās" value="neighborhood"></v-checkbox>
                  </v-flex>
                  <v-flex xs12 sm6 md4>
                    <v-checkbox v-model="filterServices" label="Tīrīšana" value="cleaning"></v-checkbox>
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
      <v-row dense>
        <template v-for="(client, clientId) in displayValues">
          <v-col cols="12" md="4" :key="clientId" v-if="showClient(client)">
            <v-card :color="'#'+client.clientColor">
              <v-list-item three-line @click="viewClientProfile(clientId)">
                <v-list-item-avatar size="60" color="secondary">
                  <v-img :src="clientPhoto(client)"></v-img>
                </v-list-item-avatar>
                <v-list-item-content>
                  <div>
                    <h4>
                    <v-icon
                        color="error"
                        v-if="client.hasRecentHealthProblems"
                      >warning</v-icon>
                      <v-icon
                        color="error"
                        v-if="client.clientStatus == 'paused'"
                      >pause_circle_outline</v-icon>
                      <v-icon color="error" v-if="client.clientStatus == 'stopped'">stop</v-icon>
                      {{client.clientName}}
                    </h4>
                  </div>
                  <v-list-item-subtitle>
                    {{client.clientDistrictName}}
                    <span
                      v-if="client.clientServices == 'bfh'"
                    >- {{client.bfhRoom.roomName}}</span>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>{{ serviceToTxt[client.clientServices] }}</v-list-item-subtitle>
                  <v-list-item-subtitle v-if="sudo">ID: {{clientId}}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      @click="newBodyVitals(clientId, client.clientName, 'new')"
                      small
                      outlined
                      fab
                      v-if="client.clientServices == 'bfh' || client.clientServices == 'neighborhood'"
                      v-on="on"
                    >
                      <v-icon>local_hospital</v-icon>
                    </v-btn>
                  </template>
                  <span>Pievienot veselības ierakstu</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      @click="newIncident(clientId, client.clientName, 'new', client.clientServices)"
                      small
                      outlined
                      fab
                      v-if="client.clientServices == 'bfh' || client.clientServices == 'neighborhood'"
                      v-on="on"
                    >
                      <v-icon>error</v-icon>
                    </v-btn>
                  </template>
                  <span>Pievienot incidentu</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      v-if="admin"
                      small
                      outlined
                      fab
                      v-on="on"
                      @click="deleteClient(clientId)"
                    >
                      <v-icon>delete_forever</v-icon>
                    </v-btn>
                  </template>
                  <span>Izdzēst klientu</span>
                </v-tooltip>
              </v-card-actions>
            </v-card>
          </v-col>
        </template>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data() {
    return {
      clientData: {},
      performedQueries: [],
      statusQuery: 'active',
      serviceQuery: 'bfh',
      noCoordinateClients: [],
      progressBar: true,
      searchValue: null,

      //filter clients
      filterDialog: false,
      filterStatus: [],
      filterServices: [],

      serviceToTxt: {
        cleaning: 'Tīrīšana',
        neighborhood: 'Aprūpe mājās',
        bfh: 'Residence',
      },
    };
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();

    //get clients
    //define initial queries from storage
    if (localStorage.getItem('userStatusFilter')) {
      try {
        vm.filterStatus = JSON.parse(localStorage.getItem('userStatusFilter'));
      } catch (e) {
        console.log(e);
      }
    } else {
      vm.filterStatus.push(vm.statusQuery);
    }

    if (localStorage.getItem('userServiceFilter')) {
      try {
        vm.filterServices = JSON.parse(
          localStorage.getItem('userServiceFilter')
        );
      } catch (e) {
        console.log(e);
      }
    } else {
      vm.filterServices.push(vm.serviceQuery);
    }

    vm.getClientData();

    //data loaded
    vm.progressBar = false;
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.clientData);
          for (var t = 0; t < ids.length; t++) {
            var searchBy =
              vm.clientData[ids[t]].clientName +
              vm.clientData[ids[t]].clientDistrictName;
            if (
              searchBy.toLowerCase().indexOf(vm.searchValue.toLowerCase()) !==
              -1
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
  watch: {
    filterStatus() {
      this.getClientData();
    },
    filterServices() {
      this.getClientData();
    },
  },
  methods: {
    async getClientData() {
      var vm = this;
      var db = firebase.firestore();

      //save updated filters in session storage
      const parsedStatusFilter = JSON.stringify(vm.filterStatus);
      const parsedServiceFilter = JSON.stringify(vm.filterServices);
      localStorage.setItem('userStatusFilter', parsedStatusFilter);
      localStorage.setItem('userServiceFilter', parsedServiceFilter);

      //possible queries
      var possibleQueries = [];

      vm.filterStatus.forEach(status => {
        vm.filterServices.forEach(service => {
          possibleQueries.push({
            query: status + service,
            status: status,
            service: service,
          });
        });
      });

      var qPromises = [];
      possibleQueries.forEach(query => {
        //get data only if not performed the query already
        if (vm.performedQueries.indexOf(query.query) == -1) {
          vm.progressBar = true;
          var clientsProm = db
            .collection('clients')
            .where('clientStatus', '==', query.status)
            .where('clientServices', '==', query.service)
            .orderBy('clientName')
            .get();

          qPromises.push(clientsProm);
        }
        if (vm.performedQueries.indexOf(query.query) == -1) {
          vm.performedQueries.push(query.query);
        }
      });

      var clientDataL = Object.assign({}, vm.clientData);
      var values = await Promise.all(qPromises);

      values.forEach(clientsSnap => {
        clientsSnap.forEach(function(doc) {
          clientDataL[doc.id] = doc.data();
          //no coordinates only for nbh and cleaning
          const clData = doc.data();
          if (
            clData.clientServices == 'neighborhood' ||
            clData.clientServices == 'cleaning'
          ) {
            if (typeof clData.clientAddressCoordinates == 'undefined') {
              vm.noCoordinateClients.push(doc.id);
            }
          }
        });
      });

      vm.clientData = Object.assign({}, clientDataL);
      vm.progressBar = false;
    },
    clientPhoto(clientData) {
      if (!clientData.clientPhotoUrl || clientData.clientPhotoUrl == '') {
        //   default photo
        return 'appId';
      } else {
        return clientData.clientPhotoUrl;
      }
    },
    viewClientProfile(clientId, clientName) {
      // view client profile programmatically
      this.$router.push({
        name: 'clientprofilen',
        params: { clientId: clientId },
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

          //change client status to 'deleted'
          vm.clientData[id].clientStatus = 'deleted';

          db.collection('clients')
            .doc(id)
            .update({ clientStatus: 'deleted' });
        } catch (error) {
          console.log(error);
        }
      }
    },
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
  },
}; //end export default
</script>

<style>
.client-card {
  margin: 2px;
  min-width: 150px;
}
</style>
