<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Objetivo {
    private $conn;
    private $table_name = "objetivos_financieros";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function listar($usuario_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE usuario_id = :usuario_id AND activo = 1 ORDER BY fecha_limite";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear($data) {
        $query = "INSERT INTO " . $this->table_name . " (nombre, descripcion, monto_objetivo, monto_actual, fecha_inicio, fecha_limite, usuario_id) VALUES (:nombre, :descripcion, :monto_objetivo, :monto_actual, :fecha_inicio, :fecha_limite, :usuario_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nombre", $data['nombre']);
        $stmt->bindParam(":descripcion", $data['descripcion']);
        $stmt->bindParam(":monto_objetivo", $data['monto_objetivo']);
        $stmt->bindParam(":monto_actual", $data['monto_actual']);
        $stmt->bindParam(":fecha_inicio", $data['fecha_inicio']);
        $stmt->bindParam(":fecha_limite", $data['fecha_limite']);
        $stmt->bindParam(":usuario_id", $data['usuario_id']);
        return $stmt->execute();
    }

    public function eliminar($id, $usuario_id) {
        $query = "UPDATE " . $this->table_name . " SET activo = 0 WHERE id = :id AND usuario_id = :usuario_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":usuario_id", $usuario_id);
        return $stmt->execute();
    }
}

$database = new Database();
$db = $database->getConnection();
$objetivo = new Objetivo($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        $result = $objetivo->listar($usuario_id);
        echo json_encode($result);
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $objetivo->crear($data);
        echo json_encode(["success" => $result]);
        break;
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        if ($id) {
            $result = $objetivo->eliminar($id, $usuario_id);
            echo json_encode(["success" => $result]);
        } else {
            echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
        }
        break;
}
?> 