var express = require('express');
var cors = require('cors');
const multer  = require('multer');
const upload = multer({  dest: 'public/files' })
const mongoose = require('mongoose');
require('dotenv').config()

var app = express();

app.use(cors());
app.use(express.json())
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});

const fileSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: [true, 'Uploaded file must have a name'],
  },
});

const File = mongoose.model('File', fileSchema)

app.post('/api/fileanalyse', upload.single('upfile') , (req, res) => {
  res.send({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  })
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
