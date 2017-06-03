const express = require('express');
const app = express();

app.disable('case sensitive routing');
app.set('json spaces', 4);
app.disable('strict routing');
app.locals.fileOpts = {
    root: process.cwd() + '/client/'
};

app.listen(3000);


app.use(express.static(app.locals.fileOpts.root));

app.use(function(req, res){
    res.status(404).sendFile('404.html', app.locals.fileOpts);
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
