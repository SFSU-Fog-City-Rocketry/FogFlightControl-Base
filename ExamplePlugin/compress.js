import zipfolder from 'zip-folder';

zipfolder('.', './Plugin.zip', function(err) {
  if(err) {
    console.log('Error: ', err);
  } else {
    console.log('Done!');
  }
});