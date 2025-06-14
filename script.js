// Contador global para los bloques de episodios
let contadorBloques = 0;

// Variable global para almacenar la lista de autores
let listaAutoresGlobal = [];

// Función para actualizar los selects de autores
function actualizarSelectsAutores() {
    const selects = document.querySelectorAll('.autor:not(.select2-hidden-accessible)');
    console.log('Actualizando selectores .autor:', selects.length);
    
    selects.forEach(select => {
        // Guardar el valor actual si existe
        const valorActual = select.value;
        
        // Limpiar opciones existentes excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar las opciones ordenadas
        listaAutoresGlobal.forEach(autor => {
            const option = new Option(autor, autor);
            select.add(option);
        });
        
        // Restaurar el valor anterior si existe
        if (valorActual) {
            select.value = valorActual;
        }
        
        // Inicializar Select2 si no está inicializado
        if (!$(select).hasClass('select2-hidden-accessible')) {
            $(select).select2({
                tags: true,
                tokenSeparators: [',']
            });
        }
    });
}

// Cargar datos de autores
async function cargarAutores() {
    console.log('Iniciando carga de autores...');
    try {
        const url = 'assets/csvjson.json';
        console.log('Solicitando datos desde:', url);
        
        // Usar una ruta relativa desde la raíz del sitio
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json; charset=utf-8'
            },
            cache: 'no-cache'
        });
        
        console.log('Respuesta recibida, estado:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Leer la respuesta como ArrayBuffer primero
        const arrayBuffer = await response.arrayBuffer();
        console.log('Tamaño del buffer:', arrayBuffer.byteLength, 'bytes');
        
        // Convertir a cadena usando TextDecoder con UTF-8
        const decoder = new TextDecoder('utf-8');
        const responseText = decoder.decode(arrayBuffer);
        
        // Eliminar BOM si existe
        const responseData = responseText.replace(/^\uFEFF/, '');
        console.log('Primeros 100 caracteres de la respuesta:', responseData.substring(0, 100));
        
        // Intentar parsear el JSON
        let autoresData;
        try {
            autoresData = JSON.parse(responseData);
            console.log('JSON parseado correctamente');
        } catch (e) {
            console.error('Error al parsear JSON:', e);
            throw new Error('El archivo JSON no tiene un formato válido');
        }
        
        console.log('Datos de autores cargados:', autoresData.length, 'registros');
        
        if (!Array.isArray(autoresData)) {
            console.error('El formato del archivo no es un array:', autoresData);
            throw new Error('El formato del archivo no es el esperado (se esperaba un array)');
        }
        
        // Extraer solo los nombres de los autores
        const nombresAutores = [];
        autoresData.forEach(item => {
            if (item && item.Autor) {
                nombresAutores.push(item.Autor);
            } else {
                console.warn('Elemento sin propiedad Autor:', item);
            }
        });
        
        console.log('Nombres de autores extraídos:', nombresAutores.length);
        
        if (nombresAutores.length === 0) {
            console.warn('No se encontraron nombres de autores en el archivo');
            return;
        }
        
        // Ordenar los nombres alfabéticamente y almacenar globalmente
        listaAutoresGlobal = [...new Set(nombresAutores)].sort((a, b) => 
            a.localeCompare(b, 'es', {sensitivity: 'base'})
        );
        
        // Actualizar los selects existentes
        actualizarSelectsAutores();
        
        console.log('Autores cargados exitosamente');
    } catch (error) {
        console.error('Error al cargar los autores:', error);
    }
}

// Observador de mutación para detectar cuando se agregan nuevos elementos al DOM
const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            shouldUpdate = true;
        }
    });
    
    if (shouldUpdate && listaAutoresGlobal.length > 0) {
        actualizarSelectsAutores();
    }
});

