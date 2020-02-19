import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import router from './router';
import * as VueGoogleMaps from 'vue2-google-maps';
import { i18n } from '@/language/i18n';
import axios from 'axios';
import VueAxios from 'vue-axios';

// FIREBASE
// Firebase App is always required and must be first
import firebase from 'firebase/app';
// You don't need to import firebase/app either since it's being imported above
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/performance';
import {config} from '@/helpers/firebaseConfig';

// service worker
import './registerServiceWorker';

// mixin
import {userDataMixin} from '@/mixins/userDataMixin';

// Vue.mixin(userDataMixin);
Vue.mixin(userDataMixin);

Vue.config.productionTip = false;

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyDHDtgPfWJypa7fpZDb2B8U-z9xBtF57dY',
    libraries: 'places', // necessary for places input
  },
});

Vue.use(VueAxios, axios);
   
Vue.config.productionTip = false;

firebase.initializeApp(config);
const perf = firebase.performance();

let app: any;
firebase.auth().onAuthStateChanged(async (user) => {
  // initialize firebase

  if (!app) {
    // wait to get user
    const user = firebase.auth().currentUser;

    // start app
    app = new Vue({
      vuetify,
      router,
      i18n,
      async created() {
        if (!user) {
          this.$router.push('/login');
        }

        const firestore = firebase.firestore();

        await firestore
            .enablePersistence({synchronizeTabs: true})
            .catch(function(err) {
              if (err.code == 'failed-precondition') {
                console.log(err);
              // Multiple tabs open, persistence can only be enabled
              // in one tab at a a time.
              // ...
              } else if (err.code == 'unimplemented') {
                console.log(err);
              // The current browser does not support all of the
              // features required to enable persistence
              // ...
              }
            });
      },

      render: (h) => h(App),
    }).$mount('#app');
  }
});
