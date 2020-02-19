<template>
  <v-row>
    <v-col cols="12">
      <v-card-title>
        <h4>Istabas</h4>
      </v-card-title>
      <v-card-text>
        <!-- rooms form -->
        <v-card outlined>
          <v-form ref="roomForm" v-model="roomValid" lazy-validation id="roomForm">
            <v-row align="center" justify="center">
              <v-col cols="12" md="4" lg="2">
                <v-text-field
                  label="Istabas nosaukums"
                  solo
                  v-model="roomName"
                  :rules="[() => !!roomName || 'Nepieciešams norādīt']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4" lg="2">
                <v-text-field
                  type="number"
                  solo
                  label="Gultu skaits"
                  v-model="roomBedrooms"
                  min="1"
                  :rules="[() => !!roomBedrooms || 'Nepieciešams norādīt']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4" lg="2" class="text-center">
                <v-btn outlined color="accent" small @click="saveRoom()">
                  <v-icon left>save</v-icon>Saglabāt
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
        <!-- list rooms -->
        <v-row align="center" justify="center">
          <v-col cols="12" md="6">
            <v-simple-table>
              <thead>
                <tr>
                  <th class="text-center">Istaba</th>
                  <th class="text-center">Gultas</th>
                  <th class="text-center">Rīki</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(room) in sortedRooms" :key="room.id">
                  <td class="text-center">{{ room.name }}</td>
                  <td class="text-center">{{ room.beds }}</td>
                  <td class="text-center">
                    <v-btn x-small fab outlined @click="editRoom(room.id)">
                      <v-icon>edit</v-icon>
                    </v-btn>
                    <v-btn x-small fab outlined color="error" @click="deleteRoom(room.id)">
                      <v-icon>delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  props: ['houseId', 'roomsPrnt'],
  data() {
    return {
      //room form
      roomId: null,
      roomBedrooms: null,
      roomName: null,
      roomValid: true,
      //for update
      roomsChld: null,
    };
  },
  created() {
    var vm = this;
    this.roomsChld = Object.assign({}, vm.roomsPrnt);
  },
  computed: {
    sortedRooms: function() {
      var vm = this;
      const object = vm.roomsChld;
      var keys = Object.keys(object);
      //object to array
      var arr = [];
      keys.forEach(function(key) {
        object[key]['id'] = key;
        arr.push(object[key]);
      });
      //sort array
      arr.sort(vm.sortByName);
      return arr;
    },
  },
  methods: {
    sortByName(a, b) {
      // Use toUpperCase() to ignore character casing
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();

      let comparison = 0;
      if (nameA > nameB) {
        comparison = 1;
      } else if (nameA < nameB) {
        comparison = -1;
      }
      return comparison;
    },
    resetForm() {
      var vm = this;
      vm.roomId = null;
      vm.roomBedrooms = null;
      vm.roomName = null;
      vm.roomValid = true;
    },
    editRoom(roomId) {
      var vm = this;
      vm.roomId = roomId;
      vm.roomName = vm.roomsChld[roomId].name;
      vm.roomBedrooms = vm.roomsChld[roomId].beds;
    },
    saveRoom() {
      var vm = this;
      if (this.$refs.roomForm.validate()) {
        //new or edit
        if (vm.roomId == null) {
          //new
          vm.roomId = (Math.random() + 1).toString(36).substring(4);
        }

        //save local
        var updatedRooms = vm.roomsChld;
        updatedRooms[vm.roomId] = { name: vm.roomName, beds: vm.roomBedrooms };
        vm.roomsChld = Object.assign({}, updatedRooms);

        //update rooms
        vm.updateRooms(updatedRooms);

        //reset form
        vm.resetForm();
      }
    },
    async deleteRoom(roomId) {
      var vm = this;

      var conf = confirm('Izdzēst istabu?');
      if (conf) {
        try {
          //check if any clients have
          var db = firebase.firestore();
          var snapShot = await db
            .collection('clients')
            .where('bfhRoom.roomId', '==', roomId)
            .get();

          if (snapShot.empty) {
            //delet local
            var updatedRooms = vm.roomsChld;
            delete updatedRooms[roomId];
            vm.roomsChld = Object.assign({}, updatedRooms);
            //update rooms
            vm.updateRooms(updatedRooms);
          } else {
            //don't allow to delete
            var clientNames = '';
            snapShot.forEach(client => {
              clientNames += ' ' + client.data().clientName + ',';
            });
            alert(
              'prieksh share' +
                clientNames +
                ' prieksh share!'
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
    updateRooms(updatedRooms) {
      var vm = this;
      //update in parent obj
      vm.$emit('updateRooms', updatedRooms);

      //update in db
      firebase
        .firestore()
        .collection('residences')
        .doc(vm.houseId)
        .update({
          rooms: updatedRooms,
          lastUpdate: new Date(),
          lastUser: vm.currentUserData.displayName,
        });
    },
  },
};
</script>