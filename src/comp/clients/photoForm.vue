<template>
  <v-row>
    <v-col cols="12" v-if="progressBar">
      <v-progress-linear :indeterminate="true"></v-progress-linear>
    </v-col>
    <v-list-item v-if="!progressBar">
      <!-- photo -->
      <v-list-item-avatar size="76">
        <v-img :src="photoSrc()"></v-img>
      </v-list-item-avatar>
      <v-list-item-content>Nomainīt attēlu</v-list-item-content>
      <v-list-item-action v-if="admin || manager">
        <v-btn outlined color="accent" @click.stop="photoDialog = true" fab small>
          <v-icon>edit</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>

    <!-- photo dialog -->
    <v-dialog v-model="photoDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Foto</v-card-title>

        <v-card-text>
          <!-- add photo -->
          <div v-if="!photoInForm || photoInForm == ''">
            <p>Pievienot foto:</p>
            <input type="file" value="upload" id="photoUpload" />
          </div>
          <!-- view photo -->
          <div v-else>
            <v-img :src="photoInForm"></v-img>
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
            @click="addPhoto()"
            v-if="!photoInForm ||photoInForm == ''"
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
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

export default {
  props: ['photoUrl', 'filePath', 'docId', 'collection', 'urlPath'],
  data() {
    return {
      //setup
      photoDialog: false,
      progressBar: false,
      photoInForm: '',
    };
  },
  created() {
    this.photoInForm = this.photoUrl;
  },
  methods: {
    photoSrc() {
      var vm = this;
      if (!vm.photoInForm || vm.photoInForm == '') {
        //   default photo
        return 'prieksh share';
      } else {
        return vm.photoInForm;
      }
    },
    addPhoto() {
      try {
        //get references
        var vm = this;

        //show progress
        vm.photoDialog = false;
        vm.progressBar = true;

        //get file
        var fileInput = document.getElementById('photoUpload');
        var file = fileInput.files[0];
        var filePath = vm.filePath + file.name;

        var storageRef = firebase.storage().ref(filePath);

        //upload file
        var uploadTask = storageRef.put(file);

        //get url
        uploadTask.then(snapshot => {
          snapshot.ref.getDownloadURL().then(downloadURL => {
            vm.photoInForm = downloadURL;
            vm.$emit('updatePhoto', vm.photoInForm);
            //hide progress
            vm.progressBar = false;
          });
        });
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
          db.collection(vm.collection)
            .doc(vm.docId)
            .update({
              [vm.urlPath]: '',
            });

          //update locally
          vm.photoInForm = '';
          vm.$emit('updatePhoto', vm.photoInForm);
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
  },
};
</script>