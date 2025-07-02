-- Base de datos para Gestor de Finanzas Personales
CREATE DATABASE IF NOT EXISTS finanzas_personales;
USE finanzas_personales;

-- Tabla 1: Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla 2: Categorías
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    icono VARCHAR(50) DEFAULT 'fa-tag',
    color VARCHAR(7) DEFAULT '#007bff',
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla 3: Cuentas Bancarias
CREATE TABLE cuentas_bancarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('cuenta_corriente', 'cuenta_ahorro', 'tarjeta_credito', 'efectivo') NOT NULL,
    saldo_inicial DECIMAL(10,2) DEFAULT 0.00,
    saldo_actual DECIMAL(10,2) DEFAULT 0.00,
    usuario_id INT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla 4: Transacciones
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    fecha_transaccion DATE NOT NULL,
    categoria_id INT,
    cuenta_id INT,
    usuario_id INT,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla 5: Presupuestos
CREATE TABLE presupuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mes INT NOT NULL,
    año INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    monto_gastado DECIMAL(10,2) DEFAULT 0.00,
    usuario_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_presupuesto (usuario_id, mes, año)
);

-- Tabla 6: Objetivos Financieros
CREATE TABLE objetivos_financieros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    monto_objetivo DECIMAL(10,2) NOT NULL,
    monto_actual DECIMAL(10,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_limite DATE,
    usuario_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla 7: Metas de Ahorro
CREATE TABLE metas_ahorro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    monto_meta DECIMAL(10,2) NOT NULL,
    monto_actual DECIMAL(10,2) DEFAULT 0.00,
    porcentaje_completado DECIMAL(5,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_limite DATE,
    usuario_id INT,
    completada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, tipo, icono, color) VALUES
('Salario', 'ingreso', 'fa-money-bill-wave', '#28a745'),
('Freelance', 'ingreso', 'fa-laptop-code', '#17a2b8'),
('Inversiones', 'ingreso', 'fa-chart-line', '#ffc107'),
('Alimentación', 'gasto', 'fa-utensils', '#dc3545'),
('Transporte', 'gasto', 'fa-car', '#6f42c1'),
('Vivienda', 'gasto', 'fa-home', '#fd7e14'),
('Entretenimiento', 'gasto', 'fa-gamepad', '#e83e8c'),
('Salud', 'gasto', 'fa-heartbeat', '#20c997'),
('Educación', 'gasto', 'fa-graduation-cap', '#6c757d'),
('Otros', 'gasto', 'fa-tag', '#6c757d'); 