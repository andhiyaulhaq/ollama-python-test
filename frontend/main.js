import './style.css';
import { marked } from 'marked';

const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const themeToggle = document.getElementById('themeToggle');
const sendBtn = document.getElementById('sendBtn');

let chatHistory = [];

// Theme Toggle
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

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    if (role === 'ai') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return contentDiv;
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
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        removeTypingIndicator();
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Create an empty AI message to stream into
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('message', 'ai-message');
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
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
            contentDiv.innerHTML = marked.parse(aiFullResponse);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
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
