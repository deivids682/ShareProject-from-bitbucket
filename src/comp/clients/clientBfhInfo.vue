<template>
  <v-row align="center" justify="center">
    <!-- snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout">
      {{ snackbarTxt }}
      <v-btn dark text @click="snackbar = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
    <v-col cols="12" sm="6">
      <v-card>
        <v-card-text>
          <!--Progress bar -->
          <v-row>
            <v-col cols="12" v-if="progressBar">
              <v-progress-linear :indeterminate="true"></v-progress-linear>
            </v-col>
          </v-row>

          <!-- additional information form -->
          <template v-if="!progressBar">
            <v-form ref="form" v-model="valid" lazy-validation id="form">
              <v-row justify="space-between">
                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.personalCode"
                    label="Personas kods"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('personalCode')"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="5">
                  <v-dialog
                    v-model="birthDateDialog"
                    :close-on-content-click="false"
                    persistent
                    width="290px"
                  >
                    <template v-slot:activator="{ on }">
                      <v-text-field
                        v-model="birthDateFormatted"
                        label="prieksh share"
                        readonly
                        v-on="on"
                        append-outer-icon="clear"
                        @click:append-outer="deleteFieldFromForm('birthDate')"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="clientData.birthDate"
                      @input="birthDateDialog = false"
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      first-day-of-week="1"
                    ></v-date-picker>
                  </v-dialog>
                </v-col>

                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.contactPersonName"
                    label="prieksh share"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('contactPersonName')"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.contactPersonContacts"
                    label="prieksh share"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('contactPersonContacts')"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.doctorName"
                    label="prieksh share"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('doctorName')"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    :readonly="!admin&&!manager"
                    v-on:change="update()"
                    v-model="clientData.doctorContacts"
                    label="Ģprieksh share"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('doctorContacts')"
                  ></v-text-field>
                </v-col>

                <!-- NBH && RD -->
                <template
                  v-if="clientData.clientServices == 'neighborhood' && clientData.clientProfile == 'Rīgas Dome'"
                >
                  <v-col cols="12" md="5">
                    <v-select
                      v-model="clientData.rsdDistrict"
                      :items="rsdDistrictsSelect"
                      label="prieksh share"
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.rsdEquipment"
                      type="number"
                      label="prieksh share"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-model="clientData.rsdEnvironmentPlan"
                      v-on:change="update()"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.rsdEnvironmentPlanDescription"
                      label="prieksh share"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-model="clientData.priekshshare"
                      v-on:change="update()"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-textarea
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.priekshshare"
                      label="prieksh share"
                    ></v-textarea>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-model="clientData.rsdMonitoring"
                      v-on:change="update()"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-textarea
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.rsdMonitoringDescription"
                      label="prieksh share"
                    ></v-textarea>
                  </v-col>
                </template>

                <v-col cols="12" md="12">
                  <v-text-field
                    v-on:change="update()"
                    v-model="clientData.religion"
                    label="prieksh share"
                    append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('religion')"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="12">
                  <v-select
                    :items="companies"
                    v-on:change="update()"
                    label="Uzņēmums"
                    item-text="title"
                    item-value="id"
                    v-model="clientData.clientForCompany"
                  ></v-select>
                </v-col>

                <!-- BFH -->
                <template v-if="clientData.clientServices == 'bfh'">
                  <v-col cols="12" md="5">
                    <v-dialog
                      v-model="deathDateDialog"
                      :close-on-content-click="false"
                      persistent
                      width="290px"
                    >
                      <template v-slot:activator="{ on }">
                        <v-text-field
                          v-model="priekshshare"
                          label="prieksh share"
                          readonly
                          v-on="on"
                          append-outer-icon="clear"
                          @click:append-outer="deleteFieldFromForm('prieksh share')"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="clientData.deathDate"
                        @input="deathDateDialog = false"
                        :readonly="!admin&&!manager"
                        v-on:change="update()"
                        first-day-of-week="1"
                      ></v-date-picker>
                    </v-dialog>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-dialog
                      v-model="leftDateDialog"
                      :close-on-content-click="false"
                      persistent
                      width="290px"
                    >
                      <template v-slot:activator="{ on }">
                        <v-text-field
                          v-model="leftDateFormatted"
                          label="prieksh share"
                          readonly
                          v-on="on"
                          append-outer-icon="clear"
                          @click:append-outer="deleteFieldFromForm('leftDate')"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="clientData.leftDate"
                        @input="leftDateDialog = false"
                        :readonly="!admin&&!manager"
                        v-on:change="update()"
                        first-day-of-week="1"
                      ></v-date-picker>
                    </v-dialog>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.priekshshare"
                      label="prieksh share"
                      append-outer-icon="clear"
                      @click:append-outer="deleteFieldFromForm('prieksh share')"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.outToSAC"
                      label="prieksh share"
                      append-outer-icon="clear"
                      @click:append-outer="deleteFieldFromForm('prieksh share')"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.outToHome"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.rdSupport"
                      label="Saņem RD atbalstu"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5" v-if="clientData.rdSupport">
                    <v-dialog
                      v-model="rdSupportDateDialog"
                      :close-on-content-click="false"
                      persistent
                      width="290px"
                    >
                      <template v-slot:activator="{ on }">
                        <v-text-field
                          v-model="rdSupportDateFormatted"
                          label="prieksh share"
                          readonly
                          v-on="on"
                          append-outer-icon="clear"
                          @click:append-outer="deleteFieldFromForm('rdSupportDate')"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="clientData.rdSupportDate"
                        @input="rdSupportDateDialog = false"
                        :readonly="!admin&&!manager"
                        v-on:change="update()"
                        first-day-of-week="1"
                      ></v-date-picker>
                    </v-dialog>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.initialPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      label="prieksh share"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.pension"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Pensijas apmērs, EUR"
                      append-outer-icon="clear"
                      @click:append-outer="deleteFieldFromForm('pension')"
                    ></v-text-field>
                  </v-col>
                  <v-text-field
                  	:readonly="!admin&&!manager"
                  	v-on:change="update()"
                  	v-model="clientData.otherIncome"
                  	type="number"
                  	step="0.01"
                  	min="0"
                  	label="prieksh share"
                  	append-outer-icon="clear"
                    @click:append-outer="deleteFieldFromForm('prieksh share')"
                	></v-text-field>

                  <!-- passport -->
                  <v-col cols="12">
                    <v-label>Pases kopija</v-label>
                    <photo-form
                      :docId="clientId"
                      :collection="'clients'"
                      :urlPath="'clientPassportPhotoUrl'"
                      :photoUrl="clientData.clientPassportPhotoUrl"
                      :filePath="'/clientPassportPhoto/' + clientId + '/clientPassportPhotoUrl/'"
                      @updatePhoto="updatePhoto"
                      v-if="!progressBar && clientId!= 'new_client'"
                    ></photo-form>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasAgreement"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasDeposit"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasXray"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasInfectionReport"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasDiphtheriaReport"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasHepatitReport"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasOtherVaccineReport"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasInfectionReport"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasClothing"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-checkbox
                      :readonly="!admin&&!manager"
                      v-on:change="update()"
                      v-model="clientData.hasHygene"
                      label="prieksh share"
                    ></v-checkbox>
                  </v-col>
                </template>
              </v-row>
            </v-form>
          </template>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

          <script>
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import PhotoForm from '@/comp/clients/photoForm.vue';
export default {
  props: ['clientId', 'loadedClientData'],
  components: {
    PhotoForm,
  },
  data() {
    return {
      //setup
      progressBar: true,
      valid: true,
      companies: [],
      clientData: {},

      //dates
      birthDateDialog: false,
      deathDateDialog: false,
      birthDateFormatted: null,
      deathDateFormatted: null,
      leftDateFormatted: null,
      rdSupportDateFormatted: null,
      leftDateDialog: false,
      rdSupportDateDialog: false,

      //nbh
      rsdDistrictsSelect: [
        'TC "prieksh share"',
      ],

      //snackbar
      snackbar: false,
      snackbarTimeout: 5000,
      snackbarColor: '',
      snackbarTxt: '',
    };
  },
  async created() {
    var vm = this;
    var db = firebase.firestore();
    //get client data
    if (vm.clientId != 'new_client') {
      vm.clientData = Object.assign({}, vm.loadedClientData);
      vm.birthDateFormatted = this.formatDate(vm.clientData.birthDate);
      vm.deathDateFormatted = this.formatDate(vm.clientData.deathDate);
      vm.leftDateFormatted = this.formatDate(vm.clientData.leftDate);
      vm.rdSupportDateFormatted = this.formatDate(vm.clientData.rdSupportDate);
    }

    let companiesRef = db.collection('companies').get();
    let values = await Promise.all([companiesRef]);

    let companiesL = [];
    values[0].forEach(function(doc) {
      let data = doc.data();
      data['id'] = doc.id;
      companiesL.push(data);
    });
    this.companies = companiesL;
    this.companies = [
      {
        title: '',
        id: null,
      },
      ...this.companies,
    ];

    vm.progressBar = false;
  },
  watch: {
    'clientData.birthDate': function(val, oldVal) {
      this.birthDateFormatted = this.formatDate(val);
    },
    'clientData.deathDate': function(val, oldVal) {
      this.deathDateFormatted = this.formatDate(val);
    },
    'clientData.leftDate': function(val, oldVal) {
      this.leftDateFormatted = this.formatDate(val);
    },
    'clientData.rdSupportDate': function(val, oldVal) {
      this.rdSupportDateFormatted = this.formatDate(val);
    },
  },
  methods: {
    deleteFieldFromForm(fieldId) {
      var vm = this;
      var conf = confirm(
        vm.currentUserData.displayName + ', vēlies izdzēst lauciņu?'
      );
      if (conf) {
        try {
          delete vm.clientData[fieldId];
          vm.update();
        } catch (error) {
          console.log(error);
        }
      }
    },
    update() {
      if (this.$refs.form.validate()) {
        try {
          var vm = this;
          var db = firebase.firestore();

          //update info
          if (vm.clientId != 'new_client' && vm.admin) {
            vm.clientData.lastUpdate = new Date();
            vm.clientData.lastUser = vm.currentUserData.displayName;
            if (vm.clientData.rdSupportDate) {
              vm.clientData.rdSupportDateRaw = new Date(
                vm.clientData.rdSupportDate
              );
            } else {
              //delete raw date
              delete vm.clientData['rdSupportDateRaw'];
            }

            db.collection('clients')
              .doc(vm.clientId)
              .set(vm.clientData);

            //update in parent obj
            vm.$emit('updateClientData', vm.clientData);

            //enable snackbar
            vm.snackbarColor = 'success';
            vm.snackbarTxt = 'Informācija saglabāta!';
            vm.snackbar = true;
          }
        } catch (error) {clientBfhInfo
          console.log(error);
        }
      }
    },
    updatePhoto(newPhotoUrl) {
      this.clientData.clientPassportPhotoUrl = newPhotoUrl;
    },
    formatDate(date) {
      if (!date) return null;

      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}.`;
    },
  },
};
</script>
