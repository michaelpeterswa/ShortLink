// ShortLink
// Michael Peters

const express = require('express')
const cors = require('cors')
const path = require('path')
const bp = require('body-parser');
const shortid = require('shortid')
const db = require('better-sqlite3')('./db/links.sqlite3')
const NodeCache = require('node-cache')

// port the app is currently serving to
const app_port = 6981


const app = express()
app.set('view engine', 'ejs');

const linkCache = new NodeCache();

// for better-sqlite3
db.prepare("CREATE TABLE IF NOT EXISTS links (url TEXT, id TEXT)").run()

// setup data structure
const link_data = {
    url: "",
    id: ""
} 

//////////////////////////////////

function createID (full_url) {
    link_data.url = full_url
    link_data.id = shortid.generate()
    console.log(`ID (${link_data.id}) created for: ${link_data.url}`)
}

function sendToDatabase (data) {
    console.log(`Sending to Database: ${data.id}\n`)
    var stmt = db.prepare(`INSERT INTO links ("url", "id") VALUES ('${data.url}', '${data.id}')`)
    stmt.run()
}

function sendToCache (data) {
    console.log(`Sending to Cache: ${data.id}`)
    // cache key is data.id, object is data, ttl is 10k
    linkCache.set(data.id, data, 10000)
}

function getFromCache (id) {
    console.log("Found Result!")
    var result = linkCache.get(id)
    return result
}

function checkCache (id) {
    console.log(`Checking cache for ID: ${id}`)
    return linkCache.has(id)
}

function getFromDatabase (id) {
    var result = undefined
    console.log(`Checking database for ID: ${id}`)
    var stmt = db.prepare(`SELECT * FROM 'links' WHERE id='${id}'`)
    result = stmt.get()
    if(result != undefined) {
        console.log("Found Result!")
        return result
    }
    else {
        console.log("Result Not Found")
        return false
    }
}

function checkDatabase (id) {
    console.log(`Checking database for ID: ${id}`) 
    return true
}

// function either returns an object or a false value
function recieveRequest (id) {
    if (checkCache(id)) { // if key exists in the cache
        var cacheResult = getFromCache(id)
        return cacheResult
    }
    else {
        var dbResult = getFromDatabase(id)
        return dbResult // could return false
    }
}

function displayResult (data) {
    io.emit('new_link', data);
    console.log("Sent socket.io message")
}

//////////////////////////////////

app.use(cors());
app.use(bp.urlencoded({
    extended: true
  }));

app.get('/', function(req, res) {
    res.render('index')
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
    var completed_link = `localhost:6981/${link_data.id}`
    sendToCache(link_data)
    sendToDatabase(link_data)
    res.render('result', {link: completed_link })
  })

app.get('/:passed_shortid', function(req, res) {
    console.log(`Endpoint accessed: /${req.params.passed_shortid}`)

    var id = req.params.passed_shortid

    var result = recieveRequest(id)
    if(result != false) {
        console.log(`Redirecting to: ${result.url}\n`)
        res.redirect(result.url)
    }
    else {
        console.log("Returning a 404")
        res.status(404).render('404');
    }
  });

const app_server = app.listen(app_port, () => console.log(`ShortLink server app listening on port ${app_port}!\n`)) 

module.exports = app_server