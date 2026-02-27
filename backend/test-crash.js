const { createApp } = require('./src/index');
const http = require('http');

console.log('Testing app initialization...');
const app = createApp();
const server = http.createServer(app);

server.listen(8081, () => {
    console.log('Server running on port 8081 for stability test.');
    
    // Send valid request to ensure it works
    const testValid = () => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 8081,
                path: '/api/health',
                method: 'GET'
            }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.end();
        });
    };

    // Send invalid JSON payload
    const testInvalid = () => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 8081,
                path: '/api/enhance-job', // Endpoint using express.json()
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                   console.log(`Response Code: ${res.statusCode}`);
                   console.log(`Response Body: ${data}`);
                   resolve(res.statusCode === 400);
                });
            });

            req.on('error', (e) => {
                console.error(`Problem with request: ${e.message}`);
                resolve(false);
            });

            // Write invalid JSON starting with a double quote to reproduce exact bug
            // `SyntaxError: Unexpected token \" in JSON at position 0`
            // If we send just `"` it's Unexpected end of JSON input
            // If we send `"foo"bar"` it's unexpected token b at position 5
            // But wait, what if we send `.something` -> Unexpected token . at position 0
            // We will just send `"{invalid"`
            req.write('"invalid json format... " " " " ');
            req.end();
        });
    };

    const run = async () => {
        try {
            console.log('1. Testing valid request...');
            const validResult = await testValid();
            console.log('Valid result:', validResult ? 'PASS' : 'FAIL');

            console.log('\n2. Testing invalid JSON payload to trigger body-parser error...');
            const invalidResult = await testInvalid();
            console.log('Invalid JSON test result:', invalidResult ? 'PASS' : 'FAIL');
            
            console.log('\n3. Testing if server is STILL alive after invalid payload...');
            const aliveResult = await testValid();
            console.log('Server still alive:', aliveResult ? 'PASS' : 'FAIL');
            
            console.log('\nStability test finished successfully. Exiting.');
            server.close();
            process.exit(0);
        } catch (e) {
            console.error('Test failed with error:', e);
            process.exit(1);
        }
    };

    run();
});
