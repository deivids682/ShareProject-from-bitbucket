<template>
  <v-row align="center" justify="center">
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <!--Progress bar -->
    <v-col cols="12" v-if="progressBar">
      <v-progress-linear :indeterminate="true"></v-progress-linear>
    </v-col>

    <v-col cols="12">
      <h2>Profilēšana</h2>
    </v-col>

    <!-- list historic profiles -->
    <v-col cols="12" v-if="!progressBar">
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="(p,profileId) in profiles" :key="profileId">
          <v-expansion-panel-header>
            <strong>{{profileId}}</strong>
            <v-label>prieksh share:</v-label>
            {{p.invoicePriceName}}
            <span></span>
            <v-label>prieksh share:</v-label>
            {{p.invoicePricePerDay}} EUR
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-list>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.invoicePricePerDay}} EUR
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.pension}} EUR
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.daysStayed}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.offDays}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share ({{p.residenceName}}-{{p.roomName}}):</v-label>
                    {{p.bedsPerRoom}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>Cenu grupa:</v-label>
                    {{p.priceGroupName}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>Izmaksu profils:</v-label>
                    {{p.invoicePriceName}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>Jauni papildus pakalpojumu punkti:</v-label>
                    {{p.newBonusPacks}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.dpPriceLevel}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>Incidenti:</v-label>
                    {{p.incidents}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>prieksh share:</v-label>
                    {{p.priekshshare}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>GIR:</v-label>
                    {{p.girRaw}}
                    <v-btn icon @click.stop="openGirDialog(profileId)">
                      <v-icon color="grey lighten-1">mdi-information</v-icon>
                    </v-btn>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-label>Komentārs:</v-label>
                    {{p.comment}}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-btn @click="openProfileDialog(profileId, p)">
              <v-icon left>refresh</v-icon>prieksh share
            </v-btn>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>

    <!-- GIR DIALOG -->
    <v-dialog v-model="girDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="headline">prieksh share</v-card-title>
        <v-card-text>
          <v-list v-if="girDialog">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>4prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['cognitiveValue'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <v-label>prieksh share:</v-label>
                  {{girDialogData['prieksh share'].Result}}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="error" text @click="girDialog = false">
            <v-icon left>close</v-icon>Aizvērt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- recalculate profile dialog -->
    <v-dialog v-model="profileDialog" max-width="600" persistent>
      <v-card v-if="profileDialog">
        <v-card-title class="headline">prieksh share</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation id="form">
            <v-row>
              <v-col cols="12">
                <h2>Klients</h2>
              </v-col>
              <!-- dates -->
              <v-col cols="12" md="5">
                <v-text-field
                  disabled
                  label="Perioda sākums"
                  :value="formatDateReport(new Date(profileDialogData.wStartDate.seconds*1000))"
                ></v-text-field>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="12" md="5">
                <v-text-field
                  disabled
                  label="Perioda beigas"
                  :value="formatDateReport(new Date(profileDialogData.wEndDate.seconds*1000))"
                ></v-text-field>
              </v-col>
              <!-- client pay and pension -->
              <v-col cols="12" md="5">
                <v-text-field
                  label="prieksh share"
                  type="number"
                  step="0.01"
                  v-model="profileDialogData.clientPay"
                  reverse
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-text-field>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="12" md="5">
                <v-text-field
                  label="prieksh share"
                  type="number"
                  step="0.01"
                  v-model="profileDialogData.pension"
                  reverse
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-text-field>
              </v-col>
              <!-- residence and room  -->
              <v-col cols="12" md="5">
                <v-select
                  v-model="profileDialogData.residenceId"
                  label="prieksh share"
                  item-text="name"
                  item-value="id"
                  :items="Object.values(residences)"
                  v-on:change="updatedResidence()"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-select>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="12" md="5">
                <v-select
                  v-model="profileDialogData.roomId"
                  label="Istaba"
                  :items="roomSelector"
                  item-value="roomId"
                  item-text="roomName"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-select>
              </v-col>
              <!-- price group  -->
              <v-col cols="12" md="5">
                <v-select
                  v-model="profileDialogData.priceGroupId"
                  label="Cenu grupa"
                  item-text="name"
                  item-value="id"
                  :items="Object.values(priceGroups)"
                  :rules="[v => !!v || 'Nepieciešams norādīt']"
                ></v-select>
              </v-col>
              <v-spacer></v-spacer>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="recalculateProfile()">
            <v-icon left>refresh</v-icon>Pārrēķināt
          </v-btn>
          <v-btn color="error" text @click="profileDialog = false">
            <v-icon left>close</v-icon>Aizvērt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { girCode, girAlfabeticProfiling } from '../../JSON/GirCodes';

export default {
  props: ['clientId', 'loadedClientData'],
  data() {
    return {
      //setup
      progressBar: true,
      girDialog: false,
      girDialogData: {},
      profileDialog: false,
      profileDialogData: {},
      priceGroups: {},
      residences: {},
      roomSelector: [],
      valid: true,
      //settings
      rdSupport: 640,
      //load profiles
      profiles: {},
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();
    vm.clientData = Object.assign({}, vm.loadedClientData);
    //load profiles
    let profilesSnap = db
      .collection('clients')
      .doc(vm.clientId)
      .collection('profiles')
      .orderBy('wEndDate', 'desc')
      .onSnapshot(function(profilesSnap) {
        let profilesL = {};
        profilesSnap.forEach(profile => {
          profilesL[profile.id] = profile.data();
        });
        vm.profiles = Object.assign({}, profilesL);
        vm.progressBar = false;
      });
  },
  methods: {
    async openProfileDialog(profileId, profileData) {
      var vm = this;
      //load data
      vm.progressBar = true;
      let getData = [];

      if (Object.keys(vm.priceGroups).length == 0) {
        var db = firebase.firestore();
        let getPriceData = db
          .collection('priceGroups')
          .where('service', '==', vm.clientData.clientServices)
          .get();
        getData.push(getPriceData);

        let getResidences = db
          .collection('residences')
          .where('service', '==', vm.clientData.clientServices)
          .get();
        getData.push(getResidences);

        let values = await Promise.all(getData);

        let pgL = {};
        values[0].forEach(pg => {
          pgL[pg.id] = pg.data();
          pgL[pg.id]['id'] = pg.id;
        });
        vm.priceGroups = Object.assign({}, pgL);

        let resL = {};
        values[1].forEach(r => {
          resL[r.id] = r.data();
          resL[r.id]['id'] = r.id;
        });
        vm.residences = Object.assign({}, resL);
      }

      vm.profileDialogData = Object.assign({}, profileData);
      vm.generateRoomSelector();
      vm.progressBar = false;
      vm.profileDialog = true;
    },
    generateRoomSelector() {
      var vm = this;
      var items = [];
      var rooms = Object.keys(
        vm.residences[vm.profileDialogData.residenceId].rooms
      );
      rooms.forEach(roomId => {
        items.push({
          roomId: roomId,
          roomName:
            vm.residences[vm.profileDialogData.residenceId].rooms[roomId].name,
        });
      });
      items.sort(vm.sortByName);

      vm.roomSelector = items;
    },
    updatedResidence() {
      //reset room
      this.profileDialogData.roomId = null;
      this.generateRoomSelector();
    },
    sortByName(a, b) {
      const nameA = a.roomName.toUpperCase();
      const nameB = b.roomName.toUpperCase();

      let comparison = 0;
      if (nameA > nameB) {
        comparison = 1;
      } else if (nameA < nameB) {
        comparison = -1;
      }
      return comparison;
    },
    openGirDialog(profileId) {
      var vm = this;
      vm.girDialogData = vm.profiles[profileId].xTaskGroups;
      vm.girDialog = true;
    },
    async deleteLastWeekProfiling() {
      var db = firebase.firestore();
      //get clients
      let clientsSnap = await db
        .collection('clients')
        .where('clientServices', '==', 'bfh')
        .get();

      clientsSnap.forEach(async client => {
        let profilesSnap = await db
          .collection('clients')
          .doc(client.id)
          .collection('profiles')
          .orderBy('wEndDate', 'desc')
          .limit(1)
          .get();

        profilesSnap.forEach(profile => {
          db.collection('clients')
            .doc(client.id)
            .collection('profiles')
            .doc(profile.id)
            .delete();
        });
      }); //end for clients
    },
    async recalculateProfile() {
      var start = new Date();
      var vm = this;
      vm.profileDialog = false;
      vm.progressBar = true;
      var vm = this;
      var c = vm.clientData;

      var wStartDate = new Date(vm.profileDialogData.wStartDate.seconds * 1000);
      var wEndDate = new Date(vm.profileDialogData.wEndDate.seconds * 1000);

      var db = firebase.firestore();
      var batch = db.batch();

      var periodStart = wStartDate;
      //check if entered later
      if (new Date(c.bfhEnterDate) > periodStart) {
        periodStart = new Date(c.bfhEnterDate);
      }

      var periodEnd = wEndDate;
      //check if died or left
      if (c.deathDate) {
        periodEnd =
          periodEnd < new Date(c.deathDate) ? periodEnd : new Date(c.deathDate);
      }
      if (c.leftDate) {
        periodEnd =
          periodEnd < new Date(c.leftDate) ? periodEnd : new Date(c.leftDate);
      }
      var periodDays = Math.floor(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24) + 1
      );

      periodEnd.setHours(23, 59, 59);

      if (periodDays < 0) {
        periodDays = 0;
      }

      //get data
      //incidents solved AND confirmed
      var getIncidents = db
        .collection('incidents')
        .where('date', '>=', periodStart)
        .where('date', '<=', periodEnd)
        .where('incidentStatus', '==', 'confirmed')
        .where('incidentSolved', '==', true)
        .where('clientId', '==', vm.clientId)
        .get();

      var getOffDays = db
        .collection('residentOffDays')
        .where('offDate', '>=', periodStart)
        .where('offDate', '<=', periodEnd)
        .where('clientId', '==', vm.clientId)
        .get();

      var values = await Promise.all([getIncidents, getOffDays]);

      var countIncidents = values[0].size;
      var countOffDays = values[1].size;

      var assistanceValues = { assisted: 3, supervised: 2, independent: 1 };
      var assitanceValKeys = Object.keys(assistanceValues);
      var taskGroups = vm.girCountObject();

      var taskKeys = Object.keys(taskGroups);

      //loop trough tasks
      Object.keys(vm.profileDialogData.xAllTasks).forEach(task => {
        const t = vm.profileDialogData.xAllTasks[task];
        var taskSubgroup = t.lpTaskCodingGroup;
        var taskName = t.taskName;
        if (
          assitanceValKeys.indexOf(t.status) != -1
        ) {
          //add value
          taskGroups[taskSubgroup]['Score'] += assistanceValues[t.status];
          //add counter
          taskGroups[taskSubgroup]['Counter'] += 1;
        } //end if task

        //if cognitive assesment task
        if (
          t.lpTaskCognitive == true &&
          assitanceValKeys.indexOf(t.status) != -1
        ) {
          //add value
          taskGroups['cognitiveValue']['Score'] += assistanceValues[t.status];
          //add counter
          taskGroups['cognitiveValue']['Counter'] += 1;
        }
      }); //end for tasks

      //calculate results
      let cannotCalculateGIR = false;
      let cannotCalculateValuesCount = 0;
      for (var key = 0; key < taskKeys.length; key++) {
        if (taskGroups[taskKeys[key]]['Counter'] !== 0) {
          var value =
            taskGroups[taskKeys[key]]['Score'] /
            taskGroups[taskKeys[key]]['Counter'];
          value = Math.round(value);
          taskGroups[taskKeys[key]]['Result'] = value;
        } else {
          taskGroups[taskKeys[key]]['Result'] = 1;
          cannotCalculateValuesCount++;
        }
      }

      if (cannotCalculateValuesCount === taskKeys.length) {
        cannotCalculateGIR = true;
      }

      girCode.forEach(gir => {
        if (gir.A === calcGir) {
          girRaw = gir.B;
        }
      });

      //if has incidents, reduce value
      var girAfterIncidents = girRaw;
      if (countIncidents > 0) {
        girAfterIncidents = parseInt(girRaw) - 1;
      }
      //find dependency profile
      var profileBeforeCognitive = null;
      girAlfabeticProfiling.forEach(x => {
        if (x.gir == girAfterIncidents) {
          profileBeforeCognitive = x.value;
        }
      });

      var profileAfterCognitive = profileBeforeCognitive;
      //if cogValue = 2 && profile value 6 => profile B
      //if cogValue = 3 && profile value 6 => profile D
      if (cognitiveValue == 2 && girAfterIncidents == 6) {
        profileAfterCognitive = 'C';
      }
      if (cognitiveValue == 3 && girAfterIncidents == 6) {
        profileAfterCognitive = 'D';
      }
      if (cognitiveValue == 3 && girAfterIncidents == 5) {
        profileAfterCognitive = 'D';
      }

      const beds =
        vm.residences[vm.profileDialogData.residenceId].rooms[
          vm.profileDialogData.roomId
        ].beds;
      var dpPriceName = profileAfterCognitive + beds;
      let dpPriceLevel = profileAfterCognitive;
      const dpPricePerDay =
        vm.priceGroups[vm.profileDialogData.priceGroupId].prices[dpPriceName];

      //CALCULATE INCOME PROFILE AND BONUS PACKS
      //MAX PAY = 90% pension + (if) RD support + extra pay
      let pensionPart = vm.profileDialogData.pension * 0.9 || 0.0;
      let clientRdSupport = 0.0;
      if (c.rdSupportDateRaw) {
        if (new Date(c.rdSupportDateRaw.seconds * 1000) < periodEnd) {
          clientRdSupport = vm.rdSupport;
        }
      }
      let ipMaxPayMonth =
        pensionPart + clientRdSupport + vm.profileDialogData.clientPay;
      let ipMaxPayDay = (ipMaxPayMonth / 30.5).toFixed(2);

      //find max income profile
      let pricesData = vm.priceGroups[vm.profileDialogData.priceGroupId];
      let pricesKeys = Object.keys(pricesData.prices);
      let pricesValues = Object.values(pricesData.prices);

      //get only prices for beds
      let ipPriceName = 'J' + beds;
      let ipPriceLevel = 'J';
      let ipPricePerDay = pricesData.prices[ipPriceName];
      for (var p = 0; p < pricesKeys.length; p++) {
        let pKey = pricesKeys[p];
        if (pKey.indexOf(beds) != -1) {
          let difference = ipMaxPayDay - pricesValues[p];
          if (difference < 0) {
            ipPriceName = pKey;
            ipPriceLevel = ipPriceName[0];
            ipPricePerDay = pricesValues[p];
            break;
          }
        }
      }

      let invoicePriceName = dpPriceName;
      let invoicePriceLevel = dpPriceLevel;
      let invoicePricePerDay = dpPricePerDay;
      //compare if any bonus packs
      let newBonusPacks = 0;
      if (ipPricePerDay > dpPricePerDay) {
        //find income value
        let incomeValue = 0;
        let dependencyValue = 0;
        girAlfabeticProfiling.forEach(x => {
          if (x.value == ipPriceLevel) {
            incomeValue = x.gir;
          }
          if (x.value == dpPriceLevel) {
            dependencyValue = x.gir;
          }
        });

        newBonusPacks = dependencyValue - incomeValue;
        invoicePriceName = ipPriceName;
        invoicePriceLevel = ipPriceLevel;
        invoicePricePerDay = ipPricePerDay;
      }

      let comment = '';

      if (cannotCalculateGIR) {
        invoicePriceName = c.clientProfile + beds;
        invoicePriceLevel = c.clientProfile;
        invoicePricePerDay = pricesData.prices[invoicePriceName];
        newBonusPacks = 0;
        comment = 'prieksh share.';
      }

      //IF FIRST TWO WEEKS AFTER AGREEMENT, USE PROFILE FROM AGREEMENT
      //days between
      let entered = new Date(c.bfhEnterDate);
      let daysFromAgreement =
        (periodStart.getTime() - entered.getTime()) / (1000 * 3600 * 24);

      if (daysFromAgreement < 14) {
        invoicePriceName = c.clientProfile + beds;
        invoicePriceLevel = c.clientProfile;
        invoicePricePerDay = pricesData.prices[invoicePriceName];
        newBonusPacks = 0;
        comment = 'Profils pēc līguma.';
      }

      var weeklyProfile = {
        bedsPerRoom: beds, //from residence
        clientPay: vm.profileDialogData.clientPay || 0.0,
        cognitiveValue: cognitiveValue,
        comment: comment,
        dateEntered: new Date(c.bfhEnterDate),
        dateLeft: c.leftDate ? new Date(c.leftDate) : null,
        daysStayed: periodDays,
        dpBeforeCognitive: profileBeforeCognitive,
        dpDependencyProfile: profileAfterCognitive,
        dpPriceLevel: dpPriceLevel,
        dpPriceName: dpPriceName,
        dpPricePerDay: dpPricePerDay,
        girAfterIncidents: girAfterIncidents,
        girRaw: girRaw,
        girSequence: calcGir,
        ipPriceLevel: ipPriceLevel,
        ipPriceName: ipPriceName,
        ipPricePerDay: ipPricePerDay,
        incidents: countIncidents,
        invoicePriceLevel: invoicePriceLevel,
        invoicePriceName: invoicePriceName,
        invoicePricePerDay: invoicePricePerDay,
        newBonusPacks: newBonusPacks,
        offDays: countOffDays,
        pension: vm.profileDialogData.pension || 0.0,
        priceGroupId: vm.profileDialogData.priceGroupId,
        priceGroupName: vm.priceGroups[vm.profileDialogData.priceGroupId].name,
        residenceId: vm.profileDialogData.residenceId,
        residenceName: vm.residences[vm.profileDialogData.residenceId].name,
        roomId: vm.profileDialogData.roomId,
        roomName:
          vm.residences[vm.profileDialogData.residenceId].rooms[
            vm.profileDialogData.roomId
          ].name,
        updatedAt: new Date(),
        updatedBy: vm.currentUserData.displayName,
        wEndDate: wEndDate,
        wStartDate: wStartDate,
        xTaskGroups: taskGroups,
        xAllTasks: vm.profileDialogData.xAllTasks,
      };

      const profileKey =
        vm.formatDateReport(wStartDate) + '-' + vm.formatDateReport(wEndDate);

      await db
        .collection('clients')
        .doc(vm.clientId)
        .collection('profiles')
        .doc(profileKey)
        .set(weeklyProfile);

      var took = (new Date().getTime() - start.getTime()) / 1000;
      console.log('fin ', took, ' sec');
      vm.progressBar = false;
    },
    girCountObject() {
      return "prieksh share" 
    },

    formatDateReport(inpDate) {
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
  },
};
</script>
          