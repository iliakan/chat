var HttpError = require('error').HttpError;

module.exports = function(req, res, next) {

  res.sendError = function(error) {
    if ( !(error instanceof HttpError) ) {
      error = new HttpError(500, "Server error");
    }

    res.status(error.status);
    if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') {
      res.json(error);
    } else {
      res.render("error", {error: error});
    }
  };

  next();
};