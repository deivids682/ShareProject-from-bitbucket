<template>
  <v-container>
    <h1>
      {{clientName}}
      <span v-if="clientStatus != 'active'" class="pause-lp-span">
        <br />
        <span v-if="clientStatus == 'paused'">
          <v-icon color="error">pause_circle_outline</v-icon>klienta statuss - apturēts
        </span>
        <span v-if="clientStatus == 'stopped'">
          <v-icon color="error">stop</v-icon>klienta statuss - izslēgts
        </span>
      </span>
    </h1>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <!-- navigate -->
    <v-flex xs12 md4 lg3 v-if="!progressBar">
      <v-select outlined v-model="showTab" :items="tabs" label="Skatīt"></v-select>
    </v-flex>
    <v-flex xs12>
      <v-divider></v-divider>
      <br />
    </v-flex>

    <v-layout wrap v-if="!progressBar">
      <!-- CLIENT FORM -->
      <v-flex xs12 v-if="showTab == 'Pamata informācija'">
        <h2>Pamata informācija</h2>
        <v-card>
          <v-form ref="form" v-model="valid" lazy-validation id="form">
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                  v-model="clientName"
                  :rules="[v => !!v || 'Nepieciešams vārds']"
                  label="Klienta vārds, uzvārds"
                  required
                  v-on:change="submit()"
                  prepend-icon="account_box"
                  :readonly="(!admin) ? true : false"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 md6 lg4>
                <v-text-field
                  v-model="clientAddress"
                  :rules="[v => !!v || 'Nepieciešama klienta adrese']"
                  label="Klienta adrese"
                  required
                  v-on:change="saveClientAddress()"
                  prepend-icon="home"
                  :readonly="(!admin) ? true : false"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 md6 lg4>
                <v-text-field
                  v-model="clientContacts"
                  label="Klienta kontaktinformācija"
                  v-on:change="submit()"
                  prepend-icon="contact_phone"
                  :readonly="(!admin) ? true : false"
                ></v-text-field>
              </v-flex>
              <v-flex xs12 md6 lg4>
                <v-text-field
                  v-model="clientDoorCode"
                  label="Durvju kods"
                  v-on:change="submit()"
                  prepend-icon="https"
                  :readonly="(!admin) ? true : false"
                ></v-text-field>
              </v-flex>
              <!-- select district -->
              <v-flex xs12 md6 lg4>
                <v-select
                  v-model="clientDistrict"
                  label="Rajons"
                  :items="districts"
                  item-text="districtName"
                  item-value="id"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                  v-on:change="updateDistrict()"
                  prepend-icon="business"
                  :readonly="(!admin) ? true : false"
                ></v-select>
                <v-layout v-if="clientDistrict == ''">
                  <v-flex xs12>
                    <p class="error-p">Trūkst rajona!</p>
                  </v-flex>
                </v-layout>
              </v-flex>
              <!-- select profile -->
              <v-flex xs12 md6 lg4 v-if="clientServices.indexOf('neighborhood')!= -1">
                <v-select
                  v-model="clientProfile"
                  label="Profils"
                  :items="profiles"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                  v-on:change="submit()"
                  prepend-icon="accessibility_new"
                  :readonly="(!admin) ? true : false"
                ></v-select>
                <v-layout v-if="clientProfile == '' && clientServices.indexOf('neighborhood')!= -1">
                  <v-flex xs12>
                    <p class="error-p">Trūkst profils!</p>
                  </v-flex>
                </v-layout>
              </v-flex>
              <!-- description -->
              <v-flex xs12>
                <v-textarea
                  v-model="clientDescription"
                  label="Informācija par klientu"
                  v-on:change="submit()"
                  prepend-icon="message"
                  :readonly="(!admin) ? true : false"
                ></v-textarea>
              </v-flex>
              <!-- sevices -->
              <v-layout wrap>
                <v-flex xs12 md12 lg3>
                  <label color="grey">
                    <v-icon>room_service</v-icon>
                    Pakalpojums - {{servicesToTxt[clientServices]}}
                  </label>
                </v-flex>
              </v-layout>

              <!-- pin color -->
              <v-flex xs12>
                <v-icon>brush</v-icon>
                <label color="grey">Atzīmes krāsa</label>
                <v-dialog v-model="colorDialog" persistent max-width="500">
                  <template v-slot:activator="{ on }">
                    <v-btn>
                      <v-icon :color="'#'+clientColor" v-on="on">location_on</v-icon>
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-title class="headline">Klienta atzīmes krāsa</v-card-title>
                    <v-card-text>
                      <slider-picker style="width:100%" v-model="clientColor" />
                      <br />
                      <v-icon
                        x-large
                        :color="clientColor.hex"
                        v-if="typeof clientColor.hex != 'undefined'"
                      >location_on</v-icon>
                      <v-icon
                        x-large
                        :color="'#'+clientColor"
                        v-if="typeof clientColor.hex == 'undefined'"
                      >location_on</v-icon>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="error" text @click="colorDialog = false">
                        <v-icon>clear</v-icon>Atcelt
                      </v-btn>
                      <v-btn color="primary" text @click="saveColor()">
                        <v-icon>save</v-icon>Saglabāt
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-flex>

              <!-- client status -->
              <v-flex xs12 md4 lg3>
                <v-select
                  v-model="clientStatus"
                  :items="clientStatusSelect"
                  label="Klienta statuss"
                  :prepend-icon="prependClientStatusIcon()"
                  :readonly="(!admin) ? true : false"
                  v-on:change="submit()"
                ></v-select>
              </v-flex>

              <!-- map -->
              <v-flex xs12 v-if="typeof clientData.clientAddressCoordinates != 'undefined'">
                <v-icon>place</v-icon>Adrese kartē
                <GmapMap
                  :center="clientData.clientAddressCoordinates"
                  :zoom="14"
                  style="width: 100%; height: 400px"
                >
                  <GmapMarker
                    :position="clientData.clientAddressCoordinates"
                    :icon="'http://www.googlemapsmarkers.com/v1/'+clientData.clientColor+'/'"
                  />
                </GmapMap>
              </v-flex>

              <!-- last update -->
              <v-flex xs12>
                <br />
                <v-divider></v-divider>
                <small>
                  <span
                    style="font-style: italic"
                    v-if="lastUser != null"
                  >Pēdējo reizi atjaunoja {{lastUser}} {{formatDate(lastUpdate.seconds)}}</span>
                </small>
              </v-flex>

              <template v-if="clientDistrict != ''">
                <v-flex xs12></v-flex>
                <v-flex xs12>
                  <br />
                  <v-divider></v-divider>
                </v-flex>
              </template>
              <v-layout wrap v-if="clientDistrict != ''"></v-layout>
            </v-layout>
          </v-form>
        </v-card>
      </v-flex>
      <!-- EVALUATIONS -->
      <v-flex xs12 v-if="showTab == 'Aprūpe mājās'">
        <h2>Aprūpe mājās</h2>
        <!-- buttons -->
        <v-layout row>
          <v-btn
            color="primary"
            :to="{ name: 'evaluation', params: { id: clientID, evId:'' }}"
            v-if="clientServices == 'neighborhood' "
          >
            <v-icon>build</v-icon>Jauna Novērtēšana
          </v-btn>
          <v-btn
            color="primary"
            :to="{ name: 'clienttasks', params: { clid: clientID}}"
            v-if="clientServices == 'neighborhood' "
          >
            <v-icon>done</v-icon>Dzīves plāna uzdevumi
          </v-btn>
          <v-btn
            color="primary"
            :to="{ name: 'lifeplan', params: { clid: clientID}}"
            v-if="clientServices == 'neighborhood' && typeof clientData.clientLifePlanTasks != 'undefined'"
          >
            <v-icon>list_alt</v-icon>Dzīves plāns
          </v-btn>

          <v-btn color="primary" v-if="admin || manager" class="margin-v-btn">
            <v-icon>file_copy</v-icon>Pārkopēt dzīves plānu
          </v-btn>
        </v-layout>
        <br />
        <!-- list daily reports -->
        <v-card v-if="cilentReports.length > 0 && showTab == 'Aprūpe mājās'">
          <v-card-title>
            <h3>Dienas atskaites</h3>
          </v-card-title>

          <list-data
            :collectionName="'clientReports'"
            :key="'clientReports'"
            :collectionData="cilentReports"
            :clientID="clientID"
            :clientName="clientName"
            :clientColor="clientColor"
          ></list-data>
        </v-card>
        <br />
        <br />

        <!-- list evaluations -->
        <v-card v-if="hasEvaluations && showTab == 'Aprūpe mājās'">
          <v-card-title>
            <h3>Dzīvesvietas novērtējumi</h3>
          </v-card-title>

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
                    :to="{ name: 'evaluation', params: { id: clientID, evId: item.id }}"
                  >
                    <v-icon dark left>remove_red_eye</v-icon>Skatīt
                  </v-btn>

                  <v-btn
                    id="reportBtn"
                    text
                    small
                    color="green lighten-2"
                    :to="{ name: 'equipmentreport', params: { clid: clientID, evid: item.id }}"
                  >
                    <v-icon dark left>camera_alt</v-icon>Atskaite
                  </v-btn>

                  <v-btn
                    id="deleteEvaluationBtn"
                    icon
                    @click="deleteRecord(clientID, item.id, 'evaluations')"
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
        </v-card>
        <br />
        <br />

        <!-- list pause dates -->
        <v-card v-if="clientPauseDates.length > 0 && showTab == 'Aprūpe mājās'">
          <v-card-title>
            <h3>Neaktīvās dienas</h3>
          </v-card-title>
          <list-data
            :collectionName="'inactiveDays'"
            :key="'inactiveDays'"
            :collectionData="clientPauseDates"
          ></list-data>
        </v-card>
        <br />
        <br />
      </v-flex>
      <!-- CLEANINGS -->
      <v-flex xs12 v-if="showTab == 'Tīrīšana'">
        <h2>Tīrīšana</h2>
        <!-- buttons -->
        <v-layout wrap>
          <v-btn
            color="primary"
            :to="{ name: 'cleaningtasksclient', params: { clid: clientID}}"
            v-if="clientServices == 'cleaning' "
          >
            <v-icon>done</v-icon>Tīrīšanas uzdevumi
          </v-btn>
        </v-layout>
        <br />

        <v-card v-if="showTab == 'Tīrīšana'">
          <list-cleanings :cleanings="cleanings" :items="cleaningsItems"></list-cleanings>
        </v-card>
      </v-flex>
      <!-- INCIDENTS -->
      <v-flex xs12 v-if="showTab == 'Incidenti'">
        <h2>Incidenti</h2>
        <!-- buttons -->
        <v-layout wrap>
          <v-btn @click="newIncident(clientID, clientName, 'new')" color="primary">
            <v-icon>error</v-icon>Incidents
          </v-btn>
        </v-layout>
        <br />

        <list-data :collectionName="'incidents'" :key="'incidents'" :collectionData="incidents"></list-data>
      </v-flex>
      <!-- VITALS -->
      <v-flex xs12 v-if="showTab == 'Veselības dati'">
        <h2>Veselības dati</h2>
        <!-- buttons -->
        <v-layout wrap>
          <v-btn @click="newBodyVitals(clientID, clientName, 'new')" color="primary">
            <v-icon>local_hospital</v-icon>Veselība
          </v-btn>
        </v-layout>
        <br />

        <list-data :collectionName="'bodyVitals'" :key="'bodyVitals'" :collectionData="vitals"></list-data>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//pdf
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

