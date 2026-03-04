const form = document.getElementById('checkout-form');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const resultBox = document.getElementById('checkout-result');
    const formData = Object.fromEntries(new FormData(form).entries());

    const response = await fetch('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const payload = await response.json();
    resultBox.textContent = JSON.stringify(payload, null, 2);
  });
}
