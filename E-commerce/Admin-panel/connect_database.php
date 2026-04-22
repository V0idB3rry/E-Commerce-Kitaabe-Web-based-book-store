<?php
// Disable mysqli exceptions — prevents "Table doesn't exist" from crashing pages
mysqli_report(MYSQLI_REPORT_OFF);

$servername = "localhost";
$username   = "root";
$password   = "";
$database   = "e-commerce";

$conn = mysqli_connect($servername, $username, $password, $database);
?>