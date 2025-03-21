// Constantes y variables globales
const API_URL = 'http://localhost:8080'; // Ajustar según la URL de tu API
let departamentoActual = null;
let departamentosPage = 0;
let empleadosPage = 0;

// Elementos DOM
const departamentosTable = document.getElementById('departamentosTable');
const empleadosTable = document.getElementById('empleadosTable');
const departamentoForm = document.getElementById('departamentoForm');
const empleadoForm = document.getElementById('empleadoForm');
const departamentosPagination = document.getElementById('departamentosPagination');
const empleadosPagination = document.getElementById('empleadosPagination');
const departamentoEmpleadosTable = document.getElementById('departamentoEmpleadosTable');
const empleadosDisponibles = document.getElementById('empleadosDisponibles');
const notificationToast = document.getElementById('notificationToast');
const notificationBody = document.getElementById('notificationBody');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Carga inicial de datos
    cargarDepartamentos();
    cargarEmpleados();

    // Event listeners
    departamentoForm.addEventListener('submit', guardarDepartamento);
    empleadoForm.addEventListener('submit', guardarEmpleado);
    document.getElementById('añadirEmpleadoExistente').addEventListener('click', añadirEmpleadoExistente);
    document.getElementById('nuevoEmpleadoForm').addEventListener('submit', crearYAñadirEmpleado);

    // Agregar evento para mostrar detalles del departamento
    departamentosTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-detalle')) {
            const id = e.target.dataset.id;
            mostrarDetalleDepartamento(id);
        } else if (e.target.classList.contains('btn-editar')) {
            const id = e.target.dataset.id;
            editarDepartamento(id);
        } else if (e.target.classList.contains('btn-eliminar')) {
            const id = e.target.dataset.id;
            eliminarDepartamento(id);
        }
    });

    // Agregar evento para acciones en la tabla de empleados
    empleadosTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-editar')) {
            const id = e.target.dataset.id;
            editarEmpleado(id);
        } else if (e.target.classList.contains('btn-eliminar')) {
            const id = e.target.dataset.id;
            eliminarEmpleado(id);
        }
    });

    // Eventos para la tabla de empleados del departamento
    departamentoEmpleadosTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-eliminar-empleado')) {
            const depId = departamentoActual;
            const empId = e.target.dataset.id;
            eliminarEmpleadoDeDepartamento(depId, empId);
        }
    });
});

// ---------- FUNCIONES PARA DEPARTAMENTOS ----------

// Cargar departamentos
function cargarDepartamentos(page = 0) {
    fetch(`${API_URL}/departamentos?page=${page}&size=5`)
        .then(response => response.json())
        .then(data => {
            renderizarDepartamentos(data);
            renderizarPaginacion(data, departamentosPagination, 'departamentos');
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar departamentos: ' + error.message, 'danger');
        });
}

// Renderizar departamentos en la tabla
function renderizarDepartamentos(data) {
    departamentosTable.innerHTML = '';
    data.content.forEach(departamento => {
        departamentosTable.innerHTML += `
            <tr>
                <td>${departamento.id}</td>
                <td>${departamento.nombre}</td>
                <td>${departamento.empleados ? departamento.empleados.length : 0}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-detalle" data-id="${departamento.id}">
                        <i class="fas fa-eye"></i> Detalles
                    </button>
                    <button class="btn btn-sm btn-warning btn-editar" data-id="${departamento.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${departamento.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

// Guardar departamento (crear o actualizar)
function guardarDepartamento(e) {
    e.preventDefault();
    
    const id = document.getElementById('departamentoId').value;
    const nombre = document.getElementById('departamentoNombreInput').value;
    const departamento = { nombre };
    
    let url = `${API_URL}/departamentos`;
    let method = 'POST';
    
    if (id) {
        url = `${API_URL}/departamentos/${id}`;
        method = 'PUT';
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(departamento)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al guardar el departamento');
        }
        return response.json();
    })
    .then(data => {
        mostrarNotificacion('Departamento guardado correctamente', 'success');
        cargarDepartamentos();
        bootstrap.Modal.getInstance(document.getElementById('departamentoModal')).hide();
    })
    .catch(error => {
        mostrarNotificacion('Error: ' + error.message, 'danger');
    });
}

// Editar departamento
function editarDepartamento(id) {
    fetch(`${API_URL}/departamentos/${id}`)
        .then(response => response.json())
        .then(departamento => {
            document.getElementById('departamentoId').value = departamento.id;
            document.getElementById('departamentoNombreInput').value = departamento.nombre;
            document.getElementById('departamentoModalLabel').textContent = 'Editar Departamento';
            
            const modal = new bootstrap.Modal(document.getElementById('departamentoModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar el departamento: ' + error.message, 'danger');
        });
}

// Eliminar departamento
function eliminarDepartamento(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
        fetch(`${API_URL}/departamentos/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el departamento');
            }
            mostrarNotificacion('Departamento eliminado correctamente', 'success');
            cargarDepartamentos();
        })
        .catch(error => {
            mostrarNotificacion('Error: ' + error.message, 'danger');
        });
    }
}

