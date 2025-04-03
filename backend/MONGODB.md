# MongoDB Data Persistence Guide

## Verifying Data Storage

This guide explains how to verify that your API is correctly storing data in MongoDB.

### Method 1: Use the MongoDB Persistence Test Script

We've created a test script that automatically verifies MongoDB persistence:

```bash
# Install the MongoDB driver if not already installed
npm install mongodb --save-dev

# Run the persistence test
node test-mongodb-persistence.js
```

This script:
1. Connects to your MongoDB database
2. Creates test data through the API
3. Verifies the data was correctly stored in MongoDB
4. Checks that passwords are properly hashed

### Method 2: Use MongoDB Compass

MongoDB Compass is a GUI tool for exploring your database:

1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass) 
2. Connect using the URI: `mongodb+srv://tuanafk2006:qI0gyTH1bvtFbKrc@cluster0.wg54m5e.mongodb.net/mercy-messenger`
3. Browse the collections to see your data:
   - `users` - Contains user accounts
   - `chatrooms` - Contains chat rooms
   - `messages` - Contains chat messages

### Method 3: Add Logging to Your Services

You can add logging to your service methods to see when data is saved:

```typescript
async createUser(userData: any): Promise<User> {
  // Create user
  const newUser = new this.userModel(userData);
  const savedUser = await newUser.save();
  
  // Log the result
  console.log(`User created: ${savedUser._id}`);
  
  return savedUser;
}
```

### Method 4: Implement Database Transaction Logging

For production environments, implement proper database transaction logging:

1. Create a database logger service:

```typescript
@Injectable()
export class DatabaseLoggerService {
  private logger = new Logger('DatabaseService');

  logCreate(collection: string, id: string): void {
    this.logger.log(`Created: ${collection}/${id}`);
  }

  logUpdate(collection: string, id: string): void {
    this.logger.log(`Updated: ${collection}/${id}`);
  }

  logDelete(collection: string, id: string): void {
    this.logger.log(`Deleted: ${collection}/${id}`);
  }

  logError(operation: string, collection: string, error: any): void {
    this.logger.error(`${operation} failed on ${collection}: ${error.message}`);
  }
}
```

2. Inject this service into your repositories or services:

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private dbLogger: DatabaseLoggerService,
  ) {}

  async create(userData: any): Promise<User> {
    try {
      const user = new this.userModel(userData);
      const result = await user.save();
      this.dbLogger.logCreate('users', result._id.toString());
      return result;
    } catch (error) {
      this.dbLogger.logError('create', 'users', error);
      throw error;
    }
  }
}
```

## Common MongoDB Issues

### Connection Issues

If you can't connect to MongoDB:

1. Check your connection string in `app.module.ts`
2. Verify network connectivity to MongoDB Atlas
3. Ensure your IP address is whitelisted in MongoDB Atlas
4. Check if there are connection limits on your MongoDB plan

### Data Not Found

If data is not being saved:

1. Check for validation errors in your console
2. Verify schema definitions match your data
3. Ensure indexes are properly set up
4. Check for duplicate key errors

### Mongoose vs. MongoDB

This project uses Mongoose, an ODM for MongoDB:

1. Mongoose adds schema validation
2. Models must match schemas
3. Middleware/hooks can interfere with operations
4. Virtuals and transformations change how data is returned

## Testing MongoDB in CI/CD

For automated testing:

1. Use an in-memory MongoDB server (mongodb-memory-server)
2. Create isolated test databases
3. Clean up test data after tests
4. Mock MongoDB for unit tests 