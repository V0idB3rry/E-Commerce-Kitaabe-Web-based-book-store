<?php
// ── Load DB + config ─────────────────────────────────────────
include 'connect_database.php';
include 'razorpay_config.php';

// Redirect if cart is empty
$cart_check = mysqli_query($conn, "SELECT COUNT(*) AS cnt FROM user_cart");
$cnt = mysqli_fetch_assoc($cart_check)['cnt'];
if ($cnt == 0) { header('Location: add_to_cart.php'); exit; }

// Fetch real cart items
$cart_result = mysqli_query($conn, "SELECT * FROM user_cart");
$cart_items  = [];
$subtotal    = 0;
while ($row = mysqli_fetch_assoc($cart_result)) {
    $qty        = max(1, (int)($row['quantity'] ?? 1));
    $price      = (float)$row['product_price'];
    $line_total = $qty * $price;
    $subtotal  += $line_total;
    $cart_items[] = array_merge($row, ['qty' => $qty, 'line_total' => $line_total]);
}
$delivery_fee = $subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
$order_total  = $subtotal + $delivery_fee;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Checkout</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        :root {
            --amazon-primary: #232f3e;
            --amazon-secondary: #37475a;
            --amazon-accent: #ff9900;
            --amazon-light: #eaeded;
            --amazon-border: #ddd;
            --amazon-price: #b12704;
            --amazon-success: #007600;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { background-color: var(--amazon-light); color: #111; }
        .header { background-color: var(--amazon-primary); padding: 10px 0; }
        .header-container { max-width: 1500px; margin: 0 auto; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; }
        .logo { color: white; font-size: 24px; font-weight: bold; text-decoration: none; display: flex; align-items: center; }
        .logo i { color: var(--amazon-accent); margin-right: 5px; }
        .secure-checkout { color: white; font-size: 18px; display: flex; align-items: center; }
        .secure-checkout i { color: var(--amazon-accent); margin-right: 8px; }
        .progress-steps { max-width: 1500px; margin: 20px auto; padding: 0 15px; }
        .steps { display: flex; justify-content: center; margin-bottom: 20px; }
        .step { display: flex; flex-direction: column; align-items: center; position: relative; width: 25%; }
        .step-number { width: 30px; height: 30px; border-radius: 50%; background-color: #ccc; color: white; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; z-index: 2; }
        .step.active .step-number { background-color: var(--amazon-accent); }
        .step-text { font-size: 14px; color: #565959; }
        .step.active .step-text { color: var(--amazon-accent); font-weight: bold; }
        .step:not(:last-child):after { content: ''; position: absolute; top: 15px; left: 60%; width: 80%; height: 2px; background-color: #ccc; z-index: 1; }
        .step.active:not(:last-child):after { background-color: var(--amazon-accent); }
        .container { max-width: 1500px; margin: 20px auto; display: flex; gap: 20px; padding: 0 15px; }
        .checkout--container { background: white; border-radius: 4px; flex: 7; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .section { padding: 20px; border-bottom: 1px solid var(--amazon-border); }
        .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .section-title { font-size: 18px; font-weight: 600; color: var(--amazon-primary); }
        .change-btn { color: #0066c0; background: none; border: none; cursor: pointer; font-size: 14px; }
        .change-btn:hover { text-decoration: underline; color: #c45500; }

        /* Address form */
        .form-grid { display: flex; flex-wrap: wrap; gap: 14px; }
        .form-grid .fg { flex: 1; min-width: 200px; }
        .form-grid .fg-full { flex: 100%; }
        .fg label { display: block; margin-bottom: 5px; font-weight: 600; color: #555; font-size: 14px; }
        .fg input, .fg textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; transition: border .2s; }
        .fg input:focus, .fg textarea:focus { outline: none; border-color: var(--amazon-accent); }
        .fg textarea { resize: vertical; min-height: 65px; }

        /* Payment methods */
        .payment-methods { display: flex; flex-direction: column; gap: 15px; }
        .payment-method { display: flex; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
        .payment-method.selected { border: 2px solid var(--amazon-accent); background-color: rgba(255, 153, 0, 0.05); }
        .payment-method:hover { border-color: var(--amazon-accent); }
        .payment-method input { margin-right: 15px; }
        .payment-icon { margin-right: 10px; font-size: 24px; color: #555; }
        .payment-details { margin-top: 15px; padding: 15px; background-color: #f7f7f7; border-radius: 4px; display: none; font-size: 14px; color: #555; }
        .payment-details.active { display: block; }
        .pay-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .pay-chip { background: #e8e8e8; padding: 4px 10px; border-radius: 4px; font-size: 12px; }

        /* Cart items in checkout */
        .cart-items-list { display: flex; flex-direction: column; gap: 14px; }
        .ci { display: flex; gap: 14px; align-items: center; }
        .ci img { width: 70px; height: 70px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; flex-shrink: 0; }
        .ci-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .ci-sub { font-size: 13px; color: #888; }
        .ci-price { margin-left: auto; font-weight: 700; color: var(--amazon-price); white-space: nowrap; }

        /* Order summary sidebar */
        .order-summary { background: white; border-radius: 4px; flex: 3; height: fit-content; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .summary-heading { padding: 15px 20px; border-bottom: 1px solid var(--amazon-border); background: var(--amazon-secondary); color: white; border-radius: 4px 4px 0 0; font-size: 18px; }
        .summary-content { padding: 20px; }
        .summary-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .summary-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--amazon-border); font-weight: bold; font-size: 18px; }
        .place-order-btn { background: var(--amazon-accent); border: 1px solid var(--amazon-accent); border-radius: 20px; width: 100%; padding: 12px; font-size: 16px; cursor: pointer; margin-top: 20px; transition: all 0.3s; font-weight: bold; }
        .place-order-btn:hover { background: #e88a00; }
        .place-order-btn:disabled { background: #ccc; cursor: not-allowed; }
        .security-notice { display: flex; align-items: center; margin-top: 15px; color: var(--amazon-success); font-size: 14px; }
        .security-notice i { margin-right: 8px; }
        .trust-badges { display: flex; justify-content: space-around; margin-top: 20px; padding: 15px; background: #f7f7f7; border-radius: 4px; }
        .badge { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .badge i { font-size: 24px; color: var(--amazon-success); margin-bottom: 5px; }
        .badge-text { font-size: 12px; color: #555; }
        .free-delivery { color: var(--amazon-success); font-weight: 600; }

        /* Error banner */
        .error-banner { background: #fdecea; border: 1px solid #e57373; color: #b71c1c; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; display: none; font-size: 14px; }
        .error-banner.show { display: block; }

        /* Loading overlay */
        #overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 999; align-items: center; justify-content: center; }
        #overlay.show { display: flex; }
        .spinner-box { background: #fff; padding: 30px 40px; border-radius: 10px; text-align: center; font-size: 15px; color: #333; }
        .spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: var(--amazon-accent); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
            .container { flex-direction: column; }
            .form-grid .fg { min-width: 100%; }
            .step:not(:last-child):after { display: none; }
            .steps { flex-direction: column; align-items: center; gap: 20px; }
            .step { width: 100%; }
        }
    </style>
</head>
<body>

<!-- Loading overlay -->
<div id="overlay"><div class="spinner-box"><div class="spinner"></div>Processing your order...</div></div>

<header class="header">
    <div class="header-container">
        <a href="index.php" class="logo">
            <i class="fa-solid fa-cart-shopping"></i>ShopCart
        </a>
        <div class="secure-checkout">
            <i class="fa-solid fa-lock"></i>Secure Checkout
        </div>
    </div>
</header>

<div class="progress-steps">
    <div class="steps">
        <div class="step active"><div class="step-number">1</div><div class="step-text">Shipping</div></div>
        <div class="step active"><div class="step-number">2</div><div class="step-text">Payment</div></div>
        <div class="step"><div class="step-number">3</div><div class="step-text">Place Order</div></div>
    </div>
</div>

<div class="container">
    <div class="checkout--container">

        <div id="error-banner" class="error-banner"></div>

        <!-- 1. Delivery Address — now a real form -->
        <div class="section">
            <div class="section-heading">
                <div class="section-title">1. Delivery Address</div>
            </div>
            <div class="form-grid">
                <div class="fg">
                    <label>Full Name *</label>
                    <input type="text" id="fname" placeholder="Your full name">
                </div>
                <div class="fg">
                    <label>Phone Number *</label>
                    <input type="tel" id="phone" placeholder="10-digit mobile number" maxlength="10">
                </div>
                <div class="fg">
                    <label>Email Address</label>
                    <input type="email" id="email" placeholder="For order updates (optional)">
                </div>
                <div class="fg-full fg">
                    <label>Street Address *</label>
                    <textarea id="address" placeholder="House no, Building, Street, Area"></textarea>
                </div>
                <div class="fg">
                    <label>City *</label>
                    <input type="text" id="city" placeholder="City">
                </div>
                <div class="fg">
                    <label>PIN Code *</label>
                    <input type="text" id="pincode" placeholder="6-digit PIN" maxlength="6">
                </div>
            </div>
        </div>

        <!-- 2. Payment Method -->
        <div class="section">
            <div class="section-heading">
                <div class="section-title">2. Payment Method</div>
            </div>
            <div class="payment-methods">

                <div class="payment-method selected" id="opt-razorpay" onclick="selectPay('razorpay')">
                    <input type="radio" name="payment" id="razorpay-radio" checked>
                    <label for="razorpay-radio">
                        <i class="fa-solid fa-bolt payment-icon"></i>
                        Pay Online — Card / UPI / Net Banking / Wallets
                    </label>
                </div>
                <div class="payment-details active" id="det-razorpay">
                    <i class="fa-solid fa-shield-check" style="color:var(--amazon-success);margin-right:5px"></i>
                    Secure Razorpay payment window will open. Supports all Indian cards, UPI (GPay, PhonePe, Paytm), and net banking.
                    <div class="pay-chips">
                        <span class="pay-chip">💳 Cards</span>
                        <span class="pay-chip">📱 UPI</span>
                        <span class="pay-chip">🏦 Net Banking</span>
                        <span class="pay-chip">👛 Wallets</span>
                    </div>
                </div>

                <div class="payment-method" id="opt-cod" onclick="selectPay('cod')">
                    <input type="radio" name="payment" id="cod">
                    <label for="cod">
                        <i class="fa-solid fa-money-bill-wave payment-icon"></i>
                        Cash on Delivery
                    </label>
                </div>
                <div class="payment-details" id="det-cod">
                    Pay ₹<?= number_format($order_total, 2) ?> in cash when your order arrives. Please keep exact change ready.
                </div>

            </div>
        </div>

        <!-- 3. Items — pulled from real cart -->
        <div class="section">
            <div class="section-heading">
                <div class="section-title">3. Items and Shipping (<?= count($cart_items) ?>)</div>
            </div>
            <div class="cart-items-list">
                <?php foreach ($cart_items as $item): ?>
                <div class="ci">
                    <img src="product-Source/<?= htmlspecialchars($item['product_image']) ?>" alt="">
                    <div>
                        <div class="ci-name"><?= htmlspecialchars($item['product_name']) ?></div>
                        <div class="ci-sub">Qty: <?= $item['qty'] ?> × ₹<?= number_format($item['product_price'], 2) ?></div>
                    </div>
                    <div class="ci-price">₹<?= number_format($item['line_total'], 2) ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

    </div><!-- /.checkout--container -->

    <!-- Order Summary sidebar — real numbers from DB -->
    <div class="order-summary">
        <div class="summary-heading">Order Summary</div>
        <div class="summary-content">
            <div class="summary-item">
                <span>Items (<?= count($cart_items) ?>):</span>
                <span>₹<?= number_format($subtotal, 2) ?></span>
            </div>
            <div class="summary-item">
                <span>Delivery:</span>
                <span>
                    <?php if ($delivery_fee == 0): ?>
                        <span class="free-delivery">FREE</span>
                    <?php else: ?>
                        ₹<?= number_format($delivery_fee, 2) ?>
                    <?php endif; ?>
                </span>
            </div>
            <?php if ($delivery_fee > 0): ?>
            <div style="font-size:12px;color:var(--amazon-success);margin-bottom:8px">
                Add ₹<?= number_format(FREE_DELIVERY_ABOVE - $subtotal, 2) ?> more for free delivery
            </div>
            <?php endif; ?>
            <div class="summary-total">
                <span>Order Total:</span>
                <span>₹<?= number_format($order_total, 2) ?></span>
            </div>

            <button class="place-order-btn" id="place-btn" onclick="placeOrder()">Place your order</button>

            <div class="security-notice">
                <i class="fa-solid fa-lock"></i>
                Your order is secured with SSL encryption
            </div>

            <div class="trust-badges">
                <div class="badge"><i class="fa-solid fa-shield"></i><div class="badge-text">Secure Payment</div></div>
                <div class="badge"><i class="fa-solid fa-truck"></i><div class="badge-text">Fast Delivery</div></div>
                <div class="badge"><i class="fa-solid fa-rotate-left"></i><div class="badge-text">Easy Returns</div></div>
            </div>
        </div>
    </div>

</div><!-- /.container -->

<!-- Razorpay SDK -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
let selectedPay = 'razorpay';

function selectPay(method) {
    selectedPay = method;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.payment-details').forEach(el => el.classList.remove('active'));
    document.getElementById('opt-' + method).classList.add('selected');
    document.getElementById('det-' + method).classList.add('active');
    document.getElementById(method === 'razorpay' ? 'razorpay-radio' : 'cod').checked = true;
}

function showError(msg) {
    const el = document.getElementById('error-banner');
    el.textContent = '⚠ ' + msg;
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() { document.getElementById('error-banner').classList.remove('show'); }

function showOverlay(show) {
    document.getElementById('overlay').classList.toggle('show', show);
    document.getElementById('place-btn').disabled = show;
}

function getFormData() {
    return {
        user_name:      document.getElementById('fname').value.trim(),
        user_email:     document.getElementById('email').value.trim(),
        user_phone:     document.getElementById('phone').value.trim(),
        address:        document.getElementById('address').value.trim(),
        city:           document.getElementById('city').value.trim(),
        pincode:        document.getElementById('pincode').value.trim(),
        payment_method: selectedPay,
    };
}

function validate(data) {
    if (!data.user_name)  return 'Please enter your full name.';
    if (!data.user_phone || data.user_phone.length !== 10 || isNaN(data.user_phone))
        return 'Please enter a valid 10-digit phone number.';
    if (!data.address)    return 'Please enter your delivery address.';
    if (!data.city)       return 'Please enter your city.';
    if (!data.pincode || data.pincode.length !== 6 || isNaN(data.pincode))
        return 'Please enter a valid 6-digit PIN code.';
    return null;
}

async function placeOrder() {
    hideError();
    const data = getFormData();
    const err  = validate(data);
    if (err) { showError(err); return; }

    showOverlay(true);

    try {
        const res  = await fetch('payment_handler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();

        if (!json.success) {
            showOverlay(false);
            showError(json.error || 'Something went wrong. Please try again.');
            return;
        }

        // COD — go straight to confirmation
        if (json.method === 'cod') {
            window.location.href = 'order_confirm.php?order_id=' + json.order_id;
            return;
        }

        // Razorpay — open payment modal
        showOverlay(false);
        const rzp = new Razorpay({
            key:         json.key_id,
            amount:      json.amount,
            currency:    json.currency,
            name:        json.store_name,
            description: 'Order #' + json.db_order_id,
            order_id:    json.rz_order_id,
            prefill: { name: json.customer.name, email: json.customer.email, contact: json.customer.phone },
            theme: { color: '#ff9900' },
            handler: async function(response) {
                showOverlay(true);
                try {
                    const vRes  = await fetch('verify_payment.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id:   response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature:  response.razorpay_signature,
                            db_order_id:         json.db_order_id,
                        }),
                    });
                    const vJson = await vRes.json();
                    if (vJson.success) {
                        window.location.href = 'order_confirm.php?order_id=' + vJson.order_id;
                    } else {
                        showOverlay(false);
                        showError(vJson.error || 'Payment verification failed. Please contact support.');
                    }
                } catch(e) {
                    showOverlay(false);
                    showError('Network error during verification. Please contact support.');
                }
            },
            modal: {
                ondismiss: function() {
                    showOverlay(false);
                    showError('Payment was cancelled. You can try again.');
                }
            }
        });
        rzp.on('payment.failed', function(resp) {
            showOverlay(false);
            showError('Payment failed: ' + (resp.error.description || 'Please try again.'));
        });
        rzp.open();

    } catch(e) {
        showOverlay(false);
        // Show the real error to help diagnose the problem
        showError('Error: ' + e.message + ' — Make sure payment_handler.php exists in your user/ folder and the orders table is created in your database (run payment_setup.sql).');
    }
}
</script>
</body>
</html>