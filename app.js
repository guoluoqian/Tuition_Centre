const express = require('express');
const mysql = require('mysql2');


const session = require('express-session');

const flash = require('connect-flash');

const app = express();

const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Republic_C207',
    database: 'ca2_team4'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

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


// validateRegistrationS for student //
const validateRegistrationS = (req, res, next) => {
    const {username, Fullname, email, password, dob, address, contact, grade, image} = req.body;

    if (!username || !Fullname || !email || !password || !dob || !contact || !grade) {
        return res.status(400).send('Required field not fill in.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/registerS');
    }
    next(); // If all validations pass, the next function is called, allowing the request to proceed to the
            // next middleware function or route handler.
};

// validateRegistration for teacher //
const validateRegistrationT = (req, res, next) => {
    const {username, Fullname, email, password, dob, address, contact, subject, teachingcert, teachingGrade, resume, image} = req.body;

    if (!username || !Fullname || !email || !password || !dob || !contact || !subject || !teachingcert || !teachingGrade || !resume) {
        return res.status(400).send('Required field not fill in.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next(); // If all validations pass, the next function is called, allowing the request to proceed to the
            // next middleware function or route handler.
};

// check if user is logged in //
const checkAuthenticatedS = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/studentlogin');
    }
};

// check if user is logged in //
const checkAuthenticatedT = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/teacherlogin');
    }
};

// check if user is logged in //
const checkAuthenticatedA = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/adminlogin');
    }
};

app.get('/', (req, res) => {
    res.render('account', { user: req.session.user, messages: req.flash('success')});
});

app.get('/registerS', (req, res) => {
    res.render('registerS', { 
        messages: req.flash('error'), 
        formData: req.flash('formData')[0]
    });
});

app.get('/registerT', (req, res) => {
    res.render('registerT', { 
        messages: req.flash('error'), 
        formData: req.flash('formData')[0]
    });
});

// register route for students //
app.post('/registerS', validateRegistrationS, (req, res) => {
    //******** TODO: Update register route to include role. ********//
    const {username, Fullname, email, password, dob, address, contact, grade, image} = req.body;

    const sql = 'INSERT INTO student (username, Fullname, email, password, dob, address, contact, grade, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, Fullname, email, password, dob, address, contact, grade, image], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

// register route for teachers //
app.post('/registerT', validateRegistrationT, (req, res) => {
    //******** TODO: Update register route to include role. ********//
    const {username, Fullname, email, password, dob, address, contact, subject, teachingcert, teachingGrade, resume, image} = req.body;

    const sql = 'INSERT INTO teacher (username, Fullname, email, password, dob, address, contact, subject, teachingcert, teachingGrade, resume, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, Fullname, email, password, dob, address, contact, subject, teachingcert, teachingGrade, resume, image], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

// login routes to render login page below //
app.get('/login', (req,res) => {
    res.render('login', {
        messages: req.flash('success'),
        errors: req.flash('error'),
        formData: req.flash('formData')[0]
    });
});

// login routes for form submission below //
app.post('/login', (req, res) => {
    const {email, password, userType} = req.body;

    // Validate email and password
    if (!email || !password || !userType) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    let tableName = '';
    let redirectPath = '';

    if (userType === 'student') {
        tableName = 'student';
        redirectPath = '/student';
    } else if (userType === 'teacher') {
        tableName = 'teacher';
        redirectPath = '/teacher';
    } else if (userType === 'admin') {
        tableName = 'admin';
        redirectPath = '/admin';
    } else {
        req.flash('error', 'Invalid Type selected.');
        return res.redirect('back');
    }


    const sql = `SELECT * FROM ${tableName} WHERE email = ? AND password = ?`;
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            // Successful login
            req.session.user = results[0]; // store user in session
            req.flash('success', 'Login successful!');
            res.redirect(redirectPath);
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

// student route to render student page for users // Doing
app.get('/student', checkAuthenticatedS, (req, res) => {
    const sql = 'SELECT * FROM session';
    // Fetch data from MySQL
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving sessions');
        }
    // Render HTML page with data
    res.render('student', {student: req.session.user, session: results});
    });
});

// teacher route to render teacher page for users Doing// 
app.get('/teacher', checkAuthenticatedT, (req, res) => {
    const sql = '
    res.render('teacher', {teacher: req.session.user});
});

// admin route to render admin page for users NOT DONE//
app.get('/admin', checkAuthenticatedA, (req, res) => {
    res.render('admin', {admin: req.session.user});
});

// logout route //
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});
// Doing //
app.get('/session/:id', (req, res) => {
    const sessionId = req.params.id;
    const sql = 'SELECT * FROM session WHERE sessionId = ?';
    db.query(sql, [sessionId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving session by ID')
        }

        if (results.length > 0) {
            res.render('session', {session: results[0] });
        } else {
            res.status(404).send('Session not found');
        }
    });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
