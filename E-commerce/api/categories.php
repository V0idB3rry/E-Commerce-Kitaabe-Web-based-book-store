<?php
// GET categories.php → every category with how many books it holds

require __DIR__ . '/bootstrap.php';
allow_methods('GET');

$rows = db()->query(
    'SELECT c.category AS name, COUNT(p.SNO) AS count
     FROM category c
     LEFT JOIN product_details p ON p.category = c.category
     GROUP BY c.SNO, c.category
     ORDER BY c.SNO'
)->fetchAll();

foreach ($rows as &$row) {
    $row['count'] = (int) $row['count'];
}

send_json(['categories' => $rows]);
