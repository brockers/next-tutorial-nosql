import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');

export async function getStaticProps() {

  const client = await MongoClient.connect(uri);

  const db = client.db();

  db.
  const yourCollection = db.collection("customers");


  const yourData = await yourCollection.find().toArray();

  client.close();

  return {
    props: data
  };
}
