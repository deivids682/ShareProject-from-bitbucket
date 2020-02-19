<template>
  <v-list-item>
    <!-- img -->
    <v-list-item-avatar v-if="currPhotoUrl != ''">
      <img :src="currPhotoUrl" />
    </v-list-item-avatar>
    <!-- quick photo -->
    <v-list-item-content>
      <div class="upload-wrap">
        <v-progress-circular
          :value="progressValue"
          v-if="fileUploading"
          color="success"
        >{{ progressValue }}</v-progress-circular>
        <span v-if="!fileUploading">
          <v-icon small color="black">add_a_photo</v-icon>
          <input
            type="file"
            :id="'quickPhoto'+taskId+beforeOrAfter"
            accept="image/*"
            capture
            class="upload-btn"
            @input="addPhoto('quickPhoto')"
          />
        </span>
        Foto {{photoText}}
      </div>
    </v-list-item-content>
    <!-- select photo -->
    <v-list-item-action @click.stop="photoDialog = true">
      <!-- add photo -->
      <v-btn icon v-if="currPhotoUrl == ''">
        <v-icon>add_photo_alternate</v-icon>
      </v-btn>

      <!-- view photo -->
      <v-btn icon v-if="currPhotoUrl != ''">
        <v-icon>remove_red_eye</v-icon>
      </v-btn>
    </v-list-item-action>

    <!-- photo dialog -->
    <v-dialog v-model="photoDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Foto {{fotoText}}</v-card-title>

        <v-card-text>
          <h3>{{taskTitle}}</h3>
          <!-- add photo -->
          <div v-if="currPhotoUrl == ''">
            <p>Pievienot foto:</p>
            <input type="file" value="upload" :id="'selectPhoto'+taskId+beforeOrAfter" />
          </div>
          <!-- view photo -->
          <div v-else>
            <v-img :src="currPhotoUrl"></v-img>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="grey" text small outlined @click="photoDialog = false">
            <v-icon left>close</v-icon>Atcelt
          </v-btn>
          <!-- save photo -->
          <v-btn
            color="info"
            text
            small
            outlined
            @click="addPhoto('selectPhoto')"
            v-if="currPhotoUrl == ''"
          >
            <v-icon left>save_alt</v-icon>Pievienot
          </v-btn>
          <!-- delete photo -->
          <v-btn color="error" text small outlined @click="deletePhoto()" v-else>
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
  props: [
    'cleaningId',
    'taskId',
    'beforeOrAfter',
    'currentUser',
    'currPhotoUrl',
    'taskTitle',
  ],
  data() {
    return {
      fileUploading: false,
      progressValue: 0,
      fotoText: null,
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

    if (vm.beforeOrAfter == 'photoBefore') {
      vm.photoText = 'pirms';
    } else {
      //photoAfter
      vm.photoText = 'pēc';
    }
  },
  methods: {
    addPhoto(quickOrSelect) {
      try {
        //get references
        var vm = this;
        var db = firebase.firestore();

        //show progress
        vm.fileUploading = true;

        //close dialog
        vm.photoDialog = false;

        //get file
        var fileInput = document.getElementById(
          quickOrSelect + vm.taskId + vm.beforeOrAfter
        );
        var file = fileInput.files[0];
        var filePath =
          '/cleanings/' +
          vm.cleaningId +
          '/tasks.' +
          vm.taskId +
          '.' +
          vm.beforeOrAfter +
          '/' +
          file.name;

        var storageRef = firebase.storage().ref(filePath);

        //upload file
        var uploadTask = storageRef.put(file);

        //save update info
        vm.updatedBy();

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

            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Fotogrāfija pievienota!';
            vm.snackbar = true;

            //add placeholder while img is being resized
            db.collection('cleanings')
              .doc(vm.cleaningId)
              .update({
                ['tasks.' +
                vm.taskId +
                '.' +
                vm.beforeOrAfter]: 'prieksh share',
              });
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
          db.collection('cleanings')
            .doc(vm.cleaningId)
            .update({
              ['tasks.' + vm.taskId + '.' + vm.beforeOrAfter]: '',
            });

          //save update info
          vm.updatedBy();

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
    updatedBy() {
      var vm = this;
      var db = firebase.firestore();

      //save update info
      db.collection('cleanings')
        .doc(vm.cleaningId)
        .update({
          updatedAt: new Date(),
          updatedById: vm.currentUser.userId,
          updatedByName: vm.currentUser.displayName,
        });
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


