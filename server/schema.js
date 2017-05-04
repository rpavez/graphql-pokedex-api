// schema.js
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
} from 'graphql';

import { Pokemon } from './Pokemon';
import { PokemonType, UserType, MyCustomType } from './schemaTypes';
import { mongo } from './mongoService';

let Q = require('q');

let schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      pokemon: {
        type: new GraphQLList(PokemonType),
        resolve: () => Pokemon
      },
      user: {
        type: UserType,
        args: {
          name: {
            description: 'The name of the user',
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (root, {name}) => {

          return mongo()
            .then(db => {
              let deferred = Q.defer();

              let collection = db.collection('users');
              collection.find({ name })
                .toArray((err, docs) => {
                  if (err) {
                    deferred.reject(err);
                    return;
                  }

                  db.close();
                  deferred.resolve(docs.length ? docs[0] : null);
                });

              return deferred.promise;
            });

        }
      }
    }
  }),

  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      specialOp: {
        type: MyCustomType,
        args: {
          dataA: {
            data: 'dataA',
            type: new GraphQLNonNull(GraphQLString)
          },
          dataB: {
            data: 'dataB',
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (obj, {name}) => {

          console.log("Calling custom mutator with data")
          console.log(name)

          let myFirstPromise = new Promise((resolve, reject) => {
            // We call resolve(...) when what we were doing async succeeded, and reject(...) when it failed.
            // In this example, we use setTimeout(...) to simulate async code. 
            // In reality, you will probably be using something like XHR or an HTML5 API.
            setTimeout(function(){
              resolve("Success!"); // Yay! Everything went well!
            }, 250);
          });

          return myFirstPromise;

          // let toCreate = {
          //   name,
          //   caught: [],
          //   created: new Date().valueOf()
          // };

          // return mongo()
          //   .then(db => {
          //     let deferred = Q.defer();

          //     let collection = db.collection('users');

          //     // see if the user already exists
          //     collection.find({ name })
          //       .toArray((err, docs) => {
          //         if (err) {
          //           db.close();
          //           return deferred.reject(err);
          //         }

          //         if (docs.length) {
          //           db.close();
          //           return deferred.resolve(docs[0]);
          //         }

          //         // insert the user if they do not exist
          //         collection.insert(toCreate, (err, result) => {
          //           db.close();

          //           if (err) {
          //             deferred.reject(err);
          //             return;
          //           }

          //           deferred.resolve(toCreate);
          //         });
          //       });

          //     return deferred.promise;
          //   });

        }
      },
      upsertUser: {
        type: UserType,
        args: {
          name: {
            description: 'The name of the user',
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (obj, {name}) => {

          let toCreate = {
            name,
            caught: [],
            created: new Date().valueOf()
          };

          return mongo()
            .then(db => {
              let deferred = Q.defer();

              let collection = db.collection('users');

              // see if the user already exists
              collection.find({ name })
                .toArray((err, docs) => {
                  if (err) {
                    db.close();
                    return deferred.reject(err);
                  }

                  if (docs.length) {
                    db.close();
                    return deferred.resolve(docs[0]);
                  }

                  // insert the user if they do not exist
                  collection.insert(toCreate, (err, result) => {
                    db.close();

                    if (err) {
                      deferred.reject(err);
                      return;
                    }

                    deferred.resolve(toCreate);
                  });
                });

              return deferred.promise;
            });

        }
      },
      caughtPokemon: {
        type: UserType,
        args: {
          name: {
            description: 'The name of the user',
            type: new GraphQLNonNull(GraphQLString)
          },
          pokemon: {
            description: 'The name of the Pokemon that was caught',
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (obj, {name, pokemon}) => {
          return mongo()
            .then(db => {
              let deferred = Q.defer();

              let collection = db.collection('users');

              // find the user
              collection.find({ name })
                .toArray((err, docs) => {
                  if (err || !docs.length) {
                    db.close();
                    return deferred.reject(err || 'The user was not found');
                  }

                  let caught = docs[0].caught;
                  caught.push(pokemon);

                  // update the user with updated caught array
                  collection.update({ name }, {
                    $set : { caught }
                  }, (err, result) => {
                    if (err) {
                      db.close();
                      return deferred.reject(err);
                    }

                    deferred.resolve({
                      name : docs[0].name,
                      created : docs[0].created,
                      caught
                    });
                  });
                });

              return deferred.promise;
            });
        }
      }
    }
  })
});

export default schema;
