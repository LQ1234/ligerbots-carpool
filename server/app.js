var express = require('express');
var app = express();

app.get('/index.html', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.send('Hello GET');
})
app.use("/", express.static(__dirname+"/serve"));

console.log("test");
var server = app.listen(3010);
