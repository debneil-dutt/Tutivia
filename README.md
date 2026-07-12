## Tutivia - Connecting Students and Tutors

Tutivia is a website designed to connect students with tutors based on their specific needs like subject, board and experience.

Here Students can ask questions, upload their doubts, and get solutions from Tutors.

## 🛠️ Tech Stack

### Frontend
* **HTML5 & CSS3**: Core layout and styling using responsive design principles (Flexbox, CSS Grid).
* **Vanilla JavaScript**: Client-side logic, DOM manipulation, and asynchronous API calls using `fetch`.
* **Static Assets**: No bundlers are used. Assets are served directly.

### Backend
* **Node.js & Express.js**: Server-side runtime and web framework handling routing and middleware.
* **Database**: **SQLite3**, a lightweight, serverless relational database for storing users, doubts, and solutions.
* **File Handling**: **Multer** is used to handle `multipart/form-data` for image uploads (doubts and solutions).

## 🏗️ Architecture & Logic

Tutivia follows a classic **Client-Server Architecture**.

### 1. Database Schema
* **Users**: Stores both students and teachers. Differentiated by a `userType` column. Teachers have extra fields like `experience`, `board`, `bio`, and `rating`.
* **Doubts**: Contains student queries (`title`, `description`, `subject`, `image`) and a boolean `solved` flag. Links to `users` via `studentId`.
* **Solutions**: Contains answers provided by teachers (`solutionText`, `solutionImage`, `rating`, `feedback`). Links to `doubts` and `users` (teacher).

### 2. Backend Logic
* **Routing**: The REST API is modularized into `auth`, `students`, `teachers`, `doubts`, and `solutions` routes.
* **Authentication**: Simple authentication checking email and password directly against the database. On login, the user's data is stored in the frontend's local storage to maintain the session state.
* **File Uploads**: The server accepts images via Multer, saves them to a local `data/uploads` folder (or a cloud storage path if configured via environment variables), and statically serves them back to the frontend through the `/api/uploads` route.
* **Frontend Integration**: Express statically serves the `frontend` directory. If a non-API route is hit, it falls back to `index.html` to support client-side routing.

### 3. Frontend Logic
* **User Interfaces**: Dedicated dashboards for students and teachers. The UI dynamically toggles components depending on the user's role (stored in localStorage).
* **Interaction Flow**:
  * Students filter and find teachers by subject and board. They can upload doubts with text and images.
  * Teachers browse unresolved doubts, submit solutions with text and images, and receive feedback/ratings from students.
  * Data binding is done dynamically by modifying the DOM with template literals after fetching from the REST API endpoints.