// Iniciar la observación del DOM
document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Select2 para elementos select mejorados
    $('.select2').select2({
        tags: true,
        tokenSeparators: [','], // Solo usar coma como separador
        createTag: function(params) {
            // Eliminar espacios al principio y al final, pero permitirlos en el medio
            const term = $.trim(params.term);
            
            // No permitir valores vacíos
            if (term === '') {
                return null;
            }
            
            return {
                id: term,
                text: term,
                newTag: true
            };
        },
        // Permitir búsqueda con espacios
        matcher: function(params, data) {
            // Si no hay términos de búsqueda, devolver todos los resultados
            if ($.trim(params.term) === '') {
                return data;
            }
            
            // Convertir a minúsculas para búsqueda sin distinción entre mayúsculas y minúsculas
            const searchTerm = params.term.toLowerCase();
            const text = data.text.toLowerCase();
            
            // Buscar coincidencias parciales
            if (text.indexOf(searchTerm) > -1) {
                return data;
            }
            
            return null;
        }
    });

    // Show/hide episodios section based on formato selection
    const tipoFormato = document.getElementById('tipoFormato');
    const episodiosSection = document.getElementById('episodiosSection');
    
    if (tipoFormato && episodiosSection) {
        tipoFormato.addEventListener('change', function() {
            const selectedFormat = this.value;
            if (selectedFormat === 'Serie (de televisión)' || selectedFormat === 'Telenovela') {
                episodiosSection.style.display = 'block';
            } else {
                episodiosSection.style.display = 'none';
                // Clear any existing episodio blocks when hiding the section
                const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
                if (bloquesContainer) {
                    bloquesContainer.innerHTML = '';
                }
            }
        });
    }

    // Add exhibicion
    const addExhibicionBtn = document.getElementById('addExhibicion');
    const exhibicionesContainer = document.getElementById('exhibicionesContainer');
    
    if (addExhibicionBtn && exhibicionesContainer) {
        addExhibicionBtn.addEventListener('click', function() {
            addExhibicion();
        });
    }

    // Add bloque de episodios
    const addBloqueEpisodiosBtn = document.getElementById('addBloqueEpisodios');
    const bloquesEpisodiosContainer = document.getElementById('bloquesEpisodiosContainer');
    
    if (addBloqueEpisodiosBtn && bloquesEpisodiosContainer) {
        addBloqueEpisodiosBtn.addEventListener('click', function() {
            addBloqueEpisodios();
        });
    }

    // Form submission
    const form = document.getElementById('obraForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generateExcel();
        });
    }

    // Validar que solo se ingresen números en los campos de porcentaje
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('porcentaje')) {
            // Eliminar cualquier carácter que no sea número o punto decimal
            let value = e.target.value.replace(/[^0-9.]/g, '');
            
            // Asegurarse de que solo haya un punto decimal
            const decimalCount = (value.match(/\./g) || []).length;
            if (decimalCount > 1) {
                value = value.substring(0, value.lastIndexOf('.'));
            }
            
            // Limitar a 2 decimales
            const parts = value.split('.');
            if (parts[1] && parts[1].length > 2) {
                value = `${parts[0]}.${parts[1].substring(0, 2)}`;
            }
            
            // Asegurarse de que el valor esté entre 0 y 100
            const numValue = parseFloat(value || 0);
            if (numValue > 100) {
                value = '100';
            } else if (numValue < 0) {
                value = '0';
            }
            
            // Actualizar el valor si cambió
            if (e.target.value !== value) {
                e.target.value = value;
            }
        }
    });
    
    // Initialize with one exhibicion
    addExhibicion();
    
    // Cargar la lista de autores
    cargarAutores();
});

// Add a new exhibicion
function addExhibicion() {
    const exhibicionesContainer = document.getElementById('exhibicionesContainer');
    if (!exhibicionesContainer) return;
    
    const template = document.getElementById('exhibicionTemplate');
    if (!template) return;
    
    const clone = template.content.cloneNode(true);
    const exhibicionItem = clone.querySelector('.exhibicion-item');
    
    // Add remove button functionality
    const removeBtn = exhibicionItem.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            // Only remove if there's more than one exhibicion
            const exhibiciones = document.querySelectorAll('.exhibicion-item');
            if (exhibiciones.length > 1) {
                exhibicionItem.remove();
            } else {
                alert('Debe haber al menos una exhibición.');
            }
        });
    }
    
    // Agregar el ítem al contenedor
    exhibicionesContainer.appendChild(exhibicionItem);
    
    // Inicializar Select2 con la misma configuración que la inicial
    $(exhibicionItem).find('.select2').select2({
        tags: true,
        tokenSeparators: [','], // Solo usar coma como separador
        createTag: function(params) {
            // Eliminar espacios al principio y al final, pero permitirlos en el medio
            const term = $.trim(params.term);
            
            // No permitir valores vacíos
            if (term === '') {
                return null;
            }
            
            return {
                id: term,
                text: term,
                newTag: true
            };
        },
        // Permitir búsqueda con espacios
        matcher: function(params, data) {
            // Si no hay términos de búsqueda, devolver todos los resultados
            if ($.trim(params.term) === '') {
                return data;
            }
            
            // Convertir a minúsculas para búsqueda sin distinción entre mayúsculas y minúsculas
            const searchTerm = params.term.toLowerCase();
            const text = data.text.toLowerCase();
            
            // Buscar coincidencias parciales
            if (text.indexOf(searchTerm) > -1) {
                return data;
            }
            
            return null;
        }
    });
}

