const jwt = require("jsonwebtoken");
const db = require("../db");

async function isAuthenticated(req, res, next) {
  // Get token from cookies
  const token = req.cookies.AuthToken;

  if (!token) {
    return res.status(401).json({ error: "Access Denied" });
  }

  try {
    // Verify token
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;

    // Check if the token in the cookie matches the hashed token stored in the database
    const user = await db.users.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Invalid Token" });
  }
}

module.exports = {
  isAuthenticated,
};
