# Non-Docker Database Setup Guide:
1. Install PostgreSQL for your OS
    - https://www.postgresql.org/download/
2. Install PgAdmin4 for your OS
    - https://www.pgadmin.org/download/

# Create Database:
1. Follow this tutorial: https://www.youtube.com/watch?v=3YnNkm3RDMI (You will need to remember the DB name and password for the next step)
1. Find "DB_NAME" and "DB_PASSWORD" in your .env.local file and replace them with the values you used in step 1

## Example:
1. I create database with name "smartquote-local-db" and password "123"
2. I copy everything in .env.example into .env.local
3. I replace "DB_NAME=smartquote" with "DB_NAME=smartquote-local-db" and "DB_PASSWORD=your_database_password_here" with "DB_PASSWORD=123"

# Most Useful Commands
- `db:migrate`: Runs all migrations
- `db:rollback:all`: Rollsback all migrations
- `db:seed`: Seeds database
- `db:reset`: Resets database and seeds it (rollsback all => runs all migrations => seeds database)
- `db:unlock`: Unlocks database if a SQL lock occurs
Note: All these commands are safe to run as prod and dev databases are separate

# Default Seed Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@smartquote.dev | password |
| Manager | manager@smartquote.dev | password |
| Support Agent | agent@smartquote.dev | password |
| Customer | c1@smartquote.dev | password |
| Customer | c2@smartquote.dev | password |
| Customer | c3@smartquote.dev | password |
| Customer | c4@smartquote.dev | password |

# Data Corruption
If you think your database has corruptions, run the following commands:
- "npm run db:migrate:rollback:all" (this drops all tables in your database)
- "npm run setup"