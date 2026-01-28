<?php
// ============================================
// AVOCADO - Backend API
// Main API file that handles user registration, login, and other requests
// ============================================

// Load environment variables from .env file
$env_file = __DIR__ . '/../.env';
if (file_exists($env_file)) {
  $env_lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($env_lines as $line) {
    if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
      [$key, $value] = explode('=', $line, 2);
      putenv(trim($key) . '=' . trim($value));
    }
  }
}

// Set response format to JSON (all responses will be JSON)
header('Content-Type: application/json');
// Allow requests from any origin (frontend can be on different domain)
header('Access-Control-Allow-Origin: *');
// Allow different HTTP methods (GET, POST, etc)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
// Allow specific headers in requests
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Database connection settings from environment variables
// Change these values if your database is on a different server
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');     // Where the database is located
define('DB_USER', getenv('DB_USER') ?: '');              // Username to connect to database
define('DB_PASS', getenv('DB_PASS') ?: '');              // Password for the database user
define('DB_NAME', getenv('DB_NAME') ?: 'avocado_db');    // Name of the database

try {
  // Try to connect to the MySQL database
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  
  // If connection fails, show error
  if ($conn->connect_error) {
    throw new Exception('Database connection failed: ' . $conn->connect_error);
  }
  
  // Use UTF-8 encoding for special characters in database
  $conn->set_charset('utf8mb4');
} catch (Exception $e) {
  // If something goes wrong, send error message back to frontend
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
  exit;
}

// Get the type of request (GET, POST, PUT, DELETE)
$request_method = $_SERVER['REQUEST_METHOD'];
// Get which API feature is being requested (e.g., 'auth', 'marketplace')
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
// Get what action to perform (e.g., 'register', 'login')
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Handle CORS preflight request (browser sends this before actual request)
if ($request_method === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Get the data sent from frontend as JSON and convert it to PHP array
$input = json_decode(file_get_contents('php://input'), true);

// ============ AUTHENTICATION ============

// Handle user registration (when someone creates a new account)
if ($endpoint === 'auth' && $action === 'register' && $request_method === 'POST') {
  // Get the data sent from frontend and clean it to prevent SQL injection
  $name = $conn->real_escape_string($input['name'] ?? '');
  $personal_email = $conn->real_escape_string($input['personal_email'] ?? '');
  $uni_email = $conn->real_escape_string($input['uni_email'] ?? '');
  $password = $input['password'] ?? '';
  
  // Check if all required fields are provided
  if (empty($name) || empty($personal_email) || empty($uni_email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
  }
  
  // Check if email format is valid
  if (!filter_var($uni_email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
  }
  
  // Check if university email contains .edu domain
  if (!preg_match('/\.edu/i', $uni_email)) {
    http_response_code(400);
    echo json_encode(['error' => 'University email must contain .edu domain']);
    exit;
  }
  
  // Password must be at least 6 characters long
  if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
  }
  
  // Check if user with this email already exists
  $check = $conn->query("SELECT user_id FROM users WHERE personal_email='$personal_email' OR uni_email='$uni_email'");
  if ($check->num_rows > 0) {
    http_response_code(400);
    echo json_encode(['error' => 'User with this email already exists']);
    exit;
  }
  
  // Convert password to hash (encrypted form) for security
  $password_hash = password_hash($password, PASSWORD_BCRYPT);
  // Create a unique token for email verification
  $verification_token = bin2hex(random_bytes(16));
  
  // Prepare SQL statement with placeholders (? marks) to safely insert data
  $stmt = $conn->prepare("INSERT INTO users (name, personal_email, uni_email, password_hash, verification_token, avatar_color) VALUES (?, ?, ?, ?, ?, ?)");
  // Pick a random color for the user's avatar
  $avatar_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  $avatar_color = $avatar_colors[array_rand($avatar_colors)];
  
  // Bind the variables to the SQL statement (s = string type)
  $stmt->bind_param('ssssss', $name, $personal_email, $uni_email, $password_hash, $verification_token, $avatar_color);
  
  if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
      'message' => 'User registered successfully',
      'user_id' => $stmt->insert_id,
      'verification_token' => $verification_token,
      'uni_email' => $uni_email
    ]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $stmt->error]);
  }
  exit;
}

// Login
if ($endpoint === 'auth' && $action === 'login' && $request_method === 'POST') {
  $email = $conn->real_escape_string($input['email'] ?? '');
  $password = $input['password'] ?? '';
  
  if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing email or password']);
    exit;
  }
  
  $result = $conn->query("SELECT user_id, name, personal_email, uni_email, password_hash, is_verified, role_id FROM users WHERE personal_email='$email'");
  
  if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
  }
  
  $user = $result->fetch_assoc();
  
  if (!password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
  }
  
  if (!$user['is_verified']) {
    http_response_code(403);
    echo json_encode(['error' => 'Please verify your email first']);
    exit;
  }
  
  // Generate JWT token (simplified)
  $token = base64_encode(json_encode([
    'user_id' => $user['user_id'],
    'email' => $user['personal_email'],
    'iat' => time()
  ]));
  
  http_response_code(200);
  echo json_encode([
    'message' => 'Login successful',
    'token' => $token,
    'user' => [
      'user_id' => $user['user_id'],
      'name' => $user['name'],
      'email' => $user['personal_email'],
      'uni_email' => $user['uni_email'],
      'role_id' => $user['role_id']
    ]
  ]);
  exit;
}

