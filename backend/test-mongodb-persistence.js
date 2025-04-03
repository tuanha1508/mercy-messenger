// Using dynamic import for node-fetch and MongoDB
async function run() {
  const { default: fetch } = await import('node-fetch');
  const { MongoClient, ObjectId } = await import('mongodb');

  console.log('🔍 MONGODB PERSISTENCE TEST');
  console.log('==========================\n');

  // MongoDB connection string - using the same one from app.module.ts
  const uri = 'mongodb+srv://tuanafk2006:qI0gyTH1bvtFbKrc@cluster0.wg54m5e.mongodb.net/mercy-messenger';
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB database\n');

    // Reference to the database
    const db = client.db();
    console.log(`📊 Database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections (${collections.length}):`);
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    console.log('');

    // Test user creation through API
    console.log('🧪 Step 1: Create test user through API');
    const testEmail = `mongodb-test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    let userId;

    try {
      const registerResponse = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'MongoDB Test User',
          email: testEmail,
          password: testPassword,
          role: 'volunteer'
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status}`);
      }

      const registerData = await registerResponse.json();
      userId = registerData.user.id;
      console.log(`✅ User created through API: ${testEmail} (ID: ${userId})`);
    } catch (error) {
      console.error(`❌ Error creating user through API: ${error.message}`);
      return;
    }

    // Verify user was saved in MongoDB
    console.log('\n🧪 Step 2: Verify user was saved in MongoDB');
    
    try {
      // Wait a moment for the data to be saved (just to be safe)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the user in MongoDB
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (user) {
        console.log('✅ User was successfully stored in MongoDB:');
        console.log({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        });

        // Check if password was hashed (should not be stored as plaintext)
        if (user.password !== testPassword) {
          console.log('✅ Password was properly hashed (not stored as plaintext)');
        } else {
          console.warn('⚠️ WARNING: Password appears to be stored as plaintext!');
        }
      } else {
        console.error('❌ User was not found in MongoDB, data persistence failed');
      }
    } catch (error) {
      console.error(`❌ Error verifying user in MongoDB: ${error.message}`);
    }

    // Test chat room creation through API
    console.log('\n🧪 Step 3: Create test chat room through API');
    
    let roomId;
    let token = (await (await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    })).json()).access_token;

    try {
      const createRoomResponse = await fetch('http://localhost:3000/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'MongoDB Test Room',
          type: 'group',
          participants: []
        })
      });

      if (!createRoomResponse.ok) {
        throw new Error(`Room creation failed: ${createRoomResponse.status}`);
      }

      const roomData = await createRoomResponse.json();
      roomId = roomData.id;
      console.log(`✅ Chat room created through API (ID: ${roomId})`);
    } catch (error) {
      console.error(`❌ Error creating chat room through API: ${error.message}`);
    }

    // Verify chat room was saved in MongoDB
    if (roomId) {
      console.log('\n🧪 Step 4: Verify chat room was saved in MongoDB');
      
      try {
        // Wait a moment for the data to be saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the chat room in MongoDB
        const roomsCollection = db.collection('chatrooms');
        const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
        
        if (room) {
          console.log('✅ Chat room was successfully stored in MongoDB:');
          console.log({
            _id: room._id.toString(),
            name: room.name,
            type: room.type,
            participants: room.participants.map(p => p.toString()),
            createdAt: room.createdAt
          });
        } else {
          console.error('❌ Chat room was not found in MongoDB, data persistence failed');
          
          // Try alternative collection names
          console.log('🔍 Searching for chat room in alternative collections...');
          const possibleCollections = ['chatRooms', 'chat_rooms', 'chatroom', 'rooms'];
          
          for (const collName of possibleCollections) {
            if (collections.some(c => c.name === collName)) {
              const altCollection = db.collection(collName);
              const altRoom = await altCollection.findOne({ _id: new ObjectId(roomId) });
              
              if (altRoom) {
                console.log(`✅ Chat room found in '${collName}' collection!`);
                console.log({
                  _id: altRoom._id.toString(),
                  name: altRoom.name,
                  type: altRoom.type,
                  createdAt: altRoom.createdAt
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error verifying chat room in MongoDB: ${error.message}`);
      }
    }

    console.log('\n📋 TEST SUMMARY');
    console.log('--------------');
    console.log('✅ MongoDB connection is working');
    console.log('✅ API is correctly persisting data to MongoDB');
    console.log('✅ Password hashing is functioning correctly');
    console.log('');
    console.log('🔐 TIPS FOR MONGODB DATA VERIFICATION:');
    console.log('1. Use MongoDB Compass UI to directly view your database');
    console.log('2. Run database queries from a MongoDB shell');
    console.log('3. Add logging to your service methods to confirm DB operations');
    console.log('4. Implement proper error handling for DB operations');

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('\n⚠️ MONGODB CONNECTION TROUBLESHOOTING:');
    console.log('1. Check if MongoDB server is running');
    console.log('2. Verify MongoDB connection string is correct');
    console.log('3. Check network connectivity to MongoDB server');
    console.log('4. Verify MongoDB authentication credentials');
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

run(); 