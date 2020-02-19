<template>
  <!-- search -->
  <v-card v-if="Object.keys(displayValues).length>0">
    <v-row justify="center" align="center">
      <v-col cols="12" md="6" lg="4">
        <v-text-field prepend-icon="search" clearable v-model="searchValue"></v-text-field>
      </v-col>
    </v-row>
    <!-- list -->
    <v-row justify="center" align="center">
      <v-col cols="12" md="6">
        <v-list two-line>
          <v-list-item v-for="(task, taskId) in displayValues" :key="taskId">
            <v-list-item-content>
              <v-list-item-title>
                <span
                  :class="'task-group-'+task.taskNumber.toString().slice(0,1)"
                >{{task.taskNumber}}</span>
                - {{task.taskName}}
              </v-list-item-title>
              <v-list-item-subtitle v-if="sudo">
                <small>{{taskId}}</small>
              </v-list-item-subtitle>
              <v-list-item-subtitle>{{task.taskType}}, {{task.taskDirect}}, {{task.taskOperationsGroup}}, {{task.taskGroup}},</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action @click="editTask(taskId)">
              <v-icon small>edit</v-icon>
            </v-list-item-action>
            <v-list-item-action @click="deleteTask(taskId)">
              <v-icon small>delete_forever</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
export default {
  props: ['tasks'],
  data() {
    return {
      searchValue: null,
    };
  },
  computed: {
    displayValues: function() {
      var vm = this;
      var displayL = {};

      if (vm.searchValue != null) {
        if (vm.searchValue.length > 1) {
          var ids = Object.keys(vm.tasks);
          for (var t = 0; t < ids.length; t++) {
            const searchString =
              vm.tasks[ids[t]].taskName + vm.tasks[ids[t]].taskNumber;
            if (
              searchString
                .toLowerCase()
                .indexOf(vm.searchValue.toLowerCase()) !== -1
            ) {
              displayL[ids[t]] = vm.tasks[ids[t]];
            }
          } //end for
        } else {
          displayL = Object.assign({}, vm.tasks);
        }
      } else {
        displayL = Object.assign({}, vm.tasks);
      }

      return displayL;
    },
  },
  methods: {
    deleteTask(taskId) {
      //update in parent component
      this.$emit('deleteTask', taskId);
    },
    editTask(taskId) {
      //update in parent component
      this.$emit('editTask', taskId);
    },
  },
};
</script>

