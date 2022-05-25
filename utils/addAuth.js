/* eslint-disable no-plusplus */
/* eslint global-require: warn */
/* eslint import/no-dynamic-require: warn */

const rls = require('readline-sync');
const path = require('path');
const fs = require('fs');

function getQuestions(props, obj) {
  const questions = props.map((p) => `${p}: ${(obj[p] !== undefined) ? `(${obj[p]})` : ''} `);
  return questions;
}

// function outputs each property for user to edit/confirm
// props are the fields that need to be changed depending on what the user selects
// obj is the JSON object that's being updated
function confirm(props, obj) {
  // create array of questions
  const updatedObj = obj;
  getQuestions(props, obj).forEach((q) => {
    const answer = rls.question(q);
    // only update the field if the answer is NOT and empty string
    if (answer) {
      updatedObj[q.split(':')[0].trim()] = answer;
    }
  });
  return updatedObj;
}

const updateBasicAuth = (auth) => {
  const propsToUpdate = ['username', 'password', 'auth_field', 'auth_field_format'];
  return confirm(propsToUpdate, auth);
};

const updateStaticTokenAuth = (auth) => {
  const propsToUpdate = ['token', 'auth_field', 'auth_field_format'];
  return confirm(propsToUpdate, auth);
};

function updateTokenSchemas(user, pw, token) {
  let schemaPath = path.join(__dirname, '..', 'entities/.system/schemaTokenReq.json');
  const reqSchema = require(schemaPath);
  reqSchema.properties.username.external_name = user;
  reqSchema.properties.password.external_name = pw;
  fs.writeFileSync(schemaPath, JSON.stringify(reqSchema, null, 2));
  schemaPath = path.join(__dirname, '..', 'entities/.system/schemaTokenResp.json');
  const respSchema = require(schemaPath);
  respSchema.properties.token.external_name = token;
  fs.writeFileSync(schemaPath, JSON.stringify(respSchema, null, 2));
}

function updateRequestToken(auth) {
  const propsToUpdate = [
    'username',
    'password',
    'auth_field',
    'auth_field_format',
    'token_user_field',
    'token_password_field',
    'token_result_field',
    'token_URI_path'
  ];
  const newAuth = confirm(propsToUpdate, auth);
  updateTokenSchemas(newAuth.token_user_field, newAuth.token_password_field, newAuth.token_result_field);

  return newAuth;
}

// prompt users to pick an auth method from the list above
const addAuthInfo = (props) => {
  const authOptions = [
    'basic user_password',
    'static_token',
    'request_token',
    'no_authentication'
  ];
  const newProps = confirm(['host', 'port', 'base_path'], props);

  const newAuthMethod = authOptions[rls.keyInSelect(authOptions, 'Which authentication method?')];
  newProps.authentication.auth_method = newAuthMethod;

  if (newAuthMethod === 'basic user_password') {
    newProps.authentication = updateBasicAuth(newProps.authentication);
  } else if (newAuthMethod === 'static_token') {
    newProps.authentication = updateStaticTokenAuth(newProps.authentication);
  } else if (newAuthMethod === 'request_token') {
    newProps.authentication = updateRequestToken(newProps.authentication);
  }
  console.log('Connectivity and authentication properties have been configured');
  console.log('If you want to make changes, rerun this script to reinstall the adapter');
  return newProps;
};

module.exports = { addAuthInfo };
