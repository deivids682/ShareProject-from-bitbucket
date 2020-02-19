<template>
  <v-card height="100%">
    <br>
      <ul class="no-bullet-ul">
        <li v-if="total">
          <h4>Klienti: {{numberOfClients}}</h4>
        </li>
        <li>
          <h4>Vizītes kopā: {{Object.keys(visits).length}}</h4>
        </li>
      </ul>
    <br>
    <v-divider></v-divider>
    <br>
    <ul class="no-bullet-ul">
      <li>
        <strong>Uzdevumi kopā: {{statsData.total || '0'}}</strong>
      </li>
      <li>Ar palīdzību: {{statsData.assisted || '0'}}</li>
      <li>Uzraudzībā: {{statsData.supervised || '0'}}</li>
      <li>Patstāvīgi: {{statsData.independent || '0'}}</li>
      <li>Netiešie: {{statsData.doneIdr || '0' }}</li>
      <li>Atcelti: {{statsData.canceled || '0'}}</li>
      <li>Pārcelti: {{statsData.postponed|| '0' }}</li>
      <li>Neatzīmēti: {{statsData.open || '0'}}</li>
    </ul>
  </v-card>
</template>

<script>
export default {
  props: ["statsData", "visits", "total"],
  data() {
    return {
      numberOfClients: 0
    };
  },
  created() {
    var vm = this;
    //calculate number of clients
    //loop visits and store different client ids
    var clients = [];
    for (var visitId in vm.visits) {
      const clientId = vm.visits[visitId].clientId;
      if (clients.indexOf(clientId) == -1) {
        clients.push(clientId);
      }
    }
    vm.numberOfClients = clients.length;
  }
};
</script>

<style>
.stat-tile {
  margin: 0px !important;
  padding: 0px !important;
}
</style>


