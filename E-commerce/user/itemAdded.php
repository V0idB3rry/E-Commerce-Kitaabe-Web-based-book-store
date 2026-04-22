<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cart Dialog Box</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="CSS/itemAdded.css">
</head>
<body>
    <button id="addToCartBtn">Add to Cart</button>

    <!-- Dialog Box -->
    <div id="cartDialog" class="dialog">
        <div class="dialog-content">
            <i class="fas fa-check-circle tick-icon"></i>
            <p>Item added to cart successfully!</p>
            <button id="closeDialogBtn">Close</button>
        </div>
    </div>

    <script>
        document.getElementById('addToCartBtn').addEventListener('click', function() {
    // Simulate adding an item to the cart
    // Show the dialog box
    document.getElementById('cartDialog').style.display = 'block';
});

document.getElementById('closeDialogBtn').addEventListener('click', function() {
    // Hide the dialog box
    document.getElementById('cartDialog').style.display = 'none';
});
    </script>
</body>
</html>