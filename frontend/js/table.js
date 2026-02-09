/**
 * Lógica de la tabla semanal de imputación
 */

class TableManager {
    constructor() {
        this.currentWeekMonday = null;
        this.projects = [];
        this.weekData = {};
        this.selectedProjects = new Set(); // Proyectos ya seleccionados en la semana
        
        this.tableBody = document.getElementById('table-body');
        this.emptyState = document.getElementById('empty-state');
        this.btnPrevWeek = document.getElementById('btn-prev-week');
        this.btnNextWeek = document.getElementById('btn-next-week');
        this.weekTitle = document.getElementById('week-title');
        
        this.setupEventListeners();
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        this.btnPrevWeek.addEventListener('click', () => {
            this.changeWeek(-1);
        });
        
        this.btnNextWeek.addEventListener('click', () => {
            this.changeWeek(1);
        });
    }
    
    /**
     * Cambia de semana
     */
    changeWeek(direction) {
        const newDate = new Date(this.currentWeekMonday);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.loadWeek(newDate);
    }
    
    /**
     * Carga los datos de una semana
     */
    async loadWeek(date) {
        const monday = this.getMonday(date);
        this.currentWeekMonday = monday;
        
        // Actualizar título
        this.updateWeekTitle(monday);
        
        // Cargar proyectos del usuario primero
        await this.loadUserProjects();
        
        // Cargar datos del servidor
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(
                `https://aregest.arelance.com/api/imputaciones/semana/${this.formatDate(monday)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                this.weekData = data;
                this.renderTable(data);
            } else {
                console.error('Error cargando semana:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    /**
     * Carga los proyectos del usuario
     */
    async loadUserProjects() {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.projects = await response.json();
            }
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        }
    }
    
    /**
     * Renderiza la tabla con los datos de la semana
     */
    renderTable(data) {
        // SIEMPRE ocultar empty states - la tabla siempre se muestra cuando hay sesión
        this.emptyState.style.display = 'none';
        const emptyStateGuest = document.getElementById('empty-state-guest');
        if (emptyStateGuest) emptyStateGuest.style.display = 'none';
        
        // Actualizar labels de fechas
        const dates = this.getWeekDates(this.currentWeekMonday);
        const dayLabels = ['l', 'm', 'x', 'j', 'v'];
        dates.forEach((date, index) => {
            const label = document.getElementById(`date-${dayLabels[index]}`);
            if (label) {
                label.textContent = `${date.getDate()}/${date.getMonth() + 1}`;
            }
        });
        
        // Limpiar tabla
        this.tableBody.innerHTML = '';
        
        // Resetear proyectos seleccionados
        this.selectedProjects.clear();
        
        // MÁXIMO DE PROYECTOS PERMITIDO
        const MAX_PROJECTS = 3;
        
        // Crear filas de proyectos ya imputados
        let rowCount = 0;
        if (data.proyectos && data.proyectos.length > 0) {
            data.proyectos.forEach(proyecto => {
                this.selectedProjects.add(proyecto.id);
                this.createProjectRow(proyecto, dates);
                rowCount++;
            });
        }
        
        // Rellenar con filas vacías hasta llegar a MAX_PROJECTS
        while (rowCount < MAX_PROJECTS) {
            this.createEmptyRow(dates, rowCount);
            rowCount++;
        }
        
        // Actualizar totales
        this.updateTotals(data.proyectos || [], dates);
    }
    
    /**
     * Crea una fila vacía con selector de proyecto
     */
    createEmptyRow(dates, rowIndex) {
        const row = document.createElement('tr');
        row.className = 'project-row empty-row';
        row.dataset.rowIndex = rowIndex;
        
        // Columna de selector de proyecto
        const nameCell = document.createElement('td');
        
        // Verificar si hay proyectos disponibles
        const availableProjects = this.projects.filter(p => !this.selectedProjects.has(p.id));
        
        if (this.projects.length === 0) {
            // No hay proyectos creados
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" disabled>
                        <option value="">Sin proyectos - crear primero</option>
                    </select>
                </div>
            `;
        } else if (availableProjects.length === 0) {
            // Todos los proyectos ya están seleccionados
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" disabled>
                        <option value="">Máximo alcanzado</option>
                    </select>
                </div>
            `;
        } else {
            // Hay proyectos disponibles
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" data-empty-row="true" data-row-index="${rowIndex}">
                        <option value="">-- Seleccionar Proyecto --</option>
                        ${this.getAvailableProjectsHTML()}
                    </select>
                </div>
            `;
        }
        
        row.appendChild(nameCell);
        
        // Columnas de días (L-V) - deshabilitadas hasta seleccionar proyecto
        dates.forEach(() => {
            const cell = document.createElement('td');
            cell.className = 'disabled';
            cell.textContent = '-';
            row.appendChild(cell);
        });
        
        // Columnas de fin de semana (S-D)
        for (let i = 0; i < 2; i++) {
            const cell = document.createElement('td');
            cell.className = 'disabled';
            cell.textContent = '-';
            row.appendChild(cell);
        }
        
        // Columna de total
        const totalCell = document.createElement('td');
        totalCell.className = 'col-total disabled';
        totalCell.textContent = '0h';
        row.appendChild(totalCell);
        
        this.tableBody.appendChild(row);
        
        // Event listener para el select (solo si está habilitado)
        if (availableProjects.length > 0) {
            const select = nameCell.querySelector('.select-project');
            select.addEventListener('change', (e) => {
                this.onProjectSelected(e.target, row, dates);
            });
        }
    }
    
