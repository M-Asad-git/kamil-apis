# Setup Guide for Kamil Computers API

## Prerequisites
- Node.js (v16 or higher)
- MySQL database server
- npm or yarn package manager

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Database Setup

### Create MySQL Database
1. Connect to your MySQL server
2. Create a new database:
```sql
CREATE DATABASE kamil_computers;
```

### Configure Environment Variables
1. Copy the `env.template` file to `.env`:
```bash
cp env.template .env
```

2. Edit the `.env` file with your actual MySQL credentials:
```env
DATABASE_URL="mysql://your_username:your_password@localhost:3306/kamil_computers"
```

Replace:
- `your_username` with your MySQL username
- `your_password` with your MySQL password
- `localhost` with your MySQL host (if different)
- `3306` with your MySQL port (if different)

## Step 3: Database Migration
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Step 4: Run the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Step 5: Verify Installation
- Server should start on port 4000 (or the port specified in your .env)
- Check console output for "Server running on port 4000"
- API will be available at `http://localhost:4000/api`

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify MySQL server is running
   - Check credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `npx kill-port 4000`

3. **Prisma Errors**
   - Run `npm run prisma:generate` after schema changes
   - Ensure database is accessible

4. **TypeScript Errors**
   - Check `tsconfig.json` configuration
   - Ensure all dependencies are installed

## API Endpoints
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
