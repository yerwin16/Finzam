let transacciones = [];
let presupuesto = 0;

function actualizarBalance() {
    const balance = transacciones.reduce((acc, t) => {
        return t.tipo === 'Ingreso' ? acc + t.monto : acc - t.monto;
    }, 0);
    document.getElementById('balanceTotal').textContent = balance.toFixed(2);
}

function renderizarTransacciones() {
    const lista = document.getElementById('listaTransacciones');
    lista.innerHTML = '';
    transacciones.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<span>${t.tipo === 'Ingreso' ? '🟢' : '🔴'} ${t.descripcion}</span><span>$${t.monto.toFixed(2)}</span>`;
        lista.appendChild(li);
    });
}

document.getElementById('agregarTransaccion').addEventListener('click', () => {
    const tipo = document.getElementById('tipoTransaccion').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const monto = parseFloat(document.getElementById('monto').value);
    if (!descripcion || isNaN(monto) || monto <= 0) {
        Swal.fire('Error', 'Por favor, ingresa una descripción y un monto válido', 'error');
        return;
    }
    transacciones.push({ tipo, descripcion, monto });
    document.getElementById('descripcion').value = '';
    document.getElementById('monto').value = '';
    actualizarBalance();
    renderizarTransacciones();
    Swal.fire('¡Transacción agregada!', '', 'success');
});

document.getElementById('guardarPresupuesto').addEventListener('click', () => {
    const valor = parseFloat(document.getElementById('presupuesto').value);
    if (isNaN(valor) || valor <= 0) {
        Swal.fire('Error', 'Ingresa un presupuesto válido', 'error');
        return;
    }
    presupuesto = valor;
    Swal.fire('¡Presupuesto guardado!', '', 'success');
});

document.getElementById('borrarTodo').addEventListener('click', () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡Esto eliminará todas las transacciones y el presupuesto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            transacciones = [];
            presupuesto = 0;
            document.getElementById('presupuesto').value = '';
            actualizarBalance();
            renderizarTransacciones();
            Swal.fire('¡Datos borrados!', '', 'success');
        }
    });
});

document.getElementById('exportarExcel').addEventListener('click', () => {
    if (transacciones.length === 0) {
        Swal.fire('No hay datos', 'Agrega transacciones para exportar.', 'info');
        return;
    }
    const ws_data = [['Tipo', 'Descripción', 'Monto']].concat(
        transacciones.map(t => [t.tipo, t.descripcion, t.monto])
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
        doc.text(`${i+1}. ${t.tipo}: ${t.descripcion} - $${t.monto.toFixed(2)}`, 10, y);
        y += 10;
    });
    doc.save('finanzas.pdf');
});

// Inicializar
actualizarBalance();
renderizarTransacciones();
