<template>
  <v-container class="elevation-1">
    <v-layout row wrap>
      <v-flex>
        <h1>Novērtēšanas forma</h1>
        <!--Progress bar -->
        <v-layout row wrap>
          <v-flex xs12 v-if="!loadedEquipment">
            <v-progress-linear :indeterminate="true"></v-progress-linear>
          </v-flex>
        </v-layout>
        <v-divider></v-divider>
        <h2>Klients: {{clientName}}</h2>
        <h4>Adrese: {{clientAddress}}</h4>
        <v-divider></v-divider>
        <h3>Novērtēšana</h3>

        <v-layout v-for="k in orderedRoomKeys" :key="k" row wrap>
          <v-flex xs12>
            <v-switch
              :label="rooms[k].question"
              v-model="rooms[k].status"
              required
              @click="updateStatus(k, rooms[k].status, 'rooms')"
            ></v-switch>
          </v-flex>
          <v-flex xs12 v-if="rooms[k].roomPhoto ==''" :id="k+'InputForm'">
            <input type="file" value="upload" :id="k+'File'" v-if="rooms[k].order >=3" />
            <v-btn
              small
              text
              @click="saveFile(k)"
              color="primary"
              v-if="rooms[k].order >=3"
            >Augšuplādēt</v-btn>
          </v-flex>
          <v-flex xs12>
            <v-progress-linear
              v-model="valueDeterminate"
              :id="k+'Progr'"
              hidden
              v-if="rooms[k].roomPhoto ==''"
            ></v-progress-linear>
          </v-flex>
          <v-flex xs12 v-if="rooms[k].order >=3 && rooms[k].roomPhoto !== '' ">
            <v-img
              :src="rooms[k].roomPhoto"
              lazy-src="https://via.placeholder.com/150"
              max-height="350px"
              contain
              position="center left"
            ></v-img>
            <v-btn id="deleteImageBtn" text small color="red lighten-2" @click="deletePhoto(k)">
              <v-icon dark left>clear</v-icon>Dzēst
            </v-btn>
          </v-flex>
          <v-flex xs12>
            <v-divider></v-divider>
          </v-flex>
        </v-layout>

        <!-- equipment part -->
        <v-layout wrap>
          <v-divider></v-divider>
          <v-flex xs12>
            <h4>Mēneša maksa: {{monthlyPrice}}</h4>
          </v-flex>
          <v-flex xs12>
            <p>
              Apskatīt visu aprīkojumu:
              <v-btn
                icon
                @click="showSelectedEquipment = !showSelectedEquipment"
                v-if="showSelectedEquipment"
              >
                <v-icon color="success">toggle_on</v-icon>
              </v-btn>
              <v-btn
                icon
                @click="showSelectedEquipment = !showSelectedEquipment"
                v-if="!showSelectedEquipment"
              >
                <v-icon color="error">toggle_off</v-icon>
              </v-btn>
            </p>
            <p>
              Sagatavot formu:
              <v-btn icon @click="printForm()">
                <v-icon color="grey">print</v-icon>
              </v-btn>
            </p>
          </v-flex>
          <v-flex xs12>
            <v-list v-if="loadedEquipment  && selectedTags.length > 0">
              <v-list-item
                v-for="(item, itemId) in finalSelectedEquipment"
                :key="itemId"
                avatar
              >
                <v-list-item-action>
                  <v-checkbox
                    v-model="item.status"
                    @click="updateStatus(itemId, item.status, 'selectedEquipment')"
                  ></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title v-text="item.title"></v-list-item-title>
                </v-list-item-content>

                <v-list-item-avatar>
                  <img :src="item.photoAvatar" />
                </v-list-item-avatar>
              </v-list-item>
            </v-list>
          </v-flex>
        </v-layout>
        <v-form ref="form" v-model="valid" lazy-validation id="form" v-if="loadedEquipment">
          <v-divider></v-divider>
          <v-text-field v-model="comment" outlined label="Komentāri" style="margin-top: 30px"></v-text-field>
          <v-btn @click="submit" id="submitBtn">Saglabāt komentāru</v-btn>
        </v-form>
      </v-flex>
    </v-layout>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default {
  data() {
    return {
      form: {
        comment: '',
      },
      comment: '',
      valid: true,
      rooms: {},
      valueDeterminate: 0,
      equipment: {},
      finalSelectedEquipment: {},
      loadedEquipment: false,
      showSelectedEquipment: true,
      //define to data from user registered data
      clientName: '',
      clientAddress: '',
      clientDescription: '',
      monthlyPrice: 0.0,
      evaluationId: '',
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },

  computed: {
    orderedRoomKeys: function() {
      var vm = this;
      if (vm.loadedEquipment) {
        var rooms = vm.rooms;
        //sort rooms in correct order
        var roomsKeys = Object.keys(vm.rooms);
        var sort_rooms = [];
        for (var key in vm.rooms) {
          sort_rooms.push({ key: key, order: vm.rooms[key].order });
        }

        sort_rooms.sort(function(x, y) {
          return x.order - y.order;
        });

        var resArr = [];
        for (var sr = 0; sr < sort_rooms.length; sr++) {
          resArr.push(sort_rooms[sr].key);
        }

        return resArr;
      }
    },
    selectedTags: function() {
      var eq = this.equipment;
      var categories = {
        Mobilitāte: this.rooms.mobilityHelp.status,
        Drošība: this.rooms.cognHelp.status,
      };
      var rooms = {
        'Dzīvojamā istaba(s)': this.rooms.livingRoom.status,
        Guļamistaba: this.rooms.bedRoom.status,
        Vannasistaba: this.rooms.bathRoom.status,
        Tualete: this.rooms.wcRoom.status,
        Virtuve: this.rooms.kitchenRoom.status,
        Visi: true,
      };

      var selectedRooms = [];
      var roomKeys = Object.keys(rooms);
      for (var sr = 0; sr < roomKeys.length; sr++) {
        if (rooms[roomKeys[sr]] == false) {
          selectedRooms.push(roomKeys[sr]);
        }
      }

      var selectedEquipment = [];
      var eqKeys = Object.keys(eq);
      for (var e = 0; e < eqKeys.length; e++) {
        var category = eq[eqKeys[e]].category;
        var roomArr = eq[eqKeys[e]].rooms;

        if (
          categories[category] == true ||
          category == 'Visiem' ||
          category == 'Socializācija'
        ) {
          var selectedRoom = false;
          for (var r = 0; r < roomArr.length; r++) {
            if (selectedRooms.indexOf(roomArr[r]) != -1) {
              selectedRoom = true;
              break;
            }
          } //end for room

          if (
            selectedRoom ||
            category == 'Visiem' ||
            category == 'Socializācija'
          ) {
            selectedEquipment.push(eqKeys[e]);
          } //end if for selected room or for visiem
        }
      } //end for e

      return selectedEquipment;
    },
  },

  created() {
    var vm = this;
    var clientId = this.$route.params.id;
    var evId = this.$route.params.evId;

    var db = firebase.firestore();

    var clientRef = db.collection('clients').doc(clientId);

    clientRef.get().then(function(doc) {
      var data = doc.data();
      vm.clientName = data.clientName;
      vm.clientAddress = data.clientAddress;
      vm.clientDescription = data.clientDescription;
    });

    //get equipment with tags
    var eqArr = {};
    var eqIdArr = {};
    var equipmentRef = db
      .collection('items')
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          var id = doc.id;
          var data = doc.data();
          var rooms = data.itemRooms;
          var itemCategory = data.itemCategory;
          var title = data.itemName;
          var photo = data.itemPhotoUrl;
          var price = data.itemMonthPrice;

          eqIdArr[id] = { status: false, title: title, photoAvatar: photo };

          eqArr[id] = {
            id: id,
            rooms: rooms,
            category: itemCategory,
            photo: photo,
            title: title,
            price: price,
          };
        });

        vm.equipment = Object.assign({}, eqArr);
        //create new evaluation record in db
        var evaluationDocRef = db
          .collection('clients')
          .doc(clientId)
          .collection('evaluations');

        if (evId == '') {
          evaluationDocRef.add({}).then(function(docRef) {
            vm.evaluationId = docRef.id;

            docRef.onSnapshot(function(doc) {
              vm.rooms = Object.assign({}, doc.data().rooms);
              vm.finalSelectedEquipment = Object.assign(
                {},
                doc.data().selectedEquipment
              );
              vm.monthlyPrice = doc.data().monthlyPrice;
              vm.loadedEquipment = true;
            });
          });
        } else {
          //get data for evaluation edit
          evaluationDocRef.doc(evId).onSnapshot(function(doc) {
            vm.rooms = Object.assign({}, doc.data().rooms);
            vm.finalSelectedEquipment = Object.assign(
              {},
              doc.data().selectedEquipment
            );
            vm.evaluationId = evId;
            vm.comment = doc.data().comment;
            vm.monthlyPrice = doc.data().monthlyPrice;
            vm.loadedEquipment = true;
          });
        }
      });
  },
  methods: {
    printForm() {
      var vm = this;
      //generate file name 'name_surname_pn_akts.pdf'

      const fileName =
        vm.clientName
          .toLowerCase()
          .split(' ')
          .join('_') + '_pn_akts.pdf';

      //generate equipment table
      var equipmentTable = [
        [
          { text: 'Nosaukums', bold: true },
          { text: 'Daudzums', bold: true },
          { text: 'Uzskaites Nr.', bold: true },
        ],
      ];
      //loop selected equipment
      var equipmentIds = Object.keys(vm.finalSelectedEquipment);
      for (var eq = 0; eq < equipmentIds.length; eq++) {
        if (vm.finalSelectedEquipment[equipmentIds[eq]].status == true) {
          equipmentTable.push([
            vm.finalSelectedEquipment[equipmentIds[eq]].title,
            '1.gab',
            ' ',
          ]);
        }
      }

      //generate form to sign given equipment
      var docDefinition = {
        content: [],
        styles: {
          header: {
            fontSize: 16,
            bold: true,
            alignment: 'center',
          },
          right: {
            alignment: 'right',
            fontSize: 12,
          },
        },
      };

      var now = new Date();

      var pdf = pdfMake.createPdf(docDefinition);
      pdf.download(fileName);
    },
    updatePrice() {
      var price = 0.0;
      var vm = this;
      var clientId = this.$route.params.id;
      var evId = vm.evaluationId;
      //loop all equipment, if selected equipment status true, add add to price
      var keysArr = Object.keys(vm.equipment);

      for (var k = 0; k < keysArr.length; k++) {
        const eqStatus = vm.finalSelectedEquipment[keysArr[k]];
        if (typeof eqStatus != 'undefined' && eqStatus.status == true) {
          price =
            parseFloat(price) + parseFloat(vm.equipment[keysArr[k]].price);
        }
      }

      var db = firebase.firestore();

      //define ref to store url in firebase
      var evRef = db
        .collection('clients')
        .doc(clientId)
        .collection('evaluations')
        .doc(vm.evaluationId);

      evRef.update({
        monthlyPrice: price.toFixed(2),
      });
    },
    updateStatus(roomId, currentSatus, cathegory) {
      //get references
      var vm = this;
      var clientId = this.$route.params.id;
      var evId = vm.evaluationId;

      var db = firebase.firestore();

      //define ref to store url in firebase
      var evRef = db
        .collection('clients')
        .doc(clientId)
        .collection('evaluations')
        .doc(vm.evaluationId);

      evRef
        .update({
          [cathegory + '.' + roomId + '.status']: !currentSatus,
        })
        .then(function() {
          //update monthly price if cathegory equipment
          if (cathegory == 'selectedEquipment') {
            vm.updatePrice();
          }
        });
    },
    deletePhoto(roomId) {
      //get references
      var clientId = this.$route.params.id;

      var vm = this;
      var db = firebase.firestore();

      //define ref to store url in firebase
      var evRef = db
        .collection('clients')
        .doc(clientId)
        .collection('evaluations')
        .doc(vm.evaluationId);

      evRef
        .update({
          ['rooms.' + roomId + '.roomPhoto']: '',
        })
        .then(function() {
          //enable snackbar
          vm.snackbarColor = 'error';
          vm.snackbarTxt = 'Attēls veiksmīgi izdzēsts!';
          vm.snackbar = true;
        });
    },
    saveFile(modelRef) {
      try {
        var clientId = this.$route.params.id;
        var vm = this;
        var inputId = modelRef + 'File';
        var progrId = modelRef + 'Progr';
        var inputFormId = modelRef + 'InputForm';
        var evId = vm.evaluationId;

        //unhide progress bar, hide inputs
        var progrBar = document.getElementById(progrId);
        progrBar.hidden = false;
        // var inputForm = document.getElementById(inputFormId);
        // inputForm.hidden = true;

        var fileButton = document.getElementById(inputId);
        var file = fileButton.files[0];
        var filePath =
          clientId +
          '/evaluations/' +
          evId +
          '/rooms.' +
          modelRef +
          '.roomPhoto/' +
          file.name;

        var storageRef = firebase.storage().ref(filePath);

        var uploadTask = storageRef.put(file);

        uploadTask.on(
          'state_changed',

          function progress(snapshot) {
            var progr = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            vm.valueDeterminate = progr;
          },

          function error(err) {
            console.log(err);
          },

          function complete(snapshot) {
            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Attēls veiksmīgi pievienots!';
            vm.snackbar = true;
            //photo url will be updated by resize function
          }
        );
      } catch (error) {
        console.log(error);
      }
    },
    submit(evt) {
      var clientId = this.$route.params.id;

      evt.preventDefault();
      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();
          var router = this.$router;
          var vm = this;

          var evRef = db
            .collection('clients')
            .doc(clientId)
            .collection('evaluations');

          evRef.doc(vm.evaluationId).update({
            comment: this.comment,
          });

          router.push({ name: 'clientprofile', params: { id: clientId } });
        } catch (error) {
          console.log(error);
        }
      }
    },
  }, //end methods
}; //end export default
</script>