    /**
     * Obtiene el HTML de proyectos disponibles (no seleccionados aún)
     */
    getAvailableProjectsHTML() {
        return this.projects
            .filter(p => !this.selectedProjects.has(p.id))
            .map(p => `<option value="${p.id}" data-color="${p.color}">${p.nombre}</option>`)
            .join('');
    }
    
    /**
     * Maneja la selección de un proyecto en una fila vacía
     */
    async onProjectSelected(select, row, dates) {
        const projectId = parseInt(select.value);
        
        if (!projectId) {
            return;
        }
        
        // Buscar el proyecto
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            return;
        }
        
        // Marcar como seleccionado
        this.selectedProjects.add(projectId);
        
        // Convertir la fila vacía en fila de proyecto
        row.classList.remove('empty-row');
        row.dataset.projectId = projectId;
        
        // Actualizar la celda de nombre
        const nameCell = row.cells[0];
        const isWhite = project.color.toUpperCase() === '#FFFFFF' || project.color.toUpperCase() === '#FFF';
        const colorStyle = isWhite 
            ? `background: ${project.color}; border: 2px solid var(--gray-400);`
            : `background: ${project.color};`;
        
        nameCell.innerHTML = `
            <div class="project-name">
                <div class="project-color" style="${colorStyle}"></div>
                <span>${project.nombre}</span>
                <button class="btn-delete" data-project-id="${projectId}" data-project-name="${project.nombre}">×</button>
            </div>
        `;
        
        // Habilitar inputs de horas (columnas 1-5 son L-V)
        for (let i = 1; i <= 5; i++) {
            const cell = row.cells[i];
            const date = dates[i - 1];
            const dateStr = this.formatDate(date);
            
            cell.className = '';
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'hour-input';
            input.min = 0;
            input.max = 24;
            input.step = 0.5;
            input.value = 0;
            input.dataset.projectId = projectId;
            input.dataset.fecha = dateStr;
            
            // Event listeners
            input.addEventListener('blur', () => this.saveHours(input));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
            
            cell.innerHTML = '';
            cell.appendChild(input);
        }
        
