const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');

function addMessage(text, isUser) {
    const welcome = document.querySelector('.welcome-screen');
    if (welcome) welcome.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-msg' : 'bot-msg'}`;
    // Use innerHTML in case Gemini returns markdown-style lists
    msgDiv.innerText = text; 
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv;
}

async function handleChat() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Add User Message
    addMessage(prompt, true);
    userInput.value = '';

    // Add Loading Placeholder
    const loadingMsg = addMessage("Planning and executing steps...", false);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        
        // Replace loading text with the actual report
        loadingMsg.innerText = data.report;
    } catch (error) {
        loadingMsg.innerText = "Error: Could not reach the server.";
    }
}

sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });