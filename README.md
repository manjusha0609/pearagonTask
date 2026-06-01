# pearagonTask

# Pearagon Interview Tasks

This repository contains solutions for both interview tasks.

## Task 1 - Book Search CLI

### Run

```bash
cd BookSearch
npm install
npm start
```

### Notes

- Prompts the user for a book title.
- Searches the provided Books API.
- Retrieves and displays author information.
- Continues prompting until the program is terminated.
- Includes in-memory API request caching.
- Cache expiration is configurable and defaults to 24 hours.

---

## Task 2 - Counter Web Application

### Run

```bash
cd CounterApp
npm install
npm start
```

Open:

```text
http://localhost:3000
```

### Notes

- Built with Express and vanilla JavaScript.
- Count starts at 0 and persists while the server is running.
- Uses only the required endpoints:
  - `GET /count`
  - `POST /increment`
- Multiply functionality is implemented using the existing endpoints (no `/multiply` endpoint).
- Includes request validation and error handling.

---

## Technologies Used

- JavaScript
- Node.js
- Express.js
- Axios
