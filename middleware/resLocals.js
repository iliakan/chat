module.exports = function(req, res, next) {
  res.locals.session = req.session;
  res.locals.user = req.user;

  next();
};
