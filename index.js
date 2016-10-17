var dotenv = require('dotenv');
dotenv.load();

var Hapi = require('hapi');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var Joi = require('joi');
var PORT = process.env.PORT || 8001;

process.env.SHARED_SECRET = 'Change me in an env file';

var server = new Hapi.Server();
server.connection({
  port: PORT,
  labels: ['api'],
  routes: {
      cors: true,
  }
});
server.register([{
    register: require('inert'),
    options: {}
}, {
    register: require('vision'),
    options: {}
}, {
  register: require('hapi-auth-jwt'),
  options: {}
}], (err) => {

    if (err) {
        throw err;
    }
});


});

//swagger ui
server.register({
  register: require('hapi-swagger'),
  options: {
    basePath: 'http://localhost:' + PORT,
    apiVersion: server.version,
    customJSHandler: function(request, reply) {
      var key = jwt.sign({
          some_data_we_are_passing: 'req-from-swagger-ui'
      }, process.env.SHARED_SECRET);
      // passing authorization to hapi-swagger
      reply('window.authorizations.add("key", new ApiKeyAuthorization("Authorization","' + key + '", "header"));').type('application/javascript');
    },
  }
}, function(err) {
  if (err) {
    server.log(['error'], 'hapi-swagger load error: ' + err);
  } else {
    server.log(['start'], 'hapi-swagger interface loaded');
  }
});

server.auth.strategy('token', 'jwt', {
  key: process.env.SHARED_SECRET,
  validateFunc: function(decodedToken, callback) {
    console.log("decoded token", decodedToken);
    if (decodedToken) {
        callback(null, true, _.pick(decodedToken, 'some_data_we_are_passing'));
    } else {
        callback(null, false);
    }
  }
});

server.route({
  method: ['POST', 'PUT'],
  path: '/api/hello',
  handler: function(request, reply) {
    reply('Hello! ' + JSON.stringify(request.payload));
  },
  config: {
    validate: {
      payload: Joi.array().items(Joi.object().keys({
          name: Joi.string(),
      }))
    },
    auth: 'jwt',
    tags: ['api']
  }
  
server.start(function(err) {
	if (err) { console.log(err); }
  var server_info = _.map(server.connections, function(connection) {
    return [
      connection.settings.labels.join(', '),
      ': ',
      connection.info.uri,
      ' with plugins ',
      _.keys(connection._registrations).join(', ')
    ].join('');
  });
  console.log("Hapi version:", server.version, "started with servers: \n", server_info.join('\n '));
});
