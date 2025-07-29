const express = require('express');
const mysql = require('mysql2');


const session = require('express-session');

const flash = require('connect-flash');

const app = express();

const bcrypt = require('bcryptjs');

const multer = require('multer');

const cors = require('cors');
const bodyParser = require('body-parser');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYvJwQ7qE3z/A5.8JZ8Xj5hQYzJvW6'; // "admin123" hashed

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

//RP738964$

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
    const { username, Fullname, email, password, dob, contact, grade } = req.body;

    if (!username || !Fullname || !email || !password || !dob || !contact || !grade) {
        return res.status(400).send('Required field not fill in.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/registerS');
    }
    next();
};

// validateRegistration for teacher //
const validateRegistrationT = (req, res, next) => {
    const { username, Fullname, email, password, dob, contact, subject, teachingGrade } = req.body;

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
    next();
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
    if (req.session.authenticated && req.session.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/admin-dashboard');
    }
};

// In-memory storage for messages (use database in production)
let chatMessages = [];
// API endpoint to get chat messages
app.get('/api/chat', (req, res) => {
  res.json(chatMessages);
});

// API endpoint to send new message
app.post('/api/chat', (req, res) => {
  const { message, sender } = req.body;
  
  if (!message || !sender) {
    return res.status(400).json({ error: 'Message and sender are required' });
  }
  
  const newMessage = {
    message,
    sender,
    timestamp: new Date().toISOString()
  };
  
  chatMessages.push(newMessage);
  res.json({ success: true });
});

// Admin panel route
app.get('/admin-chat', (req, res) => {
  res.sendFile(__dirname + '/admin-chat.html');
});

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

//  Function to load users registered this month
// API route to get inbox messages
app.get('/api/messages', (req, res) => {
    db.query('SELECT sender, message FROM messages', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// API route to get this month’s registered users
app.get('/registerS', (req, res) => {
    db.query(`
        SELECT name, contact 
        FROM student
        WHERE role = 'student'
    `, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to fetch student data' 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
});

// fetch('/students')
//   .then(response => response.json())
//   .then(data => {
//     if (data.success) {
//       // Process data.data array
//       const studentList = document.getElementById("student-list");
//       studentList.innerHTML = data.data.map(student => 
//         `<li>${student.name} - ${student.contact}</li>`
//       ).join('');
//     } else {
//       alert('Error loading students: ' + data.message);
//     }
//   })
//   .catch(error => console.error('Error:', error));


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

    const table = userType;
    const allowedTables = ['student', 'teacher'];

     let redirectPath = '';

    if (userType === 'student') {
        redirectPath = '/student';
    } else if (userType === 'teacher') {
        redirectPath = '/teacher';
    } else {
        req.flash('error', 'Invalid Type selected.');
        return res.redirect('back');
    }

    if (!allowedTables.includes(table)) {
        return res.status(400).send("Invalid table selection.");
    }
    const sql = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            req.flash('error', 'Database error occurred');
            return res.redirect('/login');
        }

        if (results.length > 0) {
            // Successful login
            req.session.user = results[0]; // store user in session
            req.flash('success', 'Login successful!');
            return res.redirect(redirectPath);
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }
    });
});

// student route to render student page for users //
app.get('/student', checkAuthenticatedS, (req, res) => {
    const studentId = req.session.user.studentId;

    // check for available session
    const sessionA = `
    SELECT s.*, s.sessionId, COUNT(ss.sessionId) AS 'current_student'
    FROM session s
    LEFT JOIN session_signup ss ON s.sessionId = ss.sessionId
    WHERE s.sessionId NOT IN (SELECT sessionId FROM session_signup WHERE studentId = ?)
    GROUP BY s.sessionId
    `;
    // check for signed up session
    const sessionS = `
    SELECT s.*, s.sessionId, COUNT(ss.sessionId) AS 'current_student'
    FROM session s
    LEFT JOIN session_signup ss ON s.sessionId = ss.sessionId
    WHERE s.sessionId IN (SELECT sessionId FROM session_signup WHERE studentId = ?)
    GROUP BY s.sessionId
    `;


    // Fetch data from MySQL
    db.query(sessionA, [studentId], (error2, results2) => {
        if (error2) {
            console.error('Database query error:', error2.message);
            return res.status(500).send('Error Retrieving sessions');
        }
        db.query(sessionS, [studentId], (error3, results3) => {
            if (error3) {
                console.error('Database query error:', error3.message);
                return res.status(500).send('Error Retrieving sessions');
            }
            for (let i = 0; i < results2.length; i++) {
                const newDate = new Date(results2[i].session_date);

                const duration = results2[i].duration;
                const parts = duration.split(":");
                const hrs = parts[0]
                const mins = parts[1]

                results2[i].session_date = newDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                });
                results2[i].duration = hrs + ' hrs ' + mins + ' mins'
            }
            for (let i = 0; i < results3.length; i++) {
                const newDate = new Date(results3[i].session_date);

                const duration = results3[i].duration;
                const parts = duration.split(":");
                const hrs = parts[0]
                const mins = parts[1]

                results3[i].session_date = newDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                });
                results3[i].duration = hrs + ' hrs ' + mins + ' mins'
            }
            // Render HTML page with data
            res.render('student', {
                student: req.session.user,
                sessionA: results2,
                sessionS: results3
            });
        });
    });
});

