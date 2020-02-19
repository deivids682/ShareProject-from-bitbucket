<template>
  <v-container>
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
    <!--DIALOG TO ADD NEW/EDIT DISTRICT -->
    <v-layout row>
      <v-dialog v-model="dialog" width="500" class="text-xs-center">
        <!--dialog btn -->
        <template v-slot:activator="{ on }">
          <v-btn
            dark
            color="primary"
            v-on="on"
            @click="resetForNewEntry()"
            v-if="serviceData == 'neighborhood'"
          >Pievienot jaunu rajonu</v-btn>
        </template>

        <!--dialog form -->
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Aprūpes rajons</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-text-field
                v-model="districtName"
                label="Rajona nosaukums"
                :rules="[() => !!districtName || 'Nepieciešams norādīt']"
              ></v-text-field>
              <v-select
                label="Kvartāla vadītājs"
                v-model="districtManagerId"
                :items="managers"
                item-text="displayName"
                item-value="id"
                :rules="[() => !!districtManagerId || 'Nepieciešams norādīt']"
              ></v-select>
              <slider-picker style="width:100%" v-model="districtColor" />
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="dialog = false">Aizvērt</v-btn>
            <v-btn color="primary" text @click="saveEntry(wantToEditEntry)">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <!-- list districts acardion -->
    <template>
      <v-layout row>
        <v-flex xs12>
          <br />
          <h1>{{serviceData == 'neighborhood' ? 'Rajoni' : 'Rezidences'}}</h1>
        </v-flex>
      </v-layout>
      <v-layout justify-center row v-if="!progressBar">
        <v-expansion-panels accordion focusable>
          <v-expansion-panel
            v-for="(district, districtId) in districts"
            :key="districtId"
            @click="getShift(districtId)"
          >
            <v-expansion-panel-header>
              <h3>
                <v-avatar :color="'#'+district.color" size="24"></v-avatar>
                {{district.name}}
                <v-btn
                  icon
                  @click="editEntry(districtId)"
                  x-small
                  v-if="serviceData == 'neighborhood'"
                >
                  <v-icon small color="secondary">edit</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="deleteEntry(districtId)"
                  x-small
                  v-if="serviceData == 'neighborhood'"
                >
                  <v-icon small color="secondary">delete_forever</v-icon>
                </v-btn>
              </h3>
              <v-spacer></v-spacer>
              <small class="text-right">Vadītājs: {{district.managerName}}</small>
              <small class="text-right" v-if="sudo">{{districtId}}</small>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <!-- another expansion pannel with dates and shifts -->
              <!-- load feedback -->
              <v-progress-linear :indeterminate="true" v-if="loadShiftsProgress"></v-progress-linear>
              <!-- list shifts -->
              <v-expansion-panels
                accordion
                focusable
                v-if="typeof shifts[districtId] != 'undefined'"
              >
                <v-expansion-panel v-for="(shift, index) in shifts[districtId].keys" :key="index">
                  <v-expansion-panel-header>
                    <!-- day, date, responsibles  -->
                    <h4 class="shiftDay">{{numbersToDays[shifts[districtId].data[shift].day]}}</h4>
                    <p>{{shifts[districtId].data[shift].formatDate}}</p>
                    <p v-for="shiftNr in numberOfShifts" :key="shiftNr" class="responsibles">
                      <strong>{{shiftsToTxt[shiftNr-1]}}:</strong>
                      {{getDisplayName(shifts[districtId].data[shift].responsibleForShifts[shiftNr-1])}}
                    </p>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <template v-for="shiftNr in numberOfShifts">
                      <v-select
                        :key="shiftNr"
                        :label="shiftsToTxt[shiftNr-1]"
                        v-model="shifts[districtId].data[shift].responsibleForShifts[shiftNr-1]"
                        :items="aiders"
                        item-text="displayName"
                        item-value="id"
                        v-on:change="saveShiftChange(districtId, shift, shiftNr-1, shifts[districtId].data[shift].responsibleForShifts[shiftNr-1], shifts[districtId].data[shift].formatDate)"
                      ></v-select>
                    </template>
                    <div class="text-center">
                      <v-btn color="secondary" @click="getClients(districtId)">Plānot pa klientiem</v-btn>
                    </div>
                    <!-- list clients -->
                    <v-expansion-panels
                      accordion
                      focusable
                      v-if="typeof clients[districtId] != 'undefined' && showShiftClients"
                    >
                      <v-expansion-panel
                        v-for="(client, clientId) in clients[districtId]"
                        :key="clientId"
                      >
                        <v-expansion-panel-header>
                          <!-- client name, date, client shift (or default) responsibles-->
                          <h4
                            class="shiftDay"
                          >{{client.clientName}} - {{shifts[districtId].data[shift].formatDate}}</h4>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <template v-for="shiftNr in numberOfShifts">
                            <v-select
                              :key="shiftNr"
                              :label="shiftsToTxt[shiftNr-1]"
                              v-model="clientShiftKeys[clientId + '.' + shifts[districtId].data[shift].formatDate + '.' + Math.round(shiftNr-1)]"
                              :items="aiders"
                              item-text="displayName"
                              item-value="id"
                              v-on:change="saveClientKeyResponsible(clientId, shifts[districtId].data[shift].shiftDate, shifts[districtId].data[shift].formatDate, districtId, Math.round(shiftNr-1), clientId + '.' + shifts[districtId].data[shift].formatDate + '.' + Math.round(shiftNr-1), )"
                            ></v-select>
                          </template>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-layout>
    </template>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {
  addDays,
  getDistricts,
  createShifts,
} from '../../helpers/helperShifts';