//color picker
import { Slider } from 'vue-color';

//list table
import ListData from '@/comp/ListData.vue';
import ListCleanings from '@/comp/ListAllCleanings.vue';

export default {
  components: {
    'slider-picker': Slider,
    ListData,
    ListCleanings,
  },
  data() {
    return {
      showProgress: false,
      progressBar: true,
      colorDialog: false,
      currentUserId: null,
      showTab: 'Pamata informācija',
      tabs: ['Pamata informācija'],
      //pagination
      page: 1,
      pageCount: 0,
      itemsPerPage: 10,
      form: {
        clientName: '',
        clientAddress: '',
        clientDescription: '',
        clientDoorCode: '',
        clientDistrict: '',
        clientContacts: '',
        clientColor: '',
        clientServices: [],
        clientStatus: '',
        clientProfile: '',
      },
      valid: true,
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      users: {},
      districts: [],
      hasEvaluations: false,
      evaluations: [],
      cleanings: {},
      cleaningsItems: [],
      incidents: {},
      vitals: {},
      profiles: [],
      clientStatusSelect: [],
      servicesToTxt: {},
      evHeaders: [],

      //define to data from user registered data
      clientName: this.$route.params.clientName,
      clientAddress: '',
      clientDescription: '',
      clientDoorCode: '',
      clientDistrict: '',
      clientProfile: '',
      clientContacts: '',
      clientServices: [],
      clientColor: '',
      clientStatus: '',
      clientData: {},
      cilentReports: [],
      clientPauseDates: [],
      lastUpdate: '',
      lastUser: '',
      clientID: this.$route.params.id,

      //if selected client tasks
      clientTasks: {},
    };
  },

  async created() {
    var vm = this;
    var clientId = this.$route.params.id;

    var db = firebase.firestore();

    //get current user data
    vm.currentUserId = vm.currentUserData.userId;

    //initialize all necessary prommises
    var clientPromise = db
      .collection('clients')
      .doc(clientId)
      .get();
    var evPromise = db
      .collection('clients')
      .doc(clientId)
      .collection('evaluations')
      .get();

    var clPromise = db
      .collection('cleanings')
      .orderBy('scheduledDate', 'desc')
      .where('clientId', '==', clientId)
      .get();

    var usersPromise = db.collection('users').get();

    var districtsPromise = db
      .collection('residences')
      .orderBy('name')
      .get();

    var incidentPromise = db
      .collection('incidents')
      .where('clientId', '==', clientId)
      .orderBy('date', 'desc')
      .get();

    var vitalsPromise = db
      .collection('bodyVitals')
      .where('clientId', '==', clientId)
      .orderBy('date', 'desc')
      .get();

    //wait for all data to load and only then work with it
    Promise.all([
      clientPromise,
      evPromise,
      clPromise,
      usersPromise,
      districtsPromise,
      incidentPromise,
      vitalsPromise,
    ]).then(function(values) {
      //districts
      const districtsSnapshot = values[4];
      districtsSnapshot.forEach(function(doc) {
        var data = doc.data();
        data['id'] = doc.id;
        vm.districts.push(data);
      });

      //users
      const userSnapshot = values[3];
      var usersL = {};
      userSnapshot.forEach(function(doc) {
        usersL[doc.id] = doc.data();
      });
      vm.users = Object.assign({}, usersL);

      //client data
      const clientData = values[0].data();
      vm.clientData = clientData;
      vm.clientName = clientData.clientName;
      vm.clientAddress = clientData.clientAddress;
      vm.clientDescription = clientData.clientDescription;
      vm.clientTasks = clientData.clientTasks;
      vm.clientDoorCode = clientData.clientDoorCode;
      vm.clientDistrict = clientData.clientDistrict;
      vm.clientContacts = clientData.clientContacts;
      vm.clientStatus = clientData.clientStatus;
      vm.clientProfile =
        typeof clientData.clientProfile != 'undefined'
          ? clientData.clientProfile
          : '';
      vm.clientServices =
        typeof clientData.clientServices != 'undefined'
          ? clientData.clientServices
          : [];

      vm.clientColor = clientData.clientColor;

      vm.cilentReports =
        typeof clientData.clientsDailyReports != 'undefined'
          ? clientData.clientsDailyReports.reverse()
          : [];

      vm.clientPauseDates =
        typeof clientData.clientsPauseDates != 'undefined'
          ? clientData.clientsPauseDates.reverse()
          : [];

      vm.lastUpdate =
        typeof clientData.lastUpdate != 'undefined'
          ? clientData.lastUpdate
          : null;

      vm.lastUser =
        typeof clientData.lastUser != 'undefined' ? clientData.lastUser : null;

      //generate view tabs
      vm.generateViewTams(vm.clientServices);

      //evaluations
      const evSnapshot = values[1];
      evSnapshot.forEach(function(doc) {
        //push data to array
        var data = doc.data();
        data['id'] = doc.id;
        vm.evaluations.push(data);
      });

      if (vm.evaluations.length > 0) {
        vm.hasEvaluations = true;
      }

      //cleanings
      const clSnapshot = values[2];
      var cleaningsL = {};
      clSnapshot.forEach(function(doc) {
        cleaningsL[doc.id] = doc.data();
      });
      vm.cleanings = Object.assign({}, cleaningsL);
      vm.cleaningsItems = Object.keys(vm.cleanings);

      //incidents
      var incidentsL = {};
      const incidentsSnapshot = values[5];
      incidentsSnapshot.forEach(function(doc) {
        incidentsL[doc.id] = doc.data();
      });
      vm.incidents = Object.assign({}, incidentsL);

      //vitals
      var vitalsL = {};
      const vitalsSnapshot = values[6];
      vitalsSnapshot.forEach(function(doc) {
        vitalsL[doc.id] = doc.data();
      });
      vm.vitals = Object.assign({}, vitalsL);

      //data is loaded
      vm.progressBar = false;
    });
  },
  methods: {
    viewCleaning(cleaningId) {
      var vm = this;
      // view cleaning programmatically
      this.$router.push({
        name: 'cleaningsViewOne',
        params: {
          cleaningId: cleaningId,
          cleaningData: vm.cleanings[cleaningId],
        },
      });
    },
    printCleaning(cleaningId) {
      console.log('print cleaning', cleaningId);
    },
    deleteCleaning(cleaningId, index) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst tīrīšanu?');
      if (conf) {
        try {
          //vm.progressBar = true;
          var db = firebase.firestore();

          //delete task
          db.collection('cleanings')
            .doc(cleaningId)
            .delete()
            .then(function() {
              //delete from table
              delete vm.cleanings[cleaningId];
              //vm.items.splice(index, 1);

              //enable snackbar
              vm.snackbarColor = 'success';
              vm.snackbarTxt = 'Tīrīšana veiksmīgi izdzēsta!';
              vm.snackbar = true;

              //vm.progressBar = false;
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
    async fetchAsync(url) {
      // await response of fetch call
      let response = await fetch(url);
      // only proceed once promise is resolved
      let data = await response.json();
      // only proceed once second promise is resolved
      return data;
    },
    saveClientAddress() {
      //get coordinates
      var vm = this;
      var db = firebase.firestore();

      const addressId = vm.clientAddress
        .toLowerCase()
        .replace(/([^a-z0-9]+)/gi, '_');

      //get lat and long from Google maps api
      //https://developers.google.com/maps/documentation/geocoding/start

      //replace spaces with +
      const addressQuery = vm.clientAddress.split(' ').join('+');
      const geoUrl =
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
        addressQuery +
        '&key=appId';

      vm.fetchAsync(geoUrl)
        .then(data => {
          //save in db

          db.collection('clients')
            .doc(vm.clientID)
            .update({
              clientAddress: vm.clientAddress,
              clientAddressCoordinates: {
                lat: data.results[0].geometry.location.lat,
                lng: data.results[0].geometry.location.lng,
              },
              lastUpdate: new Date(),
              lastUser: vm.currentUserData.displayName,
            });
          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Informācija saglabāta!';
          vm.snackbar = true;
        })
        .catch(reason => {
          console.log(reason.message);
          //trow error in snackbar
          vm.snackbarColor = 'error';
          vm.snackbarTxt = 'Nevarēja atrast adresi!';
          vm.snackbar = true;
        });

      //save to profile
    },
    prependClientStatusIcon() {
      var vm = this;
      var statusIcon = 'play_arrow';
      switch (vm.clientStatus) {
        case 'paused':
          statusIcon = 'pause';
          break;
        case 'stopped':
          statusIcon = 'stop';
          break;
        default:
          break;
      }
      return statusIcon;
    },

    newBodyVitals(clientId, clientName, vitalsId) {
      // view client profile programmatically
      this.$router.push({
        name: 'vitals',
        params: { id: clientId, clientName: clientName, vitalsId: vitalsId },
      });
    },
    newIncident(clientId, clientName, incId) {
      this.$router.push({
        name: 'incident',
        params: { id: clientId, clientName: clientName, incId: incId },
      });
    },
    generateViewTams(clientServices) {
      var vm = this;
      //loop selected services to add views to tabs
      if (clientServices == 'neighborhood') {
        vm.tabs.push('Aprūpe mājās');
      }
      if (clientServices == 'cleaning') {
        vm.tabs.push('Tīrīšana');
      }
      if (clientServices == 'bfh') {
        vm.tabs.push('Lielā ģimenes māja');
      }

      if (clientServices == 'bfh' || clientServices == 'neighborhood') {
        vm.tabs.push('Incidenti');
      }
      if (clientServices == 'bfh' || clientServices == 'neighborhood') {
        vm.tabs.push('Veselības dati');
      }
    },
    querryDailyReports() {
      var vm = this;
      var clientId = this.$route.params.id;
      var clientName = this.$route.params.clientName;
      var db = firebase.firestore();

      //get only those dates, where this client has assigned tasks
      var clientsDailyReports = [];
      db.collection('dailyReports')
        .orderBy('reportDate')
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            const reportId = doc.id;
            var numberOfTasks = 0;
            if (typeof doc.data().clientAllTasks[clientId] != 'undefined') {
              numberOfTasks = Object.keys(
                doc.data().clientAllTasks[clientId].tasks
              ).length;
            }
            //console.log(numberOfTasks)
            if (numberOfTasks > 0) {
              clientsDailyReports.push(reportId);
            }
          });
          db.collection('clients')
            .doc(clientId)
            .update({
              clientsDailyReports: clientsDailyReports,
            });
        });
    },
    showInConsole(message) {
      console.log(message);
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
            img.src = 'data:data';
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
    printReport: async function(evId, userDisplayName) {
      var vm = this;
      // feedback
      vm.showProgress = true;

      //get evaluation data
      var db = firebase.firestore();
      var evaluationRef = db
        .collection('clients')
        .doc(vm.clientID)
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
        vm.clientName
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
        content: [],
        defaultStyle: {
          fontSize: 10,
        },
        styles: {
          header: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
          },
          right: {
            alignment: 'right',
          },
          bold: {
            bold: true,
          },
          sectionHeader: {
            bold: true,
          },
        },
      };

      var now = new Date();

      var pdf = pdfMake.createPdf(docDefinition);
      pdf.download(fileName);
      vm.showProgress = false;
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
    saveColor() {
      var vm = this;
      var clientId = this.$route.params.id;
      var db = firebase.firestore();

      var color = vm.clientColor.hex;
      color = color.substr(1);

      db.collection('clients')
        .doc(clientId)
        .update({
          clientColor: color,
        });

      vm.colorDialog = false;
      vm.clientColor = color;
      //enable snackbar
      vm.snackbarColor = 'success';
      vm.snackbarTxt = 'Informācija saglabāta!';
      vm.snackbar = true;
    },
    async updateDistrict() {
      var vm = this;
      var clientId = this.$route.params.id;
      var db = firebase.firestore();

      //update district in profile
      db.collection('clients')
        .doc(clientId)
        .update({
          clientDistrict: vm.clientDistrict,
          lastUpdate: new Date(),
          lastUser: vm.currentUserData.displayName,
        });

      //enable snackbar
      vm.snackbarColor = 'success';
      vm.snackbarTxt = 'Informācija saglabāta!';
      vm.snackbar = true;
    },
    constructShiftKey(inpDate) {
      var shiftDate = new Date(inpDate * 1000);
      const year = shiftDate.getFullYear();
      var month = shiftDate.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var date = shiftDate.getDate();
      if (date < 10) {
        date = '0' + date;
      }
      return year + '-' + month + '-' + date;
    },
    submit() {
      var vm = this;
      var clientId = this.$route.params.id;

      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();

          db.collection('clients')
            .doc(clientId)
            .update({
              clientName: this.clientName,
              clientAddress: this.clientAddress,
              clientDescription: this.clientDescription || '',
              clientContacts: this.clientContacts || '',
              clientDoorCode: this.clientDoorCode || '',
              clientServices: this.clientServices || '',
              clientDistrict: this.clientDistrict,
              clientStatus: this.clientStatus,
              lastUpdate: new Date(),
              lastUser: this.currentUserData.displayName,
              clientProfile: this.clientProfile,
            });
          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Informācija saglabāta!';
          vm.snackbar = true;
        } catch (error) {
          console.log(error);
        }
      }
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
  }, //end methods
}; //end export default
</script>

<style>
.error-p {
  font-size: 20px;
  color: red;
  font-style: italic;
  padding-left: 10px;
}
.pause-lp-span {
  color: red;
}
</style>