// Mostrar detalle de un departamento
function mostrarDetalleDepartamento(id) {
    fetch(`${API_URL}/departamentos/${id}`)
        .then(response => response.json())
        .then(departamento => {
            departamentoActual = departamento.id;
            document.getElementById('departamentoNombre').textContent = departamento.nombre;
            
            // Cargar empleados del departamento
            renderizarEmpleadosDeDepartamento(departamento.empleados || []);
            
            // Cargar empleados disponibles (sin departamento o en otro departamento)
            cargarEmpleadosDisponibles();
            
            const modal = new bootstrap.Modal(document.getElementById('departamentoDetalleModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar el departamento: ' + error.message, 'danger');
        });
}

// Renderizar empleados de un departamento
function renderizarEmpleadosDeDepartamento(empleados) {
    departamentoEmpleadosTable.innerHTML = '';
    
    if (empleados.length === 0) {
        departamentoEmpleadosTable.innerHTML = '<tr><td colspan="5" class="text-center">No hay empleados en este departamento</td></tr>';
        return;
    }
    
    empleados.forEach(empleado => {
        departamentoEmpleadosTable.innerHTML += `
            <tr>
                <td>${empleado.id}</td>
                <td>${empleado.nombre}</td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.email}</td>
                <td>
                    <button class="btn btn-sm btn-danger btn-eliminar-empleado" data-id="${empleado.id}">
                        <i class="fas fa-user-minus"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

// Cargar empleados disponibles para añadir a un departamento
function cargarEmpleadosDisponibles() {
    fetch(`${API_URL}/empleados?size=100`)
        .then(response => response.json())
        .then(data => {
            empleadosDisponibles.innerHTML = '<option value="">Seleccione un empleado...</option>';
            
            data.content.forEach(empleado => {
                // Filtrar empleados que no tienen departamento o tienen otro departamento
                if (!empleado.departamento || empleado.departamento.id !== departamentoActual) {
                    empleadosDisponibles.innerHTML += `
                        <option value="${empleado.id}">${empleado.nombre} ${empleado.apellidos}</option>
                    `;
                }
            });
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar empleados disponibles: ' + error.message, 'danger');
        });
}

// Añadir un empleado existente al departamento actual
function añadirEmpleadoExistente() {
    const empleadoId = empleadosDisponibles.value;
    
    if (!empleadoId) {
        mostrarNotificacion('Por favor, seleccione un empleado', 'warning');
        return;
    }
    
    fetch(`${API_URL}/departamentos/${departamentoActual}/empleados/${empleadoId}`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al añadir el empleado al departamento');
        }
        return response.json();
    })
    .then(data => {
        mostrarNotificacion('Empleado añadido al departamento correctamente', 'success');
        // Actualizar la vista
        renderizarEmpleadosDeDepartamento(data.empleados);
        cargarEmpleadosDisponibles();
    })
    .catch(error => {
        mostrarNotificacion('Error: ' + error.message, 'danger');
    });
}

// Crear nuevo empleado y añadirlo al departamento
function crearYAñadirEmpleado(e) {
    e.preventDefault();
    
    const nuevoEmpleado = {
        nombre: document.getElementById('nuevoEmpleadoNombre').value,
        apellidos: document.getElementById('nuevoEmpleadoApellidos').value,
        email: document.getElementById('nuevoEmpleadoEmail').value,
        fechaNacimiento: document.getElementById('nuevoEmpleadoFechaNacimiento').value
    };
    
    // Primero creamos el empleado
    fetch(`${API_URL}/empleados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoEmpleado)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al crear el empleado');
        }
        return response.json();
    })
    .then(empleado => {
        // Luego lo añadimos al departamento
        return fetch(`${API_URL}/departamentos/${departamentoActual}/empleados/${empleado.id}`, {
            method: 'POST'
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al añadir el empleado al departamento');
        }
        return response.json();
    })
    .then(departamento => {
        mostrarNotificacion('Empleado creado y añadido al departamento correctamente', 'success');
        // Limpiar formulario
        document.getElementById('nuevoEmpleadoForm').reset();
        // Actualizar la vista
        renderizarEmpleadosDeDepartamento(departamento.empleados);
        cargarEmpleadosDisponibles();
    })
    .catch(error => {
        mostrarNotificacion('Error: ' + error.message, 'danger');
    });
}

