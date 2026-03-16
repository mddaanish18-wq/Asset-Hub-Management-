const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = 'AIzaSyCIZHAWect8JZ33HYmt0qzYggg8d2StqrQ';
console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    // Try different models
    const modelsToTry = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro'];

    for (const modelName of modelsToTry) {
        console.log(`\n\n========== Testing ${modelName} ==========`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = "You are a fleet management AI. I have 5 critical vehicles that need maintenance. What should I do?";
            console.log('Sending test prompt:', prompt);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('\n✅ SUCCESS with', modelName, '!');
            console.log('Response:', text);
            console.log('\n✅ API is working correctly with', modelName, '!');
            return; // Exit on first success
        } catch (error) {
            console.error('\n❌ ERROR with', modelName, ':', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            if (error.errorDetails) {
                console.error('Error details:', error.errorDetails);
            }
        }
    }

    console.log('\n❌ All models failed. Please check API key validity.');
}

testGemini();
