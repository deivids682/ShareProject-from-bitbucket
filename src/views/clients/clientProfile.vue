<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 v-if="clientData != null">
          <v-icon color="error" v-if="clientData.hasRecentHealthProblems">warning</v-icon>
          Klients
          <span v-if="!progressBar">{{clientData.clientName}}</span>
        </h1>
      </v-col>
      <template v-if="!progressBar">
        <v-col cols="12" v-if="clientData.clientStatus != 'active'">
          <span v-if="clientData.clientStatus == 'paused'">
            <v-icon color="error">pause_circle_outline</v-icon>klienta statuss - apturēts
          </span>
          <span v-if="clientData.clientStatus == 'stopped'">
            <v-icon color="error">stop</v-icon>klienta statuss - izslēgts
          </span>
        </v-col>
      </template>
    </v-row>
    <!--Progress bar -->
    <v-row>
      <v-col v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-col>
    </v-row>
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <!-- navigation tabs -->
    <template>
      <v-tabs
        grow
        show-arrows
        background-color="secondary"
        active-class="active-tab"
        slider-color="primary"
        v-model="tab"
        @change="storeStab()"
      >
        <v-tab href="#generalInfo">Pamata dati</v-tab>
        <template v-if="!progressBar">
          <v-tab href="#otherInfo">Pārējie dati</v-tab>
          <template v-if="admin||manager">
            <v-tab v-if="clientData.clientServices == 'bfh'" href="#bfhLifePlan">Dzīves plāns</v-tab>
            <v-tab v-if="clientData.clientServices == 'bfh'" href="#bfhProfiling">Profilēšana</v-tab>
            <v-tab v-if="clientData.clientServices == 'neighborhood'" href="#nbh">Mājas aprūpe</v-tab>
          </template>
          <v-tab
            v-if="clientData.clientServices == 'neighborhood' || clientData.clientServices == 'bfh'"
            href="#healthData"
          >Veselība / incidenti</v-tab>
          <v-tab v-if="clientData.clientServices == 'cleaning'" href="#cleaning">Tīrīšana</v-tab>
        </template>
      </v-tabs>
    </template>

    <v-tabs-items v-model="tab">
      <v-tab-item value="generalInfo">
        <v-card v-if="!progressBar">
          <!-- client form -->
          <client-form
            :clientId="clientId"
            :loadedClientData="clientData"
            @updateClientData="updateClientData"
          ></client-form>
        </v-card>
      </v-tab-item>
      <v-tab-item value="otherInfo">
        <!-- additional information -->
        <bfh-additional-info
          v-if="!progressBar"
          :clientId="clientId"
          :loadedClientData="clientData"
          @updateClientData="updateClientData"
        ></bfh-additional-info>
      </v-tab-item>
      <v-tab-item value="bfhProfiling">
        <!-- BFH Profiling -->
        <bfh-profiles
          v-if="!progressBar"
          :clientId="clientId"
          :loadedClientData="clientData"
          @updateClientData="updateClientData"
        ></bfh-profiles>
      </v-tab-item>
      <v-tab-item value="bfhLifePlan">
        <v-btn
          class="margin-v-btn"
          color="primary"
          :to="{ name: 'bfhclienttasks', params: { clid: clientId}}"
        >
          <v-icon>done</v-icon>Dzīves plāna uzdevumi
        </v-btn>

        <v-btn
          color="primary"
          class="margin-v-btn"
          :to="{ name: 'bfhclientlifeplan', params: { clid: clientId}}"
          v-if="admin || manager"
        >
          <v-icon>list_alt</v-icon>Dzīves plāns
        </v-btn>

        <v-btn
          color="primary"
          v-if="admin || manager"
          class="margin-v-btn"
          @click.stop="copyLpDialog=true"
        >
          <v-icon>file_copy</v-icon>Pārkopēt dzīves plānu
        </v-btn>
      </v-tab-item>
      <v-tab-item value="nbh">
        <v-card v-if="!progressBar">
          <!-- old nbh view -->
          <old-nbh-view
            :clientId="clientId"
            :loadedClientData="clientData"
            @updateClientData="updateClientData"
          ></old-nbh-view>
        </v-card>
      </v-tab-item>
      <v-tab-item value="healthData">
        <health-view
          :clientId="clientId"
          :loadedClientData="clientData"
          @updateClientData="updateClientData"
        ></health-view>
      </v-tab-item>
      <v-tab-item value="cleaning">
        <old-cleanings-view
          :clientId="clientId"
          :loadedClientData="clientData"
          @updateClientData="updateClientData"
        ></old-cleanings-view>
      </v-tab-item>
    </v-tabs-items>

    <!-- last update -->
    <v-row v-if="!progressBar">
      <v-col>
        <br />
        <v-divider></v-divider>
        <small style="font-style: italic">
          <span>Pēdējo reizi atjaunoja {{clientData.lastUser}} {{formatDate(clientData.lastUpdate.seconds)}}</span>
        </small>
      </v-col>
    </v-row>
    <!-- copy life plan -->
    <copy-life-plan
      v-if="copyLpDialog"
      :copyLifePlanDialog="copyLpDialog"
      :service="clientData.clientServices"
      :clientId="clientId"
      @closeLifePlanDialog="copyLpDialog=false"
    ></copy-life-plan>
  </v-container>
