const axios = require("axios");
const readline = require("readline");

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = "https://ejditq67mwuzeuwrlp5fs3egwu0yhkjz.lambda-url.us-east-2.on.aws/api";

// Cache expiry time we can change this one number to adjust how long cache entries stay fresh (in milliseconds)
// 24 * 60 * 60 * 1000 = 24 hours in milliseconds
const TTL_MS = 24 * 60 * 60 * 1000;


// ============================================================
// CACHE
// A Map where each entry looks like:
//   key   → string  e.g. "books:The Hobbit" or "authors:123"
//   value → { data: <API response>, storedAt: <ms timestamp> }
// ============================================================
const cache = new Map();


// ============================================================
// FUNCTION: cachedRequest({ cacheKey, method, url, body })
//
// Wraps every API call with cache logic:
//   1. Check if a fresh entry exists in the cache
//   2. If yes - return it (no network call made)
//   3. If no  - call the API, store result, return it
// ============================================================
async function cachedRequest({ cacheKey, method, url, body }) {
  // Step 1: Check if cache has an entry for this key
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);

    // Step 2: Check if the entry is still fresh
    const ageMs = Date.now() - entry.storedAt;
    if (ageMs < TTL_MS) {
      console.log(`  [cache hit] ${cacheKey}`);
      return entry.data;
    }

    // Entry exists but is stale — delete it
    cache.delete(cacheKey);
    console.log(`  [cache stale] ${cacheKey} — refetching`);
  }

  // Step 3: No fresh cache entry — make the real API call
  console.log(`  [api call] ${method} ${url}`);

  const response = method === "POST"
    ? await axios.post(url, body, { headers: { "Content-Type": "application/json" } })
    : await axios.get(url,        { headers: { "Content-Type": "application/json" } });

  // Step 4: Store the result in cache
  cache.set(cacheKey, {
    data: response.data,
    storedAt: Date.now(),
  });

  return response.data;
}


// ============================================================
// FUNCTION: searchBook(title)
//
// POST /api/books/search   body: { title }
//
// Returns the book object if found, or null if not found.
//
// "Found" response:
//   { title, id, description, authors: [123, 456] }
//
// "Not found" response:
//   { error: "Book Not Found" }
// ============================================================
async function searchBook(title) {
  const url = `${BASE_URL}/books/search`;
  const cacheKey = `books:${title.toLowerCase()}`;

  const data = await cachedRequest({
    cacheKey,
    method: "POST",
    url,
    body: { title },
  });

  // If the response has an "error" field, the book wasn't found
  if (data.error) {
    return null;
  }

  return data;
}


// ============================================================
// FUNCTION: getAuthor(authorId)
//
// GET /api/authors/:authorId
//
// Returns the author object.
//
// Response with middle initial:
//   { id: 123, firstName: "William", middleInitial: "G", lastName: "Golding" }
//
// Response without middle initial:
//   { id: 456, firstName: "Joshua", lastName: "Beatty" }
// ============================================================
async function getAuthor(authorId) {
  const url = `${BASE_URL}/authors/${authorId}`;
  const cacheKey = `authors:${authorId}`;

  const data = await cachedRequest({
    cacheKey,
    method: "GET",
    url,
  });

  return data;
}


// ============================================================
// FUNCTION: formatAuthorName(author)
//
// Formats an author object into a display string.
//
// With middle initial:    "William G. Golding"
// Without middle initial: "Joshua Beatty"
// ============================================================
function formatAuthorName(author) {
  if (author.middleInitial) {
    return `${author.firstName} ${author.middleInitial}. ${author.lastName}`;
  }
  return `${author.firstName} ${author.lastName}`;
}


// ============================================================
// FUNCTION: handleSearch(title)
//
// Orchestrates the full search flow:
//   1. Search for the book
//   2. If not found - print message and return
//   3. If found - fetch all authors in parallel
//   4. Format and print everything
// ============================================================
async function handleSearch(title) {
  console.log(`\nSearching for "${title}"...`);

  // Step 1: Search for the book
  const book = await searchBook(title);

  // Step 2: Book not found
  if (!book) {
    console.log(`\n  Book not found.`);
    return;
  }

  // Step 3: Fetch all authors in parallel
  // book.authors is an array of plain numbers e.g. [123, 456]
  // Promise.all fires all getAuthor() calls simultaneously
  // instead of waiting for each one to finish before starting the next
  let authors = [];
  if (book.authors && book.authors.length > 0) {
    authors = await Promise.all(
      book.authors.map((authorId) => getAuthor(authorId))
    );
  }

  // Step 4: Format author names
  const authorNames = authors.map((a) => formatAuthorName(a));

  // Step 5: Print the result
  console.log(`\n  Title:       ${book.title}`);
  console.log(`  Description: ${book.description}`);

  if (authorNames.length > 0) {
    console.log(`  Authors:     ${authorNames.join(", ")}`);
  } else {
    console.log(`  Authors:     (none listed)`);
  }
}


// ============================================================
// MAIN — readline loop
//
// Creates a readline interface that reads from the terminal.
// askForTitle() calls itself recursively to loop forever.
// Ctrl+C exits the program.
// ============================================================
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=================================");
  console.log("   Book Search CLI");
  console.log("=================================");
  console.log("Type a book title and press Enter.");
  console.log("Press Ctrl+C to quit.\n");

  function askForTitle() {
    rl.question("Enter book title: ", async (input) => {
      const title = input.trim();

      // If user pressed Enter with no input, just ask again
      if (!title) {
        askForTitle();
        return;
      }

      try {
        await handleSearch(title);
      } catch (err) {
        // Network errors, unexpected API responses etc.
        console.error(`\n  Error: ${err.message}`);
      }

      // Loop — ask for the next title
      askForTitle();
    });
  }

  // Kick off the first prompt
  askForTitle();
}

// Entry point
main();