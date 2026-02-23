import liveServer from 'live-server';

liveServer.start({
  root: '.',
  port: 8000,
  watch: ['index.html', 'BookReader', 'BookReaderDemo'],
  cors: true,
  middleware: [function (req, res, next) {
    console.log(`${req.method} ${req.url}`);

    // Handle /details/<identifier> requests
    const detailsMatch = req.url.match(/^\/details\/([^/?]+)/);
    if (detailsMatch) {
      const newUrl = `/BookReaderDemo/demo-internetarchive.html`;
      console.log(`Rewriting ${req.url} to ${newUrl}`);
      req.url = newUrl;
    }

    next();
  }],
});
