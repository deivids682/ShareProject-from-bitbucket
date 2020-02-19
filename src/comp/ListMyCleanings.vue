<template>
  <v-layout row v-if="hasCleanings">
    <v-flex xs12 sm6 offset-sm3>
      <v-card>
        <v-card-title>
          <h3>Tīrīšanas</h3>
        </v-card-title>
        <v-list>
          <template v-for="(cleaning, cleaingId) in myCleanings">
            <v-divider :key="cleaingId"></v-divider>
            <v-list-item :key="cleaning.createdAt.seconds">
              <v-list-item-content @click="goToCleaning(cleaingId)">
                <v-list-item-title>{{cleaning.clientName}}</v-list-item-title>
                <v-list-item-subtitle>{{cleaning.clientAddress}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
      <br>
    </v-flex>
  </v-layout>
</template>

<script>
import * as firebase from "firebase/app";
import "firebase/firestore";

export default {
  props: ["currentUser", "today", "tomorrow"],
  data() {
    return {
      myCleanings: {},
      hasCleanings: false
    };
  },
  created() {
    var vm = this;
    var db = firebase.firestore();

    //get my cleanings
    var myCleaningsL = {};
    db.collection("cleanings")
      .where("scheduledDate", ">=", vm.today)
      .where("scheduledDate", "<=", vm.tomorrow)
      .where("responsibleId", "==", vm.currentUser)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          myCleaningsL[doc.id] = doc.data();
          vm.hasCleanings = true;
        });
        vm.myCleanings = Object.assign({}, myCleaningsL);
      });
  },
  methods: {
    goToCleaning(cleaningId) {
      var vm = this;
      // view cleaning programmatically
      this.$router.push({
        name: "cleaningsViewOne",
        params: { cleaningId: cleaningId, clientId: vm.myCleanings[cleaningId].clientId}
      });
    }
  }
};
</script>