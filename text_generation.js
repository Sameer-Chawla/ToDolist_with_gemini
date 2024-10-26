// Make sure to include these imports:
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function generateDescription(itemName) {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Write a description for the item less than 50 characters: ${itemName}`;

    try {
        const result = await model.generateContent(prompt);
        console.log(result.response.text());
        return result.response.text();
        
    } catch (error) {
        console.error("Error generating description:", error);
        return "Error generating description";
    }
}
generateDescription("apple");
module.exports = { generateDescription };
