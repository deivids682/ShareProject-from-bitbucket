const admin = require('firebase-admin');

module.exports.changedDistrictName = async function(districtId, newValue) {
  return new Promise(async resolve => {
    try {
      //change district name in client profiles
      //get all clients with districtId and assign new name
      const db = admin.firestore();
      var clientsSnap = await db
        .collection('clients')
        .where('clientDistrict', '==', districtId)
        .get();

      clientsSnap.forEach(client => {
        db.collection('clients')
          .doc(client.id)
          .update({ clientDistrictName: newValue.name });
      });

      resolve('end main Promise');
      return 'promises updated';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.changedDistrictColor = async function(districtId, newValue) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      var clientsSnap = await db
        .collection('clients')
        .where('clientDistrict', '==', districtId)
        .get();

      clientsSnap.forEach(client => {
        db.collection('clients')
          .doc(client.id)
          .update({ clientColor: newValue.color });
      });

      resolve('end main Promise');
      return 'promises updated';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

module.exports.changedRooms = async function(districtId, oldValue, newValue) {
  return new Promise(async resolve => {
    try {
      const db = admin.firestore();
      var oldRooms = Object.keys(oldValue.rooms);
      var newRooms = Object.keys(newValue.rooms);
      var oldKey = '';
      var newKey = '';

      if (oldRooms.length === newRooms.length) {
        //find edited room
        newRooms.forEach(async roomId => {
          if (newValue.rooms[roomId].name !== oldValue.rooms[roomId].name) {
            //eddited room
            var clientsSnap = await db
              .collection('clients')
              .where('bfhRoom.roomId', '==', roomId)
              .get();

            clientsSnap.forEach(client => {
              db.collection('clients')
                .doc(client.id)
                .update({
                  'bfhRoom.roomName': newValue.rooms[roomId].name,
                });
            });
          }
        });
      }

      resolve('end main Promise');
      return 'promises updated';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};
