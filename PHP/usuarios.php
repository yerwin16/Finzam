<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Registro de usuario
    public function registrar($data) {
        $query = "INSERT INTO " . $this->table_name . " (nombre, email, password) VALUES (:nombre, :email, :password)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nombre", $data['nombre']);
        $stmt->bindParam(":email", $data['email']);
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
        $stmt->bindParam(":password", $passwordHash);
        try {
            $stmt->execute();
            return $this->conn->lastInsertId();
        } catch (PDOException $e) {
            return false;
        }
    }

    // Login de usuario
    public function login($data) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :email AND activo = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $data['email']);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        if($usuario && password_verify($data['password'], $usuario['password'])) {
            unset($usuario['password']);
            return $usuario;
        }
        return false;
    }
}

$database = new Database();
$db = $database->getConnection();
$usuario = new Usuario($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if(isset($_GET['action']) && $_GET['action'] === 'login') {
            $result = $usuario->login($data);
            if($result) {
                echo json_encode(["success" => true, "usuario" => $result]);
            } else {
                echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
            }
        } else {
            $result = $usuario->registrar($data);
            if($result) {
                echo json_encode(["success" => true, "id" => $result]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al registrar usuario o email ya registrado"]);
            }
        }
        break;
}
?> 