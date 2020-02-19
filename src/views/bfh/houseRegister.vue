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
    <!--DIALOG TO ADD NEW/EDIT HOUSE -->
    <v-layout row>
      <v-dialog v-model="dialog" width="500" class="text-xs-center" persistent>
        <!--dialog btn -->
        <template v-slot:activator="{ on }">
          <v-btn
            dark
            color="primary"
            v-on="on"
            @click="resetForNewEntry()"
          >Pievienot jaunu rezidenci</v-btn>
        </template>

        <!--dialog form -->
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Rezidence</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-text-field
                prepend-icon="title"
                v-model="formHouseName"
                label="Rezidences nosaukums"
                :rules="[() => !!formHouseName || 'Nepieciešams norādīt']"
              ></v-text-field>
              <v-text-field
                prepend-icon="map"
                v-model="formHouseAddress"
                label="Rezidences adrese"
                :rules="[() => !!formHouseAddress || 'Nepieciešams norādīt']"
              ></v-text-field>
              <v-select
                label="Kvartāla vadītājs"
                v-model="districtManagerId"
                prepend-icon="house"
                :items="managers"
                item-text="displayName"
                item-value="id"
                :rules="[() => !!districtManagerId || 'Nepieciešams norādīt']"
              ></v-select>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="dialog = false">Aizvērt</v-btn>
            <v-btn color="primary" text @click="saveEntry()">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
    <br />
    <h1>Rezidenču reģistrs</h1>
    <!-- search -->
    <v-row>
      <v-col cols="12" md="6" lg="4">
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
    </v-row>
    <v-layout v-if="!progressBar">
      <v-row dense>
        <template v-for="(house, houseId) in displayValues">
          <v-col cols="12" md="4" :key="houseId">
            <v-card :color="'#'+house.color">
              <v-list-item three-line @click="viewHouse(houseId)">
                <v-list-item-avatar size="60" color="secondary">
                  <v-img :src="house.photoUrl"></v-img>
                </v-list-item-avatar>
                <v-list-item-content>
                  <div>
                    <h4>{{house.name}}</h4>
                  </div>
                  <v-list-item-subtitle>{{house.address}}</v-list-item-subtitle>

                  <v-list-item-subtitle v-if="sudo">ID: {{houseId}}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
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
import {
  addDays,
  getDistricts,
  createShifts,
} from '../../helpers/helperShifts';

export default {
  data() {
    return {
      progressBar: true,
      houses: {},
      searchValue: null,
      periodLength: 7, //hardcode the length of period
      numberOfShifts: 3, //hardcode how many shifts per day

      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
      //form
      dialog: false,
      valid: true,
      formHouseName: null,
      formHouseAddress: null,
      districtName: null,
      districtManagerId: null,
      managerName: null,
      managers: [],
      managersData: {},
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get houses live
    var housesL = {};
    db.collection('residences')
      .where('service', '==', 'bfh')
      .orderBy('name')
      .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          housesL[doc.id] = doc.data();
        });
        vm.houses = Object.assign({}, housesL);
        vm.progressBar = false;
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
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.houses);
          for (var t = 0; t < ids.length; t++) {
            const searchString =
              vm.houses[ids[t]].name + vm.houses[ids[t]].address;
            if (
              searchString
                .toLowerCase()
                .indexOf(vm.searchValue.toLowerCase()) !== -1
            ) {
              displayL[ids[t]] = vm.houses[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.houses);
        }
      } else {
        displayL = Object.assign({}, vm.houses);
      }

      return displayL;
    },
  },
  methods: {
    getManagerName() {
      var vm = this;
      vm.managerName = vm.managersData[vm.districtManagerId].displayName;
    },
    viewHouse(houseId) {
      this.$router.push({ name: 'houseprofile', params: { houseId: houseId } });
    },
    resetForNewEntry() {
      var vm = this;
      //reset form
      if (typeof vm.$refs.form != 'undefined') {
        vm.$refs.form.reset();
      }
    },
    randomColor() {
      return '000000'.replace(/0/g, function() {
        return (~~(Math.random() * 16)).toString(16);
      });
    },
    saveEntry() {
      if (this.$refs.form.validate()) {
        var vm = this;
        //add new entry
        try {
          vm.dialog = false;

          //save to firebase
          var db = firebase.firestore();
          vm.getManagerName();

          // add district
          db.collection('residences')
            .add({
              name: vm.formHouseName,
              address: vm.formHouseAddress,
              photoUrl: '',
              notes: '',
              rooms: {},
              color: vm.randomColor(),
              createdAt: new Date(),
              createdBy: vm.currentUserData.displayName,
              service: 'bfh',
              clientServices: 'bfh',
              clientStatus: 'active',
              managerId: vm.districtManagerId,
              managerName: vm.managerName,
              lastUpdate: new Date(),
              lastUser: vm.currentUserData.displayName,
            })
            .then(function(doc) {
              //enable snackbar
              vm.snackbarColor = 'success';
              vm.snackbarTxt = 'Rezidence veiksmīgi pievienota!';
              vm.snackbar = true;

              //get address coordinates
              vm.saveAddress(vm.formHouseAddress, doc.id, 'residences');

              //create first period of blank shifts
              createShifts(doc.id, vm);
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
    saveAddress(address, entryId, collection) {
      //get coordinates
      var vm = this;
      var db = firebase.firestore();

      const addressId = address.toLowerCase().replace(/([^a-z0-9]+)/gi, '_');

      //get lat and long from Google maps api
      //https://developers.google.com/maps/documentation/geocoding/start

      //replace spaces with +
      const addressQuery = address.split(' ').join('+');
      const geoUrl =
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
        addressQuery +
        '&key=appId';

      vm.fetchAsync(geoUrl)
        .then(data => {
          //save in db

          var updObj = {};
          if ((collection = 'residences')) {
            updObj['addressCoordinates'] = {
              lat: data.results[0].geometry.location.lat,
              lng: data.results[0].geometry.location.lng,
            };
          }

          db.collection(collection)
            .doc(entryId)
            .update(updObj);
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
  },
};
</script>