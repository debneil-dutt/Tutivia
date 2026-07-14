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
async function rateSolution(solutionId) {
    const ratingElement = document.getElementById(`rating-${solutionId}`);
    const feedbackElement = document.getElementById(`feedback-${solutionId}`);
    
    const rating = ratingElement ? ratingElement.value : null;
    const feedback = feedbackElement ? feedbackElement.value : null;

    try {
        const response = await fetch(`${API_URL}/solutions/${solutionId}/rating`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                rating: rating ? parseInt(rating) : undefined, 
                feedback: feedback || undefined 
            })
        });
        const data = await response.json();

        if (data.success) {
            showAlert(`Feedback submitted successfully`, 'success');
            // Wait a moment then reload to show updated data
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(data.error || 'Error submitting feedback', 'error');
        }
    } catch (error) {
        showAlert('Error submitting feedback', 'error');
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
    
    // Handle multiple select for subjects
    if (formData.getAll('subject').length > 0) {
        updates.subject = formData.getAll('subject').join(', ');
    } else {
        updates.subject = null;
    }

    // Handle multiple select for boards (for teachers)
if (user.userType === 'teacher' && formData.getAll('board').length > 0) {
    updates.board = formData.getAll('board').join(', ');
}

// Handle class levels
if (formData.getAll('classLevel').length > 0) {
    updates.classLevel = formData.getAll('classLevel').join(', ');
} else {
    updates.classLevel = null;
}

// Handle competitive exams
if (formData.getAll('competitiveExams').length > 0) {
    updates.competitiveExams = formData.getAll('competitiveExams').join(', ');
} else {
    updates.competitiveExams = null;
}

    if (updates.experience && parseInt(updates.experience) < 0) {
        showAlert('Years of experience cannot be negative', 'error');
        return;
    }

    if (updates.hourlyRate) {
        updates.hourlyRate = parseFloat(updates.hourlyRate);
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile/${user.id}`, {
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



document.addEventListener('DOMContentLoaded', updateNavigation);