//color picker
import { Slider } from 'vue-color';

export default {
  props: ['service'],
  components: {
    'slider-picker': Slider,
  },
  data() {
    return {
      progressBar: true,
      loadShiftsProgress: false,
      showShiftClients: false,
      currentUserDisplayName: null,
      periodLength: 7, //hardcode the length of period
      numberOfShifts: 3, //hardcode how many shifts per day
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
      //form
      dialog: false,
      valid: true,
      wantToEditEntry: false,
      editEntryId: null,
      //aiders, managers
      aiders: [],
      aidersData: {},
      managers: [],
      managersData: {},
      //districts
      districtName: null,
      districtManagerId: null,
      managerName: null,
      districtColor: this.randomColor(),
      districts: {},
      shifts: {},
      clients: {},
      clientShiftKeys: {},
      serviceData: this.service || 'neighborhood',

      //shifts table
      //adjust manually depending on number of shifts
      shiftsToTxt: {
        0: 'Rīts',
        1: 'Pusdiena',
        2: 'Vakars',
      },
      numbersToDays: {
        0: 'Svētdiena',
        1: 'Pirmdiena',
        2: 'Otrdiena',
        3: 'Trešdiena',
        4: 'Ceturdiena',
        5: 'Piektdiena',
        6: 'Sestdiena',
      },
    };
  },
  async created() {
    var vm = this;
    vm.progressBar = true;

    //get list of entries
    var db = firebase.firestore();

    vm.currentUserDisplayName = vm.currentUserData.displayName;

    //get aiders
    db.collection('users')
      .where('role', 'array-contains', 'aider')
      .get()
      .then(function(querySnapshot) {
        var aidersDataL = {};
        querySnapshot.forEach(function(doc) {
          var data = doc.data();
          data['id'] = doc.id;
          vm.aiders.push(data);
          aidersDataL[doc.id] = doc.data();
        });
        vm.aidersData = Object.assign({}, aidersDataL);
      });

    db.collection('users')
      .where('role', 'array-contains', 'manager')
      .get()
      .then(function(querySnapshot) {
        var managersDataL = {};
        querySnapshot.forEach(function(doc) {
          var data = doc.data();
          data['id'] = doc.id;
          vm.managers.push(data);
          managersDataL[doc.id] = doc.data();
        });
        vm.managersData = Object.assign({}, managersDataL);
      });

    //get districts and shifts
    await getDistricts(this.service || 'neighborhood', vm);
    vm.progressBar = false;
  },
  watch: {
    // whenever changes, this function will run
    shifts: {
      handler: function(val) {},
      deep: true,
    },
    service: function(status) {
      this.serviceData = status;
    },
  },
  methods: {
    getManagerName() {
      var vm = this;
      vm.managerName = vm.managersData[vm.districtManagerId].displayName;
    },
    async getClients(districtId) {
      var vm = this;

      if (typeof vm.clients[districtId] == 'undefined') {
        vm.loadShiftsProgress = true;
        var db = firebase.firestore();
        var querySnapshot = await db
          .collection('clients')
          .where('clientDistrict', '==', districtId) //district
          .where('clientServices', '==', vm.service || 'neighborhood') //service
          .where('clientStatus', '==', 'active') //active
          .orderBy('clientName')
          .get();

        var dataL = {};
        var clientIds = [];
        querySnapshot.forEach(doc => {
          dataL[doc.id] = doc.data();
          clientIds.push(doc.id);
        });
        //store data
        vm.clients[districtId] = Object.assign({}, dataL);

        //generate clientShiftKeys model and get responsibles
        //get shiftKeys
        var today = new Date().setHours(0, 0, 0, 1);
        var todayDate = new Date(today);

        //todo
        var shiftsSnapshot = await db
          .collection('clientShiftKeys')
          .where('districtId', '==', districtId) //district
          .where('shiftDate', '>=', todayDate) //date
          .get();

        var loadedClientShiftKeys = {};
        shiftsSnapshot.forEach(doc => {
          loadedClientShiftKeys[doc.id] = doc.data();
        });

        //loop clients
        clientIds.forEach(clientId => {
          //loop shifts
          vm.shifts[districtId].keys.forEach(shiftId => {
            //loop shift numbers
            for (var shiftNr = 0; shiftNr < vm.numberOfShifts; shiftNr++) {
              const shiftDate = vm.shifts[districtId].data[shiftId].formatDate;
              //generate key
              const clientShiftKey = clientId + '.' + shiftDate + '.' + shiftNr;
              //get  responsible
              if (typeof loadedClientShiftKeys[clientShiftKey] == 'undefined') {
                //assign default responsible -> district, shift, shiftNr
                vm.clientShiftKeys[clientShiftKey] =
                  vm.shifts[districtId].data[shiftId].responsibleForShifts[
                    shiftNr
                  ];
              } else {
                //assign loaded responsible
                vm.clientShiftKeys[clientShiftKey] =
                  loadedClientShiftKeys[clientShiftKey].responsible;
              }
            }
          });
        });

        //list clients
        vm.showShiftClients = true;
        vm.loadShiftsProgress = false;
      } else {
        //list clients
        vm.showShiftClients = true;
      }
    },
    async getShift(districtId) {
      //get shifts if not already
      var vm = this;

      //reset showShiftClients
      vm.showShiftClients = false;

      if (typeof vm.shifts[districtId] == 'undefined') {
        vm.loadShiftsProgress = true;
        var db = firebase.firestore();
        var querySnapshot = await db
          .collection('residences')
          .doc(districtId)
          .collection('shifts')
          .orderBy('shiftDate', 'desc')
          .limit(vm.periodLength)
          .get(); //last 7 shifts

        var shiftsDataL = {};
        var shiftsKeys = [];
        querySnapshot.forEach(doc => {
          shiftsDataL[doc.id] = doc.data();
          shiftsKeys.push(doc.id);
        });
        //store data
        //vm.$set to watch changes and update responsible in shift title
        vm.$set(vm.shifts, districtId, { keys: [], data: {} });
        vm.shifts[districtId].keys = shiftsKeys.reverse();
        vm.$set(vm.shifts[districtId], 'data', shiftsDataL);
        vm.loadShiftsProgress = false;
      }
    },

    async saveShiftChange(
      districtId,
      shiftId,
      shiftNumber,
      userId,
      shiftFormatDate
    ) {
      var vm = this;
      var db = firebase.firestore();

      //overwrite local clientShiftKey with new responsible
      //construct keys
      //get clients if defined
      if (typeof vm.clients[districtId] != 'undefined') {
        const clientKeys = Object.keys(vm.clients[districtId]);
        clientKeys.forEach(clientId => {
          const shiftDate = vm.shifts[districtId].data[shiftId].formatDate;
          //generate key
          const clientShiftKey = clientId + '.' + shiftDate + '.' + shiftNumber;
          //update
          vm.clientShiftKeys[clientShiftKey] = userId;
        });
      }

      //save responsible to db
      await db
        .collection('residences')
        .doc(districtId)
        .collection('shifts')
        .doc(shiftId)
        .update({
          ['responsibleForShifts.' + shiftNumber]: userId,
          lastUpdate: new Date(),
          updatedBy: vm.currentUserDisplayName,
        });
    },
    async saveClientKeyResponsible(
      clientId,
      shiftDate,
      dateFormatted,
      districtId,
      shiftNr,
      clientShiftKey
    ) {
      var vm = this;
      var db = firebase.firestore();

      //save responsible to db
      await db
        .collection('clientShiftKeys')
        .doc(clientShiftKey)
        .set({
          responsible: vm.clientShiftKeys[clientShiftKey],
          clientId: clientId,
          districtId: districtId,
          shiftDate: shiftDate,
          shiftNr: shiftNr,
          dateFormatted: dateFormatted,
          setManual: true,
          lastUpdate: new Date(),
          updatedBy: vm.currentUserDisplayName,
        });
    },

    //work with district entries
    resetForNewEntry() {
      var vm = this;
      //reset form
      if (typeof vm.$refs.form != 'undefined') {
        vm.$refs.form.reset();
      }
      vm.districtColor = vm.randomColor();
      vm.wantToEditEntry = false;
    },
    async deleteEntry(entryId) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst rajonu?');
      if (conf) {
        try {
          vm.progressBar = true;
          var db = firebase.firestore();

          //check if any clients have
          var snapShot = await db
            .collection('clients')
            .where('clientDistrict', '==', entryId)
            .get();

          if (snapShot.empty) {
            db.collection('residences')
              .doc(entryId)
              .delete()
              .then(function() {
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Rajons veiksmīgi izdzēsts!';
                vm.snackbar = true;
              });

            await getDistricts(this.service || 'neighborhood', vm);

            //reset form
            vm.$refs.form.reset();
            vm.dialog = false;
          } else {
            //don't allow to delete
            var clientNames = '';
            snapShot.forEach(client => {
              clientNames += ' ' + client.data().clientName;
            });
            alert(
              'Rajonam ir piesaistīti klienti -' +
                clientNames +
                '. Tikmēr dzēst nedrīkst!'
            );
          }
          vm.progressBar = false;
        } catch (error) {
          console.log(error);
        }
      }
    },
    editEntry(entryId) {
      var vm = this;
      //get task data from FB
      var db = firebase.firestore();
      db.collection('residences')
        .doc(entryId)
        .get()
        .then(function(doc) {
          var data = doc.data();
          vm.districtName = data.name;
          vm.districtColor = data.color;
          vm.districtManagerId = data.managerId;

          vm.editEntryId = entryId;
          vm.dialog = true;
          vm.wantToEditEntry = true;
        });
    },
    async saveEntry(wantToEditEntry) {
      if (this.$refs.form.validate()) {
        var vm = this;
        var color = vm.districtColor;
        if (vm.districtColor.hex) {
          var color = vm.districtColor.hex;
          color = color.substr(1);
        }

        //if new entry
        if (!wantToEditEntry) {
          try {
            vm.progressBar = true;
            vm.dialog = false;

            //save to firebase
            var db = firebase.firestore();
            vm.getManagerName();

            // add district
            db.collection('residences')
              .add({
                name: vm.districtName,
                managerId: vm.districtManagerId,
                managerName: vm.managerName,
                color: color,
                service: vm.service || 'neighborhood',
                createdAt: new Date(),
                createdBy: vm.currentUserData.displayName,
              })
              .then(function(doc) {
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Rajons veiksmīgi pievienots!';
                vm.snackbar = true;

                //create first period of blank shifts
                createShifts(doc.id, vm);
              });
          } catch (error) {
            console.log(error);
          }
        } else {
          // if edited entry
          try {
            vm.progressBar = true;
            vm.dialog = false;
            var db = firebase.firestore();
            vm.getManagerName();

            // update district
            db.collection('residences')
              .doc(vm.editEntryId)
              .update({
                name: vm.districtName,
                managerId: vm.districtManagerId,
                managerName: vm.managerName,
                color: color,
              })
              .then(async function(doc) {
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Rajons veiksmīgi labots!';
                vm.snackbar = true;

                await getDistricts(vm.service || 'neighborhood', vm);
                vm.progressBar = false;
              });
          } catch (error) {
            console.log(error);
          }
        }
      }
    },
    getDisplayName(userId) {
      var vm = this;
      if (typeof vm.aidersData[userId] != 'undefined') {
        return this.aidersData[userId].displayName;
      } else if (typeof vm.managersData[userId] != 'undefined') {
        return this.managersData[userId].displayName;
      } else {
        return 'Nav atbildīgais';
      }
    },
    randomColor() {
      return '000000'.replace(/0/g, function() {
        return (~~(Math.random() * 16)).toString(16);
      });
    },
  },
};
</script>

<style scoped>
.responsibles {
  margin-left: 10px;
}

.shiftDay {
  margin-right: 10px;
}
</style>