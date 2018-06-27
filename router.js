const config = require("./config.js");
var request = require("request-promise");


module.exports = function(app){

    app.get('/login', (req, res) => {
        res.redirect(config.AUTHORIZE_URL+'authorize?client_id='+config.CLIENT_ID+"&scope=public_repo");
    });

    app.get('/logout', (req, res) => {
        res.clearCookie(config.COOKIE_TOKEN);
        res.redirect('/');
    });

    app.get('/callback', (req, res) => {
        console.log("Callback from github, code : "+req.query.code);
       request.post({
          uri: config.AUTHORIZE_URL+"access_token?client_id="+config.CLIENT_ID+"&client_secret="+config.CLIENT_SECRET+"&code="+req.query.code
         ,headers:{
            "User-Agent": config.CLIENT_NAME
         },
          json: true
        }).then((body) => {
            console.log(body);
            res.cookie(config.COOKIE_TOKEN, body.access_token);
            res.redirect('/');
       });
    });

    app
    .get('/star', (req, res, next) => {
        if(req.cookies[config.COOKIE_TOKEN]){
            next();
        } else {
            res.status(400);
            res.send("Log in required");
        }
    })
    .get('/star', (req, res) => {
        console.log(req.query.repo);
        console.log(req.cookies[config.COOKIE_TOKEN]);
        var options = {
            uri: config.APIURL+"user/starred/"+req.query.repo,
            headers: {
                "User-Agent": config.CLIENT_NAME,
                "Authorization": "token "+req.cookies[config.COOKIE_TOKEN]
            },
            json: true
        };
        console.log(options);
        request.put(options).then(() => {
            console.log("Star OK");
            res.send("OK");
        }).catch((error) => {
            console.log("Failed star "+error);
            res.status(400);
            res.send("Failed");
        });
    });

    app.get('/', (req, res) => {
        console.log("Index");
        request({
            uri: config.APIURL+"search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=100&page=1"
            ,headers:{
                "User-Agent": config.CLIENT_NAME
            },
            json: true
        }).then((body) => {
            var logged = false;
            if(req.cookies[config.COOKIE_TOKEN]) logged = true;
            res.render('pages/index', {items: body.items, logged: logged});
        });
    });
}