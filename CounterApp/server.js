const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory count that persists across page reloads (server restarts will reset it)
let count = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// GET / — serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// GET /count — return current count
app.get("/count", (req, res) => {
  res.json({ count });
});

// POST /increment — increment count by a given value
app.post("/increment", (req, res) => {
  const { value } = req.body;

  // Validate: body must exist and value must be a finite number
  if (
    req.body === undefined ||
    req.body === null ||
    value === undefined ||
    value === null ||
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return res.status(400).json({
      error:
        'Invalid request body. Expected JSON with an integer "value" field.',
    });
  }

  count += value;
  res.json({ count });
});

app.listen(PORT, () => {
  console.log(`Counter app running at http://localhost:${PORT}`);
});