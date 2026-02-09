/**
 * Lógica de gestión de proyectos
 */

class ProjectManager {
    constructor() {
        this.projects = [];
        this.modal = document.getElementById('modal-create-project');
        this.form = document.getElementById('form-create-project');
        this.btnOpen = document.getElementById('btn-create-project');
        this.btnClose = document.getElementById('modal-close');
        this.btnCancel = document.getElementById('modal-cancel');
        this.modalError = document.getElementById('modal-error');
        
        // Modal de listar proyectos
        this.modalList = document.getElementById('modal-list-projects');
        this.btnListOpen = document.getElementById('btn-list-projects');
        this.btnListClose = document.getElementById('modal-list-close');
        this.projectsListContainer = document.getElementById('projects-list-container');
        
        // Modal de confirmación de eliminación
        this.modalConfirmDelete = document.getElementById('modal-confirm-delete');
        this.confirmDeleteMessage = document.getElementById('confirm-delete-message');
        this.confirmDeleteAccept = document.getElementById('confirm-delete-accept');
        this.confirmDeleteCancel = document.getElementById('confirm-delete-cancel');
        this.pendingDeleteProjectId = null;
        this.pendingDeleteProjectName = null;
        this.pendingDeleteCallback = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Abrir modal crear
        this.btnOpen.addEventListener('click', () => {
            this.openModal();
        });
        
        // Cerrar modal crear
        this.btnClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.btnCancel.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Clic fuera del modal crear
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Submit formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });
        
        // Abrir modal listar
        this.btnListOpen.addEventListener('click', () => {
            this.openListModal();
        });
        
        // Cerrar modal listar
        this.btnListClose.addEventListener('click', () => {
            this.closeListModal();
        });
        
        // Clic fuera del modal listar
        this.modalList.addEventListener('click', (e) => {
            if (e.target === this.modalList) {
                this.closeListModal();
            }
        });
        
        // Modal de confirmación de eliminación
        this.confirmDeleteAccept.addEventListener('click', () => {
            this.confirmDelete();
        });
        
        this.confirmDeleteCancel.addEventListener('click', () => {
            this.closeConfirmDeleteModal();
        });
        
        // Clic fuera del modal de confirmación
        this.modalConfirmDelete.addEventListener('click', (e) => {
            if (e.target === this.modalConfirmDelete) {
                this.closeConfirmDeleteModal();
            }
        });
    }
    
    /**
     * Abre el modal
     */
    openModal() {
        this.modal.classList.add('show');
        this.form.reset();
        this.hideError();
    }
    
    /**
     * Cierra el modal
     */
    closeModal() {
        this.modal.classList.remove('show');
        this.hideError();
    }
    
    /**
     * Muestra un error
     */
    showError(message) {
        this.modalError.textContent = message;
        this.modalError.classList.add('show');
    }
    
    /**
     * Oculta el error
     */
    hideError() {
        this.modalError.textContent = '';
        this.modalError.classList.remove('show');
    }
    
    /**
     * Crea un nuevo proyecto
     */
    async createProject() {
        this.hideError();
        
        const formData = new FormData(this.form);
        
        // Colores corporativos que se asignan automáticamente
        const colors = ['#003049', '#E85D04', '#FFFFFF'];
        const colorIndex = this.projects.length % colors.length;
        
        const data = {
            nombre: formData.get('project-name') || document.getElementById('project-name').value,
            color: colors[colorIndex]
        };
        
        // Validaciones
        if (!data.nombre || data.nombre.trim().length === 0) {
            this.showError('El nombre del proyecto es obligatorio');
            return;
        }
        
        if (data.nombre.length > 100) {
            this.showError('El nombre debe tener máximo 100 caracteres');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Proyecto creado:', result);
                this.closeModal();
                
                // Recargar SOLO la lista de proyectos
                await this.loadProjects();
                
                // Actualizar la tabla para incluir el nuevo proyecto
                if (window.tableManager) {
                    await window.tableManager.loadUserProjects();
                    // Añadir fila vacía con el nuevo proyecto disponible
                    window.tableManager.addEmptyRowIfNeeded();
                }
            } else {
                this.showError(result.detail || 'Error al crear el proyecto');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.showError('Error de conexión con el servidor');
        }
    }
    
    /**
     * Muestra el modal de confirmación para eliminar un proyecto
     */
    deleteProject(projectId, projectName) {
        this.pendingDeleteProjectId = projectId;
        this.pendingDeleteProjectName = projectName;
        this.pendingDeleteCallback = null; // Resetear callback
        
        this.confirmDeleteMessage.innerHTML = `
            ¿Estás seguro de que quieres eliminar el proyecto <strong>"${projectName}"</strong>?<br><br>
            Se borrarán <strong>TODAS las horas imputadas</strong> en este proyecto (todas las semanas).
        `;
        
        this.modalConfirmDelete.classList.add('show');
    }
    
    /**
     * Muestra el modal de confirmación genérico con callback personalizado
     */
    showConfirmModal(message, callback) {
        this.pendingDeleteCallback = callback;
        this.confirmDeleteMessage.innerHTML = message;
        this.modalConfirmDelete.classList.add('show');
    }
    
    /**
     * Cierra el modal de confirmación
     */
    closeConfirmDeleteModal() {
        this.modalConfirmDelete.classList.remove('show');
        this.pendingDeleteProjectId = null;
        this.pendingDeleteProjectName = null;
        this.pendingDeleteCallback = null;
    }
    
    /**
     * Confirma y ejecuta la eliminación del proyecto o el callback personalizado
     */
    async confirmDelete() {
        // Si hay un callback personalizado, ejecutarlo
        if (this.pendingDeleteCallback && typeof this.pendingDeleteCallback === 'function') {
            // Guardar el callback en variable local ANTES de cerrar el modal
            const callback = this.pendingDeleteCallback;
            this.closeConfirmDeleteModal();
            await callback();
            return;
        }
        
        // Flujo normal de eliminación de proyecto
        if (!this.pendingDeleteProjectId) {
            return;
        }
        
        const projectId = this.pendingDeleteProjectId;
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`https://aregest.arelance.com/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('✅ Proyecto eliminado');
                
                // Cerrar modal
                this.closeConfirmDeleteModal();
                
                // Recargar proyectos y semana
                await this.loadProjects();
                if (window.tableManager) {
                    await window.tableManager.loadWeek(window.tableManager.currentWeekMonday);
                }
                
                // Actualizar lista si el modal de lista está abierto
                if (this.modalList.classList.contains('show')) {
                    this.renderProjectsList();
                }
            } else {
                const result = await response.json();
                alert(result.detail || 'Error al eliminar el proyecto');
                this.closeConfirmDeleteModal();
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error de conexión con el servidor');
            this.closeConfirmDeleteModal();
        }
    }
    
    /**
     * Carga todos los proyectos del usuario
     */
    async loadProjects() {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.projects = await response.json();
                console.log(`📋 Proyectos cargados: ${this.projects.length}`);
                
                // Actualizar botón de crear proyecto
                this.updateCreateButton();
            }
        } catch (error) {
            console.error('❌ Error cargando proyectos:', error);
        }
    }
    
    /**
     * Actualiza el estado del botón de crear proyecto
     */
    updateCreateButton() {
        if (this.projects.length >= 3) {
            this.btnOpen.disabled = true;
            this.btnOpen.title = 'Máximo 3 proyectos permitidos';
        } else {
            this.btnOpen.disabled = false;
            this.btnOpen.title = '';
        }
    }
    
    /**
     * Abre el modal de listar proyectos
     */
    async openListModal() {
        await this.loadProjects();
        this.renderProjectsList();
        this.modalList.classList.add('show');
    }
    
    /**
     * Cierra el modal de listar proyectos
     */
    closeListModal() {
        this.modalList.classList.remove('show');
    }
    
    /**
     * Renderiza la lista de proyectos en el modal
     */
    renderProjectsList() {
        if (this.projects.length === 0) {
            this.projectsListContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                    <p style="font-size: 18px; margin-bottom: 10px;">📋 No tienes proyectos</p>
                    <p style="font-size: 14px;">Crea tu primer proyecto para comenzar</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="padding: 20px;">
                <p style="color: var(--gray-600); margin-bottom: 15px; font-size: 14px;">
                    Tienes <strong>${this.projects.length}/3</strong> proyectos creados
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
        `;
        
        this.projects.forEach(project => {
            // Si el color es blanco, añadir borde gris para que se vea
            const isWhite = project.color.toUpperCase() === '#FFFFFF' || project.color.toUpperCase() === '#FFF';
            const colorBoxStyle = isWhite 
                ? `border: 2px solid var(--gray-300); background: ${project.color};`
                : `background: ${project.color};`;
            const borderColor = isWhite ? 'var(--gray-400)' : project.color;
            
            html += `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: var(--gray-50);
                    border-radius: 8px;
                    border-left: 4px solid ${borderColor};
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 24px;
                            height: 24px;
                            ${colorBoxStyle}
                            border-radius: 4px;
                        "></div>
                        <span style="font-weight: 500; color: var(--gray-800);">${project.nombre}</span>
                    </div>
                    <button 
                        class="btn-delete-project"
                        data-project-id="${project.id}"
                        data-project-name="${project.nombre}"
                        style="
                            background: transparent;
                            border: none;
                            color: var(--error);
                            cursor: pointer;
                            font-size: 20px;
                            padding: 5px 10px;
                            transition: background 0.2s;
                            border-radius: 4px;
                        "
                        onmouseover="this.style.background='var(--gray-200)'"
                        onmouseout="this.style.background='transparent'"
                        title="Eliminar proyecto"
                    >×</button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        this.projectsListContainer.innerHTML = html;
        
        // Añadir event listeners a los botones de eliminar
        const deleteButtons = this.projectsListContainer.querySelectorAll('.btn-delete-project');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const projectId = parseInt(btn.dataset.projectId);
                const projectName = btn.dataset.projectName;
                this.deleteProjectFromList(projectId, projectName);
            });
        });
    }
    
    /**
     * Elimina un proyecto desde el modal de lista
     */
    deleteProjectFromList(projectId, projectName) {
        // Usar el mismo flujo de confirmación
        this.deleteProject(projectId, projectName);
    }
}

// Instancia global
const projectManager = new ProjectManager();
