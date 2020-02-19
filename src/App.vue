<template>
  <div id="app">
    <v-app id="inspire">
      <v-navigation-drawer app v-model="drawer" v-if="user != ''">
        <v-list dense>
          <!-- mani uzdevumi -->
          <v-list-item :to="'/'">
            <v-list-item-action>
              <v-icon>assignment_turned_in</v-icon>
            </v-list-item-action>
            <v-list-item-title>Mani uzdevumi</v-list-item-title>
          </v-list-item>
          <!-- klienti -->
          <v-list-group prepend-icon="face">
            <template v-slot:activator>
              <v-list-item-title>Klienti</v-list-item-title>
            </template>
            <v-list-item :to="'/clientregister'">
              <v-list-item-title>Klienti</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/newclient'" v-if="admin || manager">
              <v-list-item-title>Pievienot jaunu klientu</v-list-item-title>
            </v-list-item>
            <v-list-item :to="{name: 'listincidents', params: {collection:'incidents'}}">
              <v-list-item-title>Incidenti</v-list-item-title>
            </v-list-item>
            <v-list-item :to="{name: 'listvitals', params: {collection:'bodyVitals'}}">
              <v-list-item-title>Veselības mērījumi</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Big family house -->
          <v-list-group prepend-icon="house" v-if="sudo">
            <template v-slot:activator>
              <v-list-item-title>Lielā ģimenes māja</v-list-item-title>
            </template>
            <v-list-item :to="'/bfhReports'" v-if="admin || manager">
              <v-list-item-title>Atskaites</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/bfhshifts'" v-if="admin || manager">
              <v-list-item-title>Maiņu grafiks</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/houseregister'" v-if="admin || manager">
              <v-list-item-title>Rezidenču reģistrs</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/bfhalltaskstoday'">
              <v-list-item-title>Šodienas uzdevumi</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/bfhtaskcatalog'" v-if="admin">
              <v-list-item-title>Uzdevumu katalogs</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/bfhpricegroups'" v-if="admin">
              <v-list-item-title>Cenu grupas</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/profiling'" v-if="admin || manager">
              <v-list-item-title>Profilēšana</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/bfhOutDays'" v-if="admin || manager">
              <v-list-item-title>Izbraukuma dienas</v-list-item-title>
            </v-list-item>
          </v-list-group>
          <!-- aprūpe mājās -->
          <v-list-group prepend-icon="location_city">
            <template v-slot:activator>
              <v-list-item-title>Aprūpe mājās</v-list-item-title>
            </template>
            <v-list-item :to="'/Nbhshifts'" v-if="admin || manager">
              <v-list-item-title>Maiņu grafiks</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/nbhalltaskstoday'">
              <v-list-item-title>Šodienas uzdevumi</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/dailyreports'" v-if="admin || manager">
              <v-list-item-title>Dienas atskaites</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/visits'" v-if="admin || manager">
              <v-list-item-title>Vizītes</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/nbhreports'" v-if="admin || manager">
              <v-list-item-title>Atskaites</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/nbhtaskcatalog'" v-if="admin">
              <v-list-item-title>Uzdevumu katalogs</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/equipment'" v-if="admin">
              <v-list-item-title>Aprīkojums</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/questions'" v-if="admin">
              <v-list-item-title>Aprīkojuma jautājumi</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Tīrīšana -->
          <v-list-group prepend-icon="room_service" v-if="admin || manager">
            <template v-slot:activator>
              <v-list-item-title>Tīrīšana</v-list-item-title>
            </template>
            <v-list-item :to="'/cleanings'">
              <v-list-item-title>Tīrīšanas</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/cleaningtasks'">
              <v-list-item-title>Tīrīšanas uzdevumi</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Admin -->
          <v-list-group prepend-icon="settings" v-if="admin">
            <template v-slot:activator>
              <v-list-item-title>Administrācija</v-list-item-title>
            </template>
            <v-list-item :to="'/companies'" v-if="admin">
              <v-list-item-title>Uzņēmumi</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/users'">
              <v-list-item-title>Lietotāji</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/features'">
              <v-list-item-title>Sistēmas uzlabojumi</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- dashboard -->
          <v-list-group prepend-icon="speed">
            <template v-slot:activator>
              <v-list-item-title>Aktivitāte</v-list-item-title>
            </template>
            <v-list-item :to="'/livedashboard'">
              <v-list-item-title>Aprūpētāju aktivitāte</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- help -->
          <v-list-item :to="'/helpvideo'">
            <v-list-item-action>
              <v-icon>movie</v-icon>
            </v-list-item-action>
            <v-list-item-title>Palīdzība</v-list-item-title>
          </v-list-item>

          <!-- sign out -->
          <v-list-group prepend-icon="power_settings_new">
            <template v-slot:activator>
              <v-list-item-title>Izrakstīties</v-list-item-title>
            </template>
            <v-list-item v-if="user != ''">
              <span>{{user.displayName}}</span>
              <v-btn icon v-on:click="logOut">
                <v-icon>power_settings_new</v-icon>
              </v-btn>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>
      <v-app-bar app color="primary" dark>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" v-if="user != ''" color="white"></v-app-bar-nav-icon>
        <v-toolbar-title>
          <span v-if="environment != null">{{environment}}</span>
          Senior Coding
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- name -->
        <span v-if="user != ''" class="userName">{{user.displayName}}</span>
        <!-- back button -->
        <v-btn icon small outlined @click="$router.go(-1)">
          <v-icon>arrow_back</v-icon>
        </v-btn>
      </v-app-bar>
      <v-content>
        <v-container fluid>
          <v-fade-transition mode="out-in">
            <router-view></router-view>
          </v-fade-transition>
        </v-container>
      </v-content>
      <v-footer color="secondary" app inset>
        <span>
          <small>&copy; 2019 - 2020</small>
        </span>
      </v-footer>
    </v-app>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { env } from '@/helpers/firebaseConfig.js';

