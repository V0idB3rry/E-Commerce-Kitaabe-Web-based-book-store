<?php

include 'connect_database.php'; // Database connection

$sql_category = "SELECT * FROM category";
$results_category = mysqli_query($conn, $sql_category);

session_start();
if(!isset($_SESSION["username"])){
    header("Location: login.php");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $product_name = $_POST['product_name'];
    $writer_name = $_POST['writer_name'];
    $description = $_POST['description'];
    $product_price = $_POST['product_price'];
    $category = $_POST['category'];
    $file = $_FILES['file'];
    $filename = $file['name'];
    $filetmpname = $file['tmp_name'];

    $target_directory = "../user/product-Source/";
    $target_file = $target_directory . basename($filename);
    move_uploaded_file($filetmpname, $target_file);

    $sql = "INSERT INTO product_details (product_image, product_name, product_price, category, writer_name, description) 
            VALUES ('$filename', '$product_name', '$product_price','$category','$writer_name', '$description')";

    if (mysqli_query($conn, $sql)) {
        $message = "<div class='success-message'>
                        <h2>Product Added Successfully!</h2>
                        <p>Your product has been added to the database.</p>
                    </div>";
    } else {
        $message = "<div class='error-message'>
                        <h2>Error Adding Product</h2>
                        <p>Error: " . mysqli_error($conn) . "</p>
                    </div>";
    }

}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add New Product</title>
    <link rel="stylesheet" href="addproducts.css">
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
    <div class="main-container">
        <!-- Form Section -->
        <div class="form-container">
            <a href="admin.php">Back To Admin</a>
            <h2 style="color: black; text-align: center; margin-bottom: 30px;">Add New Product</h2>
            <form action="addproduct.php" method="post" enctype="multipart/form-data">
                <label for="product_name">Product Name:</label>
                <input type="text" id="product_name" name="product_name" required>

                <label for="writer_name">Writer Name:</label>
                <input type="text" id="writer_name" name="writer_name" required>

                <label for="textInput">Description:</label>
                <textarea id="textInput" rows="10" name="description" cols="50" placeholder="Type something here..." style="width: 100%;"></textarea>
                <p>Max length: <span id="letterCount">0</span></p>
                <p id="errorMessage" class="error"></p>

                <label for="product_price">Product Price ( in ₹ ):</label>
                <input type="text" id="product_price"  name="product_price" required>

                <label for="category">Category:</label>
                <select id="category" name="category">
                    <?php
                    while($row = mysqli_fetch_assoc($results_category)) {

                        echo "<option class = 'cat'>" . $row['category'] . "</option>";

                    }

                    ?>
                    
        </select>

                <label for="file">Upload Image:</label>
                <input type="file" name="file" required>

                <input type="submit" value="Add Product">
            </form>
        </div>
        <div id = "error-message">
            <?php if (isset($message)) echo $message; ?>
        </div>

        <!-- <div class="exitbutton">
            <a href="admin.php">
                <button>
                    Back to Admin
                </button>
            </a> -->
     </div> 
    </div>
    <script>
    // Set the character limit
    const letterLimit = 255;

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