//
// This file shows the minimum you need to provide to BookReader to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the BookReader object
function instantiateBookReader(selector, extraOptions) {
  selector = selector || '#BookReader';
  extraOptions = extraOptions || {};
  var options = {
    ppi: 100,
    data: [
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page001.jpg' },
      ],
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page002.jpg' },
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page003.jpg' },
      ],
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page004.jpg' },
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page005.jpg' },
      ]
    ],

    // Book title and the URL used for the book title link
    bookTitle: 'BookReader Demo',
    bookUrl: '../index.html',
    bookUrlText: 'Back to Demos',
    bookUrlTitle: 'This is the book URL title',

    // thumbnail is optional, but it is used in the info dialog
    thumbnail: '//archive.org/download/BookReader/img/page014.jpg',
    // Metadata is optional, but it is used in the info dialog
    metadata: [
      {label: 'Title', value: 'Open Library BookReader Presentation'},
      {label: 'Author', value: 'Internet Archive'},
      {label: 'Demo Info', value: 'This demo shows how one could use BookReader with their own content.'},
    ],

    // Override the path used to find UI images
    imagesBaseURL: '../BookReader/images/',

    ui: 'full', // embed, full (responsive)

    el: selector,
    
    // Enable text selection plugin
    enablePlugin: true,
    plugins: {
      textSelection: {
        enabled: true,
        // Provide the full DJVU XML URL (if you have it)
        // fullDjvuXmlUrl: '//archive.org/download/your-book-id/your-book-id_djvu.xml',
        // OR provide per-page XML URL
        // singlePageDjvuXmlUrl: '//your-server.com/page-text/{{pageIndex}}.xml',
      }
    }
  };
  
  $.extend(options, extraOptions);
  var br = new BookReader(options);
  
  // CRITICAL: Override getPageText to provide OCR data
  // This is sample data - replace with your actual OCR text
  br.getPageText = function(index) {
    console.log('Getting text for page:', index);
    
    // Sample OCR data for testing
    // In production, you would fetch this from your server or parse from DJVU XML
    const sampleTexts = {
      0: `
        <OBJECT>
          <PARAGRAPH coords="50,100,750,400">
            <LINE coords="50,100,750,140">
              <WORD coords="50,100,150,140">BookReader</WORD>
              <WORD coords="160,100,250,140">Demo</WORD>
              <WORD coords="260,100,380,140">Page</WORD>
            </LINE>
            <LINE coords="50,150,750,190">
              <WORD coords="50,150,120,190">This</WORD>
              <WORD coords="130,150,160,190">is</WORD>
              <WORD coords="170,150,190,190">a</WORD>
              <WORD coords="200,150,280,190">sample</WORD>
              <WORD coords="290,150,350,190">text</WORD>
              <WORD coords="360,150,420,190">layer</WORD>
            </LINE>
            <LINE coords="50,200,750,240">
              <WORD coords="50,200,150,240">Double</WORD>
              <WORD coords="160,200,220,240">click</WORD>
              <WORD coords="230,200,280,240">any</WORD>
              <WORD coords="290,200,360,240">word</WORD>
              <WORD coords="370,200,400,240">to</WORD>
              <WORD coords="410,200,460,240">see</WORD>
              <WORD coords="470,200,520,240">its</WORD>
              <WORD coords="530,200,680,240">definition</WORD>
            </LINE>
            <LINE coords="50,250,750,290">
              <WORD coords="50,250,180,290">Dictionary</WORD>
              <WORD coords="190,250,260,290">mode</WORD>
              <WORD coords="270,250,360,290">allows</WORD>
              <WORD coords="370,250,420,290">you</WORD>
              <WORD coords="430,250,460,290">to</WORD>
              <WORD coords="470,250,560,290">learn</WORD>
              <WORD coords="570,250,620,290">new</WORD>
              <WORD coords="630,250,720,290">words</WORD>
            </LINE>
          </PARAGRAPH>
        </OBJECT>
      `,
      1: `
        <OBJECT>
          <PARAGRAPH coords="50,100,750,400">
            <LINE coords="50,100,750,140">
              <WORD coords="50,100,120,140">Hello</WORD>
              <WORD coords="130,100,210,140">world</WORD>
              <WORD coords="220,100,280,140">from</WORD>
              <WORD coords="290,100,370,140">page</WORD>
              <WORD coords="380,100,430,140">two</WORD>
            </LINE>
            <LINE coords="50,150,750,190">
              <WORD coords="50,150,150,190">Enable</WORD>
              <WORD coords="160,150,300,190">dictionary</WORD>
              <WORD coords="310,150,380,190">mode</WORD>
              <WORD coords="390,150,420,190">to</WORD>
              <WORD coords="430,150,520,190">explore</WORD>
            </LINE>
            <LINE coords="50,200,750,240">
              <WORD coords="50,200,120,240">Test</WORD>
              <WORD coords="130,200,220,240">words</WORD>
              <WORD coords="230,200,320,240">include</WORD>
              <WORD coords="330,200,450,240">beautiful</WORD>
              <WORD coords="460,200,580,240">wonderful</WORD>
              <WORD coords="590,200,720,240">amazing</WORD>
            </LINE>
          </PARAGRAPH>
        </OBJECT>
      `,
      2: `
        <OBJECT>
          <PARAGRAPH coords="50,100,750,400">
            <LINE coords="50,100,750,140">
              <WORD coords="50,100,120,140">Page</WORD>
              <WORD coords="130,100,210,140">three</WORD>
              <WORD coords="220,100,320,140">contains</WORD>
              <WORD coords="330,100,410,140">more</WORD>
              <WORD coords="420,100,510,140">sample</WORD>
              <WORD coords="520,100,590,140">text</WORD>
            </LINE>
            <LINE coords="50,150,750,190">
              <WORD coords="50,150,150,190">Learning</WORD>
              <WORD coords="160,150,260,190">English</WORD>
              <WORD coords="270,150,380,190">vocabulary</WORD>
              <WORD coords="390,150,420,190">is</WORD>
              <WORD coords="430,150,480,190">fun</WORD>
            </LINE>
            <LINE coords="50,200,750,240">
              <WORD coords="50,200,120,240">Try</WORD>
              <WORD coords="130,200,220,240">words</WORD>
              <WORD coords="230,200,280,240">like</WORD>
              <WORD coords="290,200,420,240">happiness</WORD>
              <WORD coords="430,200,560,240">knowledge</WORD>
              <WORD coords="570,200,700,240">wisdom</WORD>
            </LINE>
          </PARAGRAPH>
        </OBJECT>
      `,
      3: `
        <OBJECT>
          <PARAGRAPH coords="50,100,750,400">
            <LINE coords="50,100,750,140">
              <WORD coords="50,100,120,140">Page</WORD>
              <WORD coords="130,100,200,140">four</WORD>
              <WORD coords="210,100,290,140">shows</WORD>
              <WORD coords="300,100,370,140">more</WORD>
              <WORD coords="380,100,500,140">examples</WORD>
            </LINE>
            <LINE coords="50,150,750,190">
              <WORD coords="50,150,180,190">Technology</WORD>
              <WORD coords="190,150,310,190">revolution</WORD>
              <WORD coords="320,150,460,190">innovation</WORD>
              <WORD coords="470,150,580,190">progress</WORD>
            </LINE>
          </PARAGRAPH>
        </OBJECT>
      `,
      4: `
        <OBJECT>
          <PARAGRAPH coords="50,100,750,400">
            <LINE coords="50,100,750,140">
              <WORD coords="50,100,120,140">Final</WORD>
              <WORD coords="130,100,200,140">page</WORD>
              <WORD coords="210,100,260,140">with</WORD>
              <WORD coords="270,100,370,140">sample</WORD>
              <WORD coords="380,100,470,140">content</WORD>
            </LINE>
            <LINE coords="50,150,750,190">
              <WORD coords="50,150,180,190">Adventure</WORD>
              <WORD coords="190,150,310,190">journey</WORD>
              <WORD coords="320,150,460,190">discovery</WORD>
              <WORD coords="470,150,600,190">exploration</WORD>
            </LINE>
          </PARAGRAPH>
        </OBJECT>
      `
    };
    
    try {
      // Get the XML text for this page
      const xmlText = sampleTexts[index] || sampleTexts[0];
      
      // Parse the XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return Promise.resolve(null);
      }
      
      console.log('Successfully parsed XML for page', index);
      return Promise.resolve(xmlDoc.documentElement);
    } catch (error) {
      console.error('Error in getPageText:', error);
      return Promise.resolve(null);
    }
  };
  
  // Initialize BookReader
  br.init();
  
  // Enable text selection plugin after init
  console.log('BookReader initialized, checking for text selection plugin...');
  
  // Check if plugin is available
  if (typeof BookReader !== 'undefined' && BookReader.prototype.plugins) {
    console.log('BookReader.prototype.plugins:', BookReader.prototype.plugins);
  }
  
  // Try to enable the text selection plugin
  setTimeout(function() {
    console.log('Attempting to enable text selection plugin...');
    console.log('br.plugins:', br.plugins);
    
    if (br.plugins && br.plugins.textSelection) {
      console.log('Text selection plugin found!');
      
      // Set plugin options
      br.plugins.textSelection.options.enabled = true;
      
      // Initialize the plugin
      try {
        br.plugins.textSelection.init();
        console.log('Text selection plugin initialized successfully!');
        
        // Force a redraw to show text layers
        setTimeout(function() {
          console.log('Checking for text layers...');
          var textLayers = $(selector).find('.BRtextLayer');
          console.log('Text layers found:', textLayers.length);
          
          if (textLayers.length === 0) {
            console.warn('No text layers rendered yet. They should appear when you navigate pages.');
          } else {
            console.log('Text layers are rendering correctly!');
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing text selection plugin:', error);
      }
    } else {
      console.error('Text selection plugin NOT found!');
      console.log('Make sure plugin.text_selection.js is loaded before BookReader.js');
      console.log('Available on br:', Object.keys(br));
    }
  }, 500);
  
  return br;
}