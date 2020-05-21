// letterkennyQuotes api
// Michael Peters
// July 12, 2019

const express = require('express')
var cors = require('cors')
var path = require('path')
var bp = require('body-parser');
const ShortUniqueId = require('short-unique-id')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const socket_server = require('http').Server(app);
const io = require('socket.io')(socket_server);

const uid = new ShortUniqueId.default()
// port the app is currently serving to
const app_port = 6981
const socket_port = 6982

// for socket.io
socket_server.listen(socket_port)
// for sqlite3
let db = new sqlite3.Database('./db/links.sqlite', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the links database.');
  });

/////////////////////////////////

const link_data = {
    url: "",
    id: ""
} 

/////////////////////////////////

function createID (full_url) {
    link_data.url = full_url
    link_data.id = uid.randomUUID(6)
    console.log(link_data)
}

function sendToDatabase (data) {
    console.log("Sending to Database")
}

function displayResult (data) {
    console.log("Displaying Result")
}

/////////////////////////////////

app.use(cors());

app.use(bp.urlencoded({
    extended: true
  }));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/../html/index.html'));
  });

app.get('/css/bootstrap.css', function(req, res) {
    res.sendFile(path.join(__dirname + '/../css/bootstrap.css'));
  });

app.get('/css/sticky-footer.css', function(req, res) {
    res.sendFile(path.join(__dirname + '/../css/sticky-footer.css'));
  });

// When form is clicked it posts to the endpoint below
// then it redirects itself to the original page
app.post('/api', (req, res) => {
    const full_url = req.body.url
    createID(full_url)
    sendToDatabase(link_data)
    displayResult(link_data)
    res.redirect('/')
    res.end()
  })

app.use(function (req, res) {
    res.status(404).sendFile(path.join(__dirname + '/../html/404.html'));
    //res.status(200).sendFile(path.join(__dirname + '/../css/bootstrap.css'));
    //res.status(200).sendFile(path.join(__dirname + '/../css/sticky-footer.css'));
  })

const app_server = app.listen(app_port, () => console.log(`ShortLink server app listening on port ${app_port}!\n`)) 

module.exports = app_server