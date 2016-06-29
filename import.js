// # Ghost Startup
// # https://www.datememe.com/blog/schedule-posts-with=ghost
// Orchestrates the startup of Ghost when run from command line.
var ghost, errors, config, _, later, api;
var fs = require("fs");
var path = require("path");

// Make sure dependencies are installed and file system permissions are correct.
require('./core/server/utils/startup-check').check();

// Proceed with startup
ghost = require('./core');
errors = require('./core/server/errors');
_ = require('lodash');
later = require('later');
api = require('./core/server/api');


function createPost(title, text, fn) {
    api.posts.add({posts: [{title: title, markdown: text}]}, {context: {
                    user: 1
                }}).then(function(post) {
                    console.log("post created", post);
                });
}
function importArticles() {
    var files = getFiles(__dirname + "/import");
    //var item = _.first(files);

    _.each(files, function(item) {

        var post = fs.readFileSync(item).toString();
        var title = path.basename(item).replace('.txt', '');
        console.log("title", title);
        var position  = post.indexOf("\n");
        post = post.substring(position+1);
        //console.log("title", item);
        console.log("post", post);

        post = post.replace(/\d./g, '##');

        createPost(title, post, function(post) {
            console.log("done");
        });
    });
}

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}


ghost().then(function (ghostServer) {
    config = ghostServer.config;
    importArticles();
}).catch(function (err) {
    errors.logErrorAndExit(err, err.context, err.help);
});
