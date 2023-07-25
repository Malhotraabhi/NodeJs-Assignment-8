require("./config/config");
const Users = require("./Schema/userSchema");
const Post = require("./Schema/postSchema");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret_key = "RestfullApiDemo";
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("db connected");
  console.log("connected to DB");
});
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hash_password = bcrypt.hashSync(password, 10);
  const User = new Users({
    name,
    email,
    password: hash_password,
  });
  User.save()
    .then((response) => {
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        error: err,
      });
    });
});

app.post("/login", (req, res) => {
  const login_data = req.body;
  Users.findOne({ email: login_data.email })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      }
      const check_password = bcrypt.compare(login_data.password, user.password);
      if (!check_password) {
        return res
          .status(401)
          .json({ status: "error", message: "Invalid password" });
      }
      const token = jwt.sign({ userId: user._id }, secret_key, {
        expiresIn: "10m",
      });
      res.status(201).json({
        status: "created",
        result: token,
      });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ status: "error", message: "Internal server error", error });
    });
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  jwt.verify(token, secret_key, (err, auth) => {
    if (err) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
        err,
      });
    }
    req.token = token;
    req.userId = auth.userId;
    next();
  });
};

app.get("/posts", verifyToken, (req, res) => {
  Post.find()
    .populate("user", "name")
    .then((posts) => {
      res.status(200).json({
        posts,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        err,
      });
    });
});

app.post("/posts", verifyToken, (req, res) => {
  const { title, body, image } = req.body;
  const posts = new Post({ title, body, image, user: req.userId });
  posts
    .save()
    .then(() => {
      return posts.populate("user", "name");
    })
    .then((populatedPost) => {
      res.status(201).json({
        status: "success",
        message: "Post created successfully",
        post: populatedPost,
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        error: error.message,
      });
    });
});

app.put("/posts/:id", verifyToken, (req, res) => {
  const { title, body, image } = req.body;
  const id = req.params.id;

  Post.findById(id)
    .then((update_post) => {
      if (!update_post) {
        return res.status(404).json({
          status: "error",
          message: "Page not found",
        });
      }
      if (update_post.user != req.userId) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden",
        });
      }
      update_post.title = title;
      update_post.body = body;
      update_post.image = image;
      update_post
        .save()
        .then(() => {
          return res.status(200).json({
            status: "success",
            message: "Post updated successfully",
          });
        })
        .catch((err) => {
          res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: err,
      });
    });
});

app.delete("/posts/:id", verifyToken, (req, res) => {
  const id = req.params.id;

  Post.findById(id)
    .then((search_for_post) => {
      if (!search_for_post) {
        return res.status(404).json({
          status: "error",
          message: "Page not found",
        });
      }
      if (search_for_post.user != req.userId) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden",
        });
      }
      Post.findByIdAndDelete(id) 
        .then(() => {
          res.status(200).json({
            status: "success",
            message: "Post deleted successfully",
          });
        })
        .catch((err) => {
          res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: err,
      });
    });
});

app.listen(3000);
