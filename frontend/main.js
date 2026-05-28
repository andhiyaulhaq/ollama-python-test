import { marked } from 'marked';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Chat Elements
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const sendBtn = document.getElementById('sendBtn');

// Login Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

let chatHistory = [];
let authToken = localStorage.getItem('chat_token');

// --- Authentication Logic ---
async function typeWelcomeMessage() {
    if (chatBox.children.length === 0) {
        const welcomeText = "Hello! I am your AI assistant powered by Qwen 2.5. How can I help you today?";
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('message', 'ai-message');
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const textWrapper = document.createElement('div');
        textWrapper.classList.add('text-wrapper');
        
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        contentDiv.appendChild(textWrapper);
        aiMessageDiv.appendChild(contentDiv);
        chatBox.appendChild(aiMessageDiv);
        
        for (let i = 0; i < welcomeText.length; i++) {
            textWrapper.innerHTML += welcomeText.charAt(i);
            chatBox.scrollTop = chatBox.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 10)); // Sped up from 30ms to 10ms
        }
        
        // Append time only after typing is finished
        contentDiv.appendChild(timeDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function checkAuth() {
    if (authToken) {
        loginOverlay.classList.add('hidden');
        userInput.focus();
        typeWelcomeMessage();
    } else {
        loginOverlay.classList.remove('hidden');
        document.getElementById('username').focus();
    }
}

function handleAuthError() {
    authToken = null;
    localStorage.removeItem('chat_token');
    checkAuth();
}

logoutBtn.addEventListener('click', () => {
    handleAuthError();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value;
    
    loginError.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('chat_token', authToken);
        
        // Reset form and hide overlay
        loginForm.reset();
        checkAuth();
        
    } catch (error) {
        loginError.classList.remove('hidden');
    }
});

// Run initial check
checkAuth();

// --- Theme Toggle ---
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    if (newTheme === 'dark') {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// Set initial theme based on system preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

// --- Chat Logic ---
function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    const textWrapper = document.createElement('div');
    textWrapper.classList.add('text-wrapper');
    
    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (role === 'ai') {
        textWrapper.innerHTML = marked.parse(content);
    } else {
        textWrapper.textContent = content;
    }
    
    contentDiv.appendChild(textWrapper);
    contentDiv.appendChild(timeDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return textWrapper;
}

function appendTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'ai-message');
    messageDiv.id = 'typingIndicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content', 'typing-indicator');
    contentDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // Clear input
    userInput.value = '';
    
    // Append user message
    appendMessage('user', message);
    chatHistory.push({ role: 'user', content: message });
    
    // Append typing indicator
    appendTypingIndicator();
    
    // Disable input while generating
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        removeTypingIndicator();
        
        if (response.status === 401) {
            handleAuthError();
            throw new Error('Unauthorized. Please log in again.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Create an empty AI message to stream into
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('message', 'ai-message');
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const textWrapper = document.createElement('div');
        textWrapper.classList.add('text-wrapper');
        
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        contentDiv.appendChild(textWrapper);
        aiMessageDiv.appendChild(contentDiv);
        chatBox.appendChild(aiMessageDiv);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let aiFullResponse = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            aiFullResponse += chunk;
            
            // Parse with marked and update content
            textWrapper.innerHTML = marked.parse(aiFullResponse);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        // Append time only after streaming is finished
        contentDiv.appendChild(timeDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        chatHistory.push({ role: 'assistant', content: aiFullResponse });
        
    } catch (error) {
        removeTypingIndicator();
        appendMessage('ai', `Sorry, an error occurred: ${error.message}`);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});
