<?php
include 'connect_database.php';

if($_SERVER["REQUEST_METHOD"] == "POST"){
    // Get form data
    $userName = $_POST["user_name"];
    $email = $_POST["Email"];
    $phoneNumber = $_POST["number"];
    $password = $_POST["password"];

    // Check if the username and password already exist in the database
    $check_user_query = "SELECT * FROM user_database WHERE Username = '$userName' AND password = '$password'";
    $result = mysqli_query($conn, $check_user_query);

    if(mysqli_num_rows($result) > 0) {
        // User already exists, start session and redirect to index.php
        session_start();
        $_SESSION["user_name"] = $userName;
        header("Location: index.php");
        exit();
    } else {

        // Check if the insert was successful
        if($request_user) {
            // Start session and log the user in
            session_start();
            $_SESSION["user_name"] = $userName;

            // Redirect to index.php after successful signup
            header("Location: index.php");
            exit();
        } else {
            // Display an error if the insert fails
            echo "<div class='error-message'>There was an issue signing you up. Please try again.</div>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signup</title>
    <style>
        *{
    margin: 0;
    padding: 0;
}
.user-form{
    width: 100%;
    margin-top: 70px;
}
.user-form form{
    height: 500px;
    width: 400px;
    margin: auto;
    padding: 20px;
    /* background-color: rgb(255, 255, 255); */
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    border: 1px solid black;
    border-radius: 8px;
}
.user-form form label{
    font-weight: 500;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: rgb(51, 51, 51);
}
.user-form form input{
    width: 350px;
    height: 40px;
    font-size: 14px;
    text-indent: 10px;
    
}
.user-form form input[type="submit"]{
    background-color: orange;
    border: 1px solid black;
    border-radius: 5px;
}
    </style>
</head>
<body>
    <?php

include 'navbar.php';

    ?>
<div class="container">
        <div class="user-form">
            <form action="user_side.php" method="post">
                <label for="user_name">Username</label>
                <input type="text" id="user_name" name="user_name" placeholder="   Enter Your First and last name">

                <label for="password">Password</label>
                <input type="password" name="password" placeholder="   Enter password minimum length of 6">
            
                <input type="submit" value="Login" >
            
            </form>
        </div>
    </div>
</body>
</html>