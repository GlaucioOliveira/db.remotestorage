const express = require('express');
const mysql = require('mysql');

const app = express();
const cors = require('cors');

const port = 3001;

const db_host = process.env.HOST;
const db_user = process.env.USER;
const db_pass = process.env.PASS;
const db_database = process.env.DATABASE;

const apiBase = process.env.API_BASE;

// Function to create a database connection
function createConnection() {
  return mysql.createConnection({
    host: db_host,
    user: db_user,
    password: db_pass,
    database: db_database,
  });
}

// Use the cors middleware to allow any origin
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Middleware to handle database connection for each request
app.use(async (req, res, next) => {
  req.db = createConnection();
  await req.db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL: ', err);
      return res.status(500).send('Database connection error');
    }
    next();
  });
});

// Get Remote Storage
app.get(`${apiBase}/:key/:secret`, async (req, res) => {
  const key = req.params.key;
  const secret = req.params.secret;
  const sql = 'SELECT `key`, `value` from remotestorage where `key` = ? and `secret` = ?';

  try{
    await req.db.query(sql, [key, secret], (err, result) => {
      if (err) {
        console.error('Error getting meeting: ', err);
        res.status(500).send('Error getting meeting');
      } else {
        res.status(200).json(result[0]);
      }
    });
  }
  catch(ex){
    res.status(500).send(ex);
  }
  finally{
    await req.db.end();
  }  
});

// Create
 app.post(`${apiBase}`, async (req, res) => {
    const {key, value, secret} = req.body;

  const sql = 'INSERT INTO remotestorage values (0, ?, ?, ?)';

  try{
    await req.db.query(sql, [key, value, secret], (err, result) => {
    if (err) {
      console.error('Error creating remote storage: ', err);
      res.status(500).send('Error creating remote storage');
    } else {
      res.status(201).json({Id: result.insertId});
    }
  });
  }
  catch(ex){
    res.status(500).send(ex);
  }
  finally{
    await req.db.end();
  }
});

app.put(`${apiBase}`, async (req, res) => {
    //const key = req.params.key;
    const {key, value, secret} = req.body;
    let Id = 0;

    try{    
      await req.db.query('select Id from remotestorage where `key` = ? and `secret` = ?', [key, secret], async (err, result) => {
      if (err) {
        console.error('something worng happened while trying to verify if remotesotrage exists: ', err);
      } else {
        if(result && result[0] && result[0].Id > 0)
        {
          Id = Id = result[0].Id;
          
          const sql = 'UPDATE remotestorage SET value = ? where Id = ?';
          console.log(sql);
    
          await req.db.query(sql, [value, Id], (err, result) => {
            if (err) {
              console.error('Error getting remote storage: ', err);
              res.status(500).send('Error getting remote storage');
            } else {
              res.status(200).json(result[0]);
            }
          });
        }
        else{
          const sql = 'INSERT INTO remotestorage values (0, ?, ?, ?)';
          console.log(sql);
    
          await req.db.query(sql, [key, value, secret], async (err, result) => {
            if (err) {
              console.error('Error creating remote storage: ', err);
              res.status(500).send('Error creating remote storage');
            } else {
              res.status(201).json({Id: result.insertId});
            }
          });
        }        
      }
    });
  }
  catch(ex){
    res.status(500).send(ex);
  }
  finally{
    await req.db.end();
  }

});

// Delete
app.delete(`${apiBase}/:key/:secret`, async (req, res) => {
  const key = req.params.key;
  const secret = req.params.secret;
  const sql = 'DELETE FROM reuniao WHERE `key` = ? and `secret` = ?';

  try{
    await req.db.query(sql, [key, secret], (err, result) => {
      if (err) {
        console.error('Error deleting remote storage: ', err);
        res.status(500).send('Error deleting remote storage');
      } else {
        res.status(200).send('remote storage deleted successfully');
      }
  });
  }
  catch(ex)
  {
    res.status(500).send(ex);
  }
  finally{
    await req.db.end();
  }

});

app.listen(port, () => {
  console.log(`db.remotestorage v0.0.1 - ${port}`);
});
