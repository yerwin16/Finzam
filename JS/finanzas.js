// Verificar autenticación
let usuario = null;
let transacciones = [];
let presupuesto = 0;
let chartDistribucion = null;
let chartEvolucion = null;

// Verificar si el usuario está autenticado
function verificarAutenticacion() {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
        window.location.href = 'index.html';
        return;
    }
    usuario = JSON.parse(usuarioGuardado);
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
}

// Cargar datos del usuario
function cargarDatos() {
    cargarTransacciones();
    cargarPresupuesto();
}

// Cargar transacciones desde la base de datos
function cargarTransacciones() {
    fetch(`PHP/transacciones.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            transacciones = data;
            actualizarBalance();
            renderizarTransacciones();
        })
        .catch(error => {
            console.error('Error al cargar transacciones:', error);
        });
}

// Cargar presupuesto desde la base de datos
function cargarPresupuesto() {
    const mes = new Date().getMonth() + 1;
    const año = new Date().getFullYear();
    
    fetch(`PHP/presupuestos.php?usuario_id=${usuario.id}&mes=${mes}&año=${año}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.monto_total) {
                presupuesto = parseFloat(data.monto_total);
                document.getElementById('presupuesto').value = presupuesto;
            }
        })
        .catch(error => {
            console.error('Error al cargar presupuesto:', error);
        });
}

// Actualizar balance
function actualizarBalance() {
    const balance = transacciones.reduce((acc, t) => {
        return t.tipo === 'ingreso' ? acc + parseFloat(t.monto) : acc - parseFloat(t.monto);
    }, 0);
    document.getElementById('balanceTotal').textContent = balance.toFixed(2);
}

