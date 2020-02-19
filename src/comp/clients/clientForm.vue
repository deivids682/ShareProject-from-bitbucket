<template>
  <v-row align="center" justify="center">
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <v-flex xs12 sm6>
      <v-card>
        <v-card-text>
          <!--Progress bar -->
          <v-layout row wrap>
            <v-flex xs12 v-if="progressBar">
              <v-progress-linear :indeterminate="true"></v-progress-linear>
            </v-flex>
          </v-layout>

          <!-- photo -->
          <photo-form
            :docId="clientId"
            :collection="'clients'"
            :urlPath="'clientPhotoUrl'"
            :photoUrl="clientData.clientPhotoUrl"
            :filePath="'/clientProfilePhoto/' + clientId + '/clientPhotoUrl/'"
            @updatePhoto="updatePhoto"
            v-if="!progressBar && clientId!= 'new_client'"
          ></photo-form>

          <template v-if="!progressBar">
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-row justify="space-between">
                <v-col cols="12">
                  <v-text-field
                    v-model="clientData.clientName"
                    :rules="[v => !!v || 'Nepieciešams vārds']"
                    label="Klienta vārds, uzvārds"
                    required
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-radio-group
                    mandatory
                    label="Pakalpojumi"
                    row
                    v-model="clientData.clientServices"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  >
                    <v-radio value="bfh" label=""></v-radio>
                    <v-radio label="Aprūpe mājās" value="neighborhood"></v-radio>
                    <v-radio label="Tīrīšana" value="cleaning"></v-radio>
                  </v-radio-group>
                </v-col>
              </v-row>

              <!-- bfh data -->
              <v-row justify="space-between" v-if="clientData.clientServices == 'bfh'">
                <v-col cols="12">
                  <v-label>Lielās ģimenes mājas dati:</v-label>
                </v-col>
                <v-col cols="12" md="5">
                  <!-- date -->
                  <v-dialog
                    v-model="bfhDatePickerDialog"
                    :close-on-content-click="false"
                    persistent
                    width="290px"
                  >
                    <template v-slot:activator="{ on }">
                      <v-text-field
                        v-model="bfhDateFormatted"
                        label="Ierašanās datums"
                        readonly
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="clientData.bfhEnterDate"
                      @input="bfhDatePickerDialog = false"
                      :readonly="!admin&&!manager"
                      first-day-of-week="1"
                      v-on:change="update()"
                    ></v-date-picker>
                  </v-dialog>
                </v-col>

                <v-col cols="12" md="5">
                  <v-select
                    v-model="clientData.clientProfile"
                    label="Sākotnējais profils pēc līguma"
                    :items="profiles[clientData.clientServices]"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="5">
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="updatedResidence()"
                    v-model="clientData.clientDistrict"
                    label="Rezidence"
                    item-text="name"
                    item-value="id"
                    :items="discritSelector"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="5">
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.bfhRoom"
                    label="Istaba"
                    :items="roomSelector"
                    item-value="roomId"
                    item-text="roomName"
                    return-object
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="5">
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.clientPriceGroup"
                    label="Cenu grupa"
                    item-value="id"
                    item-text="name"
                    :items="priceGroupSelector"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.clientPay"
                    label="Klienta piemaksa"
                    type="number"
                    step="0.01"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-if="clientData.clientServices == 'neighborhood' || clientData.clientServices == 'cleaning'"
                    v-model="clientData.clientAddress"
                    :rules="[v => !!v  || 'Nepieciešama klienta adrese']"
                    label="Klienta adrese"
                    required
                  ></v-text-field>
                </v-flex>
              </v-layout>

              <!-- nbh data -->
              <v-layout wrap v-if="clientData.clientServices == 'neighborhood'">
                <v-flex xs12>Aprūpe mājās dati:</v-flex>
                <v-flex xs12 md5>
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.clientDistrict"
                    label="Rajons"
                    item-text="name"
                    item-value="id"
                    :items="typeof districtsData[clientData.clientServices] != 'undefined' ? Object.values(districtsData[clientData.clientServices]) : []"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-flex>
                <v-spacer></v-spacer>
                <v-flex xs12 md5>
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.clientProfile"
                    label="Sākotnējais profils pēc līguma"
                    :items="profiles[clientData.clientServices]"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-flex>
              </v-layout>

              <!-- cleaning data -->
              <v-layout wrap v-if="clientData.clientServices == 'cleaning'">
                <v-flex xs12>Tīrīšanas dati:</v-flex>
                <v-flex xs12 md5>
                  <v-select
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.clientDistrict"
                    label="Rajons"
                    item-text="name"
                    item-value="id"
                    :items="typeof districtsData[clientData.clientServices] != 'undefined' ? Object.values(districtsData[clientData.clientServices]) : []"
                    :rules="[v => !!v || 'Nepieciešams norādīt']"
                  ></v-select>
                </v-flex>
              </v-layout>

              <v-row justify="space-between">
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="clientData.clientContacts"
                    label="Kontaktinformācija"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="clientData.clientDoorCode"
                    label="Durvju kods"
                    v-if="clientData.clientServices != 'bfh'"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="clientData.clientDescription"
                    label="Cita informācija par klientu"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-textarea>
                </v-col>
              </v-row>

              <v-row justify="space-between">
                <v-col cols="12" md="5">
                  <v-select
                    v-model="clientData.clientStatus"
                    :items="clientStatusSelect"
                    label="Klienta statuss"
                    :prepend-icon="prependClientStatusIcon()"
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                  ></v-select>
                </v-col>
              </v-row>

              <!-- map -->
              <v-row v-if="typeof clientData.clientAddressCoordinates != 'undefined'">
                <v-col cols="12">
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
                </v-col>
              </v-row>

              <span v-if="clientId=='new_client'">
                <v-btn :disabled="!valid" @click="submit">Pievienot</v-btn>
              </span>
            </v-form>
          </template>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//views
