<?php
include "connect_database.php";
session_start();

if(!isset($_SESSION["username"])){
    header("Location: login.php");
}

$SNO = intval($_GET["SNO"]);


$sql_delete = "DELETE FROM product_details WHERE SNO = ?";

$stmt = mysqli_prepare($conn, $sql_delete);

mysqli_stmt_bind_param($stmt, "i", $SNO);

if (mysqli_stmt_execute($stmt)) {
    header("Location: Admin-panal.php");
    exit();
} else {
    
    echo "Error deleting record: " . mysqli_error($conn);
}
mysqli_stmt_close($stmt);
mysqli_close($conn);
?>