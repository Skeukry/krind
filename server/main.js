const express = require('express');
const app = express();


// Setup --------------------------------------------------
app.disable('case sensitive routing');
app.disable('strict routing');
app.set('json spaces', 4);
app.locals.fileOpts = {
    root: process.cwd() + '/client/'
};

app.listen(process.env.PORT || 3000);


// Routing ------------------------------------------------
app.use(express.static(app.locals.fileOpts.root + 'favicon/'));
app.use(express.static(app.locals.fileOpts.root));

app.use(function(req, res){
    res.status(404).sendFile('404.html', app.locals.fileOpts);
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
