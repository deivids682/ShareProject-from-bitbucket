<template>
  <v-container>
    <!-- title -->
    <v-flex xs12>
      <h1>Veselības dati</h1>
      <h2>{{clientName}}</h2>
      <v-divider></v-divider>
      <br />
      <v-btn-toggle v-model="btnToggle" dark mandatory v-if="vitalsId == 'new'">
        <v-btn small color="accent" @click="emergency = false">Ikdienas</v-btn>
        <v-btn small color="accent" @click="emergency = true">Ārkārtas</v-btn>
      </v-btn-toggle>
    </v-flex>
    <!--Progress bar -->
    <v-layout row wrap>
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
    <!-- snackbar -->
    <v-flex xs12>
      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
        {{ snackbarTxt }}
        <v-btn dark text @click="snackbar = false">
          <v-icon>close</v-icon>
        </v-btn>
      </v-snackbar>
    </v-flex>
    <!-- data input -->
    <v-layout row wrap v-if="!progressBar">
      <v-flex xs12 md6 lg4>
        <!-- date -->
        <v-dialog
          v-model="datePickerDialog"
          :close-on-content-click="false"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="dateFormatted"
              label="Datums*"
              prepend-icon="event"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="date"
            @input="datePickerDialog = false"
            :max="today"
            first-day-of-week="1"
          ></v-date-picker>
        </v-dialog>
      </v-flex>

      <!-- vitals -->
      <template v-if="!emergency">
        <v-flex xs12 md6 lg4 v-for="(vit, vitId) in vitals" :key="vitId">
          <v-text-field
            type="number"
            step="0.01"
            v-model="vitals[vitId]"
            :label="vitId"
            prepend-icon="local_hospital"
          ></v-text-field>
        </v-flex>
        <!-- comment box -->
        <v-flex xs12 md6 lg4>
          <v-text-field v-model="comment" label="Komentārs" prepend-icon="comment"></v-text-field>
        </v-flex>
      </template>
      <v-flex xs12 md12 lg12 v-if="emergency">
        <v-text-field v-model="comment" label="Komentārs" prepend-icon="comment"></v-text-field>
      </v-flex>

      <!-- save -->
      <v-flex xs12>
        <v-btn small color="primary" @click="saveVitals()">
          <v-icon>save</v-icon>saglabāt
        </v-btn>
        <template v-if="admin || manager">
          <v-btn small @click="deleteVital()" v-if="vitalsId != 'new'">
            <v-icon>delete_forever</v-icon>dzēst
          </v-btn>
        </template>
      </v-flex>

      <!-- last user -->
      <template v-if="allVitalsSavedData.createdBy && vitalsId != 'new'">
        <v-row>
          <v-col>
            <small>
              Pēdējais atjaunoja: {{allVitalsSavedData.createdBy}}
              <span
                v-if="allVitalsSavedData.updatedAt != undefined && allVitalsSavedData.updatedAt"
              >{{formatDate(new Date(allVitalsSavedData.updatedAt.seconds*1000).toISOString().substr(0, 10))}}</span>
              <span
                v-else-if="allVitalsSavedData.createdAt != undefined && allVitalsSavedData.createdAt"
              >{{formatDate(new Date(allVitalsSavedData.createdAt.seconds*1000).toISOString().substr(0, 10))}}</span>
            </small>
          </v-col>
        </v-row>
      </template>
    </v-layout>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

import BackBtn from '@/comp/BackBtn.vue';

export default {
  data() {
    return {
      progressBar: true,
      clientName: this.$route.params.clientName,
      clientId: this.$route.params.id,
      vitalsId: this.$route.params.vitalsId,
      emergency: false,
      today: new Date().toISOString().substr(0, 10),
      date: new Date().toISOString().substr(0, 10),
      dateFormatted: this.formatDate(new Date().toISOString().substr(0, 10)),
      datePickerDialog: false,
      comment: null,
      btnToggle: 0,
      allVitalsSavedData: {},
      vitals: {
      
      },

      //snackbar
      snackbar: false,
      snackbarTimeout: 2000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  components: {
    BackBtn,
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    if (vm.vitalsId != 'new') {
      //load incident data
      db.collection('bodyVitals')
        .doc(vm.vitalsId)
        .get()
        .then(function(doc) {
          const data = doc.data();
          vm.comment = data.comment;
          vm.emergency = data.emergency;
          vm.allVitalsSavedData = data;
          vm.date = new Date(data.date.seconds * 1000)
            .toISOString()
            .substr(0, 10);

          //add saved data to vitals
          vm.vitals = Object.assign({}, data.vitals);

          //data loaded
          vm.progressBar = false;
        });
    } else {
      vm.progressBar = false;
    }
  },
  watch: {
    date(val) {
      this.dateFormatted = this.formatDate(this.date);
    },
  },
  methods: {
    deleteVital() {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst?');
      if (conf) {
        try {
          var db = firebase.firestore();

          //delete task
          db.collection('bodyVitals')
            .doc(vm.vitalsId)
            .delete()
            .then(function() {
              // view client profile programmatically
              vm.$router.push({
                name: 'clientprofile',
                params: { id: vm.clientId, clientName: vm.clientName },
              });
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
    saveVitals() {
      var vm = this;
      var db = firebase.firestore();

      //verify if all required fields are filled

      var dataObj = {
        clientName: vm.clientName,
        clientId: vm.clientId,
        date: new Date(vm.date),
        dateFormatted: vm.dateFormatted,
        vitals: this.emergency ? null : vm.vitals,
        comment: vm.comment,
        emergency: this.emergency,
      };

      //if new incident or update old incident
      if (vm.vitalsId == 'new') {
        //add new incident
        dataObj['createdAt'] = new Date();
        dataObj['createdBy'] = vm.currentUserData.displayName;

        //add to db
        db.collection('bodyVitals')
          .add(dataObj)
          .then(function(docRef) {
            vm.vitalsId = docRef.id;
          })
          .catch(function(error) {
            console.error('Error adding document: ', error);
          });

        //save incident
        vm.snackbarColor = 'success';
        vm.snackbarTxt = 'Informācija saglabāta!';
        vm.snackbar = true;
      } else {
        //update incident
        dataObj['updatedAt'] = new Date();
        dataObj['updatedBy'] = vm.currentUserData.displayName;

        //add to db
        db.collection('bodyVitals')
          .doc(vm.vitalsId)
          .update(dataObj);

        //save incident
        vm.snackbarColor = 'success';
        vm.snackbarTxt = 'Informācija saglabāta!';
        vm.snackbar = true;
      }
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
  },
};
</script>
