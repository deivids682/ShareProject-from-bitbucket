<template>
  <v-layout wrap>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <!-- list cleanings -->
    <template>
      <!-- search -->
      <v-flex xs12 lg4>
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-flex>

      <v-data-table
        :items="displayValues"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        @page-count="pageCount = $event"
        footer-props.items-per-page-text="Dati"
        hide-default-header
        class="elevation-1"
        style="width:100%"
      >
        <template v-slot:item="{item}">
          <tr>
            <td>{{ cleanings[item.id].dateFormatted}} {{ cleanings[item.id].responsibleName}} pie {{ cleanings[item.id].clientName}}</td>
            <td class="text-right">
              <v-btn icon @click="viewCleaning(item.id)">
                <v-icon color="success">remove_red_eye</v-icon>
              </v-btn>
              <v-btn icon @click="printCleaning(item.id)">
                <v-icon color="info">print</v-icon>
              </v-btn>
              <v-btn icon @click="deleteCleaning(item.id, item.index)">
                <v-icon color="error">delete_forever</v-icon>
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>
    </template>

    <!-- prepare pdf report dialog -->
    <v-dialog v-model="progressDialog" hide-overlay persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          Gatavo atskaiti...
          <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { cleaningPDF } from '@/helpers/cleaningPDF';

export default {
  props: ['cleanings', 'items'],
  data() {
    return {
      //table
      searchValue: null,
      //pagination
      page: 1,
      pageCount: 0,
      itemsPerPage: 10,
      preparedItems: [],

      progressDialog: false,

      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  created() {
    var vm = this;
    vm.prepareItems();
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayItems = [];

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          for (var t = 0; t < vm.items.length; t++) {
            const id = vm.items[t];

            var searchIn =
              vm.cleanings[id].clientName + vm.cleanings[id].dateFormatted;

            if (
              searchIn.toLowerCase().indexOf(vm.searchValue.toLowerCase()) !==
              -1
            ) {
              displayItems.push(vm.preparedItems[t]);
            }
          } //end for
        } else {
          displayItems = vm.preparedItems;
        }
      } else {
        displayItems = vm.preparedItems;
      }

      return displayItems;
    },
  },
  methods: {
    prepareItems() {
      var vm = this;
      vm.preparedItems = [];
      for (var i = 0; i < vm.items.length; i++) {
        vm.preparedItems.push({ id: vm.items[i] });
      }
    },
    viewCleaning(cleaningId) {
      var vm = this;
      // view cleaning programmatically
      this.$router.push({
        name: 'cleaningsViewOne',
        params: {
          cleaningId: cleaningId,
          clientId: vm.cleanings[cleaningId].clientId,
        },
      });
    },
    async printCleaning(cleaningId) {
      var vm = this;
      vm.progressDialog = true;
      await cleaningPDF(vm.cleanings[cleaningId]);
      vm.progressDialog = false;
    },
    deleteCleaning(cleaningId, index) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst tīrīšanu?');
      if (conf) {
        try {
          //vm.progressBar = true;
          var db = firebase.firestore();

          //delete task
          db.collection('cleanings')
            .doc(cleaningId)
            .delete()
            .then(function() {
              //delete from table
              delete vm.cleanings[cleaningId];
              vm.items.splice(index, 1);
              vm.prepareItems();

              //enable snackbar
              vm.snackbarColor = 'success';
              vm.snackbarTxt = 'Tīrīšana veiksmīgi izdzēsta!';
              vm.snackbar = true;

              //vm.progressBar = false;
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
};
</script>


