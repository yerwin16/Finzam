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

// --- Vista de Transacciones Mejorada ---
function cargarVistaTransacciones() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body position-relative">
                        <div id="tooltipSinCuentas" style="display:none;position:absolute;top:-40px;left:0;right:0;z-index:10;text-align:center;">
                            <span class="badge bg-warning text-dark p-2 shadow">Ingrese una cuenta en la sección "Cuentas"</span>
                        </div>
                        <h4 class="mb-3"><i class="fa fa-exchange-alt text-primary"></i> Transacciones</h4>
                        <form id="formTransaccion" class="row g-2 mb-3">
                            <div class="col-4">
                                <select id="cuentaTransaccion" class="form-select"></select>
                            </div>
                            <div class="col-4">
                                <select id="tipoTransaccion" class="form-select">
                                    <option value="gasto">Gasto</option>
                                    <option value="ingreso">Ingreso</option>
                                </select>
                            </div>
                            <div class="col-4">
                                <select id="categoriaTransaccion" class="form-select"></select>
                            </div>
                            <div class="col-12">
                                <input id="descripcion" class="form-control mb-2" placeholder="Descripción de la transacción">
                            </div>
                            <div class="col-12">
                                <input id="monto" class="form-control mb-2" placeholder="Monto en pesos" type="number" min="0" step="0.01">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-success w-100"><i class="fa fa-plus"></i> Agregar Transacción</button>
                            </div>
                        </form>
                        <h5 class="mb-2"><i class="fa fa-clipboard-list"></i> Lista de Transacciones</h5>
                        <ul id="listaTransacciones" class="list-group mb-3"></ul>
                        <div class="mb-2"><span class="text-success"><i class="fa fa-money-bill-wave"></i> Balance total: $<span id="balanceTotal">0.00</span></span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarCuentasTransaccion();
    cargarCategoriasTransaccion();
    cargarTransacciones();
    document.getElementById('tipoTransaccion').onchange = cargarCategoriasTransaccion;
    document.getElementById('formTransaccion').onsubmit = function(e) {
        e.preventDefault();
        const tipo = document.getElementById('tipoTransaccion').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = parseFloat(document.getElementById('monto').value);
        const categoria_id = document.getElementById('categoriaTransaccion').value;
        const cuenta_id = document.getElementById('cuentaTransaccion').value;
        if (!descripcion || isNaN(monto) || monto <= 0 || !categoria_id || !cuenta_id) {
            Swal.fire('Error', 'Completa todos los campos correctamente', 'error');
            return;
        }
        const transaccionData = {
            descripcion,
            monto,
            tipo,
            fecha_transaccion: new Date().toISOString().split('T')[0],
            categoria_id,
            cuenta_id,
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
                cargarTransacciones();
                this.reset();
            } else {
                Swal.fire('Error', 'No se pudo agregar la transacción', 'error');
            }
        });
    };
}
function cargarCuentasTransaccion() {
    fetch(`PHP/cuentas.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('cuentaTransaccion');
            select.innerHTML = '';
            const tooltip = document.getElementById('tooltipSinCuentas');
            if (data.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Sin cuentas';
                select.appendChild(option);
                select.disabled = true;
                document.getElementById('formTransaccion').querySelectorAll('input, select, button').forEach(el => {
                    if (el.id !== 'cuentaTransaccion') el.disabled = true;
                });
                if (tooltip) tooltip.style.display = 'block';
            } else {
                select.disabled = false;
                document.getElementById('formTransaccion').querySelectorAll('input, select, button').forEach(el => {
                    el.disabled = false;
                });
                data.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;
                    option.textContent = c.nombre;
                    select.appendChild(option);
                });
                if (tooltip) tooltip.style.display = 'none';
            }
        });
}
function cargarCategoriasTransaccion() {
    const tipo = document.getElementById('tipoTransaccion').value;
    fetch(`PHP/categorias.php?tipo=${tipo}`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('categoriaTransaccion');
            select.innerHTML = '';
            data.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = c.nombre;
                select.appendChild(option);
            });
        });
    document.getElementById('tipoTransaccion').onchange = cargarCategoriasTransaccion;
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
                <div class="card shadow-sm mb-3" id="card-distribucion">
                    <div class="card-body">
                        <h5 class="card-title"><i class="fa fa-chart-pie text-info"></i> Distribución de gastos</h5>
                        <div id="distribucion-content">
                            <canvas id="chartDistribucion" height="120" style="display:none;"></canvas>
                            <div id="no-datos-distribucion" class="text-center text-muted" style="display:none;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                                <i class="fa fa-info-circle fa-2x mb-2"></i>
                                <span>No hay datos de gastos para mostrar</span>
                            </div>
                        </div>
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
        <div class="row g-4">
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fa fa-university text-secondary"></i> Cuentas</h6>
                        <ul id="dashboard-cuentas" class="list-group"></ul>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fa fa-flag-checkered text-secondary"></i> Objetivos</h6>
                        <ul id="dashboard-objetivos" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-12">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fa fa-history text-info"></i> Movimientos recientes</h6>
                        <ul id="dashboard-movimientos" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarDatosDashboard();
}

function cargarDatosDashboard() {
    fetch(`PHP/transacciones.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            window.transacciones = data;
            let ingresos = 0, gastos = 0;
            let categorias = {};
            let meses = {};
            window.transacciones.forEach(t => {
                if (t.tipo === 'ingreso') ingresos += parseFloat(t.monto);
                else gastos += parseFloat(t.monto);
                if (t.tipo === 'gasto' && t.categoria_nombre) {
                    if (!categorias[t.categoria_nombre]) categorias[t.categoria_nombre] = 0;
                    categorias[t.categoria_nombre] += parseFloat(t.monto);
                }
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
            if (window.chartDistribucion && typeof window.chartDistribucion.destroy === 'function') window.chartDistribucion.destroy();
            if (Object.keys(categorias).length > 0) {
                document.getElementById('chartDistribucion').style.display = '';
                document.getElementById('no-datos-distribucion').style.display = 'none';
                window.chartDistribucion = new Chart(ctx1, {
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
            } else {
                document.getElementById('chartDistribucion').style.display = 'none';
                document.getElementById('no-datos-distribucion').style.display = 'flex';
            }
            // Gráfica de evolución mensual
            const ctx2 = document.getElementById('chartEvolucion').getContext('2d');
            if (window.chartEvolucion && typeof window.chartEvolucion.destroy === 'function') window.chartEvolucion.destroy();
            const mesesLabels = Object.keys(meses).sort();
            window.chartEvolucion = new Chart(ctx2, {
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
            // Movimientos recientes
            const listaMov = document.getElementById('dashboard-movimientos');
            listaMov.innerHTML = '';
            if (window.transacciones.length === 0) {
                listaMov.innerHTML = '<li class="list-group-item text-center text-muted">Sin movimientos recientes</li>';
            } else {
                window.transacciones.slice(-5).reverse().forEach(t => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `<span><i class="fa ${t.tipo === 'ingreso' ? 'fa-arrow-down text-success' : 'fa-arrow-up text-danger'} me-2"></i>${t.descripcion} <span class="badge bg-light text-dark ms-2">${t.categoria_nombre || ''}</span></span><span>$${parseFloat(t.monto).toFixed(2)}</span>`;
                    listaMov.appendChild(li);
                });
            }
        });
    // Presupuesto
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();
    fetch(`PHP/presupuestos.php?usuario_id=${usuario.id}&mes=${mes}&ano=${ano}`)
        .then(res => res.json())
        .then(data => {
            let monto = 0;
            if (data && data.monto_total) monto = parseFloat(data.monto_total);
            document.getElementById('dashboard-presupuesto').textContent = `$${monto.toFixed(2)}`;
            // Barra de progreso
            let gastado = 0;
            if (window.transacciones) window.transacciones.forEach(t => { if (t.tipo === 'gasto') gastado += parseFloat(t.monto); });
            let porcentaje = monto > 0 ? Math.min(100, (gastado / monto) * 100) : 0;
            document.getElementById('dashboard-barra-presupuesto').style.width = porcentaje + '%';
            document.getElementById('dashboard-barra-presupuesto').textContent = porcentaje.toFixed(0) + '%';
            document.getElementById('dashboard-barra-presupuesto').className = 'progress-bar ' + (porcentaje > 90 ? 'bg-danger' : 'bg-success');
        });
    // Cuentas
    fetch(`PHP/cuentas.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('dashboard-cuentas');
            lista.innerHTML = '';
            if (data.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin cuentas registradas</li>';
            }
            data.forEach(c => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `<span><i class="fa fa-wallet me-2"></i>${c.nombre} <span class="badge bg-light text-dark ms-2">${c.tipo.replace('_', ' ')}</span></span><span>$${parseFloat(c.saldo_actual).toFixed(2)}</span>`;
                lista.appendChild(li);
            });
        });
    // Objetivos
    fetch(`PHP/objetivos.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('dashboard-objetivos');
            lista.innerHTML = '';
            if (data.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin objetivos registrados</li>';
            }
            data.forEach(o => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `<span><i class="fa fa-flag-checkered me-2"></i>${o.nombre}</span><span>$${parseFloat(o.monto_objetivo).toFixed(2)}</span>`;
                lista.appendChild(li);
            });
        });
}

// --- Vista de Cuentas ---
function cargarVistaCuentas() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h4 class="mb-3"><i class="fa fa-wallet text-primary"></i> Cuentas</h4>
                        <form id="formCuenta" class="row g-2 mb-3">
                            <div class="col-6">
                                <input type="text" class="form-control" id="cuentaNombre" placeholder="Nombre" required>
                            </div>
                            <div class="col-3">
                                <select class="form-select" id="cuentaTipo">
                                    <option value="cuenta_corriente">Corriente</option>
                                    <option value="cuenta_ahorro">Ahorro</option>
                                    <option value="tarjeta_credito">Tarjeta</option>
                                    <option value="efectivo">Efectivo</option>
                                </select>
                            </div>
                            <div class="col-3">
                                <input type="number" class="form-control" id="cuentaSaldo" placeholder="$ Inicial" min="0" step="0.01" required>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-success w-100"><i class="fa fa-plus"></i> Agregar Cuenta</button>
                            </div>
                        </form>
                        <ul id="listaCuentas" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarCuentas();
    document.getElementById('formCuenta').onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById('cuentaNombre').value;
        const tipo = document.getElementById('cuentaTipo').value;
        const saldo = parseFloat(document.getElementById('cuentaSaldo').value);
        fetch('PHP/cuentas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, tipo, saldo_inicial: saldo, saldo_actual: saldo, usuario_id: usuario.id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cargarCuentas();
                this.reset();
            } else {
                Swal.fire('Error', 'No se pudo agregar la cuenta', 'error');
            }
        });
    };
}
function cargarCuentas() {
    fetch(`PHP/cuentas.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('listaCuentas');
            lista.innerHTML = '';
            if (data.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin cuentas registradas</li>';
            }
            data.forEach(c => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `<span><i class="fa fa-wallet me-2"></i>${c.nombre} <span class="badge bg-light text-dark ms-2">${c.tipo.replace('_', ' ')}</span></span><span>$${parseFloat(c.saldo_actual).toFixed(2)} <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarCuenta(${c.id})"><i class='fa fa-trash'></i></button></span>`;
                lista.appendChild(li);
            });
        });
}
function eliminarCuenta(id) {
    fetch(`PHP/cuentas.php?id=${id}&usuario_id=${usuario.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => { if (data.success) cargarCuentas(); });
}

// --- Vista de Categorías ---
function cargarVistaCategorias() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h4 class="mb-3"><i class="fa fa-tags text-info"></i> Categorías</h4>
                        <form id="formCategoria" class="row g-2 mb-3">
                            <div class="col-8">
                                <input type="text" class="form-control" id="categoriaNombre" placeholder="Nombre de la categoría (ej: Alimentación)" required>
                            </div>
                            <div class="col-4">
                                <select class="form-select" id="categoriaTipo">
                                    <option value="gasto">Gasto</option>
                                    <option value="ingreso">Ingreso</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-success w-100"><i class="fa fa-plus"></i> Agregar Categoría</button>
                            </div>
                        </form>
                        <ul id="listaCategorias" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarCategorias();
    document.getElementById('formCategoria').onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById('categoriaNombre').value.trim();
        const tipo = document.getElementById('categoriaTipo').value;
        // Asignar icono automáticamente según el nombre
        let icono = 'fa-tag';
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('aliment')) icono = 'fa-utensils';
        else if (nombreLower.includes('educa')) icono = 'fa-graduation-cap';
        else if (nombreLower.includes('entreten')) icono = 'fa-film';
        else if (nombreLower.includes('salud')) icono = 'fa-heartbeat';
        else if (nombreLower.includes('transporte')) icono = 'fa-bus';
        else if (nombreLower.includes('vivienda') || nombreLower.includes('casa')) icono = 'fa-home';
        else if (nombreLower.includes('otros')) icono = 'fa-ellipsis-h';
        else if (tipo === 'ingreso') icono = 'fa-arrow-down';
        fetch('PHP/categorias.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, tipo, icono, color: '#10b981', usuario_id: usuario.id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cargarCategorias();
                this.reset();
            } else {
                Swal.fire('Error', 'No se pudo agregar la categoría', 'error');
            }
        });
    };
}
function cargarCategorias() {
    fetch(`PHP/categorias.php`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('listaCategorias');
            lista.innerHTML = '';
            if (data.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin categorías registradas</li>';
            }
            data.forEach(c => {
                let nombre = c.nombre;
                try { nombre = decodeURIComponent(escape(nombre)); } catch(e) {}
                nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `<span><i class="fa ${c.icono} me-2"></i>${nombre} <span class="badge bg-light text-dark ms-2">${c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)}</span></span>`;
                lista.appendChild(li);
            });
        });
}

// --- Vista de Objetivos ---
function cargarVistaObjetivos() {
    document.getElementById('main-content').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h4 class="mb-3"><i class="fa fa-flag-checkered text-secondary"></i> Objetivos financieros</h4>
                        <form id="formObjetivo" class="row g-2 mb-3">
                            <div class="col-6">
                                <input type="text" class="form-control" id="objetivoNombre" placeholder="Nombre" required>
                            </div>
                            <div class="col-6">
                                <input type="number" class="form-control" id="objetivoMonto" placeholder="Monto objetivo" min="0" step="0.01" required>
                            </div>
                            <div class="col-12">
                                <input type="text" class="form-control mb-2" id="objetivoDescripcion" placeholder="Descripción (opcional)">
                            </div>
                            <div class="col-6">
                                <input type="date" class="form-control" id="objetivoFechaLimite" placeholder="Fecha límite">
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-success w-100"><i class="fa fa-plus"></i> Agregar Objetivo</button>
                            </div>
                        </form>
                        <ul id="listaObjetivos" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    cargarObjetivos();
    document.getElementById('formObjetivo').onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById('objetivoNombre').value;
        const descripcion = document.getElementById('objetivoDescripcion').value;
        const monto_objetivo = parseFloat(document.getElementById('objetivoMonto').value);
        const fecha_limite = document.getElementById('objetivoFechaLimite').value;
        fetch('PHP/objetivos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion, monto_objetivo, monto_actual: 0, fecha_inicio: new Date().toISOString().split('T')[0], fecha_limite, usuario_id: usuario.id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cargarObjetivos();
                this.reset();
            } else {
                Swal.fire('Error', 'No se pudo agregar el objetivo', 'error');
            }
        });
    };
}
function cargarObjetivos() {
    fetch(`PHP/objetivos.php?usuario_id=${usuario.id}`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('listaObjetivos');
            lista.innerHTML = '';
            if (data.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-center text-muted">Sin objetivos registrados</li>';
            }
            data.forEach(o => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `<span><i class="fa fa-flag-checkered me-2"></i>${o.nombre} <span class="badge bg-light text-dark ms-2">$${parseFloat(o.monto_objetivo).toFixed(2)}</span></span><button class="btn btn-sm btn-outline-danger" onclick="eliminarObjetivo(${o.id})"><i class='fa fa-trash'></i></button>`;
                lista.appendChild(li);
            });
        });
}
function eliminarObjetivo(id) {
    fetch(`PHP/objetivos.php?id=${id}&usuario_id=${usuario.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => { if (data.success) cargarObjetivos(); });
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
    document.getElementById('nav-dashboard').onclick = function() { cargarVistaDashboard(); activarNav('nav-dashboard'); };
    document.getElementById('nav-transacciones').onclick = function() { cargarVistaTransacciones(); activarNav('nav-transacciones'); };
    document.getElementById('nav-presupuesto').onclick = function() { cargarVistaPresupuesto(); activarNav('nav-presupuesto'); };
    document.getElementById('nav-cuentas').onclick = function() { cargarVistaCuentas(); activarNav('nav-cuentas'); };
    document.getElementById('nav-categorias').onclick = function() { cargarVistaCategorias(); activarNav('nav-categorias'); };
    document.getElementById('nav-objetivos').onclick = function() { cargarVistaObjetivos(); activarNav('nav-objetivos'); };
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