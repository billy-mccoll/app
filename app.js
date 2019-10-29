var express = require('express');
var app = express();
var path = require('path');
var bodyparser = require('body-parser');
var fs = require('fs');
var url =
	'mongodb+srv://billy:billy@cluster0-d0qrq.mongodb.net/test?retryWrites=true&w=majority';
var MongoClient = require('mongodb').MongoClient;
// create body parser
var urlencodedParser = bodyparser.urlencoded({ extended: false });
var multer = require('multer');
var upload = multer({ storage: storage });
// SET STORAGE
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads');
	},
	filename: (req, file, cb) => {
		cb(null, file.filename + '-' + Date.now());
	}
});

app.set('view engine', 'ejs');

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
			if (err) throw err;
			else {
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
					if (err) throw err;
					else {
						console.log(
							'Product added to the database',
							result.ops
						);
					}
				});
				client.close();
			}
		}
	);
	res.send('thank you');
});

// ROUTE TO HANDLE ADD USER
app.post('/addUser', upload.single('profileImage'), (req, res) => {
	var img = fs.readFileSync(req.file.path);
	var encode_image = img.toString('base64');
	var user = {
		fullname: req.body.fullname,
		email: req.body.email,
		password: req.body.password,
		profileImage: {
			contentType: req.file.mimetype,
			image: new Buffer(encode_image, 'base64')
		}
	};

	MongoClient.connect(
		url,
		{ useNewUrlParser: true, useUnifiedTopology: true },
		(err, client) => {
			if (err) throw err;
			console.log('you are connected to the database');
			var userCollection = client.db('musicdatabase').collection('users');
			userCollection.insertOne(user, (err, result) => {
				if (err) throw err;
				console.log(result.ops);
			});
			client.close();
		}
	);
	res.send('added');
});

// Set public folder
app.use(express.static('public'));

app.listen(3000, () => {
	console.log('Connected on port: 3000');
});
