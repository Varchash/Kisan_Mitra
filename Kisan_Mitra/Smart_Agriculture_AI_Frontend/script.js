const form = document.getElementById('predictionForm');
const resultSection = document.getElementById('resultSection');
const cropResult = document.getElementById('cropResult');
const resultMessage = document.getElementById('resultMessage');
const resultStatus = document.getElementById('resultStatus');
const toast = document.getElementById('toast');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function valuesFromForm() {
  const data = new FormData(form);
  return {
    N: Number(data.get('N')),
    P: Number(data.get('P')),
    K: Number(data.get('K')),
    temperature: Number(data.get('temperature')),
    humidity: Number(data.get('humidity')),
    ph: Number(data.get('ph')),
    rainfall: Number(data.get('rainfall'))
  };
}

function validate(values) {
  const limits = {
    N:[0,300], P:[0,300], K:[0,300], temperature:[0,50],
    humidity:[0,100], ph:[3,10], rainfall:[0,2000]
  };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) return `${key} must have a valid number.`;
    if (value < limits[key][0] || value > limits[key][1]) return `${key} must be between ${limits[key][0]} and ${limits[key][1]}.`;
  }
  return '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = valuesFromForm();
  const error = validate(values);
  if (error) { showToast(error); return; }

  const button = document.getElementById('recommendBtn');
  const old = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span>⟳</span><span>Analyzing your farm conditions...</span>';
  resultStatus.textContent = 'Analyzing';
  resultMessage.textContent = 'Sending the 7 farmer inputs to the trained AI model...';

  try {
    const response = await fetch('https://backend-npjcdtqoe-arc-fcd8.vercel.app/predict', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || result.success === false) throw new Error(result.error || 'Prediction failed.');

    const crop = result.recommended_crop || result.crop || result.label;
    if (!crop) throw new Error('The API did not return a crop label.');
    cropResult.textContent = String(crop).replace(/^./, c => c.toUpperCase());
    resultMessage.textContent = 'Recommended from the N, P, K, temperature, humidity, pH and rainfall values you entered.';
    resultStatus.textContent = 'AI Prediction ✓';
    showToast(`Recommended crop: ${crop}`);
    resultSection.scrollIntoView({behavior:'smooth', block:'center'});
  } catch (err) {
    cropResult.textContent = 'Backend not connected';
    resultMessage.textContent = 'Start your Flask server on https://backend-npjcdtqoe-arc-fcd8.vercel.app/ and try again. Your form is ready for the real ML model.';
    resultStatus.textContent = 'Connection needed';
    showToast('Could not connect to the prediction API.');
    console.error(err);
  } finally {
    button.disabled = false;
    button.innerHTML = old;
  }
});

document.getElementById('loginBtn').addEventListener('click', () => showToast('Login can be connected to your authentication system.'));