</template>
  
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

//views
import ClientForm from '@/comp/clients/clientForm.vue';
import BfhAdditionalInfo from '@/comp/clients/clientBfhInfo.vue';
import BfhProfiles from '@/comp/clients/clientBfhProfiling.vue';
import OldNbhView from '@/comp/clients/oldNbhView.vue';
import HealthView from '@/comp/clients/healthView.vue';
import OldCleaningsView from '@/comp/clients/oldCleaningsView.vue';

//copy life plan
import CopyLifePlan from '@/comp/clients/copyLifePlan.vue';

export default {
  components: {
    ClientForm,
    BfhAdditionalInfo,
    BfhProfiles,
    OldNbhView,
    HealthView,
    OldCleaningsView,
    CopyLifePlan,
  },
  data() {
    return {
      clientId: this.$route.params.clientId,
      clientData: null,
      progressBar: true,
      tab: null,
      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
      tabsByService: {
        defaultTab: 'generalInfo',
        bfh: ['otherInfo', 'bfhLifePlan', 'healthData'],
        neighborhood: ['bfh', 'healthData'],
        cleaning: ['cleaning'],
      },
      //copy life plan dialog
      copyLpDialog: false,
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get last tab
    if (localStorage.getItem('clientProfileTab')) {
      try {
        vm.tab = localStorage.getItem('clientProfileTab');
      } catch (e) {
        console.log(e);
      }
    }

    //load client data
    db.collection('clients')
      .doc(vm.clientId)
      .onSnapshot(function(doc) {
        vm.clientData = Object.assign({}, doc.data());
        //default tab?
        if (
          vm.tabsByService[vm.clientData.clientServices].indexOf(vm.tab) == -1
        ) {
          vm.tab = vm.tabsByService.defaultTab;
          vm.storeStab();
        }
        //data loaded
        vm.progressBar = false;
      });
  },

  methods: {
    storeStab() {
      localStorage.setItem('clientProfileTab', this.tab);
    },
    updateClientData(updatedClientData) {
      this.clientData = Object.assign({}, updatedClientData);
    },
    formatDate(sec) {
      var date = new Date(sec * 1000);
      if (!sec) {
        date = this.clientData.lastUpdate;
      }
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      if (month < 10) {
        month = '0' + month;
      }
      var day = date.getDate();
      if (day < 10) {
        day = '0' + day;
      }
      var hour = date.getHours();
      var min = date.getMinutes();

      if (min < 10) {
        min = '0' + min;
      }

      return day + '.' + month + '.' + year + ' ' + hour + ':' + min;
    },
  },
};
</script>

<style scoped>
.active-tab {
  color: black !important;
}
.margin-v-btn {
  margin: 0.7rem;
}
</style>