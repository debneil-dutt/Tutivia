const API_URL = '/api';

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function updateNavigation() {
    const user = getCurrentUser();
    
    if (user) {
        document.getElementById('navHome').style.display = 'block';
        document.getElementById('navProfile').style.display = 'block';
        document.getElementById('navLogout').style.display = 'block';
        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navMessages').style.display = 'block';
        
        if (user.userType === 'student') {
            document.getElementById('navFindTeacher').style.display = 'block';
            document.getElementById('navDoubt').style.display = 'block';
            if (document.getElementById('navSolveDoubts')) {
                document.getElementById('navSolveDoubts').style.display = 'none';
            }
        } else if (user.userType === 'teacher') {
            document.getElementById('navFindStudent').style.display = 'block';
            if (document.getElementById('navSolveDoubts')) {
                document.getElementById('navSolveDoubts').style.display = 'block';
            }
            if (document.getElementById('navDoubt')) {
                document.getElementById('navDoubt').style.display = 'none';
            }
        }
        
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('userName').textContent = user.name;
        
        if (user.userType === 'student') {
            document.getElementById('studentDashboard').style.display = 'block';
        } else if (user.userType === 'teacher') {
            document.getElementById('teacherDashboard').style.display = 'block';
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function goToSignup(userType) {
    window.location.href = `signup.html?type=${userType}`;
}
 

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {  
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Delete a doubt
async function deleteDoubt(doubtId) {
    if (!confirm('Are you sure you want to delete this doubt?')) return;

    try {
        const response = await fetch(`${API_URL}/doubts/${doubtId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            showAlert('Doubt deleted successfully', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.error || 'Error deleting doubt', 'error');
        }
    } catch (error) {
        showAlert('Error deleting doubt', 'error');
        console.error(error);
    }
}

// Rate a solution
async function rateSolution(solutionId, rating) {
    try {
        const response = await fetch(`${API_URL}/solutions/${solutionId}/rating`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: parseInt(rating) })
        });
        const data = await response.json();

        if (data.success) {
            showAlert(`Solution rated ${rating}/5 stars`, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.error || 'Error rating solution', 'error');
        }
    } catch (error) {
        showAlert('Error rating solution', 'error');
        console.error(error);
    }
}

// Update user profile
async function updateProfile(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showAlert('Please login first', 'error');
        return;
    }

    const formData = new FormData(document.getElementById('editProfileForm'));
    const updates = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/profile/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const data = await response.json();

        if (data.success) {
            // Update localStorage with new user data
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showAlert('Profile updated successfully', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.error || 'Error updating profile', 'error');
        }
    } catch (error) {
        showAlert('Error updating profile', 'error');
        console.error(error);
    }
}

// Send message
async function sendMessage(recipientId, recipientName) {
    const subject = prompt(`Enter message subject for ${recipientName}:`);
    if (!subject) return;

    const message = prompt('Enter your message:');
    if (!message) return;

    const user = getCurrentUser();
    if (!user) {
        showAlert('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: user.id,
                recipientId,
                subject,
                message
            })
        });
        const data = await response.json();

        if (data.success) {
            showAlert(`Message sent to ${recipientName}`, 'success');
        } else {
            showAlert(data.error || 'Error sending message', 'error');
        }
    } catch (error) {
        showAlert('Error sending message', 'error');
        console.error(error);
    }
}

// Load user messages
async function loadMessages() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('messagesContent').innerHTML = '<p>Please login to view messages</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/messages/${user.id}`);
        const data = await response.json();

        const messagesContent = document.getElementById('messagesContent');
        if (!messagesContent) return;

        if (!data.messages || data.messages.length === 0) {
            messagesContent.innerHTML = '<p>No messages yet</p>';
            return;
        }

        let html = '<div style="display: grid; gap: 1rem;">';
        data.messages.forEach(msg => {
            html += `
                <div style="background: white; padding: 1rem; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <p><strong>From:</strong> ${msg.senderName}</p>
                    <p><strong>Subject:</strong> ${msg.subject}</p>
                    <p><strong>Message:</strong> ${msg.message}</p>
                    <p style="font-size: 0.85rem; color: #666;">Received: ${formatDate(msg.createdAt)}</p>
                </div>
            `;
        });
        html += '</div>';
        messagesContent.innerHTML = html;
    } catch (error) {
        showAlert('Error loading messages', 'error');
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', updateNavigation);
