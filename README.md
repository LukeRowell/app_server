# app_server

app_server is a "catch-all" server meant to service my other applications that are hosted on Heroku. 

## Pokébase

When a query is made on the Pokébase application, a GET request is made to the app server. The server
then assembles the correct list of query values and query text based on the given parameters, and sends
them to the queryDB function. The queryDB function then opens the connection to the PostgreSQL database,
performs the query, closes the connection, and returns the results.

## Portfolio

If the contact form on the portfolio website has been properly filled out and submitted, a POST 
request is made to the app server. The server first checks the response token from the reCAPTCHA 
by making a POST request to Google's reCAPTCHA API. If the reCAPTCHA response is validated, then 
an email is constructed and sent using Nodemailer.

## Built With

* [Express](https://expressjs.com/)
* [PostgreSQL](https://www.postgresql.org/)
* [Nodemailer](https://nodemailer.com/about/)
* [Heroku](https://www.heroku.com/home)