var express = require('express');
var app = express();
var path = require('path');
var bodyparser = require('body-parser');
var url =
	'mongodb+srv://billy:billy@cluster0-d0qrq.mongodb.net/test?retryWrites=true&w=majority';
var MongoClient = require('mongodb').MongoClient;

app.set('view engine', 'ejs');

// create body parser
var urlencodedParser = bodyparser.urlencoded({ extended: false });

// connect to the database

// Routes

var allartists;

app.get('/home', (req, res) => {
	MongoClient.connect(
		url,
		{ useNewUrlParser: true, useUnifiedTopology: true },
		(err, client) => {
			if (err) throw err;
			var product = client.db('musicdatabase').collection('newproducts');
			product.find({}).toArray((err, artist) => {
				if (err) throw err;
				allartists = artist;
				console.log(artist);
			});
		}
	);
	res.render('home', { products: allartists });
	client.close();
});

app.get('/admin', (req, res) => {
	res.sendFile(path.join(__dirname + '/admin.html'));
});

app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname + '/register.html'));
});

app.get('/seller', (req, res) => {
	res.sendFile(path.join(__dirname + '/seller.html'));
});

//ROUTE TO HANDLE USER UPLOADS
app.get('/upload', (req, res) => {
	res.sendFile(path.join(__dirname + '/upload.html'));
});

//ROUTE TO HANDLE add product
app.get('/addproduct', (req, res) => {
	res.sendFile(path.join(__dirname + '/addproduct.html'));
});

// router to send data to the database
app.post('/postProduct', urlencodedParser, (req, res) => {
	MongoClient.connect(
		url,
		{ useNewUrlParser: true, useUnifiedTopology: true },
		(err, client) => {
			if (err) {
				console.log(err);
			} else {
				var product = client
					.db('musicdatabase')
					.collection('newproducts');

				var prod = {
					artist: req.body.artist,
					album: req.body.album,
					genre: req.body.genre,
					albumdate: req.body.albumdate,
					price: req.body.price
				};

				product.insertOne(prod, (err, result) => {
					if (err) {
						console.log(err);
					} else {
						console.log(
							'Product added to the database',
							result.ops
						);
					}
				});
			}
		}
	);
	client.close();
});

// Set public folder
app.use(express.static('public'));

app.listen(3000, () => {
	console.log('Connected on port: 3000');
});
