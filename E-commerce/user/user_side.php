<?php
include 'connect_database.php';

if($_SERVER["REQUEST_METHOD"] == "POST"){
    // Get form data
    $userName = $_POST["user_name"];
    $email = $_POST["Email"];
    $phoneNumber = $_POST["number"];
    $password = $_POST["password"];

    // Insert into the database
    $sql_user = "INSERT INTO user_database (Username, Phone_number, email, password) 
            VALUES ('$userName', '$phoneNumber', '$email', '$password')";
    $request_user = mysqli_query($conn, $sql_user);

    // Check if the insert was successful
    if($request_user) {
        // Redirect to the login page after successful signup
        header("Location: signup.php");
        exit();
    } else {
        echo "<div class='error-message'>There was an issue signing you up. Please try again.</div>";
    }

    // Login logic
    if(isset($_POST["user_name"]) && $_POST["password"]) {

        $userName = $_POST["user_name"];
        $password = $_POST["password"];
    
        // Simulating user authentication (replace this with actual logic later)
        $user = [
            "$userName" => "$password",
        ];
    
        // If credentials match
        if(isset($user[$userName]) && $user[$userName] == $password){
            session_start();
            $_SESSION["user_name"] = $userName;
            header("Location: index.php"); // Redirect to index page if login successful
            exit();
        } else {
            echo "<div class='error-message'>Username or Password is incorrect. You are not Admin.</div>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>login</title>
    <link rel="stylesheet" href="../user/CSS/user_side.css">
</head>
<body>
    <?php

    include 'navbar.php';
    include 'loader.php';

    ?>

    <div class="container">
        <div class="user-form">
            <form action="user_side.php" method="post">
                <label for="user_name">Username</label>
                <input type="text" id="user_name" name="user_name" placeholder="   Enter Your First and last name">

                <label for="Email">Email</label>
                <input type="text" id="Email" name="Email" placeholder="   Enter your Email">

                <label for="number">Phone Number</label>
                <input type="number" id="number" name="number" placeholder="   Enter your Phone Nunmber">

                <label for="password">Password</label>
                <input type="password" name="password" placeholder="   Enter password minimum length of 6">
            
                <input type="submit" value="Login" >
            
            </form>
        </div>
    </div>
</body>
</html>