import PhotoForm from '@/comp/clients/photoForm.vue';

export default {
  props: ['clientId', 'loadedClientData'],
  components: {
    PhotoForm,
  },
  data() {
    return {
      //setup
      valid: true,
      progressBar: true,
      profiles: {
        bfh: ['A', 'B', 'C', 'D', 'E', 'J'],
        neighborhood: ['A', 'B', 'C', 'D', 'Rīgas Dome'],
      },
      clientStatusSelect: [
        { text: 'Aktīvs', value: 'active' },
        { text: 'Apturēts', value: 'paused' },
        { text: 'Izslēgts', value: 'stopped' },
        { text: 'Izdzēsts', value: 'deleted' },
      ],
      //later get form db
      districtsData: {},
      discritSelector: [],
      roomSelector: [],
      priceGroupsData: {},
      priceGroupSelector: [],
      bfhDatePickerDialog: false,
      //form data
      //client profile min data
      clientData: {
        clientAddress: null,
        clientContacts: null,
        clientDescription: null,
        clientDistrict: null,
        clientDistrictName: null,
        clientDoorCode: null,
        clientName: null,
        clientProfile: null,
        clientServices: 'bfh',
        clientStatus: 'active',
        clientPriceGroup: null,
        bfhRoom: null,
        bfhEnterDate: new Date().toISOString().substr(0, 10),
        bfhDateFormatted: this.formatDate(
          new Date().toISOString().substr(0, 10)
        ),
      },
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
    //get client data

    if (vm.clientId != 'new_client') {
      vm.clientData = Object.assign({}, vm.loadedClientData);
    }

    //load data
    var distrProm = vm.getDistricts(vm.clientData.clientServices);
    var pricesProm = await vm.getPriceGroups(vm.clientData.clientServices);
  },
  watch: {
    //format date
    'clientData.bfhEnterDate': function(val, oldVal) {
      this.bfhDateFormatted = this.formatDate(val);
    },
    //get district name
    'clientData.clientDistrict': function(val, oldVal) {
      var vm = this;
      const districtId = val;
      const districtData = vm.districtsData[vm.clientData.clientServices];
      if (districtData) {
        vm.clientData.clientDistrictName = districtData[districtId].name;
      }
    },
    //load other districts
    'clientData.clientServices': function(val, oldVal) {
      var vm = this;
      vm.getDistricts(val);
      vm.getPriceGroups(val);
    },
  },
  methods: {
    updatePhoto(newPhotoUrl) {
      this.clientData.clientPhotoUrl = newPhotoUrl;
    },
    updatedResidence() {
      //reset room
      this.clientData.bfhRoom = null;
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
    getPriceGroups(service) {
      return new Promise(async resolve => {
        try {
          var vm = this;
          //get only when needed
          if (typeof vm.priceGroupsData[service] == 'undefined') {
            vm.progressBar = true;
            var snapshot = await firebase
              .firestore()
              .collection('priceGroups')
              .where('service', '==', service)
              .orderBy('name')
              .get();

            var dataL = {};
            snapshot.forEach(doc => {
              dataL[doc.id] = doc.data();
              dataL[doc.id]['id'] = doc.id;
            });
            vm.priceGroupsData[service] = Object.assign({}, dataL);
            vm.progressBar = false;
          }
          vm.priceGroupSelector = Object.values(vm.priceGroupsData[service]);
          resolve('price groups loaded');
        } catch (error) {
          console.log('get districts error: ', error);
        }
      }); //end promise;
    },
    async getDistricts(service) {
      var vm = this;
      //get only when needed
      if (typeof vm.districtsData[service] == 'undefined') {
        var serviceQuery = service;
        if (service == 'cleaning') {
          //nbh and cleaning have the same districts
          serviceQuery = 'neighborhood';
        }
        vm.progressBar = true;
        var snapshot = await firebase
          .firestore()
          .collection('residences')
          .where('service', '==', serviceQuery)
          .orderBy('name')
          .get();

        var dataL = {};
        snapshot.forEach(doc => {
          dataL[doc.id] = doc.data();
          dataL[doc.id]['id'] = doc.id;
        });
        vm.districtsData[service] = Object.assign({}, dataL);
        vm.discritSelector = Object.values(vm.districtsData[service]);
        vm.generateRoomSelector();

        vm.progressBar = false;
      }
    },
    generateRoomSelector() {
      var vm = this;
      var items = [];
      var service = vm.clientData.clientServices;
      var clientDistrict = vm.clientData.clientDistrict;

      if (service == 'bfh') {
        var distrDt = vm.districtsData[service][clientDistrict];
        if (distrDt) {
          var rooms = Object.keys(distrDt.rooms);
          rooms.forEach(roomId => {
            items.push({
              roomId: roomId,
              roomName: distrDt.rooms[roomId].name,
            });
          });
          items.sort(vm.sortByName);
        }
      }

      vm.roomSelector = items;
    },
    submit(evt) {
      evt.preventDefault();
      if (this.$refs.form.validate()) {
        try {
          var vm = this;
          var db = firebase.firestore();
          var router = this.$router;

          //save or update
          if (vm.clientId == 'new_client') {
            //add default values
            vm.clientData.clientColor =
              vm.districtsData[vm.clientData.clientServices][
                vm.clientData.clientDistrict
              ].color;
            vm.clientData.lastUpdate = new Date();
            vm.clientData.lastUser = vm.currentUserData.displayName;
            vm.clientData.lifePlanOnPause = false;
          }

          db.collection('clients')
            .add(vm.clientData)
            .then(function(docRef) {
              //get address coordinates
              if (
                vm.clientData.clientServices == 'neighborhood' ||
                vm.clientData.clientServices == 'cleaning'
              ) {
                vm.saveAddress(
                  vm.clientData.clientAddress,
                  docRef.id,
                  'clients'
                );
              }

              router.push({
                name: 'clientprofilen',
                params: { clientId: docRef.id },
              });
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
    update() {
      if (this.$refs.form.validate()) {
        try {
          var vm = this;
          var db = firebase.firestore();

          //update info
          if (vm.clientId != 'new_client') {
            vm.clientData.lastUpdate = new Date();
            vm.clientData.lastUser = vm.currentUserData.displayName;

            db.collection('clients')
              .doc(vm.clientId)
              .update(vm.clientData)
              .then(() => {
                //get address coordinates
                if (
                  vm.clientData.clientServices == 'neighborhood' ||
                  vm.clientData.clientServices == 'cleaning'
                ) {
                  vm.saveAddress(
                    vm.clientData.clientAddress,
                    vm.clientId,
                    'clients'
                  );
                }
              });

            //update in parent obj
            vm.$emit('updateClientData', vm.clientData);

            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Informācija saglabāta!';
            vm.snackbar = true;
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
    randomColor() {
      return '000000'.replace(/0/g, function() {
        return (~~(Math.random() * 16)).toString(16);
      });
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
        '&key=prieksh share';

      vm.fetchAsync(geoUrl)
        .then(data => {
          //save in db

          var updObj = {};
          if ((collection = 'clients')) {
            updObj['clientAddressCoordinates'] = {
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
    prependClientStatusIcon() {
      var vm = this;
      var statusIcon = 'play_arrow';
      switch (vm.clientData.clientStatus) {
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
  }, //end methods
}; //end export default
</script>