export default {
  currentUser: '',
  data: () => ({
    drawer: null,
    environment: null,
    user: '',
    currentUserData: '',
  }),
  created() {
    var vm = this;

    //

    //if testing environment
    if (env == 'testing') {
      vm.environment = 'TESTING';
    }

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        localStorage.setItem('token', JSON.stringify(user.refreshToken));
        vm.user = user;
        //add user data if new user
        vm.addUserToDb(user);
      }
    });
  },
  methods: {
    addUserToDb(user) {
      var vm = this;
      var db = firebase.firestore();
      var userRef = db.collection('users').doc(user.uid);

      userRef
        .get()
        .then(function(doc) {
          if (doc.exists) {
            //save local
            vm.currentUserData = doc.data();
            var storeUserObj = doc.data();
            storeUserObj['userId'] = user.uid;
            localStorage.setItem(
              'currentUserData',
              JSON.stringify(storeUserObj)
            );
          } else {
            // doc.data() will be undefined in this case
            const userData = {
              displayName: user.displayName,
              email: user.email,
              role: ['aider'],
              photo: user.photoURL,
            };
            //write in db
            userRef.set(userData);

            //save local
            vm.currentUserData = userData;
            var storeUserObj = userData;
            storeUserObj['userId'] = user.uid;
            localStorage.setItem(
              'currentUserData',
              JSON.stringify(storeUserObj)
            );
          }
        })
        .catch(function(error) {
          console.log('Error getting document:', error);
        });
    },
    logOut() {
      var vm = this;
      var conf = confirm(vm.user.displayName + ', tiešām vēlies izrakstīties?');
      if (conf) {
        try {
          localStorage.setItem('token', null);
          firebase.auth().signOut();
          this.user = '';
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
};
</script>

<style>
table tr:nth-child(odd) {
  background-color: rgb(235, 233, 233);
}
h1 {
  color: gray;
}
.userName {
  margin-right: 10px;
}
/* task coloring */
.task-group-1 {
  color: #9900ff;
}
.task-group-2 {
  color: #4a86e8;
}
.task-group-4 {
  color: #74cabe;
}
.task-group-3 {
  color: #f6b26b;
}
.task-group-5 {
  color: #c49d28;
}
.task-group-6 {
  color: #6aa84f;
}
</style>
