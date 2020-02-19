<template>
  <v-container>
    <v-flex xs12>
      <h1>Incidents</h1>
      <h2>{{clientName}}</h2>
      <v-divider></v-divider>
      <br />
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
      <v-flex xs12 md6 lg4>
        <!-- select incident -->
        <v-select v-model="incident" :items="incidents" label="Incidents*" prepend-icon="error"></v-select>
      </v-flex>
      <v-flex xs12 md6 lg4>
        <!-- comment box -->
        <v-text-field v-model="comment" label="Komentārs*" prepend-icon="comment"></v-text-field>
      </v-flex>

      <!-- foto -->
      <v-flex xs12 md6 lg4>
        <div class="photo-div" v-if="photoUrl == null ">
          <label>
            <v-icon>insert_photo</v-icon>Pievienot foto:
          </label>
          <input type="file" value="upload" :id="'photoFile'" />
        </div>
        <div v-if="photoUrl != null " class="photo-div">
          <v-img :src="photoUrl" lazy-src="https://via.placeholder.com/150" contain></v-img>
          <v-btn id="deleteImageBtn" text small color="red lighten-2" @click="deletePhoto()">
            <v-icon dark left>clear</v-icon>Dzēst
          </v-btn>
        </div>
        <br />
      </v-flex>

      <!-- check box -->
      <v-flex xs12 md6 lg3 class="ml-5 text-center" v-if="clientServices == 'bfh'">
        <v-checkbox v-model="resolved" :label="`Atrisināts: ${resolved ? 'Jā' : 'Nē'}`"></v-checkbox>
      </v-flex>

      <!-- manager comment field -->
      <v-flex
        xs12
        md6
        lg4
        class="ml-5"
        v-if="incId != 'new' && clientServices == 'bfh' && (admin || manager)"
      >
        <v-textarea
          label="Kvartāla vadītāja komentārs"
          v-model="managerComment"
          :row-height="rowHeight"
          :rows="rows"
        ></v-textarea>
      </v-flex>

      <v-flex
        xs12
        md6
        lg4
        class="ml-5"
        v-if="incId != 'new' && clientServices == 'bfh' && (admin || manager)"
      >
        <v-select
          :items="states"
          item-text="name"
          v-model="state"
          label="Apstiprinājuma statuss"
          return-object
        ></v-select>
      </v-flex>
      <!-- save -->
      <v-flex xs12>
        <v-btn small color="primary" @click="addIncident()">
          <v-icon>save</v-icon>saglabāt
        </v-btn>
        <template v-if="admin || manager">
          <v-btn small @click="deleteIncident()" v-if="incId != 'new'">
            <v-icon>delete_forever</v-icon>dzēst
          </v-btn>
        </template>
      </v-flex>
      <!-- last user -->
      <v-row v-if="incidentData.user">
        <v-col>
          <small>
            Pēdējais atjaunoja: {{incidentData.user}}
            <span
              v-if="incidentData.updatedAt"
            >{{formatDate(new Date(incidentData.updatedAt.seconds*1000).toISOString().substr(0, 10))}}</span>
            <span
              v-else
            >{{formatDate(new Date(incidentData.createdAt.seconds*1000).toISOString().substr(0, 10))}}</span>
          </small>
        </v-col>
      </v-row>
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
      incidentData: {},
      resolved: false,
      progressBar: true,
      clientServices: this.$route.params.clientServices,
      clientName: this.$route.params.clientName,
      clientId: this.$route.params.id,
      incId: this.$route.params.incId,
      today: new Date().toISOString().substr(0, 10),
      date: new Date().toISOString().substr(0, 10),
      dateFormatted: this.formatDate(new Date().toISOString().substr(0, 10)),
      datePickerDialog: false,
      comment: null,
      incident: null,
      managerComment: '',
      photoUrl: null,
      client: null,
      state: 'unconfirmed',
      rowHeight: 24,
      rows: 1,
      states: [],
      incidents: [],

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
    if (vm.incId != 'new') {
      //load incident data
      db.collection('incidents')
        .doc(vm.incId)
        .get()
        .then(function(doc) {
          const data = doc.data();
          vm.incident = data.incident;
          vm.comment = data.comment;
          vm.managerComment = data.managerComment;
          vm.state = data.incidentStatus;
          vm.resolved = data.incidentSolved;
          vm.photoUrl = data.photoUrl || null;
          vm.date = new Date(data.date.seconds * 1000)
            .toISOString()
            .substr(0, 10);
          vm.incidentData = Object.assign({}, data);
        });
      //data loaded
      vm.progressBar = false;
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
    deletePhoto() {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst?');
      if (conf) {
        try {
          var db = firebase.firestore();

          //delete task
          db.collection('incidents')
            .doc(vm.incId)
            .update({
              photoUrl: '',
            })
            .then(function() {
              // view client profile programmatically
              vm.photoUrl = null;
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
    saveFile() {
      try {
        //get references
        var vm = this;
        var db = firebase.firestore();

        //calculate ids
        var inputId = 'photoFile';
        //get file
        var fileButton = document.getElementById(inputId);
        if (fileButton != null) {
          var file = fileButton.files[0];
          if (typeof file != 'undefined') {
            var filePath = '/incidents/' + vm.incId + '/photoUrl/' + file.name;

            var storageRef = firebase.storage().ref(filePath);

            //upload file
            var uploadTask = storageRef.put(file);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }, //end save file
    deleteIncident() {
      var vm = this;
      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst?');
      if (conf) {
        try {
          var db = firebase.firestore();

          //delete task
          db.collection('incidents')
            .doc(vm.incId)
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
    addIncident() {
      var vm = this;
      var db = firebase.firestore();
      //verify if all required fields are filled
      if (vm.incident != null && vm.comment != null) {
        var incObj = {
          clientName: vm.clientName,
          clientId: vm.clientId,
          date: new Date(vm.date),
          dateFormatted: vm.dateFormatted,
          incidentSolved: vm.resolved,
          incidentStatus: vm.state.value || 'unconfirmed',
          managerComment: vm.managerComment,
          clientServices: vm.clientServices,
          incident: vm.incident,
          comment: vm.comment,
          photoUrl: vm.photoUrl,
        };

        //if new incident or update old incident
        if (vm.incId == 'new') {
          //add new incident
          incObj['createdAt'] = new Date();
          incObj['createdBy'] = vm.currentUserData.userId;
          incObj['user'] = vm.currentUserData.displayName;

          //add to db
          db.collection('incidents')
            .add(incObj)
            .then(function(docRef) {
              vm.incId = docRef.id;
              //save file
              vm.saveFile();
            })
            .catch(function(error) {
              console.error('Error adding document: ', error);
            });
        } else {
          //update incident
          incObj['updatedAt'] = new Date();
          incObj['updatedBy'] = vm.currentUserData.userId;
          incObj['user'] = vm.currentUserData.displayName;

          //add to db
          db.collection('incidents')
            .doc(vm.incId)
            .update(incObj)
            .then(function() {
              vm.saveFile();
            });
        }

        //save incident
        vm.snackbarColor = 'success';
        vm.snackbarTxt = 'Informācija saglabāta!';
        vm.snackbar = true;
      } else {
        //error that fields are not filled
        //enable snackbar
        vm.snackbarColor = 'error';
        vm.snackbarTxt = 'Jāaizpilda visi obligātie lauki!';
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

<style>
.photo-div {
  border: 1px solid lightgray;
  padding: 10px;
}
</style>
