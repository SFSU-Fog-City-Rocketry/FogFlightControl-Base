import fs from 'fs';
import zipfolder from 'zip-folder';

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

zipfolder('.', './dist/Plugin.zip', function(err) {
  if(err) {
    console.log('Error: ', err);
  } else {
    console.log('Done!');
  }
});