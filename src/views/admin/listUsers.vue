<template>
  <v-container>
    <!-- snackbar -->
    <v-row>
      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
        {{ snackbarTxt }}
        <v-btn dark text @click="snackbar = false">
          <v-icon>close</v-icon>
        </v-btn>
      </v-snackbar>
    </v-row>
    <v-row justify="space-between" align="center" v-if="dataLoaded">
      <v-col cols="12" sm="4">
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-list three-line>
          <v-list-item v-for="(user, userId) in displayValues" :key="userId" class="border-div">
            <v-list-item-avatar>
              <img :src="user.photo" />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{user.displayName}} - {{user.email}}
                <span
                  v-if="sudo"
                  :id="'span-'+userId"
                  @click="copyUserId(userId)"
                >{{userId}}</span>
                <span>
                  <v-btn icon @click="editUser(userId)" x-small>
                    <v-icon small color="secondary">edit</v-icon>
                  </v-btn>
                </span>
              </v-list-item-title>
              <v-list-item-subtitle v-if="admin">
                <v-row justify="space-between" align="center">
                  <v-col cols="12" md="3">
                    <v-label>Lomas</v-label>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-checkbox
                      :input-value="hasStatus(user.role, 'admin')"
                      @change="changeRole(userId, 'admin')"
                      label="Administrators"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-checkbox
                      :input-value="hasStatus(user.role, 'manager')"
                      @change="changeRole(userId, 'manager')"
                      label="Kvartāla vadītājs"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-checkbox
                      :input-value="hasStatus(user.role, 'aider')"
                      @change="changeRole(userId, 'aider')"
                      label="Aprūpētājs"
                    ></v-checkbox>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action @click="deleteUser(userId)" v-if="admin">
              <small>Delete</small>
              <v-btn icon ripple>
                <v-icon color="error">delete_forever</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
    <!-- edit user details dialog form -->
    <v-dialog v-model="editUserDialog" max-width="300">
      <v-card>
        <v-card-title class="headline">Labot</v-card-title>
        <v-card-text>
          <v-text-field label="Lietotāja vārds" v-model="editUserDisplayName"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="resetUserEditForm()" color="error">Atcelt</v-btn>
          <v-btn text color="accent" @click="saveUserInfo()">Saglabāt</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data() {
    return {
      userData: {},
      searchValue: null,
      editUserDialog: false,
      editUserId: null,
      editUserDisplayName: null,
      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: '',
      snackbarTxt: '',
      dataLoaded: false,
    };
  },

  created() {
    var vm = this;

    var db = firebase.firestore();

    db.collection('users').onSnapshot(function(querySnapshot) {
      var userDataL = {};
      querySnapshot.forEach(function(doc) {
        var id = doc.id;
        userDataL[id] = doc.data();
      });

      vm.userData = Object.assign({}, userDataL);
      vm.dataLoaded = true;
    });
  }, //end created
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.userData);
          for (var t = 0; t < ids.length; t++) {
            var searchBy =
              vm.userData[ids[t]].displayName + vm.userData[ids[t]].email;
            if (
              searchBy.toLowerCase().indexOf(vm.searchValue.toLowerCase()) !==
              -1
            ) {
              displayL[ids[t]] = vm.userData[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.userData);
        }
      } else {
        displayL = Object.assign({}, vm.userData);
      }

      return displayL;
    },
  },
  methods: {
    saveUserInfo() {
      var vm = this;
      var db = firebase.firestore();

      db.collection('users')
        .doc(vm.editUserId)
        .update({
          displayName: vm.editUserDisplayName,
        });

      vm.resetUserEditForm();
    },
    editUser(userId) {
      this.editUserId = userId;
      this.editUserDisplayName = this.userData[userId].displayName;
      this.editUserDialog = true;
    },
    resetUserEditForm() {
      this.editUserDialog = false;
      this.editUserId = null;
      this.editUserDisplayName = null;
    },
    copyUserId(userId) {
      var copyText = document.getElementById('span-' + userId);
      var textArea = document.createElement('textarea');
      textArea.value = copyText.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('Copy');
      textArea.remove();
    },
    changeRole(userId, role) {
      var vm = this;
      var db = firebase.firestore();
      const roleIndex = vm.userData[userId].role.indexOf(role);
      var userRoles = vm.userData[userId].role;

      //has this role?
      if (roleIndex !== -1) {
        userRoles.splice(roleIndex, 1);
      } else {
        //select
        userRoles.push(role);
      }
      db.collection('users')
        .doc(userId)
        .update({ role: userRoles });
    },
    hasStatus(userRoles, role) {
      if (userRoles.indexOf(role) == -1) {
        return false;
      } else {
        return true;
      }
    },
    deleteUser(userId) {
      var vm = this;

      //check if user ment to delete
      //delete the record with confirmation
      var conf = confirm('Tiešām vēlies izdzēst šo lietotāju?');
      if (conf) {
        try {
          //delete from db
          firebase
            .firestore()
            .collection('users')
            .doc(userId)
            .delete()
            .then(function() {
              //enable snackbar
              vm.snackbarColor = 'success';
              vm.snackbarTxt = 'Lietotājs veiksmīgi izdzēsts!';
              vm.snackbar = true;
            })
            .catch(function(error) {
              console.error('Error removing document: ', error);
              //enable snackbar
              vm.snackbarColor = 'error';
              vm.snackbarTxt = 'Lietotājs netika izdzēsts!';
              vm.snackbar = true;
            });
        } catch (error) {
          console.log(error);
        }
      }
    },
  }, //end methods
}; //end export default
</script>

<style >
.border-div {
  border-bottom: 1px solid lightgray;
}
</style>