// Eliminar un empleado de un departamento
function eliminarEmpleadoDeDepartamento(depId, empId) {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado del departamento?')) {
        fetch(`${API_URL}/departamentos/${depId}/empleados/${empId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el empleado del departamento');
            }
            return response.json();
        })
        .then(departamento => {
            mostrarNotificacion('Empleado eliminado del departamento correctamente', 'success');
            // Actualizar la vista
            renderizarEmpleadosDeDepartamento(departamento.empleados);
            cargarEmpleadosDisponibles();
        })
        .catch(error => {
            mostrarNotificacion('Error: ' + error.message, 'danger');
        });
    }
}

// ---------- FUNCIONES PARA EMPLEADOS ----------

// Cargar empleados
function cargarEmpleados(page = 0) {
    fetch(`${API_URL}/empleados?page=${page}&size=5`)
        .then(response => response.json())
        .then(data => {
            renderizarEmpleados(data);
            renderizarPaginacion(data, empleadosPagination, 'empleados');
            // Actualizar departamentos en el select
            cargarDepartamentosSelect();
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar empleados: ' + error.message, 'danger');
        });
}

// Renderizar empleados en la tabla
function renderizarEmpleados(data) {
    empleadosTable.innerHTML = '';
    data.content.forEach(empleado => {
        empleadosTable.innerHTML += `
            <tr>
                <td>${empleado.id}</td>
                <td>${empleado.nombre}</td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.email}</td>
                <td>${formatearFecha(empleado.fechaNacimiento)}</td>
                <td>${empleado.departamento ? empleado.departamento.nombre : 'Sin departamento'}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-editar" data-id="${empleado.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${empleado.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

// Cargar departamentos para el select
function cargarDepartamentosSelect() {
    fetch(`${API_URL}/departamentos?size=100`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('empleadoDepartamento');
            select.innerHTML = '<option value="">Sin departamento</option>';
            
            data.content.forEach(departamento => {
                select.innerHTML += `
                    <option value="${departamento.id}">${departamento.nombre}</option>
                `;
            });
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar departamentos: ' + error.message, 'danger');
        });
}

// Guardar empleado (crear o actualizar)
function guardarEmpleado(e) {
    e.preventDefault();
    
    const id = document.getElementById('empleadoId').value;
    const nombre = document.getElementById('empleadoNombre').value;
    const apellidos = document.getElementById('empleadoApellidos').value;
    const email = document.getElementById('empleadoEmail').value;
    const fechaNacimiento = document.getElementById('empleadoFechaNacimiento').value;
    const departamentoId = document.getElementById('empleadoDepartamento').value;
    
    const empleado = {
        nombre,
        apellidos,
        email,
        fechaNacimiento,
        departamento: departamentoId ? { id: departamentoId } : null
    };
    
    let url = `${API_URL}/empleados`;
    let method = 'POST';
    
    if (id) {
        url = `${API_URL}/empleados/${id}`;
        method = 'PUT';
        empleado.id = id;
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(empleado)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al guardar el empleado');
        }
        return response.json();
    })
    .then(data => {
        mostrarNotificacion('Empleado guardado correctamente', 'success');
        cargarEmpleados();
        bootstrap.Modal.getInstance(document.getElementById('empleadoModal')).hide();
    })
    .catch(error => {
        mostrarNotificacion('Error: ' + error.message, 'danger');
    });
}

