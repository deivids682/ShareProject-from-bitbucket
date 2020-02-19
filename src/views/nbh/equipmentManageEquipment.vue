<template>
  <div id="equipment">
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
      <!-- add photo dialog -->
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Iekārtas attēls</v-card-title>

          <v-card-text>
            <v-container>
              <v-layout wrap v-if="editTaskId != null">
                <v-flex xs12>
                  <div v-if="editTaskPhotoUrl == ''" class="photo-div">
                    <p>Pievienot foto:</p>
                    <input type="file" value="upload" :id="'photoFile'" />
                    <v-btn small depressed outlined color="grey" @click="saveFile()">Augšuplādēt</v-btn>
                    <v-progress-linear v-model="progressBarValue" :id="'photoProgressBar'" hidden></v-progress-linear>
                  </div>
                  <div v-if="editTaskPhotoUrl != '' " class="photo-div">
                    <v-img
                      :src="editTaskPhotoUrl"
                      lazy-src="https://via.placeholder.com/150"
                      contain
                    ></v-img>
                    <v-btn
                      id="deleteImageBtn"
                      text
                      small
                      color="red lighten-2"
                      @click="deletePhoto()"
                    >
                      <v-icon dark left>clear</v-icon>Dzēst
                    </v-btn>
                  </div>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="red darken-1" text @click="dialog = false">Atcelt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- add new item -->
      <v-layout row>
        <v-flex>
          <v-btn @click="showForm" id="newItemBtn" color="info">Pievienot jaunu iekārtu</v-btn>
        </v-flex>
        <v-flex></v-flex>
        <v-flex></v-flex>
      </v-layout>
      <!-- new item form -->
      <v-layout align-start justify-center row>
        <v-flex></v-flex>
        <v-flex>
          <v-card>
            <v-form ref="form" v-model="valid" lazy-validation id="form" hidden>
              <v-text-field
                v-model="itemName"
                :rules="[v => !!v || 'Nepieciešams nosaukums']"
                label="Nosaukums"
                required
              ></v-text-field>
              <!-- <v-text-field
              v-model="itemPhotoUrl"
              :rules="[v => !!v || 'Nepieciešama saite uz bildi']"
              label="Saite uz bildi"
              required
              ></v-text-field>-->
              <v-text-field
                v-model="itemMonthPrice"
                :rules="[v => !!v || 'Nepieciešama mēnešam aksa']"
                label="Mēneša maksa"
                required
              ></v-text-field>
              <v-select
                v-model="itemCategory"
                :items="categories"
                :rules="[v => !!v || 'Nepieciešama kategorija']"
                label="Kategorija"
                required
              ></v-select>
              <v-select
                v-model="itemRooms"
                multiple
                :items="rooms"
                :rules="[v => !!v || 'Nepieciešama istaba']"
                label="Istaba(s)"
                required
              ></v-select>

              <v-btn :disabled="!valid" @click="submit" id="submitBtn">Pievienot</v-btn>
              <v-btn @click="clear">Notīrīt</v-btn>
            </v-form>
          </v-card>
        </v-flex>
        <v-flex></v-flex>
      </v-layout>
      <!-- list equipment -->
      <v-layout align-center justify-space-around row fill-height>
        <v-flex>
          <v-data-table :headers="headers" :items="items" class="elevation-1">
            <template v-slot:item="{item}">
              <tr>
                <td>{{ item.itemName }}</td>
                <td class="text-xs-left">
                  <v-img
                    :src="item.itemPhotoUrl || 'https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png'"
                    max-height="75px"
                    contain
                  ></v-img>
                </td>
                <td class="text-xs-center">{{ item.itemCategory }}</td>
                <td class="text-xs-center">
                  <li v-for="room in item.itemRooms">{{room}}</li>
                </td>
                <td class="text-xs-center">{{ item.itemMonthPrice }}</td>
                <td class="text-xs-right">
                  <v-btn @click="addPhoto(item.id)" id="addPhotoBtn" icon>
                    <v-icon
                      small
                      v-if="item.itemPhotoUrl == '' || typeof item.itemPhotoUrl == 'undefined'"
                      color="error"
                    >photo_camera</v-icon>
                    <v-icon
                      small
                      v-if="item.itemPhotoUrl != '' && typeof item.itemPhotoUrl != 'undefined'"
                    >photo_camera</v-icon>
                  </v-btn>
                  <v-btn id="viewItemBtn" :to="{ name: 'edititem', params: { id: item.id }}" icon>
                    <v-icon small>edit</v-icon>
                  </v-btn>
                  <v-btn @click="deleteItem(item.id)" id="deleteItemBtn" icon>
                    <v-icon small>delete_forever</v-icon>
                  </v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

