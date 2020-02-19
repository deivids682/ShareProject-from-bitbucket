import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// import logo
import { logoImg } from '@/helpers/logoImg.js';

export const cleaningPDF = (cleaningData) => {
  return new Promise(async (resolve) => {
    // generate file name 'name_surname_date.pdf'
    const fileName =
      cleaningData.clientName.split(' ').join('_') +
      '_' +
      cleaningData.dateFormatted +
      '.pdf';

    // logo
    const logo = logoImg();

    // company and client info
    const compInfo = [
      {
        type: 'none',
        ul: [

        ],
      },
      {
        type: 'none',
        ul: [
          { text: cleaningData.clientName, style: ['bold'] },
          cleaningData.clientAddress,
        ],
      },
    ];

    // loop tasks
    const tasks = [];
    if (typeof cleaningData.tasks != 'undefined') {
      // sort tasks
      const sortedTasks = sortTasks(cleaningData.tasks);

      // add title row
      tasks.push({ text: 'Uzdevumi', style: ['bold'] });

      const preparedPhotos = await preparePhotos(sortedTasks);
      tasks.push(preparedPhotos);
    }

    // add comment
    const comment = [];
    if (cleaningData.comment.length > 0) {
      comment.push(
        { text: 'Komentārs', style: ['bold'] },
        cleaningData.comment
      );
    }

    // generate form to sign given equipment
    const docDefinition = {
      content: [
        // logo
        logo,
        ' ',
        // Report date
        {
          text: 'Atskaite par tīrīšanu ' + cleaningData.dateFormatted,
          style: 'header',
        },
        ' ',
        ' ',
        // company and client info
        { columns: compInfo },
        ' ',
        ' ',
        // tasks
        tasks,
        ' ',
        ' ',
        // comment
        comment,
      ],
      defaultStyle: {
        fontSize: 10,
      },
      styles: {
        header: {
          fontSize: 12,
          bold: true,
          alignment: 'center',
        },
        center: {
          alignment: 'center',
        },

        right: {
          alignment: 'right',
        },
        bold: {
          bold: true,
        },
        sectionHeader: {
          bold: true,
        },
      },
    };

    const pdf = pdfMake.createPdf(docDefinition);
    pdf.download(fileName);

    resolve(' ');
  }); // end promise
};

function preparePhotos(sortedTasks) {
  return new Promise(async (resolve) => {
    const resArr = [];
    for (let i = 0; i < sortedTasks.length; i++) {
      try {
        const photoBefore = await toDataURL(sortedTasks[i].value.photoBefore);
        const photoAfter = await toDataURL(sortedTasks[i].value.photoAfter);

        Promise.all([photoBefore, photoAfter]).then(function (values) {
          const photoBeforeValue = values[0];
          const photoAfterValue = values[1];
          // task title row
          resArr.push(sortedTasks[i].value.text);

          // photos before and after in columns
          const beforeAfterPhotoRow = {
            columns: [photoBeforeValue, photoAfterValue],
          };
          resArr.push(beforeAfterPhotoRow);
          resArr.push(' ');
        });
      } catch (error) {
        console.log('error' + error);
      }
    } // end for sorted tasks
    resolve(resArr);
  });
}

function toDataURL(src) {
  return new Promise((resolve) => {
    if (typeof src == 'undefined' || src == '') {
      resolve('');
    } else {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
          const canvas = document.createElement('CANVAS');
          const ctx = canvas.getContext('2d');
          let dataURL;
          canvas.height = this.naturalHeight;
          canvas.width = this.naturalWidth;
          ctx.drawImage(this, 0, 0);
          dataURL = canvas.toDataURL('image/jpeg');
          resolve({ image: dataURL, fit: [150, 150] });
        };
        img.src = src;
        if (img.complete || img.complete === undefined) {
          img.src =
            'prieksh share';
          img.src = src;
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
}

function sortTasks(obj) {
  const arr = [];
  let prop;
  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      arr.push({
        key: prop,
        value: obj[prop],
      });
    }
  }

  arr.sort(function (a, b) {
    const x = a.value.text.toLowerCase();
    const y = b.value.text.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return arr; // returns array
}