// Editar empleado
function editarEmpleado(id) {
    fetch(`${API_URL}/empleados/${id}`)
        .then(response => response.json())
        .then(empleado => {
            document.getElementById('empleadoId').value = empleado.id;
            document.getElementById('empleadoNombre').value = empleado.nombre;
            document.getElementById('empleadoApellidos').value = empleado.apellidos;
            document.getElementById('empleadoEmail').value = empleado.email;
            document.getElementById('empleadoFechaNacimiento').value = formatearFechaInput(empleado.fechaNacimiento);
            
            const departamentoSelect = document.getElementById('empleadoDepartamento');
            if (empleado.departamento) {
                // Buscar el departamento en el select
                const options = departamentoSelect.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].value == empleado.departamento.id) {
                        departamentoSelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                departamentoSelect.value = '';
            }
            
            document.getElementById('empleadoModalLabel').textContent = 'Editar Empleado';
            
            const modal = new bootstrap.Modal(document.getElementById('empleadoModal'));
            modal.show();
        })
        .catch(error => {
            mostrarNotificacion('Error al cargar el empleado: ' + error.message, 'danger');
        });
}

// Eliminar empleado
function eliminarEmpleado(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
        fetch(`${API_URL}/empleados/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el empleado');
            }
            mostrarNotificacion('Empleado eliminado correctamente', 'success');
            cargarEmpleados();
        })
        .catch(error => {
            mostrarNotificacion('Error: ' + error.message, 'danger');
        });
    }
}

// ---------- FUNCIONES AUXILIARES ----------

// Formatear fecha para mostrar
function formatearFecha(fechaString) {
    if (!fechaString) return '';
    
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString();
}

// Formatear fecha para input
function formatearFechaInput(fechaString) {
    if (!fechaString) return '';
    
    const fecha = new Date(fechaString);
    return fecha.toISOString().split('T')[0];
}

// Renderizar paginación
function renderizarPaginacion(data, paginationElement, tipo) {
    paginationElement.innerHTML = '';
    
    // Botón anterior
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${data.first ? 'disabled' : ''}`;
    prevButton.innerHTML = `<a class="page-link" href="#" aria-label="Anterior">
                              <span aria-hidden="true">&laquo;</span>
                            </a>`;
    
    if (!data.first) {
        prevButton.addEventListener('click', () => {
            if (tipo === 'departamentos') {
                departamentosPage--;
                cargarDepartamentos(departamentosPage);
            } else {
                empleadosPage--;
                cargarEmpleados(empleadosPage);
            }
        });
    }
    
    paginationElement.appendChild(prevButton);
    
    // Páginas
    for (let i = 0; i < data.totalPages; i++) {
        const pageButton = document.createElement('li');
        pageButton.className = `page-item ${i === data.number ? 'active' : ''}`;
        pageButton.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
        
        pageButton.addEventListener('click', () => {
            if (tipo === 'departamentos') {
                departamentosPage = i;
                cargarDepartamentos(departamentosPage);
            } else {
                empleadosPage = i;
                cargarEmpleados(empleadosPage);
            }
        });
        
        paginationElement.appendChild(pageButton);
    }
    
    // Botón siguiente
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${data.last ? 'disabled' : ''}`;
    nextButton.innerHTML = `<a class="page-link" href="#" aria-label="Siguiente">
                              <span aria-hidden="true">&raquo;</span>
                            </a>`;
    
    if (!data.last) {
        nextButton.addEventListener('click', () => {
            if (tipo === 'departamentos') {
                departamentosPage++;
                cargarDepartamentos(departamentosPage);
            } else {
                empleadosPage++;
                cargarEmpleados(empleadosPage);
            }
        });
    }
    
    paginationElement.appendChild(nextButton);
}

// Mostrar notificación tipo toast
function mostrarNotificacion(mensaje, tipo) {
    notificationBody.textContent = mensaje;
    notificationToast.className = notificationToast.className.replace(/bg-\w+/, '');
    notificationToast.classList.add(`bg-${tipo}`);
    
    const toast = new bootstrap.Toast(notificationToast);
    toast.show();
}

// Resetear formularios al abrir modales
document.getElementById('departamentoModal').addEventListener('show.bs.modal', function () {
    document.getElementById('departamentoForm').reset();
    document.getElementById('departamentoId').value = '';
    document.getElementById('departamentoModalLabel').textContent = 'Nuevo Departamento';
});

document.getElementById('empleadoModal').addEventListener('show.bs.modal', function () {
    document.getElementById('empleadoForm').reset();
    document.getElementById('empleadoId').value = '';
    document.getElementById('empleadoModalLabel').textContent = 'Nuevo Empleado';
});