        // Event listener para botón de borrar - SOLO quita de la tabla de la semana
        const deleteBtn = nameCell.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            this.removeProjectFromWeek(projectId, project.nombre);
        });
        
        // Actualizar los selectores de las otras filas vacías
        this.updateAllEmptyRowSelectors();
        
        // Actualizar totales
        this.updateTotals(this.weekData.proyectos || [], dates);
    }
    
    /**
     * Crea una fila de proyecto
     */
    createProjectRow(proyecto, dates) {
        const row = document.createElement('tr');
        row.className = 'project-row';
        row.dataset.projectId = proyecto.id;
        
        // Columna de nombre del proyecto
        const nameCell = document.createElement('td');
        const isWhite = proyecto.color.toUpperCase() === '#FFFFFF' || proyecto.color.toUpperCase() === '#FFF';
        const colorStyle = isWhite 
            ? `background: ${proyecto.color}; border: 2px solid var(--gray-400);`
            : `background: ${proyecto.color};`;
        
        nameCell.innerHTML = `
            <div class="project-name">
                <div class="project-color" style="${colorStyle}"></div>
                <span>${proyecto.nombre}</span>
                <button class="btn-delete" data-project-id="${proyecto.id}" data-project-name="${proyecto.nombre}">×</button>
            </div>
        `;
        row.appendChild(nameCell);
        
        // Columnas de días (L-V)
        dates.forEach(date => {
            const dateStr = this.formatDate(date);
            const horas = proyecto.horas[dateStr] || 0;
            
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'hour-input';
            input.min = 0;
            input.max = 24;
            input.step = 0.5;
            input.value = horas;
            input.dataset.projectId = proyecto.id;
            input.dataset.fecha = dateStr;
            
            // Event listeners
            input.addEventListener('blur', () => this.saveHours(input));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
            
            cell.appendChild(input);
            row.appendChild(cell);
        });
        
        // Columnas de fin de semana (S-D)
        for (let i = 0; i < 2; i++) {
            const cell = document.createElement('td');
            cell.className = 'disabled';
            cell.textContent = '-';
            row.appendChild(cell);
        }
        
        // Columna de total
        const totalCell = document.createElement('td');
        totalCell.className = 'col-total';
        const total = this.calculateProjectTotal(proyecto.horas);
        totalCell.textContent = `${total}h`;
        row.appendChild(totalCell);
        
        this.tableBody.appendChild(row);
        
        // Event listener para botón de borrar - SOLO quita de la tabla de la semana
        const deleteBtn = nameCell.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            this.removeProjectFromWeek(proyecto.id, proyecto.nombre);
        });
    }
    
    /**
     * Elimina un proyecto de la tabla de la semana (solo las imputaciones de esta semana)
     */
    removeProjectFromWeek(projectId, projectName) {
        // Usar el modal de confirmación personalizado
        const message = `
            ¿Quitar <strong>"${projectName}"</strong> de esta semana?<br><br>
            Se eliminarán las horas imputadas <strong>solo en esta semana</strong> (L-V).
        `;
        
        // Callback que se ejecutará si el usuario confirma
        const confirmCallback = async () => {
            const token = localStorage.getItem('token');
            const dates = this.getWeekDates(this.currentWeekMonday);
            
            try {
                // Poner todas las horas a 0 para esta semana
                for (const date of dates) {
                    const dateStr = this.formatDate(date);
                    await fetch(`https://aregest.arelance.com/api/imputaciones`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            project_id: projectId,
                            fecha: dateStr,
                            horas: 0
                        })
                    });
                }
                
                console.log(`✅ Proyecto ${projectName} quitado de la semana`);
                
                // Recargar la semana para actualizar la tabla
                await this.loadWeek(this.currentWeekMonday);
                
            } catch (error) {
                console.error('❌ Error:', error);
                alert('Error al quitar el proyecto de la semana');
            }
        };
        
        // Mostrar el modal usando projectManager
        if (window.projectManager) {
            window.projectManager.showConfirmModal(message, confirmCallback);
        }
    }
    
    /**
     * Guarda las horas vía WebSocket
     */
    saveHours(input) {
        const projectId = parseInt(input.dataset.projectId);
        const fecha = input.dataset.fecha;
        const horas = parseFloat(input.value) || 0;
        
        // Validar horas
        if (horas < 0 || horas > 24) {
            alert('Las horas deben estar entre 0 y 24');
            input.value = 0;
            return;
        }
        
        // Enviar vía WebSocket
        wsManager.imputarHoras(projectId, fecha, horas);
    }
    
    /**
     * Actualiza una celda específica cuando llega mensaje del WebSocket
     */
    updateCell(projectId, fecha, horas) {
        const input = document.querySelector(
            `input[data-project-id="${projectId}"][data-fecha="${fecha}"]`
        );
        
        if (input) {
            input.value = horas;
            
            // Actualizar totales
            this.updateTotals(this.weekData.proyectos || [], this.getWeekDates(this.currentWeekMonday));
        }
    }
    
    /**
     * Actualiza los totales de la tabla
     */
    updateTotals(proyectos, dates) {
        const dayLabels = ['l', 'm', 'x', 'j', 'v'];
        let weekTotal = 0;
        
        dates.forEach((date, index) => {
            let dayTotal = 0;
            
            // Sumar de todos los inputs de ese día
            const inputs = document.querySelectorAll(`input[data-fecha="${this.formatDate(date)}"]`);
            inputs.forEach(input => {
                dayTotal += parseFloat(input.value) || 0;
            });
            
            const totalCell = document.getElementById(`total-${dayLabels[index]}`);
            if (totalCell) {
                totalCell.textContent = `${dayTotal}h`;
            }
            
            weekTotal += dayTotal;
        });
        
        const totalWeekCell = document.getElementById('total-week');
        if (totalWeekCell) {
            totalWeekCell.textContent = `${weekTotal}h`;
        }
    }
    
    /**
     * Calcula el total de horas de un proyecto en la semana
     */
    calculateProjectTotal(horas) {
        return Object.values(horas).reduce((sum, h) => sum + h, 0);
    }
    
    /**
     * Obtiene el lunes de una fecha
     */
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    
    /**
     * Obtiene las fechas de la semana (L-V)
     */
    getWeekDates(monday) {
        const dates = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(date);
        }
        return dates;
    }
    
    /**
     * Actualiza el título de la semana
     */
    updateWeekTitle(monday) {
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const startStr = `${monday.getDate()} de ${monthNames[monday.getMonth()]}`;
        const endStr = `${friday.getDate()} de ${monthNames[friday.getMonth()]} ${friday.getFullYear()}`;
        
        this.weekTitle.textContent = `Semana del ${startStr} al ${endStr}`;
    }
    
    /**
     * Formatea una fecha a YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Actualiza los selectores cuando se crea un nuevo proyecto
     */
    addEmptyRowIfNeeded() {
        // Siempre hay 3 filas fijas, solo actualizar los selectores
        this.updateAllEmptyRowSelectors();
    }
    
    /**
     * Actualiza todos los selectores de filas vacías
     */
    updateAllEmptyRowSelectors() {
        const emptyRows = this.tableBody.querySelectorAll('tr.empty-row');
        const dates = this.getWeekDates(this.currentWeekMonday);
        
        emptyRows.forEach(emptyRow => {
            const nameCell = emptyRow.cells[0];
            const select = nameCell.querySelector('.select-project');
            if (!select) return;
            
            const rowIndex = emptyRow.dataset.rowIndex;
            const availableProjects = this.projects.filter(p => !this.selectedProjects.has(p.id));
            
            if (this.projects.length === 0) {
                nameCell.innerHTML = `
                    <div class="project-selector">
                        <select class="select-project" disabled>
                            <option value="">Sin proyectos - crear primero</option>
                        </select>
                    </div>
                `;
            } else if (availableProjects.length === 0) {
                nameCell.innerHTML = `
                    <div class="project-selector">
                        <select class="select-project" disabled>
                            <option value="">Máximo alcanzado</option>
                        </select>
                    </div>
                `;
            } else {
                nameCell.innerHTML = `
                    <div class="project-selector">
                        <select class="select-project" data-empty-row="true" data-row-index="${rowIndex}">
                            <option value="">-- Seleccionar Proyecto --</option>
                            ${this.getAvailableProjectsHTML()}
                        </select>
                    </div>
                `;
                
                // Re-adjuntar event listener
                const newSelect = nameCell.querySelector('.select-project');
                newSelect.addEventListener('change', (e) => {
                    this.onProjectSelected(e.target, emptyRow, dates);
                });
            }
        });
    }
    
    /**
     * Actualiza solo el selector de la fila vacía con los nuevos proyectos disponibles
     */
    updateEmptyRowSelector() {
        // Buscar la fila vacía (la última fila con clase empty-row)
        const emptyRow = this.tableBody.querySelector('tr.empty-row');
        if (!emptyRow) {
            return;
        }
        
        const nameCell = emptyRow.cells[0];
        const select = nameCell.querySelector('.select-project');
        if (!select) {
            return;
        }
        
        // Verificar si hay proyectos disponibles
        const availableProjects = this.projects.filter(p => !this.selectedProjects.has(p.id));
        
        if (this.projects.length === 0) {
            // No hay proyectos creados
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" disabled>
                        <option value="">No hay proyectos (crear primero)</option>
                    </select>
                </div>
            `;
        } else if (availableProjects.length === 0) {
            // Todos los proyectos ya están seleccionados
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" disabled>
                        <option value="">Todos los proyectos ya seleccionados</option>
                    </select>
                </div>
            `;
        } else {
            // Hay proyectos disponibles - actualizar opciones
            const currentValue = select.value;
            nameCell.innerHTML = `
                <div class="project-selector">
                    <select class="select-project" data-empty-row="true">
                        <option value="">-- Seleccionar Proyecto --</option>
                        ${this.getAvailableProjectsHTML()}
                    </select>
                </div>
            `;
            
            // Re-adjuntar event listener
            const newSelect = nameCell.querySelector('.select-project');
            const dates = this.getWeekDates(this.currentWeekMonday);
            newSelect.addEventListener('change', (e) => {
                this.onProjectSelected(e.target, emptyRow, dates);
            });
        }
    }
    
    /**
     * Limpia la tabla (para cuando se hace logout)
     */
    clearTable() {
        this.tableBody.innerHTML = '';
        this.projects = [];
        this.weekData = {};
        this.selectedProjects.clear();
        
        // Resetear totales
        const dayLabels = ['l', 'm', 'x', 'j', 'v'];
        dayLabels.forEach(day => {
            const totalCell = document.getElementById(`total-${day}`);
            if (totalCell) {
                totalCell.textContent = '0h';
            }
        });
        
        const totalWeekCell = document.getElementById('total-week');
        if (totalWeekCell) {
            totalWeekCell.textContent = '0h';
        }
    }
}

// Instancia global
const tableManager = new TableManager();
