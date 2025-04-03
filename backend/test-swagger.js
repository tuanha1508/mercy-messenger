// Using dynamic import for node-fetch
async function testSwaggerUI() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Try to access the Swagger UI HTML
    const response = await fetch('http://localhost:3000/api');
    
    if (response.ok) {
      console.log('✅ Swagger UI is accessible!');
      console.log('You can access it at: http://localhost:3000/api');
      return true;
    } else {
      console.error(`❌ Failed to access Swagger UI. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error accessing Swagger UI:', error.message);
    return false;
  }
}

async function testSwaggerJSON() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Try to access the Swagger JSON document
    const response = await fetch('http://localhost:3000/api-json');
    
    if (response.ok) {
      console.log('✅ Swagger JSON is accessible!');
      
      // Parse the JSON to verify it's valid
      const swaggerDoc = await response.json();
      
      // Count the number of paths and tags
      const pathCount = Object.keys(swaggerDoc.paths).length;
      const tagCount = swaggerDoc.tags.length;
      
      console.log(`Found ${pathCount} API endpoints and ${tagCount} tags.`);
      
      // Check if the chat endpoints are documented
      const chatPaths = Object.keys(swaggerDoc.paths).filter(path => path.startsWith('/chat'));
      console.log(`Chat API has ${chatPaths.length} documented endpoints:`);
      chatPaths.forEach(path => console.log(`  - ${path}`));
      
      return true;
    } else {
      console.error(`❌ Failed to access Swagger JSON. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error accessing Swagger JSON:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing Swagger Documentation...\n');
  
  const uiResult = await testSwaggerUI();
  console.log('');
  const jsonResult = await testSwaggerJSON();
  
  console.log('\nSummary:');
  console.log(`Swagger UI: ${uiResult ? '✅ Working' : '❌ Not working'}`);
  console.log(`Swagger JSON: ${jsonResult ? '✅ Working' : '❌ Not working'}`);
  
  if (uiResult && jsonResult) {
    console.log('\n✅ Swagger documentation is working correctly!');
  } else {
    console.log('\n❌ There are issues with the Swagger documentation.');
  }
}

main(); 