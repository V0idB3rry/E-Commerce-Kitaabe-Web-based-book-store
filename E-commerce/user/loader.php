<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        #loader {
        position: fixed;
        z-index: 9999;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #loader::before {
        content: "";
        width: 60px;
        height: 60px;
        border: 10px solid #f3f3f3;
        border-top: 10px solid #fdee42;
        border-radius: 50%;
        animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    </style>
</head>
<body>
<div id="loader"></div>


<script>
    document.onreadystatechange = function () {
        if (document.readyState === "complete") {
            document.getElementById('loader').style.display = "none";
        }
    };
</script>

</body>
</html>