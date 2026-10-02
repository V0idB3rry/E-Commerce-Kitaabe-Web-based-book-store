<?php
// GET   admin_sell_requests.php?status=new     → "Sell your books" submissions, newest first
// PATCH admin_sell_requests.php {id, status}   → new | contacted | accepted | rejected

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'PATCH');

const SELL_STATUSES = ['new', 'contacted', 'accepted', 'rejected'];

function format_request(array $r): array
{
    return [
        'id'         => (int) $r['id'],
        'name'       => $r['name'],
        'email'      => $r['email'],
        'phone'      => $r['phone'],
        'city'       => $r['city'],
        'book_count' => (int) $r['book_count'],
        'books'      => $r['books'],
        'notes'      => $r['notes'],
        'status'     => $r['status'],
        'date'       => $r['created_at'],
    ];
}

if (method() === 'GET') {
    $status = $_GET['status'] ?? '';
    if (in_array($status, SELL_STATUSES, true)) {
        $stmt = db()->prepare('SELECT * FROM sell_requests WHERE status = ? ORDER BY created_at DESC, id DESC');
        $stmt->execute([$status]);
    } else {
        $stmt = db()->query('SELECT * FROM sell_requests ORDER BY created_at DESC, id DESC');
    }

    $counts = array_fill_keys(SELL_STATUSES, 0);
    foreach (db()->query('SELECT status, COUNT(*) AS n FROM sell_requests GROUP BY status') as $row) {
        $counts[$row['status']] = (int) $row['n'];
    }

    send_json(['requests' => array_map('format_request', $stmt->fetchAll()), 'counts' => $counts]);
}

$input = body();
$status = $input['status'] ?? '';
if (!in_array($status, SELL_STATUSES, true)) {
    fail('Choose a valid status.');
}
$stmt = db()->prepare('UPDATE sell_requests SET status = ? WHERE id = ?');
$stmt->execute([$status, (int) ($input['id'] ?? 0)]);
if ($stmt->rowCount() === 0) {
    $check = db()->prepare('SELECT COUNT(*) FROM sell_requests WHERE id = ?');
    $check->execute([(int) ($input['id'] ?? 0)]);
    if (!$check->fetchColumn()) fail('Request not found.', 404);
}

$row = db()->prepare('SELECT * FROM sell_requests WHERE id = ?');
$row->execute([(int) $input['id']]);
send_json(['request' => format_request($row->fetch())]);
