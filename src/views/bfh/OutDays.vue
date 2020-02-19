<template>
  <v-container>
    <h1>Izbraukuma dienas</h1>
    <v-btn
      color="primary"
      style="margin-bottom: 0.5rem"
      dark
      @click="saveOutDays()"
    >Pievienot ierakstu</v-btn>
    <template>
      <v-row justify="center">
        <v-dialog v-model="dialog" max-width="600">
          <v-card>
            <v-card-title class="headline" align="center">Pievienot izbraukuma dienu</v-card-title>
            <v-card-text align="center">
              <v-form ref="outDays" lazy-validation>
                <v-select
                  :items="loadedClientGroups"
                  item-text="clientName"
                  item-value="id"
                  v-model="clientId"
                  :rules="[rules.required]"
                  filled
                  label="Klients"
                  return-object
                ></v-select>
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="dateFormatted"
                      label="Izbraukuma diena"
                      persistent
                      readonly
                      :rules="[rules.required]"
                      prepend-icon="event"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="date"
                    no-title
                    @input="menu = false"
                    first-day-of-week="1"
                  ></v-date-picker>
                </v-menu>
                <v-textarea v-model="comment" :rules="[rules.required]" label="Komentārs"></v-textarea>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="error" text @click="close()">Aizvert</v-btn>
              <v-btn color="primary" text @click="save()">Saglabāt</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
      <!-- select how many data -->
    </template>
    <v-data-table
      :headers="headers"
      :items="residentOffDays"
      :search="search"
      sort-by="lastUpdated"
      :sort-desc="true"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-layout row wrap>
            <v-flex xs6>
              <v-btn-toggle v-model="btnToggle" dark mandatory>
                <v-btn small color="accent" @click="loadData(10)">Pēdējie 10 izbraukumi</v-btn>
                <v-btn small color="accent" @click="loadData('all')">Visi izbraukumi</v-btn>
              </v-btn-toggle>
            </v-flex>
            <v-flex xs6>
              <v-text-field
                v-model="search"
                append-icon="search"
                label="Meklēt"
                single-line
                hide-details
              ></v-text-field>
            </v-flex>
          </v-layout>
        </v-toolbar>
      </template>
      <template
        v-slot:item.lastUpdated="{ item }"
      >{{formatDate(new Date(item.lastUpdated.seconds*1000).toISOString().substr(0, 10))}}</template>
      <template v-slot:item.action="{ item }" v-if="admin || manager">
        <v-icon small class="mr-2" @click="editItem(item)">edit</v-icon>
        <v-icon small @click="deleteItem(item)">delete</v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import undefined from 'firebase/firestore';

export default {
  data() {
    return {
      dialog: false,
      clientId: null,
      outDay: null,
      comment: null,
      name: '',
      menu: null,
      date: new Date().toISOString().substr(0, 10),
      dateFormatted: this.formatDate(new Date().toISOString().substr(0, 10)),
      limit: null,
      valid: null,
      edit: false,
      editData: null,
      dataId: null,
      search: '',
      residentOffDays: [],
      loadedClientGroups: [],
      btnToggle: 0,
      rules: {
        required: value => !!value || 'Nepieciešams aizpildīt.',
      },
      headers: [
        { text: 'Izbraukuma diena', value: 'offDay' },
        { text: 'Klienta vards', value: 'clientName' },
        { text: 'Komentārs', value: 'comment' },
        { text: 'Pedējo reizi rediģēja', value: 'updatedBy' },
        { text: 'Rediģēšanas datums', value: 'lastUpdated' },
        { text: 'Labot / Dzest', value: 'action', sortable: false },
      ],
    };
  },

  async created() {
    this.loadData(10);
    let db = firebase.firestore();
    let dataPromises = [];
    let loadedClientGroupsL = [];

    let clients = db
      .collection('clients')
      .where('clientServices', '==', 'bfh')
      .get();
    dataPromises.push(clients);
    let values = await Promise.all(dataPromises);

    values[0].forEach(function(doc) {
      let data = doc.data();
      data['id'] = doc.id;
      loadedClientGroupsL.push(data);
    });
    this.loadedClientGroups = loadedClientGroupsL;
  },

  watch: {
    date(val) {
      this.dateFormatted = this.formatDate(this.date);
    },
  },

  methods: {
    async loadData(limit) {
      this.limit = limit;
      let db = firebase.firestore();
      let dataPromises = [];
      let residentOffDaysL = [];
      let ref = db
        .collection('residentOffDays')
        .where('service', '==', 'bfh')
        .limit(10);

      if (limit == 'all') {
        ref = db.collection('residentOffDays').where('service', '==', 'bfh');
      }

      dataPromises.push(ref.get());
      let values = await Promise.all(dataPromises);

      values[0].forEach(function(doc) {
        let data = doc.data();
        data['id'] = doc.id;
        residentOffDaysL.push(data);
      });
      this.residentOffDays = residentOffDaysL;
    },

    editItem(item) {
      this.editData = Object.assign({}, item);
      this.dataId = item.id;
      this.edit = true;
      this.clientId = item.clientId;
      this.dateFormatted = item.offDay;
      this.date = new Date(item.offDate.seconds * 1000)
        .toISOString()
        .substr(0, 10);
      this.comment = item.comment;
      this.dialog = true;
    },

    deleteItem(item) {
      var conf = confirm('Vai dzēst izbraukuma dienu?');
      if (conf) {
        let db = firebase.firestore();
        db.collection('residentOffDays')
          .doc(item.id)
          .delete();
        this.loadData(this.limit);
      }
    },

    saveOutDays() {
      this.dialog = true;
    },
    close() {
      this.$refs.outDays.reset();
      this.dialog = false;
      this.edit = false;
    },

    save() {
      let db = firebase.firestore();

      if (
        this.clientId == null ||
        this.dateFormatted == null ||
        this.comment == null
      ) {
        this.$refs.outDays.validate();
      } else {
        if (this.edit) {
          var docId = this.dataId;
          db.collection('residentOffDays')
            .doc(docId)
            .update({
              clientId: this.clientId.id
                ? this.clientId.id
                : this.editData.clientId,
              clientName: this.clientId.clientName
                ? this.clientId.clientName
                : this.editData.clientName,
              service: 'bfh',
              offDay: this.dateFormatted,
              offDate: new Date(this.date),
              comment: this.comment,
              updatedBy: this.currentUserData.displayName,
              lastUpdated: new Date(),
            });
          this.loadData(this.limit);
          alert('Ieraksts saglabāts');
        } else {
          var docId = this.clientId.id + '-' + this.dateFormatted;
          db.collection('residentOffDays')
            .doc(docId)
            .set({
              clientId: this.clientId.id,
              clientName: this.clientId.clientName,
              service: 'bfh',
              offDay: this.dateFormatted,
              offDate: new Date(this.date),
              comment: this.comment,
              updatedBy: this.currentUserData.displayName,
              lastUpdated: new Date(),
            });
          this.loadData(this.limit);
          alert('Ieraksts saglabāts');
        }
      }
    },

    formatDate(date) {
      if (!date) return null;
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },

    parseDate(date) {
      if (!date) return null;
      const [month, day, year] = date.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    },
  },
};
</script>
