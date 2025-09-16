<?php
header('Content-Type: application/json');

$secret = "ES_2ccaf8d88af4428badf19a4689da4680";
$token  = $_POST['h-captcha-response'] ?? '';

if (!$token) {
  echo json_encode(['success' => false, 'message' => 'Missing captcha']);
  exit;
}

$response = file_get_contents("https://hcaptcha.com/siteverify?secret={$secret}&response={$token}");
$result = json_decode($response, true);

if (!empty($result['success'])) {
  echo json_encode(['success' => true]);
} else {
  echo json_encode(['success' => false, 'message' => 'Invalid captcha']);
}
