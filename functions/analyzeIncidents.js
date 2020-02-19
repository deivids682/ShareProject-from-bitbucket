//alert MB,KK if yesterday was incident with App

const admin = require('firebase-admin');
//for email service
var mailgun = require('mailgun-js')({
  apiKey: 'prieksh share',
  domain: 'prieksh share',
});

module.exports.alertForAppIncidents = async function() {
  return new Promise(async resolve => {
    try {
      console.log('START alert for app type incidents...');
      var db = admin.firestore();

      //generate date
      //triggering 1am, Riga +3 hours from UTC time, thus for server is today, but for Riga it's yesterday
      const today = formatDate(new Date());

      var incidentsSnap = await db
        .collection('incidents')
        .where('dateFormatted', '==', today)
        .get();

      var appIncidents = {};
      incidentsSnap.forEach(inc => {
        if (inc.data().incident === 'Tehniskas problēmas (lietotne)') {
          appIncidents[inc.id] = inc.data();
        }
      });

      if (Object.keys(appIncidents).length > 0) {
        const emailTitle = 'App incidenti no ' + today;
        var emailText =
          '<p>App incidenti no ' +
          today +
          '</p>' +
          '<h4>Incidenti - Tehniskas problēmas (lietotne)</h4>';
        for (var incId in appIncidents) {
          const inc = appIncidents[incId];
          emailText +=
            '<li>' +
            inc.user +
            ' pie ' +
            inc.clientName +
            '. Komentārs: ' +
            inc.comment +
            '</li>';
        }

        sendEmail(emailTitle, emailText);
      } //end if incidents

      console.log('END alert for app type incidents');
      resolve('end main Promise');
    } catch (error) {
      console.log(error);
    } //end catch error
  }); //end promise
};

function sendEmail(title, text) {
  var sendToMB = 'prieksh share';
  var sendToMBKK = 'prieksh share, prieksh share';
  const data = {
    from: 'prieksh share',
    to: sendToMBKK,
    subject: title,
    html: text,
  };

  mailgun.messages().send(data, (error, body) => {
    console.log(body);
  });
}

function formatDate(inpDate) {
  var shiftDate = new Date(inpDate);
  const year = shiftDate.getFullYear();
  var month = shiftDate.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  var date = shiftDate.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  return date + '.' + month + '.' + year + '.';
}
