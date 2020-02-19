<template>
  <v-list-item>
    <!-- img -->
    <v-list-item-avatar v-if="currPhotoUrl != ''">
      <img :src="currPhotoUrl" />
    </v-list-item-avatar>
    <!-- quick photo -->
    <v-list-item-content>
      <div class="upload-wrap" v-if="currPhotoUrl == ''">
        <v-progress-circular
          :value="progressValue"
          v-if="fileUploading"
          color="success"
        >{{ progressValue }}</v-progress-circular>
        <span v-if="!fileUploading">
          <v-icon small color="black">add_a_photo</v-icon>
          <input
            type="file"
            accept="image/*"
            id="photoFile"
            class="upload-btn"
            @change="addPhoto()"
          />
        </span>
        Pievienot foto
      </div>
    </v-list-item-content>
    <!-- select photo -->
    <v-list-item-action @click.stop="photoDialog = true">
      <!-- view photo -->
      <v-btn icon v-if="currPhotoUrl != ''">
        <v-icon>remove_red_eye</v-icon>
      </v-btn>
    </v-list-item-action>

    <!-- photo dialog -->
    <v-dialog v-model="photoDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Foto</v-card-title>

        <v-card-text>
          <!-- view photo -->
          <div v-if="currPhotoUrl != ''">
            <v-img :src="currPhotoUrl"></v-img>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="grey" text small outlined @click="photoDialog = false">
            <v-icon left>close</v-icon>Atcelt
          </v-btn>
          <!-- delete photo -->
          <v-btn color="error" text small outlined @click="deletePhoto()" v-if="currPhotoUrl != ''">
            <v-icon left>delete_forever</v-icon>Dzēst
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
  </v-list-item>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

export default {
  props: ['taskDataInDialog', 'taskId'],
  data() {
    return {
      fileUploading: false,
      progressValue: 0,
      taskDataInQuickPhoto: {},
      placeholderPhotoUrl:
        'prieksh share',
      //photo dialog
      photoDialog: false,
      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  created() {
    var vm = this;

    //prepare variable data
    vm.taskDataInQuickPhoto = Object.assign({}, vm.taskDataInDialog);
  },
  computed: {
    currPhotoUrl: function() {
      return this.taskDataInDialog.photoUrl;
    },
  },
  methods: {
    closeMyTaskQuickPhoto(closeTaskView) {
      var vm = this;
      //close dialog
      vm.photoDialog = false;
      vm.$emit('closeMyTaskQuickPhoto', vm.taskDataInQuickPhoto, closeTaskView);
    },
    addPhoto() {
      try {
        //get references
        var vm = this;
        var db = firebase.firestore();

        //show progress
        vm.fileUploading = true;

        //add placeholder while img is being resized
        vm.taskDataInQuickPhoto.photoUrl = vm.placeholderPhotoUrl;

        //get file
        var fileInput = document.getElementById('photoFile');
        var file = fileInput.files[0];
        var filePath = '/taskArchive/' + vm.taskId + '/photoUrl/' + file.name;

        var storageRef = firebase.storage().ref(filePath);
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
            //hide progress
            vm.fileUploading = false;
            //close dialog, save changes locally
            vm.closeMyTaskQuickPhoto(true);
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
          db.collection('taskArchive')
            .doc(vm.taskId)
            .update({
              photoUrl: '',
            });

          //delete locally
          vm.taskDataInQuickPhoto.photoUrl = '';

          //close dialog
          vm.closeMyTaskQuickPhoto(false);

          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Fotogrāfija izdzēsta!';
          vm.snackbar = true;
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
};
</script>


<style>
.upload-wrap {
  position: relative;
  display: inline;
}

.upload-btn {
  position: absolute;
  left: 0;
  opacity: 0;
}
</style>


