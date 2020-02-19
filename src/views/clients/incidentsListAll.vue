<template>
  <v-container>
    <h1>Incidentu saraksts</h1>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>

    <!-- select how many data -->
    <v-layout row wrap>
      <v-flex xs12 v-if="!progressBar">
        <v-btn-toggle v-model="btnToggle" dark mandatory>
          <v-btn
            small
            color="accent"
            @click="getData(reportLimit)"
          >Pēdējie {{reportLimit}} incidenti</v-btn>
          <v-btn small color="accent" @click="getData('all')">Visi incidenti</v-btn>
          <v-btn small color="accent" @click="getData('unconfirmed')">Neapstiprinātie incidenti</v-btn>
        </v-btn-toggle>
      </v-flex>
    </v-layout>

    <list-data v-if="!progressBar" :collectionName="collection" :collectionData="incidents"></list-data>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import ListData from '@/comp/ListData.vue';
import BackBtn from '@/comp/BackBtn.vue';

export default {
  data() {
    return {
      progressBar: true,
      reportLimit: 10,
      btnToggle: 0,

      collection: this.$route.params.collection,
      incidents: {},
    };
  },
  components: {
    ListData,
    BackBtn,
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get incidents
    var incidentsL = {};
    db.collection(vm.collection)
      .orderBy('createdAt', 'desc')
      .limit(vm.reportLimit)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          incidentsL[doc.id] = doc.data();
        });
        vm.incidents = Object.assign({}, incidentsL);
        vm.progressBar = false;
      });
  },
  methods: {
    getData(queryLimit) {
      var vm = this;
      var db = firebase.firestore();
      vm.progressBar = true;
      var reportRef = db
        .collection(vm.collection)
        .limit(vm.reportLimit);

      //get all reports
      if (queryLimit == 'all') {
        reportRef = db.collection(vm.collection);
      }

      if(queryLimit == 'unconfirmed'){
        reportRef = db.collection(vm.collection).where('incidentStatus', '==', 'unconfirmed');
      }

      reportRef.orderBy('createdAt', 'desc').get().then(function(querySnapshot) {
        var dataL = {};
        querySnapshot.forEach(function(doc) {
          dataL[doc.id] = doc.data();
        });
        vm.incidents = Object.assign({}, dataL);
        vm.progressBar = false;
      });
    },
  },
};
</script>
