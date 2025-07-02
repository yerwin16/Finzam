<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Cuenta {
    private $conn;
    private $table_name = "cuentas_bancarias";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function listar($usuario_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE usuario_id = :usuario_id AND activa = 1 ORDER BY nombre";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear($data) {
        $query = "INSERT INTO " . $this->table_name . " (nombre, tipo, saldo_inicial, saldo_actual, usuario_id) VALUES (:nombre, :tipo, :saldo_inicial, :saldo_actual, :usuario_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nombre", $data['nombre']);
        $stmt->bindParam(":tipo", $data['tipo']);
        $stmt->bindParam(":saldo_inicial", $data['saldo_inicial']);
        $stmt->bindParam(":saldo_actual", $data['saldo_actual']);
        $stmt->bindParam(":usuario_id", $data['usuario_id']);
        return $stmt->execute();
    }

    public function eliminar($id, $usuario_id) {
        $query = "UPDATE " . $this->table_name . " SET activa = 0 WHERE id = :id AND usuario_id = :usuario_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":usuario_id", $usuario_id);
        return $stmt->execute();
    }
}

$database = new Database();
$db = $database->getConnection();
$cuenta = new Cuenta($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        $result = $cuenta->listar($usuario_id);
        echo json_encode($result);
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $cuenta->crear($data);
        echo json_encode(["success" => $result]);
        break;
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        if ($id) {
            $result = $cuenta->eliminar($id, $usuario_id);
            echo json_encode(["success" => $result]);
        } else {
            echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
        }
        break;
}
?> 