// Add a new bloque de episodios
function addBloqueEpisodios() {
    const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
    if (!bloquesContainer) return;
    
    const template = document.getElementById('bloqueEpisodiosTemplate');
    if (!template) return;
    
    // Incrementar el contador de bloques
    contadorBloques++;
    
    const clone = template.content.cloneNode(true);
    const bloqueEpisodios = clone.querySelector('.bloque-episodios');
    
    // Actualizar el título del bloque con el número correspondiente
    const tituloBloque = bloqueEpisodios.querySelector('.bloque-header h3');
    if (tituloBloque) {
        tituloBloque.textContent = `Bloque de Episodios #${contadorBloques}`;
    }
    
    // Add remove button functionality
    const removeBtn = bloqueEpisodios.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de eliminar este bloque de episodios?')) {
                bloqueEpisodios.remove();
            }
        });
    }
    
    // Add event listeners for desde/hasta episodio
    const desdeEpisodio = bloqueEpisodios.querySelector('.desdeEpisodio');
    const hastaEpisodio = bloqueEpisodios.querySelector('.hastaEpisodio');
    
    function updateEpisodios() {
        const desde = parseInt(desdeEpisodio.value) || 0;
        const hasta = parseInt(hastaEpisodio.value) || 0;
        
        // Limpiar contenedor de episodios individuales
        const individuales = bloqueEpisodios.querySelector('.episodios-individuales');
        if (individuales) individuales.innerHTML = '';
        
        // Generar solo la vista individual si los valores son válidos
        if (desde > 0 && hasta >= desde) {
            generateEpisodiosIndividuales(bloqueEpisodios, desde, hasta);
        }
    }
    
    if (desdeEpisodio) {
        desdeEpisodio.addEventListener('change', updateEpisodios);
        desdeEpisodio.addEventListener('blur', updateEpisodios);
    }
    
    if (hastaEpisodio) {
        hastaEpisodio.addEventListener('change', updateEpisodios);
        hastaEpisodio.addEventListener('blur', updateEpisodios);
    }
    
    // Mostrar la vista individual por defecto
    const individuales = bloqueEpisodios.querySelector('.episodios-individuales');
    if (individuales) {
        individuales.style.display = 'block';
    }
    
    // Add initial linea de participación
    const addLineaBtn = bloqueEpisodios.querySelector('.btn-small');
    if (addLineaBtn) {
        addLineaBtn.addEventListener('click', function() {
            addLineaParticipacion(this);
        });
    }
    
    // Agregar el bloque al contenedor
    bloquesContainer.appendChild(bloqueEpisodios);
    
    // Inicializar selectores de autor en este bloque
    const autorSelects = bloqueEpisodios.querySelectorAll('.autor');
    autorSelects.forEach(select => {
        // Si ya hay autores cargados, poblar el select
        if (listaAutoresGlobal.length > 0) {
            // Guardar el valor actual si existe
            const valorActual = select.value;
            
            // Limpiar opciones existentes excepto la primera
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Agregar las opciones ordenadas
            listaAutoresGlobal.forEach(autor => {
                const option = new Option(autor, autor);
                select.add(option);
            });
            
            // Restaurar el valor anterior si existe
            if (valorActual) {
                select.value = valorActual;
            }
        }
        
        // Inicializar Select2
        $(select).select2({
            tags: true,
            tokenSeparators: [',', ' '],
            createTag: function(params) {
                const term = $.trim(params.term);
                if (term === '') return null;
                return {
                    id: term,
                    text: term,
                    newTag: true
                };
            },
            matcher: function(params, data) {
                if ($.trim(params.term) === '') return data;
                const searchTerm = params.term.toLowerCase();
                const text = data.text.toLowerCase();
                return text.indexOf(searchTerm) > -1 ? data : null;
            }
        });
    });
    
    // Inicializar otros selectores Select2 en el bloque (no autores)
    $(bloqueEpisodios).find('select:not(.autor)').each(function() {
        if (!$(this).hasClass('select2-hidden-accessible')) {
            $(this).select2({
                tags: true,
                tokenSeparators: [',', ' '],
                createTag: function(params) {
                    const term = $.trim(params.term);
                    if (term === '') return null;
                    return { id: term, text: term, newTag: true };
                },
                matcher: function(params, data) {
                    if ($.trim(params.term) === '') return data;
                    const searchTerm = params.term.toLowerCase();
                    const text = data.text.toLowerCase();
                    return text.indexOf(searchTerm) > -1 ? data : null;
                }
            });
        }
    });
    
    // Trigger initial update
    updateEpisodios();
}

