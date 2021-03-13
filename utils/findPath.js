#!/usr/bin/env node
/* @copyright Itential, LLC 2019 */
/* eslint global-require:warn */
/* eslint import/no-dynamic-require:warn */
/* eslint prefer-destructuring:warn */

const fs = require('fs-extra');
const path = require('path');
const rls = require('readline-sync');

/**
 * This script will determine the type of integration test to run
 * based on input. If other information is needed, it will solicit
 * that input and then edit the integration test accordingly.
 */

/**
 * Updates the action files
 */
function checkActionFiles(apath) {
  // verify the path
  if (!apath) {
    console.log('  NO PATH PROVIDED!');
    return 'Done';
  }

  // make sure the entities directory exists
  const entitydir = path.join(__dirname, '../entities');
  if (!fs.statSync(entitydir).isDirectory()) {
    console.log('Could not find the entities directory');
    return 'error';
  }

  const entities = fs.readdirSync(entitydir);
  let found = false;

  // need to go through each entity in the entities directory
  for (let e = 0; e < entities.length; e += 1) {
    // make sure the entity is a directory - do not care about extra files
    // only entities (dir)
    if (fs.statSync(`${entitydir}/${entities[e]}`).isDirectory()) {
      // see if the action file exists in the entity
      if (fs.existsSync(`${entitydir}/${entities[e]}/action.json`)) {
        // Read the entity actions from the file system
        const actions = require(`${entitydir}/${entities[e]}/action.json`);

        // go through all of the actions set the appropriate info in the newActions
        for (let a = 0; a < actions.actions.length; a += 1) {
          if (actions.actions[a].entitypath.indexOf(apath) >= 0) {
            found = true;
            console.log(`  Found - entity: ${entities[e]} action: ${actions.actions[a].name}`);
            console.log(`          method: ${actions.actions[a].method} path: ${actions.actions[a].entitypath}`);
            console.log(' ');
          }
        }
      } else {
        console.log(`Could not find entities ${entities[e]} action.json file`);
        return 'error';
      }
    } else {
      console.log(`Could not find entities ${entities[e]} directory`);
      return 'error';
    }
  }

  if (!found) {
    console.log('  PATH NOT FOUND!');
  }
  return 'Done';
}

const findPath = rls.question('Enter the path/partial path you are looking for: ');
console.log(`PATH: ${findPath}`);
checkActionFiles(findPath);
