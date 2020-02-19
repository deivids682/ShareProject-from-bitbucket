<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>
          Rezidence
          <span v-if="!progressBar">{{houseData.name}}</span>
        </h1>
      </v-col>
    </v-row>
    <!--Progress bar -->
    <v-row>
      <v-col v-if="progressBar">
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

    <!-- navigation tabs -->
    <template>
      <v-tabs
        grow
        show-arrows
        background-color="secondary"
        active-class="active-tab"
        slider-color="primary"
        v-model="tab"
      >
        <v-tab>Dati</v-tab>
        <v-tab>Istabas</v-tab>
        <v-tab>Uzdevumi</v-tab>
        <v-tab>Dzīves plāns</v-tab>
      </v-tabs>
    </template>

    <v-row>
      <v-col xs12 sm6 offset-sm3>
        <v-card v-if="!progressBar">
          <!-- general info view -->
          <template v-if="tab == 0">
            <v-card-title>
              <h4>Informācija</h4>
            </v-card-title>
            <v-card-text>
              <v-form ref="form" lazy-validation v-model="valid">
                <v-container>
                  <v-row align="center" justify="center">
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        prepend-icon="title"
                        solo
                        :disabled="!admin"
                        v-model="houseData.name"
                        label="Rezidences nosaukums"
                        :rules="[() => !!houseData.name || 'Nepieciešams norādīt']"
                        @change="submit()"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        prepend-icon="map"
                        solo
                        :disabled="!admin"
                        v-model="houseData.address"
                        label="Rezidences adrese"
                        :rules="[() => !!houseData.address || 'Nepieciešams norādīt']"
                        @change="saveAddress(houseData.address, houseId, 'residences')"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-select
                        label="Kvartāla vadītājs"
                        solo
                        v-model="houseData.managerId"
                        prepend-icon="house"
                        :items="managers"
                        item-text="displayName"
                        item-value="id"
                        :rules="[() => !!houseData.managerId || 'Nepieciešams norādīt']"
                        @change="submit()"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        :disabled="!admin"
                        prepend-icon="note"
                        v-model="houseData.notes"
                        label="Piezīmes"
                        @change="submit()"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-form>

              <v-list>
                <!-- photo -->
                <photo-form
                  :docId="houseId"
                  :collection="'residences'"
                  :urlPath="'photoUrl'"
                  :photoUrl="houseData.photoUrl"
                  :filePath="'/residences/' + houseId + '/photoUrl/'"
                  @updatePhoto="updatePhoto"
                  v-if="!progressBar"
                ></photo-form>
                <!-- pin color -->
                <v-list-item>
                  <v-list-item-avatar>
                    <v-icon :color="'#'+houseData.color">location_on</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-content>Nomainīt rezidences krāsu</v-list-item-content>
                  <v-list-item-action v-if="admin">
                    <v-dialog v-model="colorDialog" persistent max-width="500">
                      <template v-slot:activator="{ on }">
                        <v-btn outlined :color="'#'+houseData.color" v-on="on" fab small>
                          <v-icon>brush</v-icon>
                        </v-btn>
                      </template>
                      <v-card>
                        <v-card-title class="headline">Rezidences krāsa</v-card-title>
                        <v-card-text>
                          <slider-picker style="width:100%" v-model="houseData.color" />
                          <br />
                          <v-icon
                            x-large
                            :color="houseData.color.hex"
                            v-if="typeof houseData.color.hex != 'undefined'"
                          >location_on</v-icon>
                          <v-icon
                            x-large
                            :color="'#'+houseData.color"
                            v-if="typeof houseData.color.hex == 'undefined'"
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
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <!-- map -->
              <v-container v-if="typeof houseData.addressCoordinates != 'undefined'">
                <v-row>
                  <v-col cols="12">
                    <v-icon>place</v-icon>Adrese kartē
                    <GmapMap
                      :center="houseData.addressCoordinates"
                      :zoom="14"
                      style="width: 100%; height: 400px"
                    >
                      <GmapMarker
                        :position="houseData.addressCoordinates"
                        :icon="'http://www.googlemapsmarkers.com/v1/'+houseData.color+'/'"
                      />
                    </GmapMap>
                  </v-col>
                </v-row>
              </v-container>
              <v-container v-else>
                <v-alert type="error">Adresei nevarēja atrast koordinātes. Precizēt adresi vēlreiz.</v-alert>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn outlined color="error" @click="deleteHouse()" v-if="admin">
                <v-icon left>delete_forever</v-icon>Izdzēst rezidenci
              </v-btn>
            </v-card-actions>
          </template>

          <!-- rooms view -->
          <template v-if="tab == 1">
            <room-register
              :houseId="houseId"
              :roomsPrnt="houseData.rooms"
              :currentUserData="currentUserData"
              @updateRooms="updateRooms"
            ></room-register>
          </template>

          <!-- tasks view -->
          <template v-if="tab == 2">
            <v-card-title>
              <v-btn
                class="margin-v-btn"
                color="primary"
                :to="{ name: 'bfhHouseTasks', params: { clid: houseId}}"
                v-if="admin || manager"
              >
                <v-icon>done</v-icon>Dzīves plāna uzdevumi
              </v-btn>
            <v-btn
              color="primary"
              :to="{ name: 'bfhHouselifeplan', params: { clid: houseId}}"
              v-if="admin || manager"
            >
            <v-icon>list_alt</v-icon>Dzīves plāns
            </v-btn>
            </v-card-title>
          </template>

          <!-- life plan view -->
          <template v-if="tab == 3">
            <v-card-title>
              <h4>Sastādīt dzīves plānu</h4>
            </v-card-title>
          </template>
        </v-card>
      </v-col>
    </v-row>
    <!-- last update -->
    <v-row v-if="!progressBar">
      <v-col>
        <br />
        <v-divider></v-divider>
        <small style="font-style: italic">
          <span>Pēdējo reizi atjaunoja {{houseData.lastUser}} {{formatDate(houseData.lastUpdate.seconds)}}</span>
        </small>
      </v-col>
    </v-row>
  </v-container>
