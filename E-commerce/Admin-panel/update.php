<?php

include "connect_database.php";

session_start();
if(!isset($_SESSION["username"])){
    header("Location: login.php");
    exit();
}

if(isset($_GET["SNO"])){
    $_SESSION["SNO"] = $_GET["SNO"];
}

if($_SERVER["REQUEST_METHOD"] == "POST") {
    $SNO = $_SESSION["SNO"];

    $sql_select = "SELECT product_name, product_price, category, writer_name, description FROM product_details WHERE SNO = '$SNO'";
    $result_select = mysqli_query($conn, $sql_select);
    $product = mysqli_fetch_assoc($result_select);

    // $writer_name = $_POST['writer_name'];
    // $description = $_POST['description'];
    $writer_name = !empty($_POST["writer_name"]) ? $_POST["writer_name"] : $product['writer_name'];
    $description = !empty($_POST["description"]) ? $_POST["description"] : $product['description'];
    $product_name = !empty($_POST["product_name"]) ? $_POST["product_name"] : $product['product_name'];
    $product_price = !empty($_POST["product_price"]) ? $_POST["product_price"] : $product['product_price'];
    // $category_name = $_POST["category"];

    // Check if the category needs to be updated
    if (!empty($category_name)) {
        // Check if the new category exists
        $sql_check_category = "SELECT SNO FROM category WHERE category = '$category_name'";
        $result_check_category = mysqli_query($conn, $sql_check_category);

        if (mysqli_num_rows($result_check_category) > 0) {
            // Category exists, get the category SNO
            $row = mysqli_fetch_assoc($result_check_category);
            $category = $row['SNO'];
        } else {
            // Insert the new category and get the new SNO
            $sql_insert_category = "INSERT INTO category (category) VALUES ('$category_name')";
            mysqli_query($conn, $sql_insert_category);
            $category = mysqli_insert_id($conn);
        }
    } else {
        
        $category = $product['category'];
    }



    $sql_update = "
        UPDATE product_details 
        SET 
            writer_name = '$writer_name',
            description = '$description',
            product_name = '$product_name', 
            product_price = '$product_price', 
            category = '$category' 
        WHERE 
            SNO = '$SNO' ";

            mysqli_query($conn, $sql_update);


    $sql_update_category = "
        UPDATE category 
        SET 
            category = '$category' 
        WHERE 
            SNO = '$SNO'
    ";
    mysqli_query($conn, $sql_update_category);

    header("Location: admin.php");
    exit();
}
$sql_category = "SELECT * FROM category";
$results_category = mysqli_query($conn, $sql_category);

?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update Your Product List</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="update.css">
    <style>
        .error {
            color: red;
        }
    </style>
</head>
<body>
<?php
    include '../user/loader.php';
    ?>
    <div class="form-container">
        <h2>Update Your Product</h2>
        <form id="myForm" action="update.php" method="post" enctype="multipart/form-data">
            <div class="form-group">
                <label for="product_name">Product Name:</label>
                <input type="text" id="product_name" name="product_name" >
            </div>
            <div class="form-group">
            <label for="writer_name">Writer Name:</label>
            <input type="text" id="writer_name" name="writer_name">

            </div>
            <div class="form-group">
            <label for="product_name">Description:</label>
            <textarea id="textInput" rows="10" name="description" cols="50" placeholder="Type something here..."></textarea>
            <p>Total Letters: <span id="letterCount">0</span></p>
            <p id="errorMessage" class="error"></p>
            </div>

            <div class="form-group">
                <label for="product_price">Product Price (in ₹):</label>
                <input type="text" id="product_price" name="product_price" >
            </div>
            <div class="form-group">
               <label for="productStock">Stock Quantity</label>
               <input type="number" class="form-control" id="productStock" name= "productQuantity" placeholder="Enter stock quantity">
            </div>


            <div class="form-group">
                <input type="submit" value="Update">
            </div>
        </form>
    </div>
    <script>
    // Set the character limit
    const letterLimit = 200;

    // Get references to elements
    const textInput = document.getElementById('textInput');
    const letterCount = document.getElementById('letterCount');
    const errorMessage = document.getElementById('errorMessage');
    const form = document.getElementById('myForm'); // Replace with your form's ID

    // Variable to track if the dialog has already been shown
    let dialogShown = false;

    // Function to count letters and check the limit
    textInput.addEventListener('input', () => {
        // Get the input value
        const text = textInput.value;

        // Count the number of letters (ignore spaces and other non-letter characters)
        const letterCountValue = text.replace(/[^a-zA-Z]/g, '').length;
        letterCount.textContent = letterCountValue;

        // Check if letter count exceeds the limit
        if (letterCountValue > letterLimit) {
            errorMessage.textContent = `Error: Letter count exceeded the limit of ${letterLimit} letters.`;

            // Show dialog box if not already shown
            if (!dialogShown) {
                alert(`Letter count exceeded the limit of ${letterLimit} letters. Please reduce your input.`);
                dialogShown = true; // Prevent multiple alerts
            }
        } else {
            errorMessage.textContent = '';
            dialogShown = false; // Reset dialog flag if within the limit
        }
    });

    // Prevent form submission if letter count exceeds the limit
    form.addEventListener('submit', (event) => {
        const text = textInput.value;
        const letterCountValue = text.replace(/[^a-zA-Z]/g, '').length;

        // If letter count exceeds the limit, prevent form submission
        if (letterCountValue > letterLimit) {
            alert(`Form cannot be submitted. Letter count exceeds the limit of ${letterLimit} letters.`);
            event.preventDefault(); // Prevent form submission
        }
    });
</script>


</body>
</html>