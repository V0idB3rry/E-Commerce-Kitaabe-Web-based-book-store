<?php
// GET    admin_categories.php                   → categories with book counts
// POST   admin_categories.php {name}            → add a category
// PATCH  admin_categories.php {name, new_name}  → rename (books move with it)
// DELETE admin_categories.php?name=Politics     → delete an empty category

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST', 'PATCH', 'DELETE');
require_admin();

function all_categories(): array
{
    $rows = db()->query(
        'SELECT c.category AS name, COUNT(p.SNO) AS count, COALESCE(SUM(p.product_quantity), 0) AS copies
         FROM category c LEFT JOIN product_details p ON p.category = c.category
         GROUP BY c.SNO, c.category ORDER BY c.SNO'
    )->fetchAll();
    return array_map(fn ($r) => ['name' => $r['name'], 'count' => (int) $r['count'], 'copies' => (int) $r['copies']], $rows);
}

function valid_name(string $name): string
{
    $name = trim(preg_replace('/\s+/', ' ', $name));
    if ($name === '' || mb_strlen($name) > 60) {
        fail('Category names need 1–60 characters.', 422);
    }
    return $name;
}

function exists(string $name): bool
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM category WHERE category = ?');
    $stmt->execute([$name]);
    return (bool) $stmt->fetchColumn();
}

if (method() === 'GET') {
    send_json(['categories' => all_categories()]);
}

if (method() === 'POST') {
    $name = valid_name((string) (body()['name'] ?? ''));
    if (exists($name)) {
        fail("“$name” already exists.", 409);
    }
    db()->prepare('INSERT INTO category (category) VALUES (?)')->execute([$name]);
    send_json(['categories' => all_categories()], 201);
}

if (method() === 'PATCH') {
    $input = body();
    $old = (string) ($input['name'] ?? '');
    $new = valid_name((string) ($input['new_name'] ?? ''));
    if (!exists($old)) {
        fail('Category not found.', 404);
    }
    if ($new !== $old && strcasecmp($new, $old) !== 0 && exists($new)) {
        fail("“$new” already exists.", 409);
    }

    $pdo = db();
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE category SET category = ? WHERE category = ?')->execute([$new, $old]);
    $pdo->prepare('UPDATE product_details SET category = ? WHERE category = ?')->execute([$new, $old]);
    $pdo->commit();
    send_json(['categories' => all_categories()]);
}

// DELETE
$name = (string) ($_GET['name'] ?? '');
$count = db()->prepare('SELECT COUNT(*) FROM product_details WHERE category = ?');
$count->execute([$name]);
if ((int) $count->fetchColumn() > 0) {
    fail('Move or delete the books on this shelf first.', 409);
}
db()->prepare('DELETE FROM category WHERE category = ?')->execute([$name]);
send_json(['categories' => all_categories()]);
