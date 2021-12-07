const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, "Every Article must have a URL"],
  },
  title: {
    type: String,
    unique: [true, "Every Article must have a unique title"],
    required: [true, "Every Article must have a title"],
  },
  subText: {
    type: String,

    required: [true, "Every Article must have a subText"],
  },
  imageUrl: {
    type: String,
    required: [true, "Every Article must have a photo"],
  },
  content: {
    type: String,
    required: [true, "Every Article must have a content"],
  },
  publishDate: {
    type: String,
    required: [true, "Every Article must have a publishing Date"],
    default: new Date().toString(),
  },
  author: {
    type: String,
    required: [true, "Every Article must have a Author"],
  },
  tags: [
    {
      title: {
        type: String,
        required: [true, "Every Tag must have a Title"],
      },
      url: {
        type: String,
        required: [true, "Every Tag must have a url"],
      },
    },
  ],
  relatedArticleURLs: [
    {
      type: String,
      required: [true, "Every Article must have a URL"],
    },
  ],
});

const sportsArticle = mongoose.model("sportsArticle", articleSchema);

module.exports = sportsArticle;
