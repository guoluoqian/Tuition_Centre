const express = require('express');
const mysql = require('mysql2');


const session = require('express-session');

const flash = require('connect-flash');

const app = express();

const multer = require('multer');

// Set up multer for file uploads
const uploadstudent = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/student'), // Directory to save uploaded files
        filename: (req, file, cb) => cb(null, file.originalname)
    })
});
const uploadteacher = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/teacher'), // Directory to save uploaded files
        filename: (req, file, cb) => cb(null, file.originalname)
    })
});
//for admin
const uploadadmin = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/admin'), // Directory to save uploaded files
        filename: (req, file, cb) => cb(null, file.originalname)
    })
});


// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RP738964$',
    database: 'ca2_team4'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

app.use(flash());


// validateRegistrationS for student //
const validateRegistrationS = (req, res, next) => {
    const {username, Fullname, email, password, dob, contact, grade} = req.body;

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
    const {username, Fullname, email, password, dob, contact, subject, teachingGrade} = req.body;

    if (!username || !Fullname || !email || !password || !dob || !contact || !subject || !teachingGrade) {
        return res.status(400).send('Required field not fill in.');
    }
    
    if (!req.files || !req.files.teachingcert || !req.files.teachingcert[0] || !req.files.resume || !req.files.resume[0]) {
        return res.status(400).send('Required file uploads are not fill in.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next(); // If all validations pass, the next function is called, allowing the request to proceed to the
            // next middleware function or route handler.
};

// check if student is logged in //
const checkAuthenticatedS = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/studentlogin');
    }
};

// check if teacher is logged in //
const checkAuthenticatedT = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/teacherlogin');
    }
};

//check if admin is logged in //
const checkAuthenticatedA = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/adminlogin');
    }
};

app.get('/', (req, res) => {
    res.render('home', { user: req.session.user, messages: req.flash('success')});
});

app.get('/register', (req, res) => {
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
app.post('/registerS', uploadstudent.single('image'), validateRegistrationS, (req, res) => {
    const {username, Fullname, email, password, dob, address, contact, grade} = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // save only the filename
    } else {
        image = null
    }
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
app.post('/registerT', uploadteacher.fields([
    {name: 'teachingcert'},
    {name: 'resume'},
    {name: 'image'}
]), validateRegistrationT, (req, res) => {
    const {username, Fullname, email, password, dob, address, contact, subject, teachingGrade} = req.body;
    let teachingcert;
    let resume;
    let image;

    if (req.files && req.files.teachingcert) {
        teachingcert = req.files.teachingcert[0].filename; // save only the filename
    } else {
        teachingcert = null
    }

    if (req.files && req.files.resume) {
        resume = req.files.resume[0].filename; // save only the filename
    } else {
        image = null
    }

    if (req.files && req.files.image) {
        image = req.files.image[0].filename; // save only the filename
    } else {
        image = null
    }
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

// student route to render student page for users //
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

// teacher route to render teacher page for users NOT DONE// 
app.get('/teacher', checkAuthenticatedT, (req, res) => {
    const sql = 'SELECT * FROM teacher'
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving teachers');
        }
    // Render HTML page with data
    res.render('teacher', {teacher: req.session.user, teachers: results});
    })
});


//admin route to render admin page for users NOT DONE//
app.get('/admin', checkAuthenticatedA, (req, res) => {
    res.render('admin', {admin: req.session.user});
});


// route to update student information //
app.get('/editStudent/:id', (req, res) => {
    const studentId = req.params.id;
    const sql = 'SELECT * FROM student WHERE studentId = ?';
    
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving student by ID');
        }
        if (results.length > 0) {
            res.render('editStudent', { student: results [0] });
        } else {
            res.status (404).send('Student not found');
        }
    });
});

app.post('/editStudent/:id', uploadstudent.single('image'), (req, res) => {
    const studentId = req.params.id;
    const { username, Fullname, email, password, dob, contact } = req.body;
    let image = req.body.currentImage; 
    if (req.file) {
        image = req.file.filename;
    }

    const sql = 'UPDATE student SET username = ?, Fullname = ?, email = ? password = ?, dob = ?, address = ?, contact = ?, grade = ?, image = ? WHERE studentId = ?';

    connection.query(sql, [username, Fullname, email, password, dob, address, 
        contact, grade, image, studentId], (error, results) => {
        if (error) {
 
            console.error("Error updating student:", error);
            res.status (500).send('Error updating student');
        } else {
            res.redirect('/');
        }
    });
});


// route to update teacher information //
app.get('/editTeacher/:id', (req, res) => {
    const teacherId = req.params.id;
    const sql = 'SELECT * FROM teacher WHERE teacherId = ?';
    
    connection.query(sql, [teacherId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving teacher by ID');
        }
        if (results.length > 0) {
            res.render('editTeacher', { teacher: results [0] });
        } else {
            res.status (404).send('Teacher not found');
        }
    });
});

app.post('/editTeacher/:id', uploadteacher.single('image'), (req, res) => {
    const teacherId = req.params.id;
    const { username, Fullname, email, password, dob, contact } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = 'UPDATE teacher SET username = ?, Fullname = ?, email = ?, password = ?, dob = ?, address = ?, contact = ?, subject = ?, teachingcert = ?, teachingGrade = ?, resume = ?, image = ? WHERE teacherId = ?';
    connection.query(sql, [username, Fullname, email, password, dob, address, contact, 
        subject, teachingcert, teachingGrade, resume, image, teacherId], (error, results) => {
        if (error) {
            console.error("Error updating teacher:", error);
            res.status (500).send('Error updating teacher');
        } else {
            res.redirect('/');
        }
    });
});

// routes to delete student and teacher records //
app.get('/deleteStudent/:id', (req, res) => {
    const studentId = req.params.id;
    const sql = 'DELETE FROM student WHERE studentId = ?';
    connection.query(sql, (studentId), (error, results) => {
        if (error) {
            console.error("Error deleting student:", error);
            res.status (500).send('Error deleting student');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/deleteTeacher/:id', (req, res) => {
    const teacherId = req.params.id;
    const sql = 'DELETE FROM teacher WHERE teacherId = ?';
    connection.query(sql, (teacherId), (error, results) => {
        if (error) {
            console.error("Error deleting teacher:", error);
            res.status (500).send('Error deleting teacher');
        } else {
            res.redirect('/');
        }
    });
});

// route for admin
app.get('/adminlogin', (req, res) => {
    res.render('admin');
});

// Route to serve the inbox page
app.get('/inbox', (req, res) => {
    res.render('inbox');
});

// Route to serve the contact page

app.get('/contact', (req, res) => {
    res.render('contact');
});

// logout route //
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

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