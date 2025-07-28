const express = require('express');
//const mysql = require('mysql2');  

//******** TODO: Insert code to import 'express-session' *********//
const session = require('express-session');

const flash = require('connect-flash');

const app = express();

const path = require('path');

const port = 3000; // Change this to your desired port number

//Database connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'RP738964$',
//     database: 'new_schema'
// });

// db.connect((err) => {
//     if (err) {
//         throw err;
//     }
//     console.log('Connected to database');
// });

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

//******** TODO: Insert code for Session Middleware below ********//
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

app.use(flash());

// Setting up EJS
app.set('view engine', 'ejs');

const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};

const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/dashboard');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});

// Routes
app.get('/', (req, res) => res.render('home'));

app.get('/about', (req, res) => res.render('about'));

app.get('/services', (req, res) => res.render('services'));

app.get('/contact', (req, res) => res.render('contact'));

app.post('/contact', (req, res) => {
  console.log('Form submission:', req.body);
  res.send('Thank you for contacting us!');
});

// const validateRegistration = (req, res, next) => {
//     const { username, email, password, address, contact } = req.body;

//     if (!username || !email || !password || !address || !contact) {
//         return res.status(400).send('All fields are required.');
//     }
    
//     if (password.length < 6) {
//         req.flash('error', 'Password should be at least 6 or more characters long');
//         req.flash('formData', req.body);
//         return res.redirect('/register');
//     }
//     next();
// };


// //******** TODO: Integrate validateRegistration into the register route. ********//
// app.post('/register', validateRegistration, (req, res) => {
//     //******** TODO: Update register route to include role. ********//
//     const { username, email, password, address, contact, role} = req.body;

//     const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
//     db.query(sql, [username, email, password, address, contact, role], (err, result) => {
//         if (err) {
//             throw err;
//         }
//         console.log(result);
//         req.flash('success', 'Registration successful! Please log in.');
//         res.redirect('/login');
//     });
// });

// app.get('/login', (req, res) => {
//     res.render('login', { 
//         messages: req.flash('success'), 
//         errors: req.flash('error') 
//     });
// });

// app.post('/login', (req, res) => {
//     const { email, password } = req.body;

//     // Validate email and password
//     if (!email || !password) {
//         req.flash('error', 'All fields are required.');
//         return res.redirect('/login');
//     }

//     const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
//     db.query(sql, [email, password], (err, results) => {
//         if (err) {
//             throw err;
//         }

//         if (results.length > 0) {
//             // Successful login
//             req.session.user = results[0]; // store user in session
//             req.flash('success', 'Login successful!');

//             res.redirect('/dashboard');
//         } else {
//             // Invalid credentials
//             req.flash('error', 'Invalid email or password.');
//             res.redirect('/login');
//         }
//     });
// });



app.get('/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});


app.get('/admin', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('admin', { user: req.session.user });
});
app.get('/adminlogin', (req, res) => {
    res.render('admin');
});

// Route to serve the inbox page
app.get('/inbox', (req, res) => {
    res.render('inbox');
});

app.post('/register', (req, res) => {
    const { name, contact } = req.body;

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});