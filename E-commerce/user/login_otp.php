<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 300px;
            text-align: center;
        }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        button {
            width: 100%;
            padding: 10px;
            background-color: #28a745;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Login with OTP</h2>
        <input type="email" id="email" placeholder="Enter your email" required>
        <button onclick="sendOTP()">Send OTP</button>
        <input type="text" id="otp" placeholder="Enter OTP" required>
        <button onclick="verifyOTP()">Verify OTP</button>
        <p id="message"></p>
    </div>

    <script>
        async function sendOTP() {
            const email = document.getElementById('email').value;
            if (!email) {
                document.getElementById('message').textContent = 'Email is required';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const result = await response.json();
                document.getElementById('message').textContent = result.message;
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('message').textContent = 'Failed to send OTP';
            }
        }

        async function verifyOTP() {
            const email = document.getElementById('email').value;
            const otp = document.getElementById('otp').value;
            if (!email || !otp) {
                document.getElementById('message').textContent = 'Email and OTP are required';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp }),
                });
                const result = await response.json();
                document.getElementById('message').textContent = result.message;
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('message').textContent = 'Failed to verify OTP';
            }
        }
    </script>
</body>
</html>