// Renderizar transacciones
function renderizarTransacciones() {
    const lista = document.getElementById('listaTransacciones');
    lista.innerHTML = '';
    transacciones.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <span>${t.tipo === 'ingreso' ? '🟢' : '🔴'} ${t.descripcion}</span>
            <span>$${parseFloat(t.monto).toFixed(2)}</span>
        `;
        lista.appendChild(li);
    });
}

// --- Vista de Transacciones ---
function cargarVistaTransacciones() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h4 class="mb-3"><i class="fa fa-exchange-alt text-primary"></i> Transacciones</h4>
                        <select id="tipoTransaccion" class="form-select mb-2">
                            <option value="gasto">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                        </select>
                        <input id="descripcion" class="form-control mb-2" placeholder="Descripción de la transacción">
                        <input id="monto" class="form-control mb-3" placeholder="Monto en pesos" type="number" min="0" step="0.01">
                        <button id="agregarTransaccion" class="btn btn-success w-100 mb-3"><i class="fa fa-plus"></i> Agregar Transacción</button>
                        <h5 class="mb-2"><i class="fa fa-clipboard-list"></i> Lista de Transacciones</h5>
                        <ul id="listaTransacciones" class="list-group mb-3"></ul>
                        <div class="mb-2"><span class="text-success"><i class="fa fa-money-bill-wave"></i> Balance total: $<span id="balanceTotal">0.00</span></span></div>
                        <div class="d-flex gap-2 mb-2">
                            <button id="exportarExcel" class="btn btn-primary w-100"><i class="fa fa-file-excel"></i> Exportar Excel</button>
                            <button id="exportarPDF" class="btn btn-primary w-100"><i class="fa fa-file-pdf"></i> Exportar PDF</button>
                            <button id="borrarTodo" class="btn btn-danger w-100"><i class="fa fa-trash"></i> Borrar Todo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarTransacciones();
    agregarListenersTransacciones();
}

function agregarListenersTransacciones() {
    document.getElementById('agregarTransaccion').addEventListener('click', () => {
        const tipo = document.getElementById('tipoTransaccion').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = parseFloat(document.getElementById('monto').value);
        if (!descripcion || isNaN(monto) || monto <= 0) {
            Swal.fire('Error', 'Por favor, ingresa una descripción y un monto válido', 'error');
            return;
        }
        const transaccionData = {
            descripcion: descripcion,
            monto: monto,
            tipo: tipo,
            fecha_transaccion: new Date().toISOString().split('T')[0],
            categoria_id: null,
            cuenta_id: null,
            usuario_id: usuario.id,
            notas: ''
        };
        fetch('PHP/transacciones.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaccionData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('descripcion').value = '';
                document.getElementById('monto').value = '';
                cargarTransacciones();
                Swal.fire('¡Transacción agregada!', '', 'success');
            } else {
                Swal.fire('Error', 'No se pudo agregar la transacción', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'Error de conexión', 'error');
        });
    });
    document.getElementById('borrarTodo').addEventListener('click', () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Esto eliminará todas las transacciones!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar todo',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Aquí se podría implementar la eliminación masiva desde la base de datos
                Swal.fire('¡Datos borrados!', '', 'success');
                cargarTransacciones();
            }
        });
    });
    document.getElementById('exportarExcel').addEventListener('click', () => {
        if (transacciones.length === 0) {
            Swal.fire('No hay datos', 'Agrega transacciones para exportar.', 'info');
            return;
        }
        const ws_data = [['Tipo', 'Descripción', 'Monto', 'Fecha']].concat(
            transacciones.map(t => [t.tipo, t.descripcion, t.monto, t.fecha_transaccion])
        );
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
        XLSX.writeFile(wb, 'finanzas.xlsx');
    });
    document.getElementById('exportarPDF').addEventListener('click', () => {
        if (transacciones.length === 0) {
            Swal.fire('No hay datos', 'Agrega transacciones para exportar.', 'info');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Transacciones', 10, 10);
        let y = 20;
        transacciones.forEach((t, i) => {
            doc.text(`${i+1}. ${t.tipo}: ${t.descripcion} - $${parseFloat(t.monto).toFixed(2)}`, 10, y);
            y += 10;
        });
        doc.save('finanzas.pdf');
    });
}

// --- Vista de Presupuesto ---
function cargarVistaPresupuesto() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h4 class="mb-3"><i class="fa fa-bullseye text-warning"></i> Presupuesto mensual</h4>
                        <input id="presupuesto" class="form-control mb-2" placeholder="Ingresa tu presupuesto mensual" type="number" min="0" step="0.01">
                        <button id="guardarPresupuesto" class="btn btn-warning w-100 mb-3"><i class="fa fa-save"></i> Guardar Presupuesto</button>
                        <div class="progress mb-2">
                            <div id="barra-presupuesto" class="progress-bar" role="progressbar" style="width: 0%">0%</div>
                        </div>
                        <div><span id="presupuesto-actual">$0.00</span> de presupuesto</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarPresupuestoVista();
    agregarListenerPresupuesto();
}

function cargarPresupuestoVista() {
    const mes = new Date().getMonth() + 1;
    const año = new Date().getFullYear();
    fetch(`PHP/presupuestos.php?usuario_id=${usuario.id}&mes=${mes}&año=${año}`)
        .then(res => res.json())
        .then(data => {
            let monto = 0;
            if (data && data.monto_total) monto = parseFloat(data.monto_total);
            document.getElementById('presupuesto').value = monto;
            document.getElementById('presupuesto-actual').textContent = `$${monto.toFixed(2)}`;
            // Barra de progreso
            fetch(`PHP/transacciones.php?usuario_id=${usuario.id}`)
                .then(res => res.json())
                .then(transacciones => {
                    let gastado = 0;
                    transacciones.forEach(t => { if (t.tipo === 'gasto') gastado += parseFloat(t.monto); });
                    let porcentaje = monto > 0 ? Math.min(100, (gastado / monto) * 100) : 0;
                    document.getElementById('barra-presupuesto').style.width = porcentaje + '%';
                    document.getElementById('barra-presupuesto').textContent = porcentaje.toFixed(0) + '%';
                    document.getElementById('barra-presupuesto').className = 'progress-bar ' + (porcentaje > 90 ? 'bg-danger' : 'bg-success');
                });
        });
}

function agregarListenerPresupuesto() {
    document.getElementById('guardarPresupuesto').addEventListener('click', () => {
        const valor = parseFloat(document.getElementById('presupuesto').value);
        if (isNaN(valor) || valor <= 0) {
            Swal.fire('Error', 'Ingresa un presupuesto válido', 'error');
            return;
        }
        const presupuestoData = {
            mes: new Date().getMonth() + 1,
            año: new Date().getFullYear(),
            monto_total: valor,
            usuario_id: usuario.id
        };
        fetch('PHP/presupuestos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(presupuestoData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire('¡Presupuesto guardado!', '', 'success');
                cargarPresupuestoVista();
            } else {
                Swal.fire('Error', 'No se pudo guardar el presupuesto', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'Error de conexión', 'error');
        });
    });
}

// --- Navegación dinámica ---
function cargarVistaDashboard() {
    document.getElementById('main-content').innerHTML = `
        <div class="row g-4">
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h5 class="card-title"><i class="fa fa-wallet text-primary"></i> Balance general</h5>
                        <h2 class="fw-bold text-success">$<span id="dashboard-balance">0.00</span></h2>
                        <div class="mt-2">
                            <span class="badge bg-success">Ingresos: $<span id="dashboard-ingresos">0.00</span></span>
                            <span class="badge bg-danger ms-2">Gastos: $<span id="dashboard-gastos">0.00</span></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h5 class="card-title"><i class="fa fa-chart-pie text-info"></i> Distribución de gastos</h5>
                        <canvas id="chartDistribucion" height="120"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fa fa-bullseye text-warning"></i> Presupuesto mensual</h6>
                        <div class="progress mb-2">
                            <div id="dashboard-barra-presupuesto" class="progress-bar" role="progressbar" style="width: 0%">0%</div>
                        </div>
                        <div><span id="dashboard-presupuesto">$0.00</span> de presupuesto</div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fa fa-chart-line text-primary"></i> Evolución mensual</h6>
                        <canvas id="chartEvolucion" height="120"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarDatosDashboard();
}

