<template>
  <v-dialog v-model="dialog" width="500" class="text-xs-center" persistent>
    <!--dialog btn -->
    <template v-slot:activator="{ on }">
      <v-btn
        dark
        color="primary"
        v-on="on"
        @click.stop="resetForNewEntry()"
      >Pievienot jaunu uzdevumu</v-btn>
    </template>

    <!--dialog form -->
    <v-card>
      <v-card-title class="headline grey lighten-2" primary-title>Uzdevums</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid" lazy-validation id="form">
          <v-text-field
            v-model="taskData.taskName"
            label="Uzdevuma nosaukums"
            :rules="[() => !!taskData.taskName || 'Nepieciešams norādīt']"
          ></v-text-field>

          <v-radio-group
            v-model="taskData.taskType"
            column
            label="Rezidenta vai mājas uzdevums:"
            :rules="[() => !!taskData.taskType || 'Nepieciešams norādīt']"
          >
            <v-radio label="Rezidenta" value="Rezidenta"></v-radio>
            <v-radio label="Mājas" value="Mājas"></v-radio>
          </v-radio-group>
          <v-radio-group
            v-model="taskData.taskDirect"
            column
            label="Tieši saistīts are rezidentu vai netieši:"
            :rules="[() => !!taskData.taskDirect || 'Nepieciešams norādīt']"
          >
            <v-radio label="Tieši" value="Tiešs"></v-radio>
            <v-radio label="Netieši" value="Netiešs"></v-radio>
          </v-radio-group>
          <v-select
            :items="taskOperationsGroupItems[service]"
            v-model="taskData.taskOperationsGroup"
            label="Uzdevuma grupa"
            :rules="[() => !!taskData.taskOperationsGroup || 'Nepieciešams norādīt']"
            v-on:change="filterTaskGroup()"
          ></v-select>
          <v-select
            :items="filteredTaskGroupItems"
            v-model="taskData.taskGroup"
            v-if="taskData.taskOperationsGroup != null"
            label="Uzdevuma apakšgrupa"
            :rules="[() => !!taskData.taskGroup || 'Nepieciešams norādīt']"
          ></v-select>
          <v-select
            v-if="taskData.taskType == 'Rezidenta'"
            :items="taskCodingGroupItems"
            v-model="taskData.taskCodingGroup"
            label="Uzdevuma profilēšanas grupa"
            :rules="[() => !!taskData.taskCodingGroup || 'Nepieciešams norādīt']"
          ></v-select>
          <!-- equipment -->
          <v-divider></v-divider>
          <v-select
            v-model="taskData.taskEquipment"
            :items="equipmentAll"
            item-text="itemName"
            item-value="itemId"
            label="Aprīkojums"
            single-line
          ></v-select>

          <v-divider></v-divider>
          <v-switch
            :label="`Ikdienas uzdevums (uzdevumus nepārceļ)`"
            v-model="taskData.taskEveryday"
          ></v-switch>
          <v-switch :label="`Sociālais uzdevums`" v-model="taskData.taskSocial"></v-switch>
          <v-switch :label="`Kognitīvais uzdevums`" v-model="taskData.taskCognitive"></v-switch>
          <v-divider></v-divider>
          <v-layout row wrap>
            <v-flex xs12>
              <p>
                Uzdevuma izpildes uzsākšanas laiks:
                <br />(tikai uzdevumu kārtošanai)
              </p>
            </v-flex>
            <v-flex xs12>
              <v-time-picker
                label="Vēlamais uzdevuma uzsākšanas laiks"
                v-model="taskData.taskTime"
                format="24hr"
              ></v-time-picker>
            </v-flex>
          </v-layout>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" text @click="closeDialog()">Aizvērt</v-btn>
        <v-btn color="primary" text @click="saveEntry()">Saglabāt</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  props: ['passedTaskId', 'allTasks', 'equipmentAll', 'service', 'openDialog'],
  data() {
    return {
      dialog: false,
      valid: true,
      taskId: null,
      filteredTaskGroupItems: [],
      taskData: {},
      //task options
      taskOperationsGroupItems: {
        neighborhood: [],
        bfh: [],
      },
      taskGroupItems: {
        neighborhood: [],
        bfh: [],
      },
      taskCodingGroupItems: [],
    };
  },
  watch: {
    openDialog: function(status) {
      this.dialog = status;
    },
    passedTaskId: function(value) {
      var vm = this;
      vm.taskId = value;
      if (value == 'new_task') {
        vm.taskData = Object.assign({}, vm.newTaskObj());
      } else {
        vm.taskData = Object.assign({}, vm.allTasks[vm.taskId]);
      }
    },
    'taskData.taskOperationsGroup': function(status) {
      this.filterTaskGroup();
    },
  },
  methods: {
    newTaskObj() {
      return {
        taskType: null,
        taskDirect: null,
        taskOperationsGroup: null,
        taskGroup: null,
        taskCodingGroup: null,
        taskName: null,
        taskTime: '8:00',
        taskEveryday: false,
        taskSocial: false,
        taskEquipment: null,
      };
    },
    filterTaskGroup() {
      var vm = this;
      if (vm.taskData.taskOperationsGroup) {
        const firstTG = vm.taskData.taskOperationsGroup.slice(0, 1);
        var filteredArr = [];
        for (var tg = 0; tg < vm.taskGroupItems[vm.service].length; tg++) {
          const tgiFirst = vm.taskGroupItems[vm.service][tg].slice(0, 1);
          if (tgiFirst == 4 && vm.service == 'neighborhood') {
            tgiFirst = 2;
          } //because group 4000 is under 2000 for nbh
          if (firstTG == tgiFirst) {
            filteredArr.push(vm.taskGroupItems[vm.service][tg]);
          }
        }
        vm.filteredTaskGroupItems = filteredArr;
      }
    },
    resetForNewEntry() {
      this.taskId = 'new_task';
      this.taskData = this.newTaskObj();
      this.$emit('resetTaskId');
    },
    async saveEntry() {
      if (this.$refs.form.validate()) {
        var vm = this;
        var db = firebase.firestore();
        vm.closeDialog();
        vm.progressFeedback();
        //update info
        vm.taskData.lastUpdate = new Date();
        vm.taskData.lastUser = vm.currentUserData.displayName;
        vm.taskData.service = vm.service;

        // new task or update
        if (vm.taskId == 'new_task') {
          //generate task auto number
          var groupIndex = vm.taskData.taskGroup.indexOf('.');
          var groupNumber = parseInt(
            vm.taskData.taskGroup.slice(0, groupIndex)
          );

          //get how many tasks already in the group
          var collectionSize = 1;
          var collectionSnapshot = await db
            .collection('neighborhoodTasks')
            .where('taskGroup', '==', vm.taskData.taskGroup)
            .get();

          collectionSize += collectionSnapshot.size;
          groupNumber += collectionSize;
          vm.taskData.taskNumber = groupNumber;

          //save in db
          db.collection('neighborhoodTasks').add(vm.taskData);

          //enable snackbar
          vm.snackbarColor = 'success';
          vm.snackbarTxt = 'Uzdevums veiksmīgi pievienots!';
          vm.snackbar = true;
          vm.progressFeedback();
          vm.resetForNewEntry();
        } else {
          //save in db
          db.collection('neighborhoodTasks')
            .doc(vm.taskId)
            .update(vm.taskData);
        }
      }
    },
    closeDialog() {
      this.dialog = false;
      this.$emit('closeDialog');
    },
    progressFeedback() {
      this.$emit('progressFeedback');
    },
  },
};
</script>