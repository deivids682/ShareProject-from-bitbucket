<template>
    <div id="editItem">
        <v-layout row>
        <v-flex></v-flex>
        <v-flex>
            <v-card>
                <v-alert
                :value="alert"
                dismissible
                type="success"
                transition="scale-transition"
                >
                Informācija veiksmīgi saglabāta!
                </v-alert>
                <h1>Labot informāciju</h1>
                <v-form ref="form" v-model="valid" lazy-validation id="form">
                <v-text-field
                v-model="itemName"
                :rules="[v => !!v || 'Nepieciešams nosaukums']"
                label="Nosaukums"
                required
                ></v-text-field>
                <!-- <v-text-field
                v-model="itemPhotoUrl"
                :rules="[v => !!v || 'Nepieciešama saite uz bildi']"
                label="Saite uz bildi"
                required
                ></v-text-field> -->
                <v-text-field
                v-model="itemMonthPrice"
                :rules="[v => !!v || 'Nepieciešama mēnešam aksa']"
                label="Mēneša maksa"
                required
                ></v-text-field>
                <v-select
                v-model="itemCategory"
                :items="categories"
                :rules="[v => !!v || 'Nepieciešama kategorija']"
                label="Kategorija"
                required
                ></v-select>
                <v-select
                v-model="itemRooms"
                multiple
                :items="rooms"
                :rules="[v => !!v || 'Nepieciešama istaba']"
                label="Istaba(s)"
                required
                ></v-select>
                
                <v-btn
                :disabled="!valid"
                @click="submit"
                id="submitBtn"
                >
                Saglabāt
                </v-btn>
                </v-form>
            </v-card>
        </v-flex>
        <v-flex></v-flex>
        </v-layout>
    </div>
</template>

<script>
import * as firebase from "firebase/app";
import "firebase/firestore";

export default {
  data() {
    return {
      alert:false,
      form: {
        itemName: "",
        itemPhotoUrl: "",
        itemCategory: "",
        itemRooms: [],
        itemMonthPrice: ""
      },
      valid: true,
      itemName: "",
      itemPhotoUrl: "",
      itemCategory: "",
      itemRooms: [],
      itemMonthPrice: "",
      categories: ["Drošība", "Mobilitāte", "Socializācija", "Visiem"],
      rooms: [
        "Dzīvojamā istaba(s)",
        "Guļamistaba",
        "Vannasistaba",
        "Tualete",
        "Virtuve"
      ]
    };
  },

  created() {
    var vm = this;
    var itemId = this.$route.params.id;

    var db = firebase.firestore();

    var itemRef = db.collection("items").doc(itemId);

    itemRef.get().then(function(doc) {
      var item = doc.data();
      vm.itemName = item.itemName;
      // vm.itemPhotoUrl = item.itemPhotoUrl;
      vm.itemCategory = item.itemCategory;
      vm.itemRooms = item.itemRooms;
      vm.itemMonthPrice = item.itemMonthPrice;
    });
  },

  methods: {
    submit(evt) {
    var itemId = this.$route.params.id;
      evt.preventDefault();
      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();

          db.collection("items").doc(itemId).set({
            itemName: this.itemName,
            // itemPhotoUrl: this.itemPhotoUrl,
            itemCategory: this.itemCategory,
            itemRooms: this.itemRooms,
            itemMonthPrice: this.itemMonthPrice
          });

          this.alert = true;
        } catch (error) {
          console.log(error);
        }
      }
    }
  } //end methods
}; //end export default
</script>