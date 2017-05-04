import express from 'express';
import schema from './schema';
import graphqlHTTP from 'express-graphql';
import { graphql } from 'graphql';

let app  = express();

// GraphqQL server route
app.use('/graphql', graphqlHTTP(req => ({
  schema,
  pretty: true,
  graphiql: true
})));

let server = app.listen(
  3000,
  () => console.log(`GraphQL running on port ${server.address().port}`)
);
