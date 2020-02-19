<template>
  <v-container>
    <h1>{{ $t('profiling.profilingHeader') }}</h1>
    <v-btn color="primary" class="position-btn" text @click="changeLocale('lv')">Latviešu</v-btn>
    <v-btn color="primary" text @click="changeLocale('ru')">Pусский</v-btn>
    <v-card class="mx-auto mt-5">
      <v-card-text>
        <v-container fluid>
          <v-row align="center">
            <v-col class="d-flex" cols="12" sm="2">
              <h4>{{$t('profiling.category.categoryHeader') }}</h4>
            </v-col>
            <v-col class="d-flex" cols="12" sm="5">
              <h4>{{$t('profiling.question.questionHeader') }}</h4>
            </v-col>
          </v-row>
          <v-form ref="profiling">
            <template v-if="!edit">
              <v-row align="center" v-for="question in questions" :key="question.category">
                <v-col class="d-flex" cols="12" sm="2">
                  <div>{{ $t(question.category) }}</div>
                </v-col>
                <v-col class="d-flex" cols="12" sm="5">
                  <div>{{ $t(question.question) }}</div>
                </v-col>
                <v-col class="d-flex" cols="12" sm="5">
                  <template>
                    <v-select
                      :items="answers"
                      item-text="answer"
                      @input="calculateGir($event, question.id)"
                      filled
                      :rules="rulesRequired"
                      :label="$t('global.labelChose')"
                      return-object
                    >
                      <template slot="selection" slot-scope="{ item }">{{ $t(item.answer)}}</template>
                      <template slot="item" slot-scope="{ item }">{{ $t(item.answer) }}</template>
                    </v-select>
                  </template>
                </v-col>
              </v-row>
            </template>
            <template v-if="edit">
              <v-row align="center" v-for="question in editQuestion" :key="question.category">
                <v-col class="d-flex" cols="12" sm="2">
                  <div>{{ $t(question.category) }}</div>
                </v-col>
                <v-col class="d-flex" cols="12" sm="5">
                  <div>{{ $t(question.question) }}</div>
                </v-col>
                <v-col class="d-flex" cols="12" sm="5">
                  <template>
                    <v-select
                      :items="answers"
                      :item-text="answer"
                      @input="calculateGir($event, question.id)"
                      filled
                      :rules="rulesRequired"
                      :reduce="answers => answers.value"
                      v-model="question.selected"
                      :label="$t('global.labelChose')"
                      return-object
                    >
                      <template slot="selection" slot-scope="{ item }">{{$t(item.answer)}}</template>
                      <template slot="item" slot-scope="{ item }">{{$t(item.answer)}}</template>
                    </v-select>
                  </template>
                </v-col>
              </v-row>
            </template>
            <v-row align="center">
              <v-col cols="12" sm="3">
                <v-select
                  :items="beds"
                  item-text="name"
                  @input="getBedsInRoom"
                  :reduce="getBedsInRoom => getBedsInRoom.value"
                  v-model="bedsInRoom"
                  filled
                  :rules="rulesRequired"
                  :label="$t('global.bedsInRoom')"
                >
                  <template slot="selection" slot-scope="{ item }">{{$t(item.name)}}</template>
                  <template slot="item" slot-scope="{ item }">{{$t(item.name)}}</template>
                </v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  :items="getAllPriceGrups"
                  item-text="name"
                  @input="getPrices"
                  :reduce="getAllPriceGrups => getAllPriceGrups.name"
                  v-model="priceG"
                  filled
                  :rules="rulesRequired"
                  :label="$t('global.choosePriceGroup')"
                  return-object
                ></v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-btn
                  color="primary"
                  class="position-btn"
                  dark
                  @click="addCognitiveGroup()"
                >{{$t('global.calculatePrice')}}</v-btn>
              </v-col>
              <v-col cols="12" sm="3">
                <v-btn
                  color="primary"
                  class="position-btn"
                  dark
                  @click="profilingHistory()"
                >{{$t('global.profilingHistory')}}</v-btn>
              </v-col>
              <v-dialog v-model="dialog">
                <v-card>
                  <v-card-text align="center" v-if="saving">
                    <v-chip class="ma-2" color="primary" label>
                      {{$t('profiling.priceRange') + girFormatted}}
                    </v-chip>
                    <v-chip class="ma-2" color="primary" label>
                      {{$t('profiling.bedsInRoom2') + bedsInRoom}}
                    </v-chip>
                    <v-chip class="ma-2" color="primary" label>
                      {{  $t('profiling.pricePerDay') + dayPrice }}
                      <v-icon left>mdi-currency-eur</v-icon>
                    </v-chip>
                    <v-chip class="ma-2" color="primary" label>
                       {{$t('profiling.pricePerMonth') + monthPrice }}
                      <v-icon left>mdi-currency-eur</v-icon>
                    </v-chip>
                    <v-form ref="userInfo">
                      <v-col cols="12" sm="6">
                        <v-text-field v-model="name" :rules="rulesRequired" :label="$t('global.name')"></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-textarea v-model="notes" :label="$t('global.notes')"></v-textarea>
                      </v-col>
                    </v-form>
                  </v-card-text>
                  <v-card-actions v-if="saving">
                    <v-btn color="primary" class="position-btn" text @click="closeDialog()">{{$t('global.close')}}</v-btn>
                    <v-btn color="primary" text @click="saveProfilingResult()">
                      {{
                      edit ? $t('global.editSave') : $t('profiling.saveProfile')
                      }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
                <v-simple-table dense v-if="saving">
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th class="text-left">{{$t('profiling.task')}}</th>
                        <!-- <th class="text-left">Subgroup</th>
                        <th class="text-left">Assistance grade</th>-->
                        <th class="text-left">{{$t('profiling.suggestedAssistanceLevel')}}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="task in neighborhoodTasksFormated" :key="task.taskName">
                        <td>{{ task.taskName }}</td>
                        <!-- <td>{{ task.taskCodingGroup }}</td>
                        <td>{{ task.assistanceGrade }}</td>-->
                        <td>{{ $t(task.SuggestedAssistanceLevel) }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
                <template v-if="!saving">
                  <v-data-table
                    :headers="headers"
                    :items="getFormatedProfilingHistory"
                    :search="search"
                    class="elevation-1"
                  >
                    <template v-slot:top>
                      <v-toolbar flat color="white">
                        <v-toolbar-title>{{$t('global.profilingHistory')}}</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-text-field
                          v-model="search"
                          prepend-icon="search"
                          :label="$t('global.search')"
                          single-line
                          hide-details
                          clearable
                        ></v-text-field>
                        <template>
                          <v-btn
                            color="primary"
                            dark
                            class="position-btn"
                            text
                            @click="close()"
                          >{{$t('global.close')}}</v-btn>
                        </template>
                      </v-toolbar>
                    </template>
                    <template v-slot:item.action="{ item }" v-if="admin || manager">
                      <v-icon small class="mr-2" @click="editItem(item)">edit</v-icon>
                      <v-icon small @click="deleteItem(item)">delete</v-icon>
                    </template>
                  </v-data-table>
                </template>
              </v-dialog>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { girCode, girAlfabetic } from '../../JSON/GirCodes';
import { houseAndRezidentTasks } from '../../helpers/exportFromExcel';
import undefined from 'firebase/firestore';
import { i18n } from './../../language/i18n';

export default {
  data: () => ({
    answers: [
      {
        answer: 'profiling.answer.answer1',
        value: '1',
      },
      {
        answer: 'profiling.answer.answer2',
        value: '2',
      },
      {
        answer: 'profiling.answer.answer3',
        value: '3',
      },
    ],

    levelOfAssistance: {
      A: 'profiling.levelOfAssistance.A',
      B: 'profiling.levelOfAssistance.B',
      C: 'profiling.levelOfAssistance.C',
    },

    questions: [
      {
        selected: null,
        id: 0,
        category: 'profiling.category.category1',
        question: 'profiling.question.question1',
      },
      {
        selected: null,
        id: 1,
        category: 'profiling.category.category2',
        question: 'profiling.question.question2',
      },
      {
        selected: null,
        id: 2,
        category: 'profiling.category.category3',
        question: 'profiling.question.question3',
      },
      {
        selected: null,
        id: 3,
        category: 'profiling.category.category4',
        question: 'profiling.question.question4',
      },
      {
        selected: null,
        id: 4,
        category: 'profiling.category.category5',
        question: 'profiling.question.question5',
      },
      {
        selected: null,
        id: 5,
        category: 'profiling.category.category6',
        question: 'profiling.question.question6',
      },
      {
        selected: null,
        id: 6,
        category: 'profiling.category.category7',
        question: 'profiling.question.question7',
      },
    ],
    beds: [
      { name: 'profiling.beds.one', value: 1 },
      { name: 'profiling.beds.two', value: 2 },
      { name: 'profiling.beds.three', value: 3 },
    ],
    name: '',
    notes: '',
    search: '',
    prices: [],
    answer: null,
    priceGroups: [],
    loadedPriceGroups: [],
    neighborhoodTasks: [],
    profilingSurveys: [],
    Gir: '0000000',
    GirValue: null,
    girFormatted: null,
    bedsInRoom: null,
    saving: true,
    selected: null,
    neighborhoodTasksFormated: [],
    formatedProfilingSurveys: [],
    dayPrice: 0,
    dialog: false,
    edit: false,
    editQuestion: [],
    priceGroup: null,
    priceG: null,
    girF: null,
    profileId: null,
    change: false,
  }),

  created() {

    let db = firebase.firestore();
    db.collection('priceGroups')
      .where('service', '==', 'bfh')
      .orderBy('name')
      .onSnapshot(snap => {
        let loadedPriceGroupsL = {};
        snap.forEach(doc => {
          loadedPriceGroupsL[doc.id] = doc.data();
        });
        this.loadedPriceGroups = Object.assign({}, loadedPriceGroupsL);
      });

    db.collection('neighborhoodTasks')
      .where('service', '==', 'bfh')
      .where('taskType', '==', 'Rezidenta')
      .onSnapshot(snap => {
        let neighborhoodTasksL = {};
        snap.forEach(doc => {
          neighborhoodTasksL[doc.id] = doc.data();
        });
        this.neighborhoodTasks = Object.assign({}, neighborhoodTasksL);
      });
  },

  computed: {
    rulesRequired() {
      return [value => !!value || this.$t('global.needToFillOut')];
    },

      headers() { //https://stackoverflow.com/questions/55460597/internationalization-of-vuetify-data-table-header
      return [
      {
        text: this.$t('global.name'),
        align: 'left',
        value: 'name',
      },
      { text: this.$t('global.profil'), value: 'girFormatted' },
      { text: this.$t('global.priceGroup'), value: 'priceGroup' },
      { text: this.$t('global.bedsInRoom'), value: 'bedsInRoom' },
      { text: this.$t('profiling.pricePerDay2'), value: 'dayPrice', align: 'right' },
      { text: this.$t('profiling.priceperMoth2'), value: 'monthPrice', align: 'right' },
      { text: this.$t('global.notes'), value: 'notes' },
      { text: this.$t('global.lastUpdate'), value: 'lastUpdate' },
      { text: this.$t('global.updatedBy'), value: 'updatedBy' },
      { text: this.$t('global.action'), value: 'action', sortable: false },
    ];
      },

    monthPrice() {
      return parseFloat(this.dayPrice * 31).toFixed(2);
    },
    getAllPriceGrups() {
      let ids = Object.keys(this.loadedPriceGroups);
      ids.forEach(id => {
        this.priceGroups.push({
          name: this.loadedPriceGroups[id].name,
          prices: this.loadedPriceGroups[id].prices,
        });
      });

      return this.priceGroups;
    },

    getFormatedProfilingHistory() {
      var vm = this;
      this.formatedProfilingSurveys = [];
      let ids = Object.keys(this.profilingSurveys);

      ids.forEach(id => {
        let t = new Date(1970, 0, 1); // Epoch
        t.setSeconds(this.profilingSurveys[id].lastUpdate.seconds);

        this.formatedProfilingSurveys.push({
          id: id,
          languages: this.profilingSurveys[id].languages,
          name: this.profilingSurveys[id].name,
          notes: this.profilingSurveys[id].notes,
          answers: this.profilingSurveys[id].answers,
          lastUpdate: vm.formatDate(t.toISOString().substr(0, 10)),
          updatedBy: this.profilingSurveys[id].updatedBy,
          bedsInRoom: this.profilingSurveys[id].bedsInRoom,
          priceGroup: this.profilingSurveys[id].priceGroup,
          girFormatted: this.profilingSurveys[id].girFormatted,
          dayPrice: this.profilingSurveys[id].dayPrice,
          monthPrice: this.profilingSurveys[id].monthPrice,
        });
      });
      return this.formatedProfilingSurveys;
    },

    calculatePriceDay() {
      if (!this.edit) {
        this.dayPrice = parseFloat(
          this.prices[this.girFormatted + this.bedsInRoom]
        ).toFixed(2);
      } else {
        var prices = this.getAllPriceGrups;
        var price = [];
        prices.forEach(price => {
          if (price.name == this.priceGroup) {
            price = price.prices;
            this.dayPrice = parseFloat(
              price[this.girFormatted + this.bedsInRoom]
            ).toFixed(2);
          }
        });
      }
    },
  },

  methods: {

    changeLocale(locale) {
      i18n.locale = locale;
    },

    helperCognitiveGroup: function(i, id, str) {
      if (str[i] == 1) {
        this.neighborhoodTasksFormated.push({
          taskName: this.neighborhoodTasks[id].taskName,
          taskCodingGroup: this.neighborhoodTasks[id].taskCodingGroup,
          assistanceGrade: 'A',
          SuggestedAssistanceLevel: this.levelOfAssistance.A,
        });
      } else if (str[i] == 2) {
        this.neighborhoodTasksFormated.push({
          taskName: this.neighborhoodTasks[id].taskName,
          taskCodingGroup: this.neighborhoodTasks[id].taskCodingGroup,
          assistanceGrade: 'B',
          SuggestedAssistanceLevel: this.levelOfAssistance.B,
        });
      } else if (str[i] == 3) {
        this.neighborhoodTasksFormated.push({
          taskName: this.neighborhoodTasks[id].taskName,
          taskCodingGroup: this.neighborhoodTasks[id].taskCodingGroup,
          assistanceGrade: 'C',
          SuggestedAssistanceLevel: this.levelOfAssistance.C,
        });
      }
    },

    editItem(item) {
      this.edit = true;
      let str = [...item.answers];
      this.editQuestion = this.questions;
      this.Gir = item.answers;

      for (let i = 0; i < this.questions.length; i++) {
        this.editQuestion[i].selected = str[i];
      }
      this.bedsInRoom = item.bedsInRoom;
      this.priceG = item.priceGroup;
      this.priceGroup = item.priceGroup;
      this.girFormatted = item.girFormatted;
      this.profileId = item.id;
      this.name = item.name;
      this.notes = item.notes;

      this.dialog = false;
    },

    deleteItem(item) {
      let db = firebase.firestore();
      db.collection('profilingSurveys')
        .doc(item.id)
        .delete();
    },

    addCognitiveGroup() {
      this.calculatePriceDay;
      this.saving = true;
      let str = [...this.Gir];
      let ids = Object.keys(this.neighborhoodTasks);
      this.neighborhoodTasksFormated = [];
      ids.forEach(id => {
        switch (this.neighborhoodTasks[id].taskCodingGroup) {
          case '4500. Cognitive Orientation':
            this.helperCognitiveGroup(0, id, str);
            break;
          case '4200. Hygiene/ bathing/ grooming':
            this.helperCognitiveGroup(1, id, str);
            break;
          case '4300. Dressing':
            this.helperCognitiveGroup(2, id, str);
            break;
          case '4400. Eating':
            this.helperCognitiveGroup(3, id, str);
            break;
          case '4600. Toileting/ Incontinence':
            this.helperCognitiveGroup(4, id, str);
            break;
          case '4700. Positionning/ Bed mobility':
            this.helperCognitiveGroup(5, id, str);
            break;
          case '4800. Moving':
            this.helperCognitiveGroup(6, id, str);
            break;
        }
      });

      let i = 0;
      str.forEach(question => {
        if (question != 0 && !this.edit) {
          i++;
        }
      });

      if (
        (this.bedsInRoom == null || this.prices.length <= 0 || i != 7) &&
        !this.edit
      ) {
        this.$refs.profiling.validate();
        i = 0;
      } else {
        this.dialog = true;
      }
    },

    saveProfilingResult() {
      let db = firebase.firestore();
      if (this.name <= 0) {
        this.$refs.form.validate();
      } else {
        if (this.edit) {
          db.collection('profilingSurveys')
            .doc(this.profileId)
            .update({
              languages: i18n.locale == 'lv' ? 'Latvian' : 'Russian',
              name: this.name,
              notes: this.notes || '',
              answers: this.Gir,
              lastUpdate: new Date(),
              updatedBy: this.currentUserData.displayName,
              bedsInRoom: this.bedsInRoom,
              priceGroup: this.priceGroup,
              girFormatted: this.girFormatted,
              dayPrice: this.dayPrice,
              monthPrice: this.monthPrice,
            });
          alert('Profils Izlabots!');
        } else {
          db.collection('profilingSurveys').add({
            languages: i18n.locale == 'lv' ? 'Latvian' : 'Russian',
            name: this.name,
            notes: this.notes || '',
            answers: this.Gir,
            lastUpdate: new Date(),
            updatedBy: this.currentUserData.displayName,
            bedsInRoom: this.bedsInRoom,
            priceGroup: this.priceGroup,
            girFormatted: this.girFormatted,
            dayPrice: this.dayPrice,
            monthPrice: this.monthPrice,
          });
          alert('Profils saglabāts!');
        }
      }
    },

    profilingHistory() {
      this.saving = false;
      let db = firebase.firestore();
      var profRef = db.collection('profilingSurveys');

      profRef.orderBy('lastUpdate', 'desc').onSnapshot(snap => {
        let profilingSurveysL = {};
        snap.forEach(doc => {
          profilingSurveysL[doc.id] = doc.data();
        });
        this.profilingSurveys = Object.assign({}, profilingSurveysL);
      });
      this.dialog = true;
    },

    closeDialog() {
      this.$refs.profiling.reset();
      this.$refs.userInfo.reset();
      this.edit = false;
      this.dialog = false;
    },

    close() {
      this.dialog = false;
    },

    getBedsInRoom(event) {
      this.change = true;
      this.bedsInRoom = event;
    },

    getPrices(event) {
      if (event != undefined) {
        this.change = true;
        (this.priceGroup = event.name), (this.prices = event.prices);
      }
    },

    calculateGir($event, id) {
      if ($event != undefined) {
        let str = [...this.Gir];
        str[id] = $event.value;
        this.Gir = str;
        this.Gir = str.join('');

        girCode.forEach(gir => {
          if (gir.A === this.Gir) {
            this.GirValue = gir.B;
            girAlfabetic.forEach(x => {
              if (x.gir == this.GirValue) {
                this.girFormatted = x.value;
              }
            });
          }
        });
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
<style scoped>
.d-flex.col-sm-5.col-12 {
  padding: 0 5px !important;
}
.theme--light.v-card > .v-card__text,
.theme--light.v-card .v-card__subtitle {
  color: black;
}

.v-icon {
  padding-left: 7px;
}

.position-btn {
  margin-left: auto !important;
}
</style>
