var request = require('request'),
    restmail = require('./restmail.js');

const TESTIDP_API = 'https://testidp.org/api/';

// Compatible with Q.ncall
exports.qCreateIdP = function (cb) {
  request(TESTIDP_API + 'domain', function(err, response, body) {
    if (err) return cb(err);

    // resp would be 0
    var obj = {
      idp: JSON.parse(body)
    };

    // getRandomEmail() - allocate a random email on the testidp's domain
    obj.getRandomEmail = function() {
      return restmail.randomEmail(10, this.idp.domain + '.testidp.org');
    };

    obj.addPublicKey = module.exports.addPublicKey;

    // setWellKnown() - set the well-known document for the domain
    obj.setWellKnown = function(document, cb) {
      if (typeof document === 'object') document = JSON.stringify(document, null, 3);

      request.put({
        url: TESTIDP_API + this.idp.domain + "/well-known",
        json: true,
        body: document,
        headers: {
          'x-password': this.idp.password
        }
      }, function(err, response, body) {
        if (err) return cb(err);
        if (!body.ok) return cb(body.why);
        cb(err);
      });
    };

    obj.email = obj.getRandomEmail();

    cb(err, obj);
  });
};

function putJson(idp, params, api, cb) {
  put(idp, {json: params}, api, cb);
}
function putForm(idp, params, api, cb) {
  put(idp, {form: params}, api, cb);
}
function put(idp, opts, api, cb) {
  request(_.extend({
    url: 'https://testidp.org/api/' + idp.domain + '/' + api,
    method: 'PUT',
    headers: {
     'X-Password': idp.password
    },
    encoding: 'utf8'
  }, opts), cb);
}

exports.CreateIdP = function (idp) {
  return {
    /**
     * @param {object} wellKnown
     * @param {boolean} addGoodKey - public-key field will be populated
     *                  with actual keypair
     * @param {function} cb - request compatible callback
     */
    putWellKnown: function (wellKnown, addGoodKey, cb) {
      if (addGoodKey) module.exports.addPublicKey(wellKnown);
      putJson(idp, wellKnown, 'well-known', cb);
    },
    /**
     * @param {object} envUrl - Must start with http and end with /
     * @param {function} cb - request compatible callback
     */
    putEnv: function (envUrl, cb) {
      putForm(idp, {env: envUrl}, 'env', cb);
    },
    /**
     * @param {string} name
     * @param {string} value
     * @param {function} cb - request compatible callback
     */
    putHeaders: function(name, value, cb) {
      var headers = {};
      headers[name] = value;
      putJson(idp, headers, 'headers', cb);
    },
    /**
     * @param {function} cb - request compatible callback
     */
    deleteIdp: function(cb) {
      request({
        url: 'https://testidp.org/api/' + idp.domain,
        method: 'DELETE',
        headers: {
         'X-Password': idp.password
        },
        encoding: 'utf8'
      }, cb);
    }
  };
};

/**
 * @param {object}
 * @return updated wellKnown - provided for chaining, object gets
 *                 updated either way
 */
exports.addPublicKey = function (wellKnown) {
  wellKnown['public-key'] = '<TEST IDP PROVIDED>';
  return wellKnown;
};