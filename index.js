// Simple HTTP server using Node.js
// const http = require("http");

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader("Content-Type", "text/plain");
//   res.end("Hello, World!\n");
// });

// server.listen(8080, () => {
//   console.log("Server running at http://localhost:8080/");
// });

// Advanced HTTP server using Express.js
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const db = require("./src/db");
const { isAuthenticated } = require("./src/middlewares/auth");

// Read environment variables from the .env file
dotenv.config();

// Initialize Express.js App
const app = express();

// Helmet middleware helps securing the endpoints with various HTTP headers
app.use(helmet());

// Parse request body and cookies before the routes if they are in the application/json format
app.use(express.json());

// Parse request body and cookies before the routes
app.use(cookieParser());

// Endpoint for user registration
app.post("/auth/register", async function createUser(req, res) {
  // Validate request body
  if (!req.body.username || !req.body.password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Check if username already exists
    const existingUser = await db.users.findOne({
      username: req.body.username,
    });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new db.users({
      username: req.body.username,
      password: hashedPassword,
    });
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Set authToken cookie
    res.cookie("AuthToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    });

    // Respond to client
    return res.status(201).send();
  } catch (error) {
    // Handle error
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for user login
app.post("/auth/login", async (req, res) => {
  // Validate request body
  if (!req.body.username || !req.body.password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Check if username exists
    const user = await db.users.findOne({ username: req.body.username });
    if (!user) {
      return res
        .status(400)
        .json({ error: `No user found with username ${req.body.username}` });
    }

    // Verify password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Create JWT
    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Set authToken cookie
    res.cookie("AuthToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    });

    // Respond to client
    res.json({ id: user._id });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Endpoint for user logout
app.post("/auth/logout", (req, res) => {
  // Clear the authToken cookie
  res.clearCookie("AuthToken");

  // Respond to client
  res.status(201).send();
});

// Endpoint for getting the list of posts with top level comments
app.get("/posts", async (req, res) => {
  try {
    const posts = await db.posts
      .find({ parent: null }) // Find all posts (documents where parent is null)
      .select("-parent -__v")
      .populate("author", "username") // Populate the 'author' field
      .populate({
        path: "comments", // Populate the 'comments' field
        select: "-parent -__v",
        populate: { path: "author", select: "username" }, // Populate the 'author' field of the comments
      })
      .exec(); // Execute the query

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Endpoint for creating a new post
app.post("/posts", isAuthenticated, async (req, res) => {
  // Validate request body
  if (!req.body.title || !req.body.body) {
    return res
      .status(400)
      .json({ error: "Title and body are required for posts" });
  }

  try {
    // Create new post
    const post = new db.posts({
      title: req.body.title,
      body: req.body.body,
      author: new mongoose.Types.ObjectId(req.user._id),
    });
    await post.save();

    // Respond to client
    res.status(201).json({ post: post._id });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for editing a post or a comment
app.patch("/posts/:id", async (req, res) => {
  const postOrCommentId = req.params.id;

  // Validate request body and URL parameter
  if (!req.body.body || !mongoose.Types.ObjectId.isValid(postOrCommentId)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    // Update the body of the post or comment
    const updatedPostComment = await db.posts.findByIdAndUpdate(
      postOrCommentId,
      { body: req.body.body },
      { new: true } // Return the updated document
    );

    // Check if the post/comment was found and updated
    if (!updatedPostComment) {
      return res.status(404).json({ error: "Post or comment not found" });
    }

    // Respond to client
    res.send(updatedPostComment);
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for deleting a post or a comment
app.delete("/posts/:id", async (req, res) => {
  const postOrCommentId = req.params.id;

  // Validate URL parameter
  if (!mongoose.Types.ObjectId.isValid(postOrCommentId)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    // Delete the post or comment
    const deletedPostOrComment = await db.posts.findByIdAndDelete(
      postOrCommentId
    );

    // Check if the post/comment was found and deleted
    if (!deletedPostOrComment) {
      return res.status(404).json({ error: "Post or comment not found" });
    }

    // Respond to client
    res.send(deletedPostOrComment);
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/posts/:id/comments", async (req, res) => {
  const postId = req.params.id;

  // Validate URL parameter
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    // Find the post
    const post = await db.posts
      .findById(postId)
      .select("-parent -__v")
      .populate("author", "username")
      .populate({
        path: "comments",
        select: "-parent -__v",
        populate: { path: "author", select: "username" },
      })
      .exec();

    // Check if the post was found
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Respond to client
    res.json(post);
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for creating a new comment to an existing post
app.post("/posts/:id/comments", isAuthenticated, async (req, res) => {
  const postId = req.params.id;

  // Validate request body and URL parameter
  if (!req.body.body || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    // Check if post exists
    const post = await db.posts.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Create new comment
    const comment = new db.posts({
      body: req.body.body,
      author: new mongoose.Types.ObjectId(req.user._id),
      parent: new mongoose.Types.ObjectId(postId), // Parent is the post_id from the URL parameter
    });
    await comment.save();

    // Update parent post to include new comment
    await db.posts.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    // Respond to client
    res.status(201).json({ comment: comment._id });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generic error handler
app.use(function handleError(err, req, res, next) {
  res.status(err.status || 500).json({ error: err.message });
});

// 404 Not Found handler
app.all("*", function handleNotFound(req, res) {
  res.status(404).json({ error: "Not found" });
});

// Start the server
app.listen(process.env.PORT, async function () {
  await db.connect();
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});

// Gracefully shutdown the server on SIGINT and SIGTERM
process.on("SIGINT", async function () {
  await db.disconnect();
  console.log("Server stopped due to SIGINT");
  process.exit();
});

process.on("SIGTERM", async function () {
  await db.disconnect();
  console.log("Server stopped due to SIGTERM");
  process.exit();
});
