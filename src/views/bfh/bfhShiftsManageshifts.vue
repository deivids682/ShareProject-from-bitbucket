<template>
  <shifts-manage-shifts 
  :service="'bfh'">
  </shifts-manage-shifts>
</template>

<script>
//views
import ListTasks from '@/comp/nbh/taskCatalogList.vue';
import ShiftsManageShifts from '@/views/nbh/shiftsManageShifts.vue';

export default {
  components: {
    ShiftsManageShifts,
  },
}

</script>