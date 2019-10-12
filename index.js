const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

app.listen(port, () => {                        //start the server on supplied port or port 3000 if none supplied
    console.log(`Starting server at ${port}`);
});

app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
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

    const client = await pool.connect()
    const result = await client.query({
      rowMode: 'array',
      text: queryText,
      values: queryValues
    });

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