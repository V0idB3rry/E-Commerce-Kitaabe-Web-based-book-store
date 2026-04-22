<?php
if(isset($_POST["username"]) && $_POST["password"]) {

    $username = $_POST["username"];
    $password = $_POST["password"];

    $user = [
        "admin" => "passwordofadmin",
    ];

    if(isset($user[$username]) && $user[$username] == $password){

        session_start();
        $_SESSION["username"] = $username;
        header("Location: Admin-panal.php");
        exit();

    } else {
        echo "<div class='error-message'>Username or Password is incorrect. You are not Admin.</div>";
    }

}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login Panel</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }

        .form-container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }

        .form-container h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #333333;
            font-size: 24px;
        }

        .form-container form {
            display: flex;
            flex-direction: column;
        }

        .form-container form input[type="text"],
        .form-container form input[type="password"] {
            height: 45px;
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #cccccc;
            border-radius: 5px;
            font-size: 16px;
        }

        .form-container form input[type="submit"] {
            height: 45px;
            background-color: #ff9900;
            border: none;
            border-radius: 5px;
            color: #ffffff;
            font-size: 18px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .form-container form input[type="submit"]:hover {
            background-color: #e68a00;
        }

        .error-message {
            color: #ff4d4d;
            text-align: center;
            margin-top: 20px;
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .form-container {
                padding: 20px;
                width: 100%;
            }

            .form-container h2 {
                font-size: 20px;
            }

            .form-container form input[type="text"],
            .form-container form input[type="password"] {
                font-size: 14px;
                padding: 8px;
            }

            .form-container form input[type="submit"] {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <a href="../user/index.php" style = " text-decoration : none; color: blue;">  Back to home page </a>
        <h2>Admin Login</h2>
        <form action="login.php" method="post">
            <input type="text" name="username" placeholder="Enter your username" required>
            <input type="password" name="password" placeholder="Enter your password" required>
            <input type="submit" name="submit" class="btn-submit" value="Login">
        </form>
    </div>
</body>
</html>