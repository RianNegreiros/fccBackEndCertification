const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const shortId = require("shortid")
require('dotenv').config()

//Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Schemas
const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  count: Number,
  duration: { type: Number, required: true },
  date: Date,
})
new mongoose.model('exercise', exerciseSchema)

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, default: shortId.generate },
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [exerciseSchema]
})

const User = mongoose.model('User', userSchema)

// Post route to create user
app.post('/api/users', (req, res) => {
  // Try to find
  User.findOne({ username: req.body.username }, (err, foundUser) => {
    // Check is findOne return error and output to console
    if (err) {
      console.log('FindOne() error')
    }
    // Check if found user by given username
    if (foundUser) {
      res.send('Username already in use')
    } else {
      // Craete and save a new user
      const newUser = new User({
        username: req.body.username
      })
      newUser.save()
      res.json({
        username: req.body.username,
        _id: newUser._id
      })
    }
  })
})

// Route to get all users
app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) {
      console.log('Find() error')
    };
    res.json(users);
  });
});

// Post route to get user exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  let { _id, description, duration, date } = req.body
  // If any date is given use current time
  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  // Try to find user by id
  try{
    let findOne = await User.findOne({
      _id
    })
    // If user exists, add exercise
    if (findOne){
      console.log("Retrieving Stored User")
      findOne.count++;
      findOne.log.push({
        description: description,
        duration: parseInt(duration),
        date: date
      })
      findOne.save()

      res.json({
          username: findOne.username,
          description: description,
          duration: parseInt(duration),
          _id,
          date: date
        })
    }
    // If user doesn't exist, return error
  } catch (err) {
    console.error(err)
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id, limit, form, to, from } = req.params
  if (_id) {
    await User.findById(_id, (err, userFound) => {
      if (err) {
        res.send("FindById() error")
      }
      let resObj = {
        _id: userFound._id,
        username: userFound.username,
        count: userFound.log.length
      }

      if (limit) {
        resObj.log = userFound.log.slice(0, limit)
      } else {
        resObj.log = userFound.log.map(log => ({
          description: log.description,
          duration: log.duration,
          date: new Date(log.date).toDateString()
        }))
      }

      if (form || to) {
        let fromDate = new Date()
        let toDate = new Date()

        if (from) {
          fromDate = new Date(from)
        }

        if (to) {
          toDate = new Date(to)
        }

        fromDate.getTime()
        toDate.getTime()

        resObj.log = userFound.log.filter((session) => {
          return new Date(session.date).getTime();
        })
      }
      res.json(resObj)
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
