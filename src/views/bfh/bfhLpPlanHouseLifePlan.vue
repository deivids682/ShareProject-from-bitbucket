<template>
  <lpPlanClientLifePlan
  :service="'bfh'"
  :typeOfTask="'residences'">
  </lpPlanClientLifePlan>
</template>

<script>
import lpPlanClientLifePlan from '@/views/clients/lpPlanClientLifePlan';

export default {
  components: {
    lpPlanClientLifePlan,
  },
}

</script>