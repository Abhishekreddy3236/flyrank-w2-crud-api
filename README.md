# FlyRank W2 CRUD API

This is a backend assignment for FlyRank Internship (Backend Track - Week 2).
It is a simple CRUD API for managing a to-do list, built with Node.js and Express.

> **Note:** Data is stored IN-MEMORY and will disappear when the server is restarted. This is expected behavior for this assignment.

## Technologies Used
- JavaScript
- Node.js
- Express
- swagger-ui-express

## How to Install and Run
1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm start
   ```
*(Alternatively, you can run `node index.js`)*

The server will start on `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| GET | `/` | API information |
| GET | `/health` | Health check |
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |

## Swagger UI

Swagger UI is available at: [http://localhost:3000/docs](http://localhost:3000/docs)

*(A screenshot of the Swagger UI is omitted here but it lists and documents all the endpoints allowing you to Try It Out).*
![Swagger UI Screenshot](./swagger_screenshot.png)

## Example curl commands

### Create a task
```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

**Output:**
```
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40
Date: Wed, 23 Sep 2026 10:54:36 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Buy milk","done":false}
```

### List tasks
```bash
curl -i http://localhost:3000/tasks
```

### Update a task
```bash
curl -i -X PUT http://localhost:3000/tasks/4 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
```

### Delete a task
```bash
curl -i -X DELETE http://localhost:3000/tasks/4
```

## Project Structure
- `index.js` - Main application logic, route definitions, and in-memory store.
- `swagger.js` - OpenAPI configuration for Swagger UI.
- `package.json` - Project metadata and dependencies.

## Stage 4: SQL Exploration
I opened `tasks.db` and ran:
`SELECT * FROM tasks WHERE done = 1;`
This query returned all tasks that have their `done` status set to true (1), which showed me any completed tasks.
