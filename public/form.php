<?php
// Emails newsletter sign-ups and story submissions to you, then shows the thank-you page.
// Works on KnownHost (cPanel) PHP hosting. Set your address on the next line.
$TO = 'CHANGE_ME@example.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /'); exit; }

// Spam trap: real people leave this hidden field empty.
if (!empty($_POST['company-website'])) { header('Location: /thanks/', true, 303); exit; }

$site = preg_replace('/[^a-z0-9.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'website');
$form = ($_POST['form-name'] ?? '') === 'newsletter' ? 'Newsletter sign-up' : 'News submission';
$allowed = ['type', 'business', 'area', 'name', 'email', 'phone', 'story', 'website'];

$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$email) { header('Location: /submit/?error=email', true, 303); exit; }

$lines = ["$form from $site", ''];
foreach ($allowed as $field) {
  if (!isset($_POST[$field]) || $_POST[$field] === '') continue;
  $value = mb_substr(trim((string) $_POST[$field]), 0, 5000);
  $lines[] = ucfirst($field) . ': ' . $value;
}
$lines[] = '';
$lines[] = 'Sent ' . gmdate('Y-m-d H:i') . ' UTC';

$headers = [
  'From: ' . $site . ' <no-reply@' . $site . '>',
  'Reply-To: ' . $email,
  'Content-Type: text/plain; charset=UTF-8',
];
mail($TO, "[$site] $form", implode("\n", $lines), implode("\r\n", $headers));

header('Location: /thanks/', true, 303);