// Verify email
if ($endpoint === 'auth' && $action === 'verify' && $request_method === 'POST') {
  $token = $conn->real_escape_string($input['token'] ?? '');
  
  $stmt = $conn->prepare("UPDATE users SET is_verified = TRUE, verification_date = NOW() WHERE verification_token = ?");
  $stmt->bind_param('s', $token);
  
  if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
      http_response_code(200);
      echo json_encode(['message' => 'Email verified successfully']);
    } else {
      http_response_code(400);
      echo json_encode(['error' => 'Invalid verification token']);
    }
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Verification failed']);
  }
  exit;
}

// ============ MARKETPLACE ============

// Get all marketplace items
if ($endpoint === 'marketplace' && $action === 'items' && $request_method === 'GET') {
  $category = $conn->real_escape_string($_GET['category'] ?? '');
  $type = $conn->real_escape_string($_GET['type'] ?? '');
  $limit = min(intval($_GET['limit'] ?? 50), 100);
  $offset = intval($_GET['offset'] ?? 0);
  
  $query = "SELECT m.*, u.name as seller_name FROM marketplace_items m JOIN users u ON m.owner_id = u.user_id WHERE m.is_active = TRUE";
  
  if (!empty($category)) {
    $query .= " AND m.category = '$category'";
  }
  
  if (!empty($type)) {
    $query .= " AND m.item_type = '$type'";
  }
  
  $query .= " ORDER BY m.created_at DESC LIMIT $limit OFFSET $offset";
  
  $result = $conn->query($query);
  $items = [];
  
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }
  
  http_response_code(200);
  echo json_encode(['items' => $items, 'count' => count($items)]);
  exit;
}

// Post new item
if ($endpoint === 'marketplace' && $action === 'create' && $request_method === 'POST') {
  // Check authorization (token required)
  $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (empty($auth_header)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
  }
  
  $owner_id = intval($input['owner_id'] ?? 0);
  $title = $conn->real_escape_string($input['title'] ?? '');
  $description = $conn->real_escape_string($input['description'] ?? '');
  $category = $conn->real_escape_string($input['category'] ?? '');
  $item_type = $conn->real_escape_string($input['item_type'] ?? '');
  $price = floatval($input['price'] ?? 0);
  $condition = $conn->real_escape_string($input['condition'] ?? 'Good');
  $dorm_location = $conn->real_escape_string($input['dorm_location'] ?? '');
  
  $stmt = $conn->prepare("INSERT INTO marketplace_items (owner_id, title, description, category, item_type, price, condition, dorm_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  $stmt->bind_param('issssdss', $owner_id, $title, $description, $category, $item_type, $price, $condition, $dorm_location);
  
  if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
      'message' => 'Item created successfully',
      'item_id' => $stmt->insert_id
    ]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create item']);
  }
  exit;
}

// ============ DIRECT MESSAGES ============

// Get messages for conversation
if ($endpoint === 'messages' && $action === 'get' && $request_method === 'GET') {
  $user_id = intval($_GET['user_id'] ?? 0);
  $other_user_id = intval($_GET['other_user_id'] ?? 0);
  
  if ($user_id <= 0 || $other_user_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user IDs']);
    exit;
  }
  
  $query = "SELECT * FROM direct_messages WHERE (sender_id = $user_id AND receiver_id = $other_user_id) OR (sender_id = $other_user_id AND receiver_id = $user_id) ORDER BY created_at ASC LIMIT 100";
  
  $result = $conn->query($query);
  $messages = [];
  
  while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
  }
  
  // Mark as read
  $conn->query("UPDATE direct_messages SET is_read = TRUE, read_at = NOW() WHERE receiver_id = $user_id AND sender_id = $other_user_id");
  
  http_response_code(200);
  echo json_encode(['messages' => $messages]);
  exit;
}

// Send message
if ($endpoint === 'messages' && $action === 'send' && $request_method === 'POST') {
  $sender_id = intval($input['sender_id'] ?? 0);
  $receiver_id = intval($input['receiver_id'] ?? 0);
  $message_content = $conn->real_escape_string($input['message'] ?? '');
  $item_id = intval($input['item_id'] ?? 0);
  
  if ($sender_id <= 0 || $receiver_id <= 0 || empty($message_content)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
  }
  
  $item_id_val = ($item_id > 0) ? $item_id : NULL;
  
  $stmt = $conn->prepare("INSERT INTO direct_messages (sender_id, receiver_id, item_id, message_content) VALUES (?, ?, ?, ?)");
  $stmt->bind_param('iiis', $sender_id, $receiver_id, $item_id_val, $message_content);
  
  if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
      'message' => 'Message sent',
      'message_id' => $stmt->insert_id
    ]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send message']);
  }
  exit;
}

// ============ RENTAL REMINDERS (Cron job endpoint) ============

if ($endpoint === 'cron' && $action === 'send_reminders' && $request_method === 'GET') {
  // Verify API key (add your own security)
  $api_key = $_GET['api_key'] ?? '';
  $expected_key = getenv('CRON_API_KEY');
  if (empty($api_key) || $api_key !== $expected_key) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
  }
  
  // Get rentals due tomorrow
  $result = $conn->query("SELECT * FROM upcoming_reminders_view");
  $sent_count = 0;
  
  while ($rental = $result->fetch_assoc()) {
    // Send email to borrower
    $to = $rental['uni_email'];
    $subject = 'Rental Due Reminder - ' . $rental['title'];
    $message = "Your rental of '{$rental['title']}' is due on {$rental['rental_due_date']}. Please return it on time.";
    
    // TODO: Implement proper email sending (using PHPMailer or similar)
    // mail($to, $subject, $message);
    
    // Mark reminder as sent
    $conn->query("UPDATE rentals SET reminder_sent = TRUE WHERE rental_id = {$rental['rental_id']}");
    $sent_count++;
  }
  
  http_response_code(200);
  echo json_encode(['message' => "Reminders sent: $sent_count"]);
  exit;
}

// Default 404
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);

$conn->close();
?>
