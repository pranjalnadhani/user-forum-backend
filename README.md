# User Forum Backend Application

This is a Node.js and Express application that includes user authentication and APIs to CRUD posts and comments. It uses a .env file with dotenv to store environment variables.

## Installation

1. Clone the repository: `git clone https://github.com/your-username/your-repo.git`
1. Install dependencies:
   ```sh
   npm install
   ```
1. Make a copy of the `.env.example` file using the command
   ```sh
   mv .env.example .env
   ```
1. Fill in the values in the `.env` file with your own values.
   1. Choose a port number that is not already in use on your system. You can choose any number between 1024 and 65535. For example, you can choose port 3000.
   1. Host a MongoDB instance either locally or on the cloud. If you want to host it locally, you can download and install MongoDB from the official website. If you want to host it on the cloud, you can use services like MongoDB Atlas or mLab.
   1. Once you have hosted your MongoDB instance, you need to get the connection string. You can get the connection string from your MongoDB instance dashboard. It should look something like this: `mongodb://<username>:<password>@<host>:<port>/<database>`
   1. Replace the `<username>`, `<password>`, `<host>`, `<port>`, and `<database>` placeholders with your own values.
   1. Open the `.env` file in your project and fill in the following values:
      - `PORT`: The port number you chose in step 1.
      - `MONGODB_URI`: The MongoDB connection string you obtained in step 3.
      - `TOKEN_SECRET`: Run the command `openssl rand -base64 32` in your terminal to generate a random string. Copy the output and paste it as the value for `TOKEN_SECRET`.
1. Save the `.env` file and start the server using the command:
   ```sh
   npm start
   ```

## Usage

Once the server is running, you can access the following endpoints for user authentication:

- `POST /auth/register`: create a new user account
- `POST /auth/login`: log in to an existing user account
- `POST /auth/logout`: log out of the current user account

You can also use the following endpoints:

- `GET /posts`: get a list of all posts
- `POST /posts`: create a new post
- `PATCH /posts/:id`: update an existing post or comment by ID
- `DELETE /posts/:id`: delete a post or comment by ID
- `GET /posts/:id/comments`: get a list of comments for a specific post or comment
- `POST /posts/:id/comments`: create a new comment for a specific post or comment

## Contributing

If you'd like to contribute to this project, please fork the repository and submit a pull request.
