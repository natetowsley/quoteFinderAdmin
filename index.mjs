import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

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
   res.render('home.ejs')
});

app.get('/updateQuote', async(req, res) => {
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
   res.render('updateQuote.ejs', {quoteInfo, authors, categories});
});

app.get('/quotes', async(req, res) => {
    let sql = `SELECT quoteId, quote
               FROM quotes`;
    const [quotes] = await pool.query(sql);
    res.render('quotes.ejs', {quotes});
});

app.get('/updateAuthor', async (req, res) => {
    let authorId = req.query.id;
    let sql = `SELECT *,
               DATE_FORMAT(dob, '%Y-%m-%d') ISOdob,
               DATE_FORMAT(dod, '%Y-%m-%d') ISOdod
               FROM authors
               WHERE authorId = ?`;
    const [authorInfo] = await pool.query(sql, [authorId]);
   res.render('updateAuthor.ejs', {authorInfo});
});

app.get('/authors', async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
               FROM authors
               ORDER BY lastName`;
    const [authors] = await pool.query(sql);
    res.render('authors.ejs', {authors});
})

//Displays form to add a new author
app.get('/addAuthor', (req, res) => {
   res.render('addAuthor.ejs')
});

//Displays form to add a new quote
app.get('/addQuote', async (req, res) => {
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

app.post('/addQuote', async (req, res) => {
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
    const [cate] = await pool.query(sql);
   res.render('addQuote.ejs', {rows, cate})
});

//Stores author data into the database
app.post('/addAuthor', async (req, res) => {
    let fn = req.body.first;
    let ln = req.body.last;
    let birthPlace = req.body.bp;
    let gender = req.body.sex;
    let proffe = req.body.prof;
    let img = req.body.url;
    let info = req.body.bio;
    let sql = `INSERT INTO authors
                (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    let sqlParams = [fn, ln, dofb, dofd, gender,proffe, birthPlace, img, info];
    const [rows] = await pool.query(sql, sqlParams);
   res.render('addAuthor.ejs')
});

app.post('/updateAuthor', async (req, res) => {
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