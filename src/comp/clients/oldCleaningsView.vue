<template>
  <v-row align="center" justify="center">
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <v-col cols="12">
      <v-card-actions>
        <v-btn color="primary" :to="{ name: 'cleaningtasksclient', params: { clid: clientId}}">
          <v-icon>done</v-icon>Tīrīšanas uzdevumi
        </v-btn>
      </v-card-actions>
      <v-card-text>
        <!--Progress bar -->
        <v-row>
          <v-col cols="12" v-if="progressBar">
            <v-progress-linear :indeterminate="true"></v-progress-linear>
          </v-col>
        </v-row>

        <!-- CLEANINGS -->
        <v-row v-if="!progressBar">
          <v-col cols="12">
            <list-cleanings :cleanings="cleanings" :items="cleaningsItems"></list-cleanings>
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
  </v-row>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//list table
import ListCleanings from '@/comp/ListAllCleanings.vue';

export default {
  props: ['clientId', 'loadedClientData'],
  components: {
    ListCleanings,
  },
  data() {
    return {
      //setup
      progressBar: true,
      clientData: {},
      cleanings: {},
      cleaningsItems: [],
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

    var cleaningsSnap = await db
      .collection('cleanings')
      .orderBy('scheduledDate', 'desc')
      .where('clientId', '==', vm.clientId)
      .get();

    //cleanings
    var cleaningsL = {};
    cleaningsSnap.forEach(function(doc) {
      cleaningsL[doc.id] = doc.data();
    });
    vm.cleanings = Object.assign({}, cleaningsL);
    vm.cleaningsItems = Object.keys(vm.cleanings);

    vm.progressBar = false;
  },
};
</script>