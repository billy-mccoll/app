// variables for app.js
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
var express = require('express');
var app = express();
var path = require('path');
var bcrypt = require('bcrypt');
var passport = require('passport');
var session = require('express-session');
var flash = require('express-flash');
var initializePassport = require('./passport-config');
var bodyparser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var url =
	'mongodb+srv://billy:billy@cluster0-d0qrq.mongodb.net/test?retryWrites=true&w=majority';
var MongoClient = require('mongodb').MongoClient;

// create body parser
var urlencodedParser = bodyparser.urlencoded({ extended: false });

// global variables
var allUsers, allProducts, allartists;
var multer = require('multer');

// SET STORAGE
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'upload');
	},
	filename: (req, file, cb) => {
		cb(null, file.filename + '-' + Date.now());
	}
});

var upload = multer({ storage: storage });

// Init passport
initializePassport(
	passport,
	// function to find user based on there email
	email => allUsers.find(user => user.email === email),
	id => allUsers.find(user => user._id.toString() === id)
);

// setting statements to tell express to use flash and session
app.use(flash());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false
	})
);

app.use(passport.initialize());
app.use(passport.session());
// Set public folder
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

// Routes

// home page route that handles ejs template
app.get('/home', (req, res) => {
	res.render('home', { products: allProducts });
});

// Route to handle login path
app.post(
	'/logging-in',
	urlencodedParser,
	passport.authenticate('local', {
		successRedirect: '/seller',
		failureRedirect: '/login',
		failureFlash: true
	})
);

// Middleware function for checking that users are authenticated
function checkAuthenticatedUser(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
}

// middleware function for checking that users is not logged in.
function checkNotAuthenticatedUser(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/seller');
	}
	next();
}

// admin page route that handles ejs template
app.get('/admin', (req, res) => {
	res.render('admin', { users: allUsers });
});

// Login page route that handles ejs template
app.get('/login', checkNotAuthenticatedUser, (req, res) => {
	res.render('login');
});

// Route to handle logout path
app.delete('/logout', (req, res) => {
	req.logOut(); // passport function to clear sessions
	res.redirect('/login');
});

app.get('/register', checkNotAuthenticatedUser, (req, res) => {
	res.sendFile(path.join(__dirname + '/register.html'));
});

app.get('/seller', checkAuthenticatedUser, (req, res) => {
	res.render('seller', { name: req.user.fullname });
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
				var product = client.db('musicdatabase').collection('products');

				var prod = {
					artist: req.body.artist,
					album: req.body.album,
					genre: req.body.genre,
					albumdate: req.body.albumdate,
					price: req.body.price,
					seller: req.user.fullname
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
	res.redirect('/seller');
});

// ROUTE TO HANDLE ADD USER
app.post('/addUser', upload.single('profileImage'), (req, res, next) => {
	var hashpassword = bcrypt.hashSync(req.body.password, 10);
	var img = fs.readFileSync(req.file.path);
	var encode_image = img.toString('base64');
	var user = {
		fullname: req.body.fullname,
		email: req.body.email,
		password: hashpassword,
		profileImage: {
			contentType: req.file.mimetype,
			image: Buffer.from(encode_image, 'base64')
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
	//res.send('user added');
	res.redirect('/login');
});

app.listen(3000, () => {
	MongoClient.connect(
		url,
		{ useNewUrlParser: true, useUnifiedTopology: true },
		(err, client) => {
			var db = client.db('musicdatabase');
			var productsCollection = db.collection('products');
			var userCollection = db.collection('users');

			productsCollection.find({}).toArray((err, result) => {
				if (err) throw err;
				allProducts = result;
			});

			userCollection.find({}).toArray((err, result) => {
				if (err) throw err;
				allUsers = result;
			});
		}
	);

	console.log('Connected on port: 3000');
});
