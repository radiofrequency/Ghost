// # Ghost Startup
// # https://www.datememe.com/blog/schedule-posts-with=ghost
// Orchestrates the startup of Ghost when run from command line.
var ghost, errors, config, _, later, api;

// Make sure dependencies are installed and file system permissions are correct.
require('./core/server/utils/startup-check').check();

// Proceed with startup
ghost = require('./core');
errors = require('./core/server/errors');
_ = require('lodash');
later = require('later');
api = require('./core/server/api');

function publishFirstDraftPost() {
    api.posts.browse({
        filter: 'tags:scheduled',
        status: 'draft',
        include: 'tags',
        limit: '1',
        context: {
            internal: true
        }
    }).then(function (result) {
        var tags, post;
        if (result.posts.length > 0) {
            tags = _.remove(result.posts[0].tags, function (tag) {
                return (tag.name !== 'scheduled');
            });
            post = {
                posts: [{
                    published_at: new Date(),
                    published_by: result.posts[0].author,
                    status: 'published',
                    tags: tags
                }]
            };
            api.posts.edit(post, {
                id: result.posts[0].id,
                context: {
                    user: result.posts[0].author
                }
            }).then(function (result) {
                console.log('published post', config.getBaseUrl() + result.posts[0].url);
            });
        } else {
            console.log('no drafts found to post');
        }
    }).catch(function (reason) {
        console.log('error', reason);
    });
}

function startSchedule() {
    var schedule = later.parse.text('at 9:am');
    later.setInterval(publishFirstDraftPost, schedule);
}

ghost().then(function (ghostServer) {
    config = ghostServer.config;
    startSchedule();
}).catch(function (err) {
    errors.logErrorAndExit(err, err.context, err.help);
});
