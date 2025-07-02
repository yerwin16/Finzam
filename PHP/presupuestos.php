<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Presupuesto {
    private $conn;
    private $table_name = "presupuestos";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear o actualizar presupuesto
    public function guardar($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (mes, año, monto_total, usuario_id) 
                  VALUES (:mes, :año, :monto_total, :usuario_id)
                  ON DUPLICATE KEY UPDATE monto_total = :monto_total";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":mes", $data['mes']);
        $stmt->bindParam(":año", $data['año']);
        $stmt->bindParam(":monto_total", $data['monto_total']);
        $stmt->bindParam(":usuario_id", $data['usuario_id']);
        
        return $stmt->execute();
    }

    // Leer presupuesto del mes actual
    public function leer($usuario_id, $mes = null, $año = null) {
        if(!$mes) $mes = date('n');
        if(!$año) $año = date('Y');
        
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE usuario_id = :usuario_id AND mes = :mes AND año = :año";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->bindParam(":mes", $mes);
        $stmt->bindParam(":año", $año);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Actualizar monto gastado
    public function actualizarGastado($usuario_id, $mes, $año, $monto_gastado) {
        $query = "UPDATE " . $this->table_name . " 
                  SET monto_gastado = :monto_gastado 
                  WHERE usuario_id = :usuario_id AND mes = :mes AND año = :año";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":monto_gastado", $monto_gastado);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->bindParam(":mes", $mes);
        $stmt->bindParam(":año", $año);
        
        return $stmt->execute();
    }

    // Obtener estadísticas del presupuesto
    public function obtenerEstadisticas($usuario_id, $mes = null, $año = null) {
        if(!$mes) $mes = date('n');
        if(!$año) $año = date('Y');
        
        $query = "SELECT p.*, 
                         (p.monto_total - p.monto_gastado) as disponible,
                         (p.monto_gastado / p.monto_total * 100) as porcentaje_usado
                  FROM " . $this->table_name . " p
                  WHERE p.usuario_id = :usuario_id AND p.mes = :mes AND p.año = :año";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->bindParam(":mes", $mes);
        $stmt->bindParam(":año", $año);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

$database = new Database();
$db = $database->getConnection();
$presupuesto = new Presupuesto($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        $mes = isset($_GET['mes']) ? $_GET['mes'] : null;
        $año = isset($_GET['año']) ? $_GET['año'] : null;
        
        if(isset($_GET['estadisticas'])) {
            $result = $presupuesto->obtenerEstadisticas($usuario_id, $mes, $año);
        } else {
            $result = $presupuesto->leer($usuario_id, $mes, $año);
        }
        echo json_encode($result);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $presupuesto->guardar($data);
        echo json_encode(["success" => $result]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : 1;
        $mes = isset($_GET['mes']) ? $_GET['mes'] : date('n');
        $año = isset($_GET['año']) ? $_GET['año'] : date('Y');
        
        $result = $presupuesto->actualizarGastado($usuario_id, $mes, $año, $data['monto_gastado']);
        echo json_encode(["success" => $result]);
        break;
}
?> 