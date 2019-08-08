const erorrHandler = middleware => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (err) {
      //next(err);
      console.log(err);
      res.status(500).json({ message: 'Error:: `${err.name}`', error:true,data:null });
    }
  };
};

module.exports = erorrHandler;