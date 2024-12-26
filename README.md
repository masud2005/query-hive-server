# QueryHive

QueryHive is a web application designed to facilitate the submission, management, and recommendation of user-generated queries related to various products. Users can log in, create, update, and delete their queries, as well as recommend queries submitted by others. The app also features Google-based authentication for a seamless user experience.

---

## Purpose
The purpose of QueryHive is to:
- Enable users to voice their concerns and raise queries about specific products.
- Provide a platform for community-driven recommendations on queries.
- Enhance user experience with modern authentication and secure API interactions.

---

## Live URL

[Live Demo](https://ask-and-recommend.web.app)

---

## Key Features
- **Authentication:**
  - Email/Password-based registration and login.
  - Google login for quick access.
  - JWT-based secure API requests with HTTP-only cookies.
- **Query Management:**
  - Create, update, and delete queries.
  - View all queries or fetch specific queries by ID or email.
  - Retrieve the 6 most recent queries.
- **Recommendations:**
  - Recommend queries and track counts.
  - Fetch all recommendations by query or user.
  - Add and remove recommendations dynamically.
- **Protected Routes:**
  - Routes secured using React context and private routes.
- **Responsive Design:**
  - A responsive layout powered by Tailwind CSS and DaisyUI.

---

## Technologies Used
### Frontend:
- **React**: A JavaScript library for building user interfaces.
- **React Router Dom**: For navigation and routing.
- **Axios**: For API communication.
- **Framer Motion**: Animation library for enhancing UI transitions.
- **Tailwind CSS & DaisyUI**: Styling framework for fast and responsive design.
- **SweetAlert2**: For customizable alerts.

### Backend:
- **Node.js**: JavaScript runtime for the server-side application.
- **Express.js**: Web application framework.
- **MongoDB**: NoSQL database for data storage.
- **JWT**: For secure token-based authentication.
- **Cookie Parser**: Middleware to parse cookies.

### Firebase:
- Authentication with Email/Password and Google login.

---

## NPM Packages Used
- axios: For API requests.
- firebase: For authentication.
- framer-motion: For animations.
- react: For UI rendering.
- react-router-dom: For routing.
- react-helmet-async: For managing document head.
- react-icons: For icons.
- react-tooltip: For tooltips.
- sweetalert2: For alerts.
- swiper: For interactive sliders.
