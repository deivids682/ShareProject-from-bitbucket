<template>
  <v-layout wrap>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
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
      <template v-slot:item="{item}" v-if="dataLoaded">
        <tr v-if="collectionName == 'incidents'">
          <td
            @click="newIncident(collectionData[item.id].clientId, collectionData[item.id].clientName, item.id, collectionData[item.id].clientServices)"
          >
            {{collectionData[item.id].clientName}} - {{collectionData[item.id].dateFormatted}} {{collectionData[item.id].incident}} Pievienoja: {{users[collectionData[item.id].createdBy] ? users[collectionData[item.id].createdBy].displayName : "NA"}}
            {{collectionData[item.id].clientServices == 'bfh' ? collectionData[item.id].incidentSolved ? "- Atrisināts" : "- Neatrisināts" : ""}}
            {{collectionData[item.id].clientServices == 'bfh' ? collectionData[item.id].incidentStatus == 'confirmed' ? "- Apstiprināts" : "" : ""}}
          </td>
        </tr>
        <tr v-if="collectionName == 'bodyVitals'">
          <td
            @click="newBodyVitals(collectionData[item.id].clientId, collectionData[item.id].clientName, item.id)"
          >
            <span v-if="collectionData[item.id].emergency">
              <v-icon>warning</v-icon>Ārkārtas:
            </span>
            {{collectionData[item.id].clientName}} - {{collectionData[item.id].dateFormatted}} Pievienoja: {{collectionData[item.id].createdBy ? collectionData[item.id].createdBy : "NA"}}
          </td>
        </tr>
        <tr v-if="collectionName == 'clientReports'">
          <td @click="viewClientReport(item.id)">{{ item.id}}</td>
        </tr>
        <tr v-if="collectionName == 'inactiveDays'">
          <td>{{ item.id}}</td>
        </tr>
        <tr v-if="collectionName == 'visits'">
          <td>
            {{ collectionData[item.id].dateFormatted}} - {{users[collectionData[item.id].user].displayName}}
            no {{closeTime(collectionData[item.id].startAt.seconds)}} līdz {{closeTime(collectionData[item.id].endAt.seconds)}} ({{ collectionData[item.id].duration}})
            pie {{ collectionData[item.id].clientName}}
          </td>
          <td class="text-xs-right">
            <v-btn icon @click="deleteVisit(item.id, item.index)">
              <v-icon color="error">delete_forever</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-layout>
</template>


<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  props: {
    collectionName: {
      default: '',
    },
    collectionData: {
      default: '',
    },
    clientID: {
      default: '',
    },
    clientName: {
      default: '',
    },
    clientColor: {
      default: '',
    },
  },
  data() {
    return {
      //pagination
      page: 1,
      pageCount: 0,
      itemsPerPage: 10,

      dataLoaded: false,
      searchValue: null,
      items: [],
      users: {},
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get users and prepare data
    var usersL = {};
    db.collection('users')
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          // doc.data() is never undefined for query doc snapshots
          usersL[doc.id] = doc.data();
        });
        vm.users = Object.assign({}, usersL);
        vm.prepareTableItems(vm.collectionData);
        vm.dataLoaded = true;
      });
  },

  computed: {
    displayValues: function() {
      var vm = this;
      var displayItems = [];

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          for (var t = 0; t < vm.items.length; t++) {
            const id = vm.items[t].id;

            var searchIn =
              vm.collectionName == 'incidents' ||
              vm.collectionName == 'bodyVitals' ||
              vm.collectionName == 'visits'
                ? (searchIn =
                    vm.collectionData[id].clientName +
                    vm.collectionData[id].dateFormatted)
                : (searchIn = id);

            if (
              searchIn.toLowerCase().indexOf(vm.searchValue.toLowerCase()) !==
              -1
            ) {
              displayItems.push(vm.items[t]);
            }
          } //end for
        } else {
          displayItems = vm.items;
        }
      } else {
        displayItems = vm.items;
      }
      return displayItems;
    },
  },
  methods: {
    prepareTableItems(collectionData) {
      var vm = this;
      vm.items = [];
      var keys = [];

      switch (vm.collectionName) {
        case 'incidents':
          keys = Object.keys(vm.collectionData);
          break;

        case 'bodyVitals':
          keys = Object.keys(vm.collectionData);
          break;

        case 'visits':
          keys = Object.keys(vm.collectionData);
          break;

        default:
          keys = vm.collectionData;
          break;
      }

      for (var k = 0; k < keys.length; k++) {
        vm.items.push({ id: keys[k] });
      }
    },
    closeTime(closedTime) {
      const closeedAt = new Date(closedTime * 1000);

      var hours = closeedAt.getHours();
      if (hours < 10) {
        hours = '0' + hours;
      }
      var minutes = closeedAt.getMinutes();
      if (minutes < 10) {
        minutes = '0' + minutes;
      }

      return hours + ':' + minutes;
    },
    deleteVisit(visitId, index) {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst vizīti?');
      if (conf) {
        try {
          vm.progressBar = true;
          var db = firebase.firestore();

          //delete task
          db.collection('visits')
            .doc(visitId)
            .delete()
            .then(function() {
              //delete from table
              delete vm.collectionData[visitId];
              vm.prepareTableItems(vm.collectionData);

              //enable snackbar
              vm.snackbarColor = 'success';
              vm.snackbarTxt = 'Vizīte veiksmīgi izdzēsta!';
              vm.snackbar = true;

              vm.progressBar = false;
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
    newIncident(clientId, clientName, incId, clientServices) {
      this.$router.push({
        name: 'incident',
        params: {
          id: clientId,
          clientName: clientName,
          incId: incId,
          clientServices: clientServices,
        },
      });
    },
    newBodyVitals(clientId, clientName, vitalsId) {
      // view vitals programmatically
      this.$router.push({
        name: 'vitals',
        params: { id: clientId, clientName: clientName, vitalsId: vitalsId },
      });
    },
    viewClientReport(repId) {
      this.$router.push({
        name: 'clientdailyreport',
        params: {
          id: this.clientID,
          repid: repId,
          clientName: this.clientName,
          clientColor: this.clientColor,
        },
      });
    },
  },
};
</script>