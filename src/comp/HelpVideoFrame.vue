<template>
  <v-layout wrap>
    <v-flex xs12 sm6 offset-sm3>
    <v-card>
      <v-card-title primary-title><h3>{{videoTitle}}</h3></v-card-title>
      <div class="video-container">
      <iframe
        :src="videoSource"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      </div>
    </v-card>
    </v-flex>
    <v-flex xs12>
      <v-divider></v-divider>
    </v-flex>
  </v-layout>
</template>


<script>
export default {
  props: ["videoTitle", "videoSource"]
};
</script>

<style>
.video-container {
    position:relative;
    padding-bottom:56.25%;
    padding-top:30px;
    height:0;
    overflow:hidden;
    
}

.video-container iframe, .video-container object, .video-container embed {
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height:100%;
}
</style>
