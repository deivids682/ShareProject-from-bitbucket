<template>
  <v-container>
    <!--Progress bar -->
    <v-row>
      <v-col cols="12" v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-col>
    </v-row>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <!-- add new price group btn -->
    <v-row>
      <v-dialog v-model="dialog" max-width="800" class="text-xs-center">
        <!--dialog btn -->
        <template v-slot:activator="{ on }">
          <v-btn
            dark
            color="primary"
            v-on="on"
            @click="resetForNewEntry()"
          >Pievienot jaunu cenu grupu</v-btn>
        </template>
        <!--dialog form -->
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Cenu grupa</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-text-field
                v-model="priceGroupData.name"
                label="Cenu grupas nosaukums"
                :rules="[() => !!priceGroupData.name || 'Nepieciešams norādīt']"
              ></v-text-field>

              <!-- price table -->
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th class="text-center">Profils</th>
                    <th v-for="beds in maxBedsPerRoom" :key="beds" class="text-center">
                      {{beds}}
                      <span v-if="beds>1">gultas</span>
                      <span v-else>gulta</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(profile, profileIndx) in profiles" :key="profileIndx">
                    <td class="text-center">{{ profile}}</td>
                    <td v-for="beds in maxBedsPerRoom" :key="beds" class="text-center">
                      <v-text-field
                        v-model="priceGroupData.prices[profile+beds]"
                        reverse
                        hide-details
                        type="number"
                        step="0.01"
                        :rules="[() => !!priceGroupData.prices[profile+beds] || 'Nepieciešams norādīt']"
                      ></v-text-field>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="dialog = false">Aizvērt</v-btn>
            <v-btn color="primary" text @click="saveEntry()">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <v-row justify="space-between">
      <v-col cols="12" sm="6">
        <h1>Cenu grupas</h1>
      </v-col>
      <!-- search -->
      <v-col cols="12" sm="4">
        <v-text-field append-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
    </v-row>

    <v-row justify-center v-if="!progressBar">
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="(priceGroup, priceGroupId) in displayValues" :key="priceGroupId">
          <v-expansion-panel-header>
            <h3>
              {{priceGroup.name}}
              <v-btn icon @click="editEntry(priceGroupId)" x-small>
                <v-icon small color="secondary">edit</v-icon>
              </v-btn>
              <v-btn icon @click="deleteEntry(priceGroupId)" x-small>
                <v-icon small color="secondary">delete_forever</v-icon>
              </v-btn>
            </h3>
            <v-spacer></v-spacer>
            <small class="text-right" v-if="sudo">{{priceGroupId}}</small>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <!-- price table -->
            <v-simple-table dense>
              <thead>
                <tr>
                  <th class="text-center">Profils</th>
                  <th v-for="beds in maxBedsPerRoom" :key="beds" class="text-center">
                    {{beds}}
                    <span v-if="beds>1">gultas</span>
                    <span v-else>gulta</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(profile, profileIndx) in profiles" :key="profileIndx">
                  <td class="text-center">{{ profile}}</td>
                  <td
                    v-for="beds in maxBedsPerRoom"
                    :key="beds"
                    class="text-center"
                  >{{priceGroup.prices[profile+beds]}}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <small style="font-style: italic">
              <span>Pēdējo reizi atjaunoja {{priceGroup.updatedBy}} {{formatDate(priceGroup.lastUpdate.seconds)}}</span>
            </small>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-row>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data() {
    return {
      progressBar: true,
      searchValue: null,
      profiles: ['A', 'B', 'C', 'D', 'E', 'J', 'K'],
      maxBedsPerRoom: 3,
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
      //form
      dialog: false,
      valid: true,
      priceGroupId: null,
      priceGroupData: {
        name: null,
        service: 'bfh',
        prices: {},
      },
      loadedPriceGroups: {},
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();
    db.collection('priceGroups')
      .where('service', '==', 'bfh')
      .orderBy('name')
      .onSnapshot(snap => {
        var loadedPriceGroupsL = {};
        snap.forEach(doc => {
          loadedPriceGroupsL[doc.id] = doc.data();
        });
        vm.loadedPriceGroups = Object.assign({}, loadedPriceGroupsL);
        vm.progressBar = false;
      });

    //current user data
    vm.progressBar = false;
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.loadedPriceGroups);
          for (var t = 0; t < ids.length; t++) {
            if (
              vm.loadedPriceGroups[ids[t]].name
                .toLowerCase()
                .indexOf(vm.searchValue.toLowerCase()) !== -1
            ) {
              displayL[ids[t]] = vm.loadedPriceGroups[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.loadedPriceGroups);
        }
      } else {
        displayL = Object.assign({}, vm.loadedPriceGroups);
      }

      return displayL;
    },
  },
  methods: {
    resetForNewEntry() {
      var vm = this;
      vm.priceGroupId = null;
      vm.priceGroupData = {
        name: null,
        service: 'bfh',
        prices: {},
      };
    },
    editEntry(priceGroupId) {
      var vm = this;
      vm.priceGroupId = priceGroupId;
      vm.priceGroupData = vm.loadedPriceGroups[priceGroupId];
      vm.dialog = true;
    },
    saveEntry() {
      if (this.$refs.form.validate()) {
        var vm = this;
        var db = firebase.firestore();
        vm.progressBar = true;
        vm.dialog = false;

        vm.priceGroupData.lastUpdate = new Date();
        vm.priceGroupData.updatedBy = vm.currentUserData.displayName;
        //save or update
        if (!vm.priceGroupId) {
          try {
            db.collection('priceGroups')
              .add(vm.priceGroupData)
              .then(function(doc) {
                vm.progressBar = false;
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Cenu grupa veiksmīgi pievienota!';
                vm.snackbar = true;
              });
          } catch (error) {
            console.log(error);
          }
        } else {
          try {
            db.collection('priceGroups')
              .doc(vm.priceGroupId)
              .update(vm.priceGroupData)
              .then(function(doc) {
                //enable snackbar
                vm.snackbarColor = 'success';
                vm.snackbarTxt = 'Cenu grupa veiksmīgi labota!';
                vm.snackbar = true;
              });
          } catch (error) {
            console.log(error);
          }
        }
      }
    },
    async deleteEntry(priceGroupId) {
      var vm = this;
      var conf = confirm(
        vm.currentUserData.displayName + ', tiešām vēlies izdzēst?'
      );
      if (conf) {
        try {
          //check if any clients have
          var db = firebase.firestore();
          var snapShot = await db
            .collection('clients')
            .where('clientPriceGroup', '==', priceGroupId)
            .get();

          if (snapShot.empty) {
            //delete from db
            firebase
              .firestore()
              .collection('priceGroups')
              .doc(priceGroupId)
              .delete();
          } else {
            //don't allow to delete
            var clientNames = '';
            snapShot.forEach(client => {
              clientNames += ' ' + client.data().clientName + ',';
            });
            alert(
              'Kamēr cenu grupai ir piesaistīti klienti' +
                clientNames +
                ' tikmēr dzēst nedrīkst!'
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
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
  },
};
</script>
