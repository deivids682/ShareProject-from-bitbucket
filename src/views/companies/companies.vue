<template>
  <v-container>
    <h1>Uzņēmumi</h1>
    <template>
      <v-btn style="margin-bottom: 1rem" color="primary" @click="dialog = true">Pievienot uzņēmumu</v-btn>
    </template>
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-card>
      <v-card-title>
        <v-text-field v-model="search" append-icon="search" label="Meklēt" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table :headers="headers" :items="companies" :search="search">
        <template v-slot:item.action="{ item }">
          <v-icon small class="mr-2" @click="edit(item)">edit</v-icon>
          <v-icon small @click="deleteItem(item)">delete</v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Pievienot uzņēmumu</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-form ref="form" lazy-validation id="form">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      label="Nosaukums*"
                      :rules="RulesRequired"
                      v-model="title"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      label="Reģistrācijas numurs*"
                      :rules="RulesRequired"
                      v-model="registrationNumber"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field label="Adrese*" :rules="RulesRequired" v-model="address" required></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field label="Bankas nosaukums" v-model="bankName"></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field label="Bankas konts" v-model="bankAccountNumber"></v-text-field>
                  </v-col>
                </v-row>
              </v-form>
            </v-container>
            <small>*Atzimēti obligāti aizpildāmie lauki</small>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="close()">Aizvert</v-btn>
            <v-btn color="primary" text @click="save()">Saglabāt</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
  </v-container>
</template>
<script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  data: () => ({
    search: '',
    checkEdit: false,
    dialog: false,
    title: null,
    registrationNumber: null,
    address: null,
    bankName: null,
    bankAccountNumber: null,
    company: [],
    //snackbar
    snackbar: false,
    snackbarTimeout: 6000,
    snackbarColor: '',
    snackbarTxt: '',
    companies: [],
    RulesRequired: [validate => !!validate || 'Nepieciešams aizpildīt!'],
    headers: [
      {
        text: 'Nosaukums',
        align: 'left',
        value: 'title',
      },
      { text: 'Reģistrācijas numurs', value: 'registrationNumber' },
      { text: 'Pedējo reizi rediģēja', value: 'updatedBy' },
      { text: 'Rediģēšanas datums', value: 'updatedAtFormated' },
      { text: 'Labot / Dzest', value: 'action', sortable: false },
    ],
  }),

  async created() {
    let db = firebase.firestore();

    let companiesRef = db
      .collection('companies')
      .orderBy('updatedAt', 'desc')
      .get();
    let values = await Promise.all([companiesRef]);

    let companiesL = [];
    values[0].forEach(function(doc) {
      let data = doc.data();
      data['id'] = doc.id;
      companiesL.push(data);
    });
    this.companies = companiesL;
  },

  methods: {
    close() {
      this.$refs.form.reset();
      this.dialog = false;
    },

    async save() {
      if (
        this.title == null ||
        this.registrationNumber == null ||
        this.address == null
      ) {
        this.$refs.form.validate();
      } else {
        //save to firebase
        let db = firebase.firestore();
        let company = {
          title: this.title,
          registrationNumber: this.registrationNumber,
          address: this.address,
          bankName: this.bankName || null,
          bankAccountNumber: this.bankAccountNumber || null,
          updatedAtFormated: this.formatDate(
            new Date().toISOString().substr(0, 10)
          ),
          updatedAt: new Date(),
          updatedBy: this.currentUserData.displayName,
        };
        if (this.checkEdit) {
          try {
            db.collection('companies')
              .doc(this.companyId)
              .update(company);

            let objIndex = this.companies.findIndex(
              obj => obj.id == this.companyId
            );
            company['id'] = this.companyId;
            this.companies[objIndex] = company;
            this.companies = [...this.companies];

            //enable snackbar
            this.snackbar = true;
            this.snackbarColor = 'success';
            this.snackbarTxt = 'Uzņēmuma dati atjaunināti!';
          } catch (error) {
            console.log(error);
          }
          this.close();
          this.checkEdit = false;
        } else {
          try {
            db.collection('companies')
              .add(company)
              .then(function(doc) {
                company['id'] = doc.id;
              });
            this.companies = [company, ...this.companies];
            //enable snackbar
            this.snackbar = true;
            this.snackbarColor = 'success';
            this.snackbarTxt = 'Uzņēmums pievienots!';
            this.close();
          } catch (error) {
            console.log(error);
          }
        }
      }
    },
    
    edit(item) {
      this.checkEdit = true;
      this.title = item.title;
      this.registrationNumber = item.registrationNumber;
      this.address = item.address;
      this.bankName = item.bankName;
      this.bankAccountNumber = item.bankAccountNumber;
      this.companyId = item.id;
      this.dialog = true;
    },

    async deleteItem(item) {
        //save to firebase
        let db = firebase.firestore();

        let clientsRef = db.collection('clients')
          .where('clientForCompany', '==', item.id)
          .get();
        let values = await Promise.all([clientsRef]);

        let clients = [];
        values[0].forEach(function(doc) {
        let data = doc.data();
        data['id'] = doc.id;
        clients.push(data);
        });
        if(clients.length === 0){
            db.collection('companies')
            .doc(item.id)
            .delete();
        let objIndex = this.companies.findIndex(
              obj => obj.id == item.id
            );
        this.companies  = this.companies.filter(companie => companie !== this.companies[objIndex])   
        }
        else {
             //don't allow to delete
            var clientNames = '';
            clients.forEach(client => {
              clientNames += ` ${client.clientName},`;
            });
            alert(
              `Kamēr uzņēmumam ir piesaistīti klienti: ${clientNames} tikmēr dzēst nedrīkst!`
            );
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