const admin = require('firebase-admin');

module.exports.changedUserDisplayName = async function(userId, newValue) {
  return new Promise(async resolve => {
    try {
      //change user display name in district manager
      const db = admin.firestore();
      var residencesSnap = await db
        .collection('residences')
        .where('managerId', '==', userId)
        .get();

      residencesSnap.forEach(res => {
        db.collection('residences')
          .doc(res.id)
          .update({ managerName: newValue.displayName });
      });

      resolve('end main Promise');
      return 'promises updated';
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};
