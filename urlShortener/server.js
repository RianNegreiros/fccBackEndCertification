require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const dns = require('dns')
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(cors());

app.use(express.json())

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Connect database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});

// Create Schema
const { Schema } = mongoose;
const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true,
    default: 0
  }
});
const Url = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const urlRequest = req.body.url;

  const hostname = urlRequest
  .replace(/http[s]?\:\/\//, '')
  .replace(/\/(.+)?/, '');

  dns.lookup(hostname, (lookupErr, addresses) => {
    if (lookupErr) {
      console.log('lookup() error');
    }
    if (!addresses) {
      res.json({ error: "invalid URL" })
    } else {
      Url.findOne({
        original_url: urlRequest
      }, (findOneErr, urlFound) => {
        if (findOneErr) {
          console.log('FindOne() error');
        }
        if (!urlFound) {
          Url.estimatedDocumentCount((countErr, count) => {
            if (countErr) {
              res.send('estimatedDocumentCount() error');
            }
            const url = new Url({
              original_url: urlRequest,
              short_url: count + 1
            });
            url.save((saveErr, urlSaved) => {
              if (saveErr) {
                res.send('save() error');
              }
              res.json({
                original_url: urlSaved.original_url,
                short_url: urlSaved.short_url
              });
            });
          });
        } else {
          res.json({ original_url: urlFound.original_url, short_url: urlFound.short_url });
        }
      });
    }
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const { shorturl } = req.params;

  Url.findOne({
    short_url: shorturl
  }, (err, urlFound) => {
    if (err) {
      console.log('findOne() error');
    }
    if (!urlFound) {
      res.json({ error: "no matching URL" })
    } else {
      res.redirect(urlFound.original_url);
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
