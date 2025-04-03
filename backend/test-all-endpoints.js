// Using dynamic import for node-fetch
async function run() {
  const { default: fetch } = await import('node-fetch');

  console.log('🔍 Testing all API endpoints via Swagger...\n');

  // First, get the Swagger JSON to see all available endpoints
  let swaggerDoc;
  try {
    const response = await fetch('http://localhost:3000/api-json');
    swaggerDoc = await response.json();
    console.log(`✅ Found ${Object.keys(swaggerDoc.paths).length} API endpoints in Swagger documentation\n`);
  } catch (error) {
    console.error('❌ Error fetching Swagger JSON:', error.message);
    process.exit(1);
  }

  // Test registration and get token
  console.log('🧪 Step 1: Register a new user');
  const email = `test${Date.now()}@example.com`;
  const password = 'password123';
  let token;

  try {
    const registerResponse = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password,
        role: 'volunteer'
      })
    });

    if (!registerResponse.ok) {
      const errorBody = await registerResponse.text();
      throw new Error(`Registration failed: ${registerResponse.status} - ${errorBody}`);
    }

    const registerData = await registerResponse.json();
    token = registerData.access_token;
    console.log(`✅ User registered successfully with email: ${email}`);
    console.log(`✅ Received JWT token: ${token.substring(0, 15)}...\n`);
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    // Try to login instead
    console.log('🔄 Trying to login instead...');
    
    try {
      const loginResponse = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com', // Using a default test user
          password: 'password123'
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }

      const loginData = await loginResponse.json();
      token = loginData.access_token;
      console.log('✅ Logged in successfully using default test user\n');
    } catch (loginError) {
      console.error('❌ Login also failed:', loginError.message);
      console.error('⚠️ Will continue without authentication, but most endpoints will fail\n');
    }
  }

  // Test creating a chat room
  console.log('🧪 Step 2: Create a new chat room');
  let chatRoomId;

  try {
    const createRoomResponse = await fetch('http://localhost:3000/chat/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Room',
        type: 'group',
        participants: []
      })
    });

    if (!createRoomResponse.ok) {
      throw new Error(`Create room failed: ${createRoomResponse.status}`);
    }

    const roomData = await createRoomResponse.json();
    chatRoomId = roomData.id;
    console.log(`✅ Chat room created successfully with ID: ${chatRoomId}\n`);
  } catch (error) {
    console.error('❌ Create chat room failed:', error.message);
    console.log('⚠️ Will continue testing other endpoints\n');
  }

  // Test endpoints that should return 201
  const endpointsThatReturn201 = [
    { 
      url: 'http://localhost:3000/chat/rooms', 
      method: 'POST',
      body: { name: 'Another Test Room', type: 'group', participants: [] }
    },
    { 
      url: chatRoomId ? `http://localhost:3000/chat/rooms/${chatRoomId}/messages` : null, 
      method: 'POST',
      body: { text: 'Hello, this is a test message' }
    },
    { 
      url: 'http://localhost:3000/auth/register', 
      method: 'POST',
      body: { name: `Test User ${Date.now()}`, email: `test${Date.now()}@example.com`, password: 'password123' }
    }
  ];

  console.log('🧪 Step 3: Testing endpoints that should return 201 (Created)');
  
  for (const endpoint of endpointsThatReturn201) {
    if (!endpoint.url) {
      console.log(`⏩ Skipping test for message creation as no chat room ID is available`);
      continue;
    }

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(endpoint.body)
      });

      if (response.status === 201) {
        console.log(`✅ ${endpoint.method} ${endpoint.url} returned ${response.status} as expected`);
      } else {
        console.log(`⚠️ ${endpoint.method} ${endpoint.url} returned ${response.status} instead of 201`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${endpoint.method} ${endpoint.url}:`, error.message);
    }
  }

  console.log('\n🧪 Step 4: Testing other endpoints');

  // Test get chat rooms
  try {
    const response = await fetch('http://localhost:3000/chat/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ GET /chat/rooms returned ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Found ${data.length} chat rooms`);
    }
  } catch (error) {
    console.error('❌ Error testing GET /chat/rooms:', error.message);
  }

  // Test get profile
  try {
    const response = await fetch('http://localhost:3000/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ GET /auth/profile returned ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   User profile: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ Error testing GET /auth/profile:', error.message);
  }

  // Test specific chat room if we have an ID
  if (chatRoomId) {
    try {
      const response = await fetch(`http://localhost:3000/chat/rooms/${chatRoomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`✅ GET /chat/rooms/${chatRoomId} returned ${response.status}`);
      
      // Test marking messages as read
      const markReadResponse = await fetch(`http://localhost:3000/chat/rooms/${chatRoomId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`✅ PATCH /chat/rooms/${chatRoomId}/read returned ${markReadResponse.status}`);
    } catch (error) {
      console.error(`❌ Error testing chat room endpoints:`, error.message);
    }
  }

  console.log('\n✅ API testing complete!');
}

run(); 