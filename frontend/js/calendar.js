/**
 * Lógica del calendario lateral
 */

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.daysWithHours = new Set(); // Fechas que tienen horas imputadas
        
        this.calendarGrid = document.getElementById('calendar-grid');
        this.calendarTitle = document.getElementById('calendar-title');
        this.btnPrevMonth = document.getElementById('btn-prev-month');
        this.btnNextMonth = document.getElementById('btn-next-month');
        
        this.setupEventListeners();
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        this.btnPrevMonth.addEventListener('click', () => {
            this.changeMonth(-1);
        });
        
        this.btnNextMonth.addEventListener('click', () => {
            this.changeMonth(1);
        });
    }
    
    /**
     * Cambia de mes
     */
    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }
    
    /**
     * Renderiza el calendario
     */
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Actualizar título
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        this.calendarTitle.textContent = `${monthNames[month]} ${year}`;
        
        // Limpiar grid
        this.calendarGrid.innerHTML = '';
        
        // Primer día del mes
        const firstDay = new Date(year, month, 1);
        // Último día del mes
        const lastDay = new Date(year, month + 1, 0);
        
        // Días del mes anterior para llenar
        const firstDayOfWeek = firstDay.getDay();
        const daysToFillBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // Crear días del mes anterior
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = daysToFillBefore; i > 0; i--) {
            const day = prevMonthLastDay - i + 1;
            this.createDayElement(day, 'other-month', new Date(year, month - 1, day));
        }
        
        // Crear días del mes actual
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            this.createDayElement(day, '', date);
        }
        
        // Crear días del siguiente mes para llenar
        const remainingCells = 42 - (daysToFillBefore + lastDay.getDate());
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayElement(day, 'other-month', new Date(year, month + 1, day));
        }
    }
    
    /**
     * Crea un elemento de día
     */
    createDayElement(day, extraClass, date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        if (extraClass) {
            dayElement.classList.add(extraClass);
        }
        
        // Marcar día actual
        const today = new Date();
        if (this.isSameDay(date, today)) {
            dayElement.classList.add('today');
        }
        
        // Marcar día seleccionado
        if (this.isSameDay(date, this.selectedDate)) {
            dayElement.classList.add('selected');
        }
        
        // Marcar días con horas
        const dateStr = this.formatDate(date);
        if (this.daysWithHours.has(dateStr)) {
            dayElement.classList.add('has-hours');
        }
        
        // Event listener - cargar la semana de esta fecha en la tabla
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        this.calendarGrid.appendChild(dayElement);
    }
    
    /**
     * Selecciona una fecha y carga su semana en la tabla
     */
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.render();
        
        // Cargar la semana de esta fecha en la tabla
        if (window.tableManager) {
            window.tableManager.loadWeek(date);
        }
    }
    
    /**
     * Marca días con horas imputadas
     */
    markDaysWithHours(dates) {
        this.daysWithHours = new Set(dates);
        this.render();
    }
    
    /**
     * Compara si dos fechas son el mismo día
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
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
}

// Instancia global
const calendarManager = new CalendarManager();
