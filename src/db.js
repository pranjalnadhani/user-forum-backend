const mongoose = require("mongoose");

const options = { timestamps: true };

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  options
);

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: function () {
        return !this.parent;
      }, // Required if it's a post
    },
    body: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId, // Reference to another post/comment
      ref: "Post",
      default: null, // Null if it's a post, reference if it's a comment
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  options
);

async function connect() {
  await mongoose.connect(process.env.DATABASE_URL);
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = {
  // todos: mongoose.model("todos", TodoSchema),
  connect,
  disconnect,
  users: mongoose.model("User", UserSchema),
  posts: mongoose.model("Post", PostSchema),
};
