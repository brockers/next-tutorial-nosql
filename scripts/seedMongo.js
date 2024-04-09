const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');
const options = { ordered: true };
const bcrypt = require('bcrypt');

async function seedData(data, db) {
  try {
    // Define Collection
    const coll = db.collection(data.name);
    // Drop Collection if it already exists
    coll.drop(function(err, delOK) {
      if (err) throw err;
      if (delOK) console.log("Collection deleted");
    });
    // Execute insert operation
    const result = await coll.insertMany(data.data, options);
    // Print result
    console.log(`${result.insertedCount} ${data.name} documents were inserted`);
  } catch (error) {
    console.error(`Error seeding ${data.name}:`, error);
    throw error;
  }
}

async function main() {

  const client = await MongoClient.connect(uri);
  const db = client.db("accountFunnel");
  // Hashed passwords only
  users.forEach( async function(u) {
    u.password = await bcrypt.hash(u.password, 10);
  });

  await seedData( {name: "customers", data: customers}, db );
  await seedData( {name: "revenue", data: revenue}, db );
  await seedData( {name: "invoices", data: invoices}, db );
  // console.log("users object is: ", users);
  await seedData( {name: "users", data: users}, db );
  await client.close();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
