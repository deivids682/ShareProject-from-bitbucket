<template>
  <v-dialog v-model="dialog" persistent fullscreen hide-overlay>
    <v-card>
      <!-- snackbar -->
      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
        {{ snackbarTxt }}
        <v-btn dark text @click="snackbar = false">
          <v-icon>close</v-icon>
        </v-btn>
      </v-snackbar>
      <!--Progress bar -->
      <v-flex xs12 v-if="progressBar">
        <v-progress-linear :indeterminate="true"></v-progress-linear>
      </v-flex>

      <template v-if="!progressBar">
        <v-card-title class="headline">
          <v-layout wrap>
            <v-flex xs10>
              <span
                :class="
                  'task-group-' +
                    taskDataInDialog.lpTaskNumber.toString().slice(0, 1) +
                    ' span-number'
                "
              >{{ taskDataInDialog.lpTaskNumber }}</span>
              {{ taskDataInDialog.lpTaskName }} -
              {{ taskDataInDialog.clientName }}
              <!-- postponed -->
              <span v-if="typeof taskDataInDialog.postponed != 'undefined'">
                (
                <v-icon large>fast_forward</v-icon>)
              </span>
            </v-flex>
            <v-flex xs2>
              <v-btn color="error" fab @click="close" outlined small>
                <v-icon>close</v-icon>
              </v-btn>
            </v-flex>
          </v-layout>
        </v-card-title>

        <v-card-text>
          <!-- buttons -->
          <v-layout
            wrap
            justify-center
            v-if="!taskDataInDialog.lpTaskSocial || parcipentsCount > 0 && taskDataInDialog.photoUrl != ''"
          >
            <span v-if="dirOrIdir == 'Tiešs'">
              <v-btn
                id="assisted-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('assisted')"
                v-bind:class="updateBtnClass('assisted')"
              >
                <v-icon v-if="!taskDataInDialog.lpTaskCognitive">people</v-icon>
                <v-icon v-else>sentiment_very_dissatisfied</v-icon>
              </v-btn>
              <v-btn
                id="supervised-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('supervised')"
                v-bind:class="updateBtnClass('supervised')"
              >
                <v-icon v-if="!taskDataInDialog.lpTaskCognitive">visibility</v-icon>
                <v-icon v-else>sentiment_dissatisfied</v-icon>
              </v-btn>
              <v-btn
                id="independent-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('independent')"
                v-bind:class="updateBtnClass('independent')"
              >
                <v-icon v-if="!taskDataInDialog.lpTaskCognitive">person</v-icon>
                <v-icon v-else>sentiment_very_satisfied</v-icon>
              </v-btn>
            </span>
            <span v-if="dirOrIdir == 'Netiešs'">
              <v-btn
                id="doneIdr-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('doneIdr')"
                v-bind:class="updateBtnClass('doneIdr')"
              >
                <v-icon>check_circle_outline</v-icon>
              </v-btn>
            </span>
            <!-- cancel or forward only if has comment -->
            <span v-if="taskDataInDialog.comment != ''">
              <v-btn
                id="canceled-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('canceled')"
                v-bind:class="updateBtnClass('canceled')"
              >
                <v-icon>cancel</v-icon>
              </v-btn>
              <v-btn
                v-if="!taskDataInDialog.lpTaskEveryday"
                id="postponed-btn"
                class="narrow-btn"
                fab
                small
                depressed
                outlined
                @click="updateStatus('postponed')"
                v-bind:class="updateBtnClass('postponed')"
              >
                <v-icon>fast_forward</v-icon>
              </v-btn>
            </span>

            <v-btn
              id="open-btn"
              class="narrow-btn"
              fab
              small
              depressed
              outlined
              @click="updateStatus('open')"
              v-bind:class="updateBtnClass('open')"
            >
              <v-icon>check_box_outline_blank</v-icon>
            </v-btn>
          </v-layout>
          <!-- task details -->
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                {{ shiftsToTxt[taskDataInDialog.lpTaskShiftNumber] }}
                {{ taskDataInDialog.lpTaskFormatDate }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Atbildīgais:
                {{
                usersInDialog[taskDataInDialog.responsible].displayName
                }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <!-- task status -->
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                Statuss:
                {{ statusToTxt[taskDataInDialog.status] }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-if="
                taskDataInDialog.lpTaskSocial && 
                taskDataInDialog.service === 'bfh' && 
                taskDataInDialog.lpTaskType === 'Mājas'"
          >
            <v-list-item-content>
              <v-text-field label="Dalibnieku skaits" type="number" v-model="parcipentsCount"></v-text-field>
            </v-list-item-content>
          </v-list-item>

          <!-- comment -->
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Komentāri:</v-list-item-title>
              <v-list-item-subtitle>
                <v-text-field
                  text
                  outlined
                  :value="taskDataInDialog.comment"
                  label="Pievienot komentāru"
                  id="comment-area"
                ></v-text-field>
                <v-btn small block depressed outlined color="secondary" @click="saveComment()">
                  {{taskDataInDialog.lpTaskSocial &&
                  taskDataInDialog.service === 'bfh' &&
                  taskDataInDialog.lpTaskType === 'Mājas' ? "Saglabāt" : "saglabāt komentāru" }}
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <!-- quick photo -->
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Foto</v-list-item-title>
              <v-list-item-subtitle>
                <my-task-quick-photo
                  :taskDataInDialog="taskDataInDialog"
                  :taskId="taskId"
                  @closeMyTaskQuickPhoto="closeMyTaskQuickPhoto"
                ></my-task-quick-photo>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <!-- equipment -->
          <v-list-item
            v-if="
              typeof equipmentInDialog[taskDataInDialog.equipment] !=
                'undefined'
            "
          >
            <v-list-item-content>
              <v-list-item-title>
                Izmantojamais inventārs:
                {{
                equipmentInDialog[taskDataInDialog.equipment].itemName
                }}
              </v-list-item-title>
              <v-img
                :src="
                  equipmentInDialog[taskDataInDialog.equipment].itemPhotoUrl
                "
                max-width="100px"
              ></v-img>
            </v-list-item-content>
          </v-list-item>

          <!-- postponed notes -->
          <v-list-item v-if="typeof taskDataInDialog.postponed != 'undefined'">
            <v-list-item-content>
              <v-list-item-title>Uzdevums ir pārcelts:</v-list-item-title>
              <v-list-item-subtitle
                v-for="(postpDetails, index) in taskDataInDialog.postponed"
                :key="index"
              >
                {{ postpDetails.date }}
                {{
                usersInDialog[postpDetails.responsible].displayName
                }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <!-- last update -->
          <v-list-item v-if="typeof taskDataInDialog.updatedBy != 'undefined'">
            <v-list-item-content>
              <p>
                <small style="font-style: italic">
                  Pēdējās izmaiņas: {{ taskDataInDialog.updatedBy }}
                  {{ formatDate(taskDataInDialog.lastUpdate.seconds) }}
                </small>
              </p>
            </v-list-item-content>
          </v-list-item>

          <!-- admin -->
          <v-list-item v-if="sudo">
            <v-list-item-content>
              <v-list-item-title>Admin view:</v-list-item-title>

              <small>
                <li>shiftKey: {{ taskDataInDialog.shiftKey }}</li>
                <li>clientShiftKey: {{ taskDataInDialog.clientShiftKey }}</li>
                <li>soloTaskKey: {{ taskDataInDialog.soloTaskKey }}</li>
                <li>soloTask: {{ taskDataInDialog.soloTask }}</li>
                <li>taskCognitive: {{ taskDataInDialog.lpTaskCognitive }}</li>
                <li>taskCodingGroup: {{ taskDataInDialog.lpTaskCodingGroup }}</li>
              </small>
            </v-list-item-content>
          </v-list-item>

          <!-- {{taskDataInDialog}} -->
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="error" text @click="close" outlined>
            <v-icon left>close</v-icon>Aizvērt
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import MyTaskQuickPhoto from '@/comp/MyTasksQuickPhoto.vue';

export default {
  name: 'OneTaskDialog',
  props: [
    'taskData',
    'users',
    'currentUserId',
    'equipment',
    'taskId',
    'dirOrIdir',
  ],
  components: {
    MyTaskQuickPhoto,
  },
  data() {
    return {
      parcipentsCount: 0,
      dialog: true,
      progressBar: true,
      taskDataInDialog: {},
      usersInDialog: {},
      equipmentInDialog: {},
      shiftsToTxt: { 0: 'Rīts', 1: 'Pusdiena', 2: 'Vakars' },
      statusToTxt: {
        open: 'vēl neizpildīts',
        independent: 'izpildīts patstāvīgi',
        assisted: 'izpildīts ar palīdzību',
        supervised: 'izpildīts uzraudzībā',
        canceled: 'atcelts',
        postponed: 'pārcelts',
        doneIdr: 'izpildīts',
      },
      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },

  async created() {
    var vm = this;
    var db = firebase.firestore();

    //prepare variable data
    vm.taskDataInDialog = Object.assign({}, vm.taskData);
    vm.usersInDialog = Object.assign({}, vm.users);
    vm.equipmentInDialog = Object.assign({}, vm.equipment);

    //load user data if necessary
    if (
      typeof vm.usersInDialog[vm.taskDataInDialog.responsible] == 'undefined'
    ) {
      var userData = await db
        .collection('users')
        .doc(vm.taskDataInDialog.responsible)
        .get();

      vm.usersInDialog[userData.id] = userData.data();
    }

    if (
      vm.taskDataInDialog.lpTaskSocial &&
      vm.taskDataInDialog.service === 'bfh' &&
      vm.taskDataInDialog.lpTaskType === 'Mājas'
    ) {
      vm.parcipentsCount = vm.taskDataInDialog.numberOfParticipants;
    }

    //load postponed user if necessary
    var postpUsersProm = [];
    if (typeof vm.taskDataInDialog.postponed != 'undefined') {
      vm.taskDataInDialog.postponed.forEach(postpDetails => {
        if (typeof vm.usersInDialog[postpDetails.responsible] == 'undefined') {
          var userData = db
            .collection('users')
            .doc(postpDetails.responsible)
            .get();
          postpUsersProm.push(userData);
        }
      });
    }

    var userValues = await Promise.all(postpUsersProm);
    userValues.forEach(user => {
      vm.usersInDialog[user.id] = user.data();
    });

    //get equipment
    const equipmentId = vm.taskDataInDialog.equipment;
    if (
      typeof equipmentId != 'undefined' &&
      equipmentId != '' &&
      equipmentId != null
    ) {
      //get equipment info
      //load user data if necessary
      if (typeof vm.equipmentInDialog[equipmentId] == 'undefined') {
        var equipmentData = await db
          .collection('items')
          .doc(equipmentId)
          .get();

        vm.equipmentInDialog[equipmentId] = equipmentData.data();
      }
    }
    vm.progressBar = false;
  },
  methods: {
    close() {
      var vm = this;
      vm.$emit(
        'close',
        vm.usersInDialog,
        vm.equipmentInDialog,
        vm.taskDataInDialog,
        vm.taskId
      );
    },

    closeMyTaskQuickPhoto(taskDataInQuickPhoto, closeTaskView) {
      var vm = this;
      //save changes locally
      vm.taskDataInDialog = Object.assign({}, taskDataInQuickPhoto);

      //auto close indirect task
      if (
        vm.taskDataInDialog.lpTaskSocial &&
        vm.taskDataInDialog.service === 'bfh' &&
        vm.taskDataInDialog.lpTaskType === 'Mājas'
      ) {
        if (
          vm.dirOrIdir == 'Netiešs' &&
          closeTaskView &&
          vm.parcipentsCount > 0
        ) {
          vm.updateStatus('doneIdr');
        }
      } else {
        if (vm.dirOrIdir == 'Netiešs' && closeTaskView) {
          vm.updateStatus('doneIdr');
        }
      }
    },
    updateStatus(status) {
      var vm = this;
      var db = firebase.firestore();
      vm.progressBar = true;

      //get geo location
      var location = navigator.geolocation.getCurrentPosition(function(
        position,
        error
      ) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const closedAt = new Date();
        //save locally
        vm.taskDataInDialog['status'] = status;
        vm.taskDataInDialog['closedAt'] = closedAt;
        vm.taskDataInDialog['closedBy'] = vm.currentUserId;
        vm.taskDataInDialog['lastUpdate'] = {
          seconds: Math.round(closedAt.getTime() / 1000),
        };
        vm.taskDataInDialog['updatedBy'] =
          vm.users[vm.currentUserId].displayName +
          ' mainīja uzdevuma statusu (single)';

        db.collection('taskArchive')
          .doc(vm.taskId)
          .update({
            status: status,
            closedAt: closedAt,
            closedBy: vm.currentUserId,
            location: new firebase.firestore.GeoPoint(latitude, longitude),
            lastUpdate: closedAt,
            updatedBy:
              vm.users[vm.currentUserId].displayName +
              ' mainīja uzdevuma statusu (single)',
          });

        //close dialog
        vm.progressBar = false;

        vm.close();
      });
    },
    saveComment() {
      var vm = this;
      var comment = document.getElementById('comment-area').value;
      var db = firebase.firestore();
      //save comment to db numberOfParticipants

      let saveObject = {
        comment: comment,
        lastUpdate: new Date(),
        updatedBy:
          vm.users[vm.currentUserId].displayName + ' pievienoja komentāru',
      };

      if (
        vm.taskDataInDialog.lpTaskSocial &&
        vm.taskDataInDialog.service === 'bfh' &&
        vm.taskDataInDialog.lpTaskType === 'Mājas'
      ) {
        saveObject['numberOfParticipants'] = vm.parcipentsCount;
      }
      db.collection('taskArchive')
        .doc(vm.taskId)
        .update(saveObject);

      //update locally
      vm.taskDataInDialog['numberOfParticipants'] = vm.parcipentsCount;
      vm.taskDataInDialog['comment'] = comment;
      vm.taskDataInDialog['lastUpdate'] = {
        seconds: Math.round(new Date().getTime() / 1000),
      };
      vm.taskDataInDialog['updatedBy'] =
        vm.users[vm.currentUserId].displayName + ' pievienoja komentāru';
      //enable snackbar
      vm.snackbarColor = 'success';

      if (
        vm.taskDataInDialog.lpTaskSocial &&
        vm.taskDataInDialog.service === 'bfh' &&
        vm.taskDataInDialog.lpTaskType === 'Mājas'
      ) {
        vm.snackbarTxt = 'Saglabāts!';
      } else {
        vm.snackbarTxt = 'Komentārs saglabāts!';
      }

      vm.snackbar = true;
    },
    updateBtnClass(btnStatus) {
      if (btnStatus == this.taskDataInDialog.status) {
        return 'active-btn';
      }
    },
    formatDate(sec) {
      var date = new Date(sec * 1000);
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
.span-number {
  padding-left: 10px;
  padding-right: 5px;
}
.active-btn {
  background-color: lightgrey;
}
.narrow-btn {
  margin: 0;
  margin-right: 5px;
}
</style>
