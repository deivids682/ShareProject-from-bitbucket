<template>
  <v-container>
    <v-row>
      <v-flex xs12 sm6 offset-sm3>
        <v-btn @click="showForm = !showForm" color="info">Pievienot jaunu klientu</v-btn>
      </v-flex>
    </v-row>

    <client-form :clientId="'new_client'" :loadedClientData="null" v-if="showForm"></client-form>
  </v-container>
</template>

<script>
import ClientForm from '@/comp/clients/clientForm.vue';
export default {
  components: {
    ClientForm,
  },
  data() {
    return {
      //setup
      showForm: false,
    };
  },
};
</script>