// teacher route to render teacher page for users DONE// 
app.get('/teacher', checkAuthenticatedT, (req, res) => {
    const teacher = req.session.user; // Get the currently logged-in teacher's data

    // 1. First, fetch the teacher's details (if needed)
    const sqlTeacher = 'SELECT * FROM teacher WHERE email = ?'; // Example query

    db.query(sqlTeacher, [teacher.email], (error, teacherResults) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send("Error retrieving teacher's info");
        }

        // 2. Fetch sessions taught by the teacher
        const sqlSession = 'SELECT T.sessionId, T.subject, T.session_date, T.session_time FROM session T WHERE T.teacher_name = ?';

        db.query(sqlSession, [teacher.name], (sessionError, sessionResults) => {
            if (sessionError) {
                console.error('Database session error:', sessionError.message);
                return res.status(500).send("Error retrieving sessions");
            }

            // 3. Render the page with both teacher and session data
            res.render('teacher', {
                teacher: req.session.user, // or teacherResults[0] if you fetched from DB
                sessions: sessionResults   // Pass sessions to the template
            });
        });
    });
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


// Middleware to check if user is authenticated as admin
const ensureAuthenticated = (req, res, next) => {
  // Check if user is logged in and is an admin
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  // If using session-based auth without Passport:
  /*
  if (req.session.authenticated && req.session.role === 'admin') {
    return next();
  }
  */
  
  // Not authenticated - redirect to login
  res.redirect('/admin-dashboard');
};

// Login page
app.get('/admin-dashboard', (req, res) => {
    res.render('admin-dashboard', { error: null });
});

// Login handler
app.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME) {
        const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD);
        
        if (passwordMatch) {
            req.session.authenticated = true;
            req.session.role = 'admin';
            req.session.userName = 'Admin';
            return res.redirect('/admin');
        }
    }
    
    res.render('admin', { error: 'Invalid credentials' });
});

app.get('/addAdmin', (req, res) => {
    res.render('addAdmin', { 
        messages: req.flash('error'), 
        formData: req.flash('formData')[0]
    });
});

app.post('/addAdmin', uploadstudent.single('image'), (req, res) => {
    const {username, password, name, dob, email, address, contact} = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // save only the filename
    } else {
        image = null
    }
    const sql = 'INSERT INTO admin (username,  password, name, dob, email, address, contact, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, password, name, dob, email, address, contact, image], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Added admin successful!');
        res.redirect('/login');
    });
});

app.get('/editAdmin/:id', (req, res) => {
    const adminId = req.params.id;
    const sql = 'SELECT * FROM admin WHERE adminId = ?';
    // Fetch data from MySQL
    db.query(sql, [adminId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving admins');
        }
        // Render HTML page with data
        res.render('editAdmin', { admin: results});
    });
});


app.post('/editAdmin/:id', (req, res) => {
    // Get adminId from the request body
    const adminId = req.params.Id;
    const { username, Fullname, email, password, dob, contact } = req.body;
    const sql = 'UPDATE admin SET username = ?, Fullname = ?, email = ?, password = ?, dob = ?, contact = ? WHERE adminId = ?';
    db.query(sql, [username, Fullname, email, password, dob, contact, adminId], (err, result) => {
        if (error) {
            console.error("Error updating admin:", error);
            res.status(500).send('Error updating admin');
        } else {
            res.redirect('/admin');
        }
    });
});


// Send a message (POST)
app.post('/send-message', (req, res) => {
    const senderRole = req.body.role;
    const senderName = req.body.name;
    const message = req.body.message;

    const sql = `INSERT INTO messages (sender_role, sender_name, message) VALUES (?, ?, ?)`;
    db.query(sql, [senderRole, senderName, message], (err, result) => {
        if (err) {
            console.error('Insert failed:', err);
            res.status(500).send('Failed to send message');
        } else {
            res.send('Message sent');
        }
    });
});

// Get all messages (GET)
app.get('/inbox', (req, res) => {
    const sql = `SELECT * FROM messages ORDER BY timestamp DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch failed:', err);
            res.status(500).send('Error fetching messages');
        } else {
            res.json(results);
        }
    });
});

// Route to serve the contact page

app.get('/contact', (req, res) => {
    res.render('contact');
});

// Route to serve the student information page
app.get('/SInfo', checkAuthenticatedS, (req, res) => {
    const studentId = req.session.user.studentId;
    const sql = 'SELECT * FROM student WHERE studentId = ?'
    db.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving session')
        }
        res.render('SInfo', {student: req.session.user});
    })
    
});

app.get('/session', (req, res) => {
    const sql = `
    SELECT s.*, s.sessionId, COUNT(ss.sessionId) AS 'current_student'
    FROM session s
    LEFT JOIN session_signup ss ON s.sessionId = ss.sessionId
    GROUP BY s.sessionId
    `
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving session')
        }
        for (let i = 0; i < results.length; i++) {
            const newDate = new Date(results[i].session_date);

            const duration = results[i].duration;
            const parts = duration.split(":");
            const hrs = parts[0]
            const mins = parts[1]

            results[i].session_date = newDate.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
            results[i].duration = hrs + ' hrs ' + mins + ' mins'
        }
        res.render('session', { session: results })
    });
});

// logout route //
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});