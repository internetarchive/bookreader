// Import the node-fetch module
const fetch = require('node-fetch');

// Define the URL of the remote JSON file
const url = 'https://127.0.0.1:8000/BookReaderDemo/laboratory.json';

// Create the BookReader object
function instantiateBookReader(selector, extraOptions) {
  selector = selector || '#BookReader';
  extraOptions = extraOptions || {};

// Fetch the JSON file and parse it into a JavaScript object
fetch(url)
  .then(response => response.json())
  .then(options => {
    // The 'data' variable contains the parsed JSON as a JavaScript object
    console.log(data);
  })
  .catch(error => {
    console.error('Error fetching the JSON file:', error);
  });
  $.extend(options, extraOptions);
  var br = new BookReader(options);
  br.init();
}
