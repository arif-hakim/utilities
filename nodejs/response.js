const response = {};

response.success = ({ res, message = "Success!", data = null, code = 200 }) => {
  res.status(200).send({
    error: false,
    message,
    data,
    code,
  });
};

response.error = ({
  res,
  message = "Failed!",
  data = null,
  code = 400,
  validationErrors = undefined,
}) => {
  res.status(400).send({
    error: true,
    message,
    data,
    code,
    validationErrors,
  });
};

response.unauthorized = ({
  res,
  message = "Unauthorized access!",
  data = null,
  code = 401,
}) => {
  res.status(401).send({
    error: true,
    message,
    data,
    code,
  });
};

response.forbidden = ({
  res,
  message = "Forbidden access!",
  data = null,
  code = 403,
}) => {
  res.status(403).send({
    error: true,
    message,
    data,
    code,
  });
};

module.exports = response;
