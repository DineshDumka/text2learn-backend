const healthCheck = (req, res) => {
  res.status(200).send("health successful");
};

module.exports = { healthCheck };
