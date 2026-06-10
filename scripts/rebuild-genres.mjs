import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const books = db.collection("books");

  console.log("Connected to database");

  // Count books with categories (these will be updated)
  const withCategories = await books.countDocuments({
    categories: { $exists: true, $ne: [] },
  });
  console.log(`Books with categories: ${withCategories}`);

  // Update: set genres = categories for books that have categories
  const result = await books.updateMany(
    { categories: { $exists: true, $ne: [] } },
    [{ $set: { genres: "$categories" } }],
  );

  console.log(`Updated ${result.modifiedCount} books`);
  console.log(`Matched ${result.matchedCount} books`);

  // Count books with no categories that still have genres (left untouched)
  const untouched = await books.countDocuments({
    $or: [
      { categories: { $exists: false } },
      { categories: { $size: 0 } },
    ],
    genres: { $exists: true, $ne: [] },
  });
  console.log(`Books with genres but no categories (untouched): ${untouched}`);

  await client.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