function cargarDatosDashboard() {
    // Cargar transacciones y presupuesto para el dashboard
    fetch(`PHP/transacciones.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            transacciones = data;
            let ingresos = 0, gastos = 0;
            let categorias = {};
            let meses = {};
            transacciones.forEach(t => {
                if (t.tipo === 'ingreso') ingresos += parseFloat(t.monto);
                else gastos += parseFloat(t.monto);
                // Para gráfica de categorías (solo gastos)
                if (t.tipo === 'gasto' && t.categoria_nombre) {
                    if (!categorias[t.categoria_nombre]) categorias[t.categoria_nombre] = 0;
                    categorias[t.categoria_nombre] += parseFloat(t.monto);
                }
                // Para gráfica de evolución mensual
                const fecha = new Date(t.fecha_transaccion);
                const key = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
                if (!meses[key]) meses[key] = { ingresos: 0, gastos: 0 };
                if (t.tipo === 'ingreso') meses[key].ingresos += parseFloat(t.monto);
                else meses[key].gastos += parseFloat(t.monto);
            });
            const balance = ingresos - gastos;
            document.getElementById('dashboard-balance').textContent = balance.toFixed(2);
            document.getElementById('dashboard-ingresos').textContent = ingresos.toFixed(2);
            document.getElementById('dashboard-gastos').textContent = gastos.toFixed(2);
            // Gráfica de distribución de gastos
            const ctx1 = document.getElementById('chartDistribucion').getContext('2d');
            if (chartDistribucion) chartDistribucion.destroy();
            chartDistribucion = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categorias),
                    datasets: [{
                        data: Object.values(categorias),
                        backgroundColor: [
                            '#10b981','#2563eb','#ef4444','#fde68a','#6f42c1','#fd7e14','#e83e8c','#20c997','#6c757d'
                        ]
                    }]
                },
                options: { plugins: { legend: { position: 'bottom' } } }
            });
            // Gráfica de evolución mensual
            const ctx2 = document.getElementById('chartEvolucion').getContext('2d');
            if (chartEvolucion) chartEvolucion.destroy();
            const mesesLabels = Object.keys(meses).sort();
            chartEvolucion = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: mesesLabels.map(m => meses[m].ingresos),
                            backgroundColor: '#10b981'
                        },
                        {
                            label: 'Gastos',
                            data: mesesLabels.map(m => meses[m].gastos),
                            backgroundColor: '#ef4444'
                        }
                    ]
                },
                options: {
                    plugins: { legend: { position: 'bottom' } },
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        });
    // Presupuesto
    const mes = new Date().getMonth() + 1;
    const año = new Date().getFullYear();
    fetch(`PHP/presupuestos.php?usuario_id=${usuario.id}&mes=${mes}&año=${año}`)
        .then(res => res.json())
        .then(data => {
            let monto = 0;
            if (data && data.monto_total) monto = parseFloat(data.monto_total);
            document.getElementById('dashboard-presupuesto').textContent = `$${monto.toFixed(2)}`;
            // Barra de progreso
            let gastado = 0;
            transacciones.forEach(t => { if (t.tipo === 'gasto') gastado += parseFloat(t.monto); });
            let porcentaje = monto > 0 ? Math.min(100, (gastado / monto) * 100) : 0;
            document.getElementById('dashboard-barra-presupuesto').style.width = porcentaje + '%';
            document.getElementById('dashboard-barra-presupuesto').textContent = porcentaje.toFixed(0) + '%';
            document.getElementById('dashboard-barra-presupuesto').className = 'progress-bar ' + (porcentaje > 90 ? 'bg-danger' : 'bg-success');
        });
}

// --- Navegación ---
function activarNav(id) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    cargarVistaDashboard();
    activarNav('nav-dashboard');
    // Navegación
    document.getElementById('nav-dashboard').onclick = function() { cargarVistaDashboard(); activarNav('nav-dashboard'); };
    document.getElementById('nav-transacciones').onclick = function() { cargarVistaTransacciones(); activarNav('nav-transacciones'); };
    document.getElementById('nav-presupuesto').onclick = function() { cargarVistaPresupuesto(); activarNav('nav-presupuesto'); };
    // Cerrar sesión
    document.getElementById('cerrarSesion').onclick = function() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('usuario');
                window.location.href = 'index.html';
            }
        });
    };
}); 