<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Categoria {
    private $conn;
    private $table_name = "categorias";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Leer categorías
    public function leer($tipo = null) {
        $query = "SELECT * FROM " . $this->table_name;
        if($tipo) {
            $query .= " WHERE tipo = :tipo";
        }
        $query .= " ORDER BY nombre";
        
        $stmt = $this->conn->prepare($query);
        if($tipo) {
            $stmt->bindParam(":tipo", $tipo);
        }
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Crear categoría
    public function crear($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nombre, tipo, icono, color, usuario_id) 
                  VALUES (:nombre, :tipo, :icono, :color, :usuario_id)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":nombre", $data['nombre']);
        $stmt->bindParam(":tipo", $data['tipo']);
        $stmt->bindParam(":icono", $data['icono']);
        $stmt->bindParam(":color", $data['color']);
        $stmt->bindParam(":usuario_id", $data['usuario_id']);
        
        return $stmt->execute();
    }
}

$database = new Database();
$db = $database->getConnection();
$categoria = new Categoria($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;
        $result = $categoria->leer($tipo);
        echo json_encode($result);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $categoria->crear($data);
        echo json_encode(["success" => $result]);
        break;
}
?> 