</template>
  
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//color picker
import { Slider } from 'vue-color';

//views
import RoomRegister from '@/comp/bfh/addRooms.vue';
import PhotoForm from '@/comp/clients/photoForm.vue';

export default {
  components: {
    'slider-picker': Slider,
    RoomRegister,
    PhotoForm,
  },
  data() {
    return {
      houseId: this.$route.params.houseId,
      progressBar: true,
      tab: null,
      houseData: null,
      valid: true,
      colorDialog: false,
      managers: [],
      managersData: {},

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

    //load data
    var dataPromises = [];

    //load house data
    var houseProm = db
      .collection('residences')
      .doc(vm.houseId)
      .get();
    dataPromises.push(houseProm);

    var mngProm = db
      .collection('users')
      .where('role', 'array-contains', 'manager')
      .get();
    dataPromises.push(mngProm);

    var values = await Promise.all(dataPromises);

    vm.houseData = Object.assign({}, values[0].data());

    var managersDataL = {};
    values[1].forEach(function(doc) {
      var data = doc.data();
      data['id'] = doc.id;
      vm.managers.push(data);
      managersDataL[doc.id] = doc.data();
    });
    vm.managersData = Object.assign({}, managersDataL);

    vm.progressBar = false;
  },
  methods: {
    getManagerName() {
      var vm = this;
      vm.houseData.managerName =
        vm.managersData[vm.houseData.managerId].displayName;
    },
    updateRooms(updatedRoomObj) {
      this.houseData.rooms = updatedRoomObj;
    },
    updatePhoto(newPhotoUrl) {
      this.houseData.photoUrl = newPhotoUrl;
    },
    addPhoto() {
      try {
        //get references
        var vm = this;
        var db = firebase.firestore();

        //show progress
        vm.progressBar = true;

        //close dialog
        vm.photoDialog = false;

        //get file
        var fileInput = document.getElementById('housePhotoUpload');
        var file = fileInput.files[0];
        var filePath = '/residences/' + vm.houseId + '/photoUrl/' + file.name;

        var storageRef = firebase.storage().ref(filePath);

        //upload file
        var uploadTask = storageRef.put(file);

        //functions.js will add filre url

        uploadTask.on(
          'state_changed',

          function progress(snapshot) {
            //show progress
            var progr = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            vm.progressValue = parseInt(progr);
          },

          function error(err) {
            console.log(err);
          },

          function complete(snapshot) {
            uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
              vm.houseData.photoUrl = downloadURL;
            });

            //hide progress
            vm.progressBar = false;

            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Fotogrāfija pievienota!';
            vm.snackbar = true;
          }
        );
      } catch (error) {
        console.log(error);
      }
    },
    deletePhoto() {
      var vm = this;
      var db = firebase.firestore();
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Izdzēst fotogrāfiju?');
      if (conf) {
        try {
          //delete photo
          db.collection('residences')
            .doc(vm.houseId)
            .update({
              photoUrl: '',
            });

          //update local
          vm.houseData.photoUrl = '';
          //close dialog
          vm.photoDialog = false;

          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Fotogrāfija izdzēsta!';
          vm.snackbar = true;
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
            updObj.lastUpdate = new Date();
            updObj.lastUser = vm.currentUserData.displayName;
            updObj['address'] = address;
          }

          //save local
          vm.houseData.addressCoordinates = {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng,
          };

          db.collection(collection)
            .doc(entryId)
            .update(updObj);

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
    submit() {
      var vm = this;

      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();

          vm.houseData.lastUpdate = new Date();
          vm.houseData.lastUser = vm.currentUserData.displayName;
          vm.getManagerName();

          db.collection('residences')
            .doc(vm.houseId)
            .update(vm.houseData);
          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Informācija saglabāta!';
          vm.snackbar = true;
        } catch (error) {
          console.log(error);
        }
      }
    },
    async deleteHouse() {
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
            .where('clientDistrict', '==', vm.houseId)
            .get();

          if (snapShot.empty) {
            //delete from db
            firebase
              .firestore()
              .collection('residences')
              .doc(vm.houseId)
              .delete();

            //redirect to house register
            vm.$router.push({ name: 'houseregister' });
          } else {
            //don't allow to delete
            var clientNames = '';
            snapShot.forEach(client => {
              clientNames += ' ' + client.data().clientName + ',';
            });
            alert(
              'Kamēr residencei ir piesaistīti klienti' +
                clientNames +
                ' tikmēr dzēst nedrīkst!'
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
    saveColor() {
      var vm = this;
      var db = firebase.firestore();

      var color = vm.houseData.color.hex;
      color = color.substr(1);

      db.collection('residences')
        .doc(vm.houseId)
        .update({
          color: color,
          lastUpdate: new Date(),
          lastUser: vm.currentUserData.displayName,
        });

      vm.colorDialog = false;
      vm.houseData.color = color;
      //enable snackbar
      vm.snackbarColor = 'success';
      vm.snackbarTxt = 'Informācija saglabāta!';
      vm.snackbar = true;
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

<style scoped>
.active-tab {
  color: black !important;
}
.margin-v-btn {
  margin-right: 0.7rem;
}
</style>