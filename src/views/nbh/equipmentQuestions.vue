<template>
  <div id="questions">
    <v-container>
      <v-layout row>
        <v-flex>
          <v-btn @click="showForm" id="newQuestionBtn" color="info">Pievienot jaunu jautājumu</v-btn>
        </v-flex>
        <v-flex></v-flex>
        <v-flex></v-flex>
      </v-layout>
      <v-layout align-start justify-center row>
        <v-flex></v-flex>
        <v-flex>
          <v-card>
            <v-form ref="form" v-model="valid" lazy-validation id="form" hidden>
              <v-text-field
                v-model="qText"
                :rules="[v => !!v || 'Nepieciešams jautājuma teksts']"
                label="Jautājums"
                required
              ></v-text-field>
              <v-text-field v-model="qCategory" label="Jautājuma kategorija"></v-text-field>
              <v-checkbox label="Jautājums par istabu?" v-model="qRoom"></v-checkbox>
              <v-btn :disabled="!valid" @click="submit" id="submitBtn">Saglabāt</v-btn>
              <v-btn @click="clear">Notīrīt</v-btn>
            </v-form>
          </v-card>
        </v-flex>
        <v-flex></v-flex>
      </v-layout>
      <v-layout align-center justify-space-around row fill-height>
        <v-flex>
          <v-data-table :headers="headers" :items="questions" class="elevation-1">
            <template v-slot:item="{item}">
              <tr>
                <td>{{ item.qText }}</td>
                <td class="text-center">{{ item.qCategory}}</td>
                <td class="text-center">{{ item.qRoom }}</td>
                <td class="text-right">
                  <v-btn @click="deleteQuestion(item.id)" id="deleteItemBtn">Dzēst</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data() {
    return {
      form: {
        qText: '',
        qCategory: '',
        qRoom: '',
      },
      valid: true,
      questions: [],

      //define to data from user registered data
      qText: '',
      qCategory: '',
      qRoom: '',
      headers: [
        { text: 'Jautājums', align: 'left', value: 'qText' },
        { text: 'Jautājuma kategorija', value: 'qCategory', align: 'center' },
        { text: 'Istaba (Jā/Nē)', value: 'qRoom', align: 'center' },
        { text: 'Rīki', value: 'action', align: 'right', sortable: false },
      ],
    };
  },

  created() {
    var vm = this;

    var db = firebase.firestore();

    db.collection('questions').onSnapshot(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        //push data to array
        var data = doc.data();
        data['id'] = doc.id;
        vm.questions.push(data);
      });
    });
  },

  methods: {
    clear() {
      this.$refs.form.reset();
    },
    submit(evt) {
      evt.preventDefault();
      if (this.$refs.form.validate()) {
        try {
          var db = firebase.firestore();

          db.collection('questions').add({
            qText: this.qText,
            qCategory: this.qCategory || '',
            qRoom: this.qRoom || false,
          });

          this.clear();
          this.questions = []; //to reset table for new item
        } catch (error) {
          console.log(error);
        }
      }
    },
    showForm() {
      if (document.getElementById('form').hidden) {
        document.getElementById('form').hidden = false;
      } else {
        document.getElementById('form').hidden = true;
      }
    },
    deleteQuestion(id) {
      try {
        var db = firebase.firestore();

        db.collection('questions')
          .doc(id)
          .delete();
        this.questions = []; //to reset table for new item
      } catch (error) {
        console.log(error);
      }
    },
  }, //end methods
}; //end export default
</script>