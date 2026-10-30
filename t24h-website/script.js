// Override this when embedding the page in another site.
// Example: window.REGISTER_API_URL = "https://yourdomain.com/api/register";
const API_URL = window.REGISTER_API_URL || "/api/register";
const HOME_URL = window.REGISTER_HOME_URL || "/t24h/";

const form = document.getElementById('registerForm');
const msg = document.getElementById('message');
const btn = document.getElementById('submitBtn');
const homeBtn = document.getElementById('homeBtn');

function setMessage(text, type) {
  msg.textContent = text;
  msg.className = 'msg ' + type;
}

if (homeBtn) {
  homeBtn.addEventListener('click', () => {
    window.location.href = HOME_URL;
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const payload = {
    name: (data.get('name') || '').trim(),
    phone: (data.get('phone') || '').trim(),
  };
  if (!payload.name || !payload.phone) {
    setMessage('Please fill in all fields.', 'error');
    return;
  }
  btn.disabled = true;
  setMessage('Submitting...', '');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      setMessage(result.error || 'Submission failed.', 'error');
    } else {
      setMessage('Registered successfully!', 'success');
      form.reset();
      if (homeBtn) homeBtn.style.display = 'block';
    }
  } catch (err) {
    setMessage('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
  }
});