import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//for session use
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'cst336',
  resave: false,
  saveUninitialized: true
//   cookie: { secure: true }
}))

//setting up database connection pool
const pool = mysql.createPool({
    host: "g8mh6ge01lu2z3n1.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "vf3eq84lslno4wi3",
    password: "fahim1jmq6mmb4nf",
    database: "ypx5nnap969d2ue6",
    connectionLimit: 10,
    waitForConnections: true
});


//routes
app.get('/', (req, res) => {
   res.render('login.ejs')
});

app.post('/loginProcess', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let hashedPassword = "";

    let sql = `SELECT *
                FROM users
                WHERE username = ?`;
    const [rows] = await pool.query(sql, [username]);

    if (rows.length > 0) {
        hashedPassword = rows[0].password;
    }

    const match = await bcrypt.compare(password, hashedPassword);
    if (match) {
        req.session.isUserAuthenticated = true;
        if (rows[0].isAdmin == 1) {
            req.session.isUserAdmin = true;
        }
        req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
        res.render('home.ejs');
    }

    else {
        res.render('login.ejs', {"loginError": "Wrong Credentials"});
    }
});

app.get('/home', isUserAuthenticated, (req, res) => {
    res.render('home.ejs');
})

app.get('/updateQuote', isUserAuthenticated, isUserAdmin, async(req, res) => {
   let quoteId = req.query.quoteId;
    let sql = `SELECT *
               FROM quotes
               WHERE quoteId = ?`;
    const [quoteInfo] = await pool.query(sql, [quoteId]);

    let sqlAuthors = `SELECT authorId, firstName, lastName
                      FROM authors`;
    const [authors] = await pool.query(sqlAuthors);

    let cat = `SELECT DISTINCT category
    FROM quotes`;
    const [categories] = await pool.query(cat);
   res.render('updateQuote.ejs', {quoteId, quoteInfo, authors, categories});
});

app.get('/quotes', isUserAuthenticated, async(req, res) => {
    let sql = `SELECT quoteId, quote
               FROM quotes`;
    const [quotes] = await pool.query(sql);
    res.render('quotes.ejs', {quotes});
});

app.get('/updateAuthor', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let authorId = req.query.id;
    let sql = `SELECT *,
               DATE_FORMAT(dob, '%Y-%m-%d') ISOdob,
               DATE_FORMAT(dod, '%Y-%m-%d') ISOdod
               FROM authors
               WHERE authorId = ?`;
    const [authorInfo] = await pool.query(sql, [authorId]);
   res.render('updateAuthor.ejs', {authorInfo});
});

app.get('/authors', isUserAuthenticated, async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
               FROM authors
               ORDER BY lastName`;
    const [authors] = await pool.query(sql);
    res.render('authors.ejs', {authors});
})

//Displays form to add a new author
app.get('/addAuthor', isUserAuthenticated, isUserAdmin, (req, res) => {
   res.render('addAuthor.ejs')
});

//Displays form to add a new quote
app.get('/addQuote', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
    FROM authors
    ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    console.log(rows);

    let sql2 = `SELECT DISTINCT category
    FROM quotes`;
    const [rows2] = await pool.query(sql2);
    console.log(rows2);
    res.render('addQuote.ejs', {rows, rows2});
});

app.post('/addQuote', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let id = req.body.authorId;
    let q = req.body.quote;
    let cates = req.body.Category;
    let sql = `INSERT INTO quotes
                (quote,authorId,category)
                VALUES (?, ?, ?)`
    let sqlParams = [q, id, cates];
    const [insert] = await pool.query(sql, sqlParams);
    sql = `SELECT authorId, firstName, lastName
               FROM authors
               ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    sql = `SELECT DISTINCT(category) 
           FROM quotes
           ORDER BY category`;
    const [rows2] = await pool.query(sql);
   res.render('addQuote.ejs', {rows, rows2})
});

//Stores author data into the database
app.post('/addAuthor', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let fn = req.body.first;
    let ln = req.body.last;
    let dob = req.body.dob;
    let dod = req.body.dod;
    let birthPlace = req.body.bp;
    let gender = req.body.sex;
    let proffe = req.body.prof;
    let img = req.body.url;
    let info = req.body.bio;
    let sql = `INSERT INTO authors
                (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    let sqlParams = [fn, ln, dob, dod, gender,proffe, birthPlace, img, info];
    const [rows] = await pool.query(sql, sqlParams);
   res.render('addAuthor.ejs')
});

app.post('/updateAuthor', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let id = req.body.id;
    let firstName = req.body.fn;
    let lastName = req.body.ln;
    let sql = `UPDATE authors
               SET firstName = ?,
                   lastName = ?
               WHERE authorId = ?`;
    let sqlParams = [firstName, lastName, id];  
    const [rows] = await pool.query(sql, sqlParams);       
    res.redirect('/authors');
});

app.post('/updateQuote', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let quoteId = req.body.id;
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let cate = req.body.cate;
    let sql = `UPDATE quotes
               SET quote = ?,
                   authorId = ?,
                   category = ?
               WHERE quoteId = ?`;
    let sqlParams = [quote, authorId, cate, quoteId];  
    await pool.query(sql, sqlParams);       
    res.redirect('/quotes');
});
app.get('/deleteAuthor', isUserAuthenticated, isUserAdmin, async (req, res) => {
    let id = req.query.id;
    let sql = `DELETE FROM authors
               WHERE authorId = ?`;
    let sqlParams = [id];
    await pool.query(sql, sqlParams);
    res.redirect('/authors')
});

app.get('/deleteQuote', isUserAuthenticated, isUserAdmin,async(req,res) => {
    let id = req.query.quoteId;
    let sql = `DELETE FROM quotes
                WHERE quoteId = ?`;
    let sqlParams = [id];
    await pool.query(sql, sqlParams);
    res.redirect('/quotes');
});
//middleware
function isUserAuthenticated(req, res, next) {
    if (req.session.isUserAuthenticated) {
        next();
    }
    else {
        res.redirect('/');
    }
}

function isUserAdmin(req, res, next) {
    if (req.session.isUserAdmin) {
        next();
    }
    else {
        res.redirect('/');
    }
}

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});//dbTest

app.listen(3000, ()=>{
    console.log("Express server running")
})