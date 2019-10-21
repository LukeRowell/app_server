const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));

async function queryDB(dbConnectionString, queryText, queryValues) {
    const pool = new Pool({
        connectionString: dbConnectionString,
        ssl: true,
    });

    const client = await pool.connect()
    const result = await client.query({
      rowMode: 'array',
      text: queryText,
      values: queryValues
    });

    client.release();

    pool.end(() => {
        //console.log(`Pool ended for: ${dbConnectionString}`);
    });

    return result;
}

app.post('/portfolio', async (request, response) => {
    const returnData = "Hello from sendmail";
    const secret_key = process.env.SECRET_KEY;
    const userResponse = JSON.stringify(request.body);
    const recaptcha_api_url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${userResponse}`;

    console.log(request.body);

    const recaptcha_response = await fetch(recaptcha_api_url, {
        method: 'POST'
    });

    const recaptcha_response_json = await recaptcha_response.json();

    response.json(recaptcha_response_json);
    
    /*
    const recaptcha_response = await fetch(recaptcha_api_url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    */
    //response.json(returnData);
    /*
    const rawResponse = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({a: 1, b: 'Textual content'})
    });

    const content = await rawResponse.json();
    */


    /*
    //response.json(request.headers);
    
    
    const options = {
      method: 'POST',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          secret: process.env.SECRET_KEY,
          response: userResponse
      })
    };

    const db_response = await fetch(recaptcha_api_url, options);   //send the data over to be inserted to the database
    //const db_json = await db_response.json();
    */

    /*
    app.use(cors());
    app.options('*', cors());


    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDR,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_ADDR,
        to: process.env.EMAIL_ADDR
    };
    */

});

app.get('/pokebase/search/:parameters', async (request, response) => {
    const searchParameters = request.params.parameters.split(',');
    const orderStat = searchParameters[0];
    const searchType1 = searchParameters[1];
    const searchType2 = searchParameters[2];
    let generationNumbers;
    let orderVal;
    let queryText;
    let queryValues;
    let formattedResults = [];

    searchParameters[3] == "any" ? generationNumbers = [1, 2, 3, 4, 5, 6, 7] : generationNumbers = [parseInt(searchParameters[3], 10)];
    searchParameters[4] == 1 ? orderVal = "ASC" : orderVal = "DESC";

    if (searchType1 == "none" && searchType2 == "none"){   //if both types are set to none
        queryText = `SELECT * FROM pokemon WHERE name = $1;`;
        queryValues = ['Luke'];
    } else if (searchType1 == "any" && searchType2 == "any") {     //if both types are set to any
        queryText = `SELECT * FROM pokemon WHERE generation = ANY ($1) ORDER BY ${orderStat} ${orderVal};`;        
        queryValues = [generationNumbers];
    } else if ((searchType1 == "any" && searchType2 == "none") || (searchType1 == "none" && searchType2 == "any")) {     //if one type is any, and one type is none
        queryText = `SELECT * FROM pokemon WHERE type2 = $1 AND generation = ANY ($2) ORDER BY ${orderStat} ${orderVal};`;
        queryValues = ['none', generationNumbers];
    } else if ((searchType1 == "any" && searchType2 != "any") || (searchType1 != "any" && searchType2 == "any")) {   //if one type is any, and one type is not none
        if (searchType1 != "any" && searchType1 != "none") { //if searchType1 is the specified type
            queryText = `SELECT * FROM pokemon WHERE (type1 = $1 OR type2 = $1) AND generation = ANY ($2) ORDER BY ${orderStat} ${orderVal};`;
            queryValues = [searchType1, generationNumbers];
        } else { //if searchType2 is the specified type
            queryText = `SELECT * FROM pokemon WHERE (type1 = $1 OR type2 = $1) AND generation = ANY ($2) ORDER BY ${orderStat} ${orderVal};`;
            queryValues = [searchType2, generationNumbers];
        }
    } else if ((searchType1 == "none" && searchType2 != "any" && searchType2 != "none") || (searchType1 != "any" && searchType1 != "none" && searchType2 == "none")) { //if one type is none, and one type is not any
        if (searchType1 != "any" && searchType1 != "none") { //if searchType1 is the specified type
            queryText = `SELECT * FROM pokemon WHERE (type1 = $1 AND type2 = $2) AND generation = ANY ($3) ORDER BY ${orderStat} ${orderVal};`;
            queryValues = [searchType1, 'none', generationNumbers];
        } else { //if searchType2 is the specified type
            queryText = `SELECT * FROM pokemon WHERE (type1 = $1 AND type2 = $2) AND generation = ANY ($3) ORDER BY ${orderStat} ${orderVal};`;
            queryValues = [searchType2, 'none', generationNumbers];
        }
    } else { //return any Pokemon with this type combination - type1/type2 or type2/type1
        queryText = `SELECT * FROM pokemon WHERE ((type1 = $1 AND type2 = $2) OR (type1 = $2 AND type2 = $1)) AND generation = ANY ($3) ORDER BY ${orderStat} ${orderVal};`;
        queryValues = [searchType1, searchType2, generationNumbers];
    }

    const result = await queryDB(process.env.DATABASE_URL, queryText, queryValues);

    for (item of result.rows) {
        const entry = {
            name: item[0],
            ndexno: item[1], 
            generation: item[2],
            type1: item[3],
            type2: item[4],
            hp: item[5],
            atk: item[6],
            def: item[7],
            spatk: item[8],
            spdef: item[9],
            spd: item[10],
            total: item[11],
            bulba_name: item[12]
        }

        formattedResults.push(entry);
    }
    
    response.json(formattedResults);
});

app.listen(port, () => {                        //start the server on supplied port or port 3000 if none supplied
    console.log(`Starting server at ${port}`);
});