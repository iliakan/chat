var checkAuth = require('middleware/checkAuth');

module.exports = function(app) {
  require('./auth')(app);

  app.get('/', function(req, res) {
    res.render('index');
  });

  app.get('/chat', checkAuth, function(req, res) {
    res.render('chat');
  });
};