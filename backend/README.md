# Club Nanny Backend

Backend API server for Club Nanny application using Express.js and SQL Server.

## ✅ Current Status

- **Backend Server**: Running on http://localhost:3001
- **Frontend Server**: Running on http://localhost:8081
- **Database**: Connected to cn_dev_db on srv01.t2technologies.co.za

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── models/
│   │   ├── index.js              # Model relationships
│   │   ├── User.js               # User authentication model
│   │   ├── Family.js             # Family profile model
│   │   ├── Nanny.js              # Nanny profile model
│   │   ├── NannyCertification.js # Nanny certifications
│   │   ├── NannyAvailability.js  # Nanny schedule
│   │   ├── Child.js              # Children information
│   │   ├── Booking.js            # Booking records
│   │   ├── Review.js             # Reviews and ratings
│   │   ├── Conversation.js       # Chat conversations
│   │   ├── Message.js            # Chat messages
│   │   ├── Payment.js            # Payment transactions
│   │   ├── PaymentMethod.js      # Saved payment cards
│   │   ├── Subscription.js       # User subscriptions
│   │   ├── Favorite.js           # Favorited nannies
│   │   ├── Reference.js          # Nanny references
│   │   ├── IdentityVerification.js # Persona verification
│   │   └── Report.js             # User reports/disputes
│   ├── routes/                   # API routes (empty - ready for your endpoints)
│   ├── controllers/              # API controllers (empty - ready for your logic)
│   ├── middleware/               # Middleware (empty - ready for auth, etc.)
│   ├── scripts/
│   │   └── syncDatabase.js       # Database sync utility
│   └── server.js                 # Main server file
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── database-schema.sql           # SQL script to create all tables
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🗄️ Database Tables Created

Total: **17 tables**

### User & Authentication
1. **users** - All users (families and nannies)

### Profiles
2. **families** - Family profile details
3. **nannies** - Nanny profile details
4. **nanny_certifications** - Nanny certifications and qualifications
5. **nanny_availability** - Nanny weekly schedule
6. **children** - Family children information

### Bookings & Reviews
7. **bookings** - Booking records
8. **reviews** - Reviews and ratings

### Messaging
9. **conversations** - Chat conversations
10. **messages** - Individual messages

### Payments
11. **payments** - Payment transactions
12. **payment_methods** - Saved payment cards
13. **subscriptions** - User subscription plans

### Other
14. **favorites** - Favorited nannies
15. **references** - Nanny references
16. **identity_verifications** - Persona verification data
17. **reports** - User reports and disputes

## 🚀 Setup Instructions

### 1. Create Database Tables in SSMS

The database user `cn_dev_sa` doesn't have CREATE TABLE permissions, so you need to run the SQL script manually:

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to `srv01.t2technologies.co.za`
3. Open the file: `backend/database-schema.sql`
4. Make sure you're connected to the `cn_dev_db` database
5. Execute the script (F5)

This will create all 17 tables with proper relationships and indexes.

### 2. Install Dependencies (Already Done)

```bash
cd backend
npm install
```

### 3. Configure Environment Variables (Already Done)

The `.env` file is already configured with your database credentials:
- Host: srv01.t2technologies.co.za
- Database: cn_dev_db
- User: cn_dev_sa
- Port: 3001

### 4. Start the Server (Already Running)

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 🔌 API Endpoints

### Current Endpoints

- `GET /` - Server status
- `GET /api/health` - Health check with database status

### Ready to Build

The following directories are ready for you to add your API logic:

- `src/routes/` - Define your API routes here
- `src/controllers/` - Add your business logic here
- `src/middleware/` - Add authentication, validation, etc.

## 📊 Database Model Relationships

```
User
├── Family (one-to-one)
│   ├── Children (one-to-many)
│   ├── Bookings (one-to-many)
│   ├── Conversations (one-to-many)
│   ├── Payments (one-to-many)
│   └── Favorites (one-to-many)
│
└── Nanny (one-to-one)
    ├── NannyCertification (one-to-one)
    ├── NannyAvailability (one-to-many)
    ├── Bookings (one-to-many)
    ├── Conversations (one-to-many)
    ├── Payments (one-to-many)
    ├── Favorites (one-to-many)
    └── References (one-to-many)

Booking
├── Reviews (one-to-many)
└── Payments (one-to-many)

Conversation
└── Messages (one-to-many)
```

## 🔐 Next Steps

1. **Create the database tables** - Run the `database-schema.sql` in SSMS
2. **Build authentication routes** - Add login, register, JWT middleware
3. **Build API endpoints** - Create CRUD operations for each model
4. **Connect to frontend** - Update frontend to call your API endpoints
5. **Add validation** - Use express-validator for input validation
6. **Add file uploads** - Configure multer for image uploads
7. **Add tests** - Write unit and integration tests

## 📝 Example: Adding an API Route

### 1. Create a controller

```javascript
// src/controllers/nannyController.js
import db from '../models/index.js';

export const getAllNannies = async (req, res) => {
  try {
    const nannies = await db.Nanny.findAll({
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['email', 'firstName', 'lastName']
      }]
    });
    res.json(nannies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 2. Create a route

```javascript
// src/routes/nannyRoutes.js
import express from 'express';
import { getAllNannies } from '../controllers/nannyController.js';

const router = express.Router();
router.get('/nannies', getAllNannies);

export default router;
```

### 3. Add to server.js

```javascript
import nannyRoutes from './routes/nannyRoutes.js';
app.use('/api', nannyRoutes);
```

## 🛠️ Troubleshooting

### Connection Issues
- Make sure you're on the correct network/VPN to access the database server
- Check firewall settings
- Verify credentials in `.env` file

### Table Creation Failed
- The database user needs CREATE TABLE permissions
- Run the `database-schema.sql` script manually in SSMS
- Contact your DBA to grant proper permissions

### Port Already in Use
- Change the PORT in `.env` file
- Kill the process using the port: `lsof -ti:3001 | xargs kill -9`

## 📚 Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Express.js Documentation](https://expressjs.com/)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/)
