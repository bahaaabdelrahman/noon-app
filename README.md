# Noon App - Full Stack E-commerce Application

This is a comprehensive e-commerce application that combines an Angular frontend with a Node.js backend API.

## Project Structure

```
noon-app/
├── frontend/          # Angular frontend application
├── backend/           # Node.js backend API
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## Frontend (Angular)

This Angular application was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

### Development server

To start the frontend development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

### Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Backend (Node.js)

The backend provides a RESTful API for the e-commerce application.

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Install backend dependencies:

```bash
cd backend
npm install
```

### Running the Backend

Start the backend server:

```bash
cd backend
npm start
```

## Full Stack Development

### Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd noon-app
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Install backend dependencies:

```bash
cd backend
npm install
```

### Running Both Applications

1. Start the backend server:

```bash
cd backend
npm start
```

2. In a new terminal, start the frontend application:

```bash
cd frontend
ng serve
```

## Features

- User authentication and authorization
- Product catalog management
- Shopping cart functionality
- Order management
- User reviews and ratings
- Wishlist functionality
- Search and filtering
- Modern Angular frontend with responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## License

This project is licensed under the MIT License.
