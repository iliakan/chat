var async = require('async');
var User = require('models/user').User;

exports.post = function(req, res, next) {
  async.waterfall([
    function(callback) {
      User.findOne({ username: req.body.username }).exec(callback);
    },
    function(user, callback) {
      if (!user) {
        user = new User({
          username: req.body.username,
          password: req.body.password
        });
        // если просто user.save(callback), то будет лишний аргумент у следующей функции
        user.save(function(err, user, affected) {
          callback(err, user);
        });
      } else {
        if (user.checkPassword(req.body.password)) {
          callback(null, user);
        } else {
          res.send(403, 'Логин или пароль неверен.');
        }
      }
    }
  ],
    function(err, user) {
      if (err) {
        return next(err);
      }

      req.session.user = user._id;
      res.json(user.getPublicFields());
    }
  );
};

exports.get = function(req, res, next) {
  res.render('login');
};
