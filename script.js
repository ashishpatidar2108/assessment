// --- EmailJS Configuration (replace these values with your own from https://www.emailjs.com/) ---
// Optionally store config in localStorage under "emailjsConfig" so it persists.
let EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
let EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
let EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

let emailjsConfigured = false;

function loadEmailJsConfig() {
    try {
        const stored = localStorage.getItem('emailjsConfig');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (parsed.publicKey) EMAILJS_PUBLIC_KEY = parsed.publicKey;
        if (parsed.serviceId) EMAILJS_SERVICE_ID = parsed.serviceId;
        if (parsed.templateId) EMAILJS_TEMPLATE_ID = parsed.templateId;
    } catch (e) {
        console.warn('Could not load EmailJS config from localStorage.', e);
    }
}

// Call this from the browser console to save your real EmailJS keys:
// localStorage.setItem('emailjsConfig', JSON.stringify({ publicKey:'YOUR_KEY', serviceId:'YOUR_SERVICE', templateId:'YOUR_TEMPLATE' }));

loadEmailJsConfig();

// 1. Service Data
const services = [
    { id: 1, name: "Dry Cleaning", price: 200, icon: "fa-shirt" },
    { id: 2, name: "Wash & Fold", price: 100, icon: "fa-basket-shopping" },
    {
        id: 3,
        name: "Ironing",
        price: 30,
        // Use a colored icon to match the brand styling
        iconUrl: "https://img.icons8.com/color/48/000000/iron.png",
        iconAlt: "Iron icon"
    },
    { id: 4, name: "Stain Removal", price: 500, icon: "fa-wand-magic-sparkles" },
    { id: 5, name: "Leather & Suede", price: 999, icon: "fa-vest" },
    { id: 6, name: "Wedding Dress", price: 2800, icon: "fa-person-dress" }
];

let cart = [];

// 2. Initialize Services List
const servicesList = document.getElementById('services-list');

function renderServices() {
    servicesList.innerHTML = services.map(service => {
        const isInCart = cart.find(item => item.id === service.id);
        const iconHtml = service.iconUrl
            ? `<img src="${service.iconUrl}" alt="${service.iconAlt || service.name}" class="service-icon" />`
            : `<i class="fas ${service.icon}"></i>`;

        return `
            <div class="service-item">
                <div class="service-info">
                    ${iconHtml}
                    <span>${service.name} - <span class="price">₹${service.price.toFixed(2)}</span></span>
                </div>
                ${isInCart 
                    ? `<button class="action-btn btn-remove" onclick="removeFromCart(${service.id})">Remove Item <i class="fas fa-minus-circle"></i></button>`
                    : `<button class="action-btn btn-add" onclick="addToCart(${service.id})">Add Item <i class="fas fa-plus-circle"></i></button>`
                }
            </div>
        `;
    }).join('');
}

// 3. Cart Logic
function addToCart(id) {
    if (cart.some(item => item.id === id)) {
        setBookingMessage('This service is already in your cart.', 'error');
        return;
    }

    const service = services.find(s => s.id === id);
    cart.push(service);
    setBookingMessage(`${service.name} added to cart!`, 'success');
    updateUI();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateUI();
}

function updateUI() {
    renderServices();
    renderCart();
}

// Newsletter Subscription
function setupNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = form.querySelector('input[type="text"]').value.trim();
        const email = form.querySelector('input[type="email"]').value.trim();

        if (!name || !email) {
            alert('Please enter both name and email to subscribe.');
            return;
        }

        alert(`Thanks ${name}! You are now subscribed with ${email}.`);
        form.reset();
    });
}

function renderCart() {
    const cartTable = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('total-amount');
    
    if (cart.length === 0) {
        cartTable.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No Items Added</td></tr>`;
        totalDisplay.innerText = `₹0.00`;
        return;
    }

    cartTable.innerHTML = cart.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td><span class="price">₹${item.price.toFixed(2)}</span></td>
        </tr>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalDisplay.innerText = `₹${total.toFixed(2)}`;
}

// 4. EmailJS Implementation
function initEmailJS() {
    if (typeof emailjs === 'undefined' || typeof emailjs.init !== 'function') {
        console.warn('EmailJS is not loaded; email functionality will not work.');
        emailjsConfigured = false;
        setBookingMessage('EmailJS is not loaded. Email confirmation will not be sent.', 'error');
        return;
    }

    // Validate config values
    if (
        EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
        EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' ||
        EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID'
    ) {
        console.warn('EmailJS is not configured -- please replace placeholder values in script.js.');
        emailjsConfigured = false;
        setBookingMessage('EmailJS is not configured. Update the constants at the top of script.js to enable email confirmations.', 'error');
        return;
    }

    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailjsConfigured = true;
}

const bookingMessageEl = document.getElementById('booking-message');
let bookingMessageTimeout;

function setBookingMessage(text, type, durationMs = 5000) {
    if (!bookingMessageEl) return;
    clearTimeout(bookingMessageTimeout);

    bookingMessageEl.textContent = text;
    bookingMessageEl.className = 'booking-message';
    if (type === 'success') bookingMessageEl.classList.add('booking-message--success');
    if (type === 'error') bookingMessageEl.classList.add('booking-message--error');

    bookingMessageTimeout = setTimeout(() => {
        bookingMessageEl.textContent = '';
        bookingMessageEl.className = 'booking-message';
    }, durationMs);
}

document.getElementById('booking-form').addEventListener('submit', function(event) {
    event.preventDefault();

    if (cart.length === 0) {
        setBookingMessage('Please add at least one service to your cart!', 'error');
        return;
    }

    const serviceNames = cart.map(item => item.name).join(', ');
    const totalAmount = document.getElementById('total-amount').innerText;

    const templateParams = {
        to_name: document.getElementById('user_name').value,
        user_email: document.getElementById('user_email').value,
        message: `Order Details: ${serviceNames}. Total: ${totalAmount}`
    };

    if (!emailjsConfigured) {
        setBookingMessage('Booking received! Thank you for booking the service.', 'success');
        cart = [];
        document.getElementById('booking-form').reset();
        updateUI();
        return;
    }

    // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' in the constants at the top of script.js
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            setBookingMessage('Thank you for booking the service! We will get back to you soon.', 'success');
            cart = [];
            document.getElementById('booking-form').reset();
            updateUI();
        }, function(error) {
            console.log('FAILED...', error);
            setBookingMessage('Something went wrong sending confirmation. Please try again later.', 'error');
        });
});

// Initial Render
renderServices();
renderCart();

// Initialize email service and newsletter handling
initEmailJS();
setupNewsletter();