export default {
  data() {
    return {
      form: {
        itemName: '',
        itemPhotoUrl: '',
        itemCategory: '',
        itemRooms: [],
        itemMonthPrice: '',
      },
      valid: true,
      items: [],
      dialog: false,
      progressBar: false,
      progressBarValue: 0,
      editTaskPhotoUrl: '',
      editTaskId: null,
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',

      //define to data from user registered data
      itemName: '',
      itemPhotoUrl: '',
      itemCategory: '',
      itemRooms: [],
      itemMonthPrice: '',
      categories: ['Drošība', 'Mobilitāte', 'Socializācija', 'Visiem'],
      rooms: [
        'Dzīvojamā istaba(s)',
        'Guļamistaba',
        'Vannasistaba',
        'Tualete',
        'Virtuve',
      ],
      headers: [
        { text: 'Nosaukums', align: 'left', value: 'itemName' },
        { text: 'Attēls', value: 'itemPhotoUrl', align: 'center' },
        { text: 'Kategorija', value: 'itemCategory', align: 'center' },
        { text: 'Istabas', value: 'itemRooms', align: 'center' },
        { text: 'Mēneša maksa', value: 'itemMonthPrice', align: 'center' },
        { text: 'Rīki', value: 'action', align: 'right', sortable: false },
      ],
    };
  },

  created() {
    var vm = this;
    vm.progressBar = true;

    var db = firebase.firestore();

    db.collection('items').onSnapshot(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        //push data to array
        var data = doc.data();
        data['id'] = doc.id;
        vm.items.push(data);
        vm.progressBar = false;
      });
    });
  },

  methods: {
    addPhoto(itemId) {
      var vm = this;
      vm.editTaskId = itemId;

      var db = firebase.firestore();

      db.collection('items')
        .doc(itemId)
        .get()
        .then(function(doc) {
          vm.editTaskPhotoUrl = doc.data().itemPhotoUrl || '';
          vm.dialog = true;
        });
    },

    clear() {
      this.$refs.form.reset();
    },
    submit(evt) {
      evt.preventDefault();
      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();

          db.collection('items').add({
            itemName: this.itemName,
            itemPhotoUrl: '', //placeholder
            itemCategory: this.itemCategory,
            itemRooms: this.itemRooms,
            itemMonthPrice: this.itemMonthPrice,
          });
          this.clear();
          this.items = []; //to reset table for new item
        } catch (error) {
          console.log(error);
        }
      }
    },
    showForm() {
      if (document.getElementById('form').hidden) {
        document.getElementById('form').hidden = false;
      } else {
        document.getElementById('form').hidden = true;
      }
    },
    deleteItem(id) {
      var conf = confirm('Tiešām vēlies izdzēst?');
      if (conf) {
        try {
          var db = firebase.firestore();

          db.collection('items')
            .doc(id)
            .delete();
          this.items = []; //to reset table for new item
        } catch (error) {
          console.log(error);
        }
      }
    },
    deletePhoto() {
      //get references

      var vm = this;
      var db = firebase.firestore();

      //define ref to store url in firebase
      var taskRef = db.collection('items').doc(vm.editTaskId);

      //reset items table
      vm.items = [];

      taskRef
        .update({
          ['itemPhotoUrl']: '',
        })
        .then(function() {
          //enable snackbar
          vm.snackbarColor = 'error';
          vm.snackbarTxt = 'Attēls veiksmīgi izdzēsts!';
          vm.snackbar = true;
          //reset
          vm.editTaskPhotoUrl = '';
        });
    },
    saveFile() {
      try {
        //get references
        var vm = this;
        var db = firebase.firestore();

        //calculate ids
        var inputId = 'photoFile';
        var progrId = 'photoProgressBar';

        //unhide progress bar
        var progrBar = document.getElementById(progrId);
        progrBar.hidden = false;

        //get file
        var fileButton = document.getElementById(inputId);
        var file = fileButton.files[0];
        var filePath = '/items/' + vm.editTaskId + '/itemPhotoUrl/' + file.name;

        var storageRef = firebase.storage().ref(filePath);

        var uploadTask = storageRef.put(file);

        uploadTask.on(
          'state_changed',

          function progress(snapshot) {
            var progr = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            vm.progressBarValue = progr;
          },

          function error(err) {
            console.log(err);
          },

          function complete(snapshot) {
            //hide input div
            progrBar.hidden = true;
            vm.dialog = false;
            vm.progressBar = true;

            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Attēls veiksmīgi pievienots!';
            vm.snackbar = true;
            vm.items = [];
          }
        );
      } catch (error) {
        console.log(error);
      }
    }, //end save file
  }, //end methods
}; //end export default
</script>

<style>
.photo-div {
  border: 1px solid lightgray;
  padding: 10px;
}
</style>