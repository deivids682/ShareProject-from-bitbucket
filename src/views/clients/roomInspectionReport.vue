<template>
  <div>
    <v-container class="elevation-1">
      <h2>Uzstādītā aprīkojuma atskaite</h2>
      <v-layout row wrap v-for="(item, k) in clientEquipment" :key="k">
        <v-flex v-if="item.status == true">
          <h4>{{item.title}}</h4>
          <p>Foto atskaite:</p>
          <v-flex
            xs12
            v-if="item.afterPhoto =='' || typeof item.afterPhoto == 'undefined'"
            :id="k+'InputForm'"
          >
            <input type="file" value="upload" :id="k+'File'">
            <v-btn small text @click="saveFile(k)" color="primary">Augšuplādēt</v-btn>
          </v-flex>
          <v-flex xs12>
            <v-progress-linear
              v-model="valueDeterminate"
              :id="k+'Progr'"
              hidden
              v-if="item.afterPhoto =='' || typeof item.afterPhoto == 'undefined'"
            ></v-progress-linear>
          </v-flex>
          <v-flex xs12 v-if="item.afterPhoto !== '' && typeof item.afterPhoto != 'undefined' ">
            <v-img
              :src="item.afterPhoto"
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
  </div>
</template>

<script>
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";


export default {
  data() {
    return {
      clientEquipment: {},
      valueDeterminate: 0,
      dataLoaded: false,
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: "",
      snackbarTxt: ""
    };
  },
  created() {
    var vm = this;
    var clientId = this.$route.params.clid;
    var evId = this.$route.params.evid;

    var db = firebase.firestore();

    //get selected equipment
    var clientEquipment = {};
    db.collection("clients")
      .doc(clientId)
      .collection("evaluations")
      .doc(evId)
      .onSnapshot(function(doc) {
        vm.clientEquipment = Object.assign({}, doc.data().selectedEquipment);
        vm.dataLoaded = true;
      });
  }, //end mounted
  methods: {
    deletePhoto(equipmentId) {
      //get references
      var clientId = this.$route.params.clid;
      var evId = this.$route.params.evid;
      var vm = this;
      var db = firebase.firestore();

      //define ref to store url in firebase
      var evRef = db
        .collection("clients")
        .doc(clientId)
        .collection("evaluations")
        .doc(evId);

      evRef.update({
        ["selectedEquipment." + equipmentId + ".afterPhoto"]: ""
      }).then(function(){
        //enable snackbar
              vm.snackbarColor = "error";
              vm.snackbarTxt = "Attēls veiksmīgi izdzēsts!";
              vm.snackbar = true;
      });
    },
    saveFile(modelRef) {
      try {
        var clientId = this.$route.params.clid;
        var vm = this;
        var inputId = modelRef + "File";
        var progrId = modelRef + "Progr";
        var inputFormId = modelRef + "InputForm";
        var evId = this.$route.params.evid;

        //unhide progress bar, hide inputs
        var progrBar = document.getElementById(progrId);
        progrBar.hidden = false;

        var fileButton = document.getElementById(inputId);
        var file = fileButton.files[0];
        var filePath =
          clientId +
          "/evaluations/" +
          evId +
          "/selectedEquipment." +
          modelRef +
          ".afterPhoto/" +
          file.name;

        var storageRef = firebase.storage().ref(filePath);

        var uploadTask = storageRef.put(file);

        uploadTask.on(
          "state_changed",

          function progress(snapshot) {
            var progr = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            vm.valueDeterminate = progr;
          },

          function error(err) {
            console.log(err);
          },

          function complete(snapshot) {
            //enable snackbar
            vm.snackbarColor = "success";
            vm.snackbarTxt = "Attēls veiksmīgi pievienots!";
            vm.snackbar = true;
            //photo url will be updated by resize function
          }
        );
      } catch (error) {
        console.log(error);
      }
    }
  } //end methods
};
</script>