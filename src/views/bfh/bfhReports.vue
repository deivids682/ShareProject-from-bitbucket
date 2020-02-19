<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Atskaites</h1>
      </v-col>
      <!--Progress bar -->
      <v-col cols="12" v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-col>
      <v-col cols="12">
        <!-- snackbar -->
        <v-snackbar
          v-model="snackbar"
          :color="snackbarColor"
          :timeout="snackbarTimeout"
        >
          {{ snackbarTxt }}
          <v-btn dark text @click="snackbar = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-snackbar>
      </v-col>
    </v-row>

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
        <v-tab href="#rdReport">RD atskaite</v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item value="rdReport">
          <v-card>
            <bfh-rd-reports></bfh-rd-reports>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </template>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import bfhRdReports from '@/comp/bfh/bfhRdReports.vue';
export default {
  components: {
    bfhRdReports,
  },
  data() {
    return {
      progressBar: true,
      tab: null,
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  created() {
    var vm = this;
    vm.progressBar = false;
  },
};
</script>