// Generate episodios individuales
function generateEpisodiosIndividuales(container, desde, hasta) {
    const containerDiv = container.querySelector('.episodios-individuales');
    if (!containerDiv) return;
    
    containerDiv.innerHTML = '';
    
    for (let i = desde; i <= hasta; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="episodio-${i}">Episodio ${i}</label>
            <input type="text" id="episodio-${i}" class="titulo-episodio" data-episodio="${i}" placeholder="Título del episodio ${i}">
        `;
        containerDiv.appendChild(div);
    }
}

// Add linea de participación
function addLineaParticipacion(button) {
    const lineasContainer = button.closest('.subbloque').querySelector('.lineas-participacion');
    if (!lineasContainer) return;
    
    const template = document.getElementById('lineaParticipacionTemplate');
    if (!template) return;
    
    const clone = template.content.cloneNode(true);
    const linea = clone.querySelector('.linea-participacion');
    
    // Agregar la línea al contenedor
    lineasContainer.appendChild(linea);
    
    // Inicializar el selector de autor
    const autorSelect = linea.querySelector('.autor');
    if (autorSelect) {
        // Si ya hay autores cargados, poblar el select
        if (listaAutoresGlobal.length > 0) {
            // Guardar el valor actual si existe
            const valorActual = autorSelect.value;
            
            // Limpiar opciones existentes excepto la primera
            while (autorSelect.options.length > 1) {
                autorSelect.remove(1);
            }
            
            // Agregar las opciones ordenadas
            listaAutoresGlobal.forEach(autor => {
                const option = new Option(autor, autor);
                autorSelect.add(option);
            });
            
            // Restaurar el valor anterior si existe
            if (valorActual) {
                autorSelect.value = valorActual;
            }
        }
        
        // Inicializar Select2
        $(autorSelect).select2({
            tags: true,
            tokenSeparators: [',', ' '],
            createTag: function(params) {
                return {
                    id: params.term,
                    text: params.term,
                    newTag: true
                };
            }
        });
    }
    
    // Inicializar el selector de rol
    const rolSelect = linea.querySelector('.rol');
    if (rolSelect) {
        $(rolSelect).select2({
            tags: true,
            tokenSeparators: [',', ' ']
        });
    }
}

// Remove linea de participación
function removeLineaParticipacion(button) {
    const linea = button.closest('.linea-participacion');
    if (linea) {
        linea.remove();
    }
}

// Generate Excel file
function generateExcel() {
    // Get general data
    const generalData = {
        tituloOriginal: document.getElementById('tituloOriginal').value,
        tipoFormato: document.getElementById('tipoFormato').value,
        empresaProductora: document.getElementById('empresaProductora').value,
        paisProduccion: document.getElementById('paisProduccion').value,
        anioProduccion: document.getElementById('anioProduccion').value,
        idioma: document.getElementById('idioma').value,
        actores: document.getElementById('actores').value,
        directores: document.getElementById('directores').value,
        guionistas: document.getElementById('guionistas').value
    };
    
    // Get exhibiciones data
    const exhibiciones = [];
    document.querySelectorAll('.exhibicion-item').forEach((item, index) => {
        exhibiciones.push({
            otroTitulo: item.querySelector('.otroTitulo').value,
            idioma: item.querySelector('.idiomaExhibicion').value,
            pais: item.querySelector('.paisExhibicion').value,
            canal: item.querySelector('.canalExhibicion').value
        });
    });
    
    // Get episodios data
    const episodiosData = [];
    
    document.querySelectorAll('.bloque-episodios').forEach(bloque => {
        const temporada = parseInt(bloque.querySelector('.temporada').value) || 1;
        const desde = parseInt(bloque.querySelector('.desdeEpisodio').value) || 0;
        const hasta = parseInt(bloque.querySelector('.hastaEpisodio').value) || 0;
        
        if (desde > 0 && hasta >= desde) {
            // Get lineas de participación
            const lineas = [];
            bloque.querySelectorAll('.linea-participacion').forEach(linea => {
                const roles = Array.from(linea.querySelectorAll('.rol option:checked')).map(opt => opt.value);
                const autor = linea.querySelector('.autor').value;
                const porcentaje = linea.querySelector('.porcentaje').value;
                
                // Si no hay roles seleccionados, agregar una línea vacía
                if (roles.length === 0) {
                    lineas.push({
                        rol: '',
                        autor: autor,
                        porcentaje: porcentaje
                    });
                } else {
                    roles.forEach(rol => {
                        lineas.push({
                            rol: rol,
                            autor: autor,
                            porcentaje: porcentaje
                        });
                    });
                }
            });
            
            // Si no hay líneas de participación, agregar una vacía
            if (lineas.length === 0) {
                lineas.push({
                    rol: '',
                    autor: '',
                    porcentaje: ''
                });
            }
            
            // Get títulos de episodios
            const titulos = {};
            bloque.querySelectorAll('.titulo-episodio').forEach(input => {
                const num = input.getAttribute('data-episodio');
                titulos[num] = input.value;
            });
            
            // Crear filas para cada episodio y línea
            for (let i = desde; i <= hasta; i++) {
                lineas.forEach(linea => {
                    episodiosData.push({
                        temporada: temporada,
                        numEpisodio: i,
                        tituloEpisodio: titulos[i] || '',
                        rol: linea.rol,
                        autor: linea.autor,
                        porcentaje: linea.porcentaje
                    });
                });
            }
        }
    });
    
    // Crear los encabezados
    const headers = [
        'Título Original', 'Tipo de Formato', 'Empresa Productora', 'País de Producción',
        'Año de Producción', 'Idioma', 'Actores', 'Directores', 'Guionistas'
    ];
    
    // Agregar encabezados de exhibiciones
    exhibiciones.forEach((_, index) => {
        headers.push(
            `Otro Título ${index + 1}`, 
            `Idioma ${index + 1}`, 
            `País ${index + 1}`, 
            `Canal/Plataforma ${index + 1}`
        );
    });
    
    // Agregar encabezados de episodios
    headers.push('Temporada', 'N° Episodio', 'Título del Episodio', 'Rol', 'Autor', '% Participación');
    
    // Crear la primera fila con datos generales y exhibiciones
    const primeraFila = [
        generalData.tituloOriginal || '',
        generalData.tipoFormato || '',
        generalData.empresaProductora || '',
        generalData.paisProduccion || '',
        generalData.anioProduccion || '',
        generalData.idioma || '',
        generalData.actores || '',
        generalData.directores || '',
        generalData.guionistas || ''
    ];
    
    // Agregar datos de exhibiciones a la primera fila
    exhibiciones.forEach(exh => {
        primeraFila.push(
            exh.otroTitulo || '',
            exh.idioma || '',
            exh.pais || '',
            exh.canal || ''
        );
    });
    
    // Dejar vacíos los campos de episodios en la primera fila
    primeraFila.push('', '', '', '', '');
    
    // Crear las filas de datos
    const filasDatos = [];
    
    // Si no hay datos de episodios, crear una fila con los datos generales
    if (episodiosData.length === 0) {
        const filaVacia = [
            generalData.tituloOriginal || '',
            generalData.tipoFormato || '',
            generalData.empresaProductora || '',
            generalData.paisProduccion || '',
            generalData.anioProduccion || '',
            generalData.idioma || '',
            generalData.actores || '',
            generalData.directores || '',
            generalData.guionistas || ''
        ];
        
        // Agregar datos de exhibiciones
        exhibiciones.forEach(exh => {
            filaVacia.push(
                exh.otroTitulo || '',
                exh.idioma || '',
                exh.pais || '',
                exh.canal || ''
            );
        });
        
        // Agregar celdas vacías para los datos de episodios
        filaVacia.push('', 'Sin episodios', '', '', '', '');
        
        filasDatos.push(filaVacia);
    } else {
        // Si hay datos de episodios, creamos filas para cada uno
        episodiosData.forEach(episodio => {
            const fila = [
                '', // Título Original (vacío en filas de episodios)
                '', // Tipo de Formato
                '', // Empresa Productora
                '', // País de Producción
                '', // Año de Producción
                '', // Idioma
                '', // Actores
                '', // Directores
                ''  // Guionistas
            ];
            
            // Dejar vacíos los campos de exhibiciones en filas de episodios
            for (let i = 0; i < exhibiciones.length; i++) {
                fila.push('', '', '', '');
            }
            
            // Agregar datos del episodio
            fila.push(
                episodio.temporada || 1,
                episodio.numEpisodio || '',
                episodio.tituloEpisodio || '',
                episodio.rol || '',
                episodio.autor || '',
                episodio.porcentaje || ''
            );
            
            filasDatos.push(fila);
        });
    }
    
    // Combinar primera fila con las filas de datos
    const datosFinales = [primeraFila, ...filasDatos];
    
    // Crear la hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet([headers, ...datosFinales]);
    
    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Declaración Obra');
    
    // Generar y descargar el archivo Excel
    XLSX.writeFile(wb, 'declaracion_obra.xlsx');
}
