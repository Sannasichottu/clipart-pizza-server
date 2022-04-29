import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    jwt.verify(token, process.env.secret_key);
    next();
  } catch (err) {
    res.status(401).send({ error: err.message });
  }
};
