<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Transaccion {
    private $conn;
    private $table_name = "transacciones";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear transacción
    public function crear($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (descripcion, monto, tipo, fecha_transaccion, categoria_id, cuenta_id, usuario_id, notas) 
                  VALUES (:descripcion, :monto, :tipo, :fecha_transaccion, :categoria_id, :cuenta_id, :usuario_id, :notas)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":descripcion", $data['descripcion']);
        $stmt->bindParam(":monto", $data['monto']);
        $stmt->bindParam(":tipo", $data['tipo']);
        $stmt->bindParam(":fecha_transaccion", $data['fecha_transaccion']);
        $stmt->bindParam(":categoria_id", $data['categoria_id']);
        $stmt->bindParam(":cuenta_id", $data['cuenta_id']);
        $stmt->bindParam(":usuario_id", $data['usuario_id']);
        $stmt->bindParam(":notas", $data['notas']);
        
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Leer transacciones
    public function leer($usuario_id) {
        $query = "SELECT t.*, c.nombre as categoria_nombre, cb.nombre as cuenta_nombre 
                  FROM " . $this->table_name . " t
                  LEFT JOIN categorias c ON t.categoria_id = c.id
                  LEFT JOIN cuentas_bancarias cb ON t.cuenta_id = cb.id
                  WHERE t.usuario_id = :usuario_id 
                  ORDER BY t.fecha_transaccion DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Actualizar transacción
    public function actualizar($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET descripcion = :descripcion, monto = :monto, tipo = :tipo, 
                      fecha_transaccion = :fecha_transaccion, categoria_id = :categoria_id, 
                      cuenta_id = :cuenta_id, notas = :notas 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":descripcion", $data['descripcion']);
        $stmt->bindParam(":monto", $data['monto']);
        $stmt->bindParam(":tipo", $data['tipo']);
        $stmt->bindParam(":fecha_transaccion", $data['fecha_transaccion']);
        $stmt->bindParam(":categoria_id", $data['categoria_id']);
        $stmt->bindParam(":cuenta_id", $data['cuenta_id']);
        $stmt->bindParam(":notas", $data['notas']);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
    }

    // Eliminar transacción
    public function eliminar($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Obtener balance
    public function obtenerBalance($usuario_id) {
        $query = "SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos
                  FROM " . $this->table_name . " 
                  WHERE usuario_id = :usuario_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

// Manejar requests
$database = new Database();
$db = $database->getConnection();
$transaccion = new Transaccion($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        $result = $transaccion->leer($usuario_id);
        echo json_encode($result);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $transaccion->crear($data);
        if($result) {
            echo json_encode(["success" => true, "id" => $result]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al crear transacción"]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if($id) {
            $result = $transaccion->actualizar($id, $data);
            echo json_encode(["success" => $result]);
        } else {
            echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
        }
        break;
        
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if($id) {
            $result = $transaccion->eliminar($id);
            echo json_encode(["success" => $result]);
        } else {
            echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
        }
        break;
}
?> 