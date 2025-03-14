// DOM Elements
const userGoalTextarea = document.getElementById('user-goal');
const apiKeyInput = document.getElementById('api-key');
const generateBtn = document.getElementById('generate-btn');
const fetchModelsBtn = document.getElementById('fetch-models-btn');
const modelSelectionContainer = document.getElementById('model-selection-container');
const modelSelect = document.getElementById('model-select');
const modelInfoText = document.getElementById('model-info-text');
const affirmationsSection = document.querySelector('.affirmations-section');
const affirmationsContainer = document.getElementById('affirmations-container');
const activeAffirmationSection = document.querySelector('.active-affirmation-section');
const currentAffirmationElement = document.getElementById('current-affirmation');
const countdownElement = document.getElementById('countdown');
const progressRingCircle = document.querySelector('.progress-ring-circle');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseBtn = document.getElementById('pause-btn');
const nextBtn = document.getElementById('next-btn');
const stopBtn = document.getElementById('stop-btn');
const intervalInput = document.getElementById('interval');
const startTimeInput = document.getElementById('start-time');
const repeatDailyCheckbox = document.getElementById('repeat-daily');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const affirmationCountInput = document.getElementById('affirmation-count');
const affirmationsTitle = document.getElementById('affirmations-title');
const reasoningContent = document.getElementById('reasoning-content');
const affirmationStyleSelect = document.getElementById('affirmation-style');
const styleInfoIcon = document.querySelector('.style-info-icon');
const styleInfoContent = document.querySelector('.style-info-content');

// Block Management Elements
const createBlockBtn = document.getElementById('create-block-btn');
const saveBlocksBtn = document.getElementById('save-blocks-btn');
const blocksContainer = document.getElementById('blocks-container');
const blockModal = document.getElementById('block-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const blockNameInput = document.getElementById('block-name');
const blockDescriptionInput = document.getElementById('block-description');
const blockAffirmationsList = document.getElementById('block-affirmations-list');
const addAllAffirmationsBtn = document.getElementById('add-all-affirmations-btn');
const clearBlockAffirmationsBtn = document.getElementById('clear-block-affirmations-btn');
const saveBlockBtn = document.getElementById('save-block-btn');
const cancelBlockBtn = document.getElementById('cancel-block-btn');

// Time Slot Elements
const addTimeSlotBtn = document.getElementById('add-time-slot-btn');
const timeSlotModal = document.getElementById('time-slot-modal');
const closeTimeModalBtn = document.getElementById('close-time-modal-btn');
const timeSlotTimeInput = document.getElementById('time-slot-time');
const timeSlotBlockSelect = document.getElementById('time-slot-block');
const saveTimeSlotBtn = document.getElementById('save-time-slot-btn');
const cancelTimeSlotBtn = document.getElementById('cancel-time-slot-btn');
const timeSlotsContainer = document.getElementById('time-slots-list');
const weekdayButtons = document.querySelectorAll('.weekday-btn');
const displayModeRadios = document.querySelectorAll('input[name="display-mode"]');
const intervalSettings = document.getElementById('interval-settings');

// Global variables
let affirmations = [];
let affirmationReasoning = '';
let currentAffirmationIndex = 0;
let countdownInterval;
let isPaused = false;
let timerSchedule;
let currentInterval = 30; // Default interval in seconds
const circumference = 2 * Math.PI * 50; // Circumference of the progress ring
let availableModels = []; // Store available models
let selectedModel = ''; // Store selected model
let blocks = []; // Store affirmation blocks
let selectedDays = new Set(); // Store selected weekdays
let timeSlots = []; // Store time slots
let editingBlockIndex = -1; // Track which block is being edited

// Initialize the application
function init() {
    // Set default start time to current time + 1 minute
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    startTimeInput.value = `${hours}:${minutes}`;

    // Check for saved API key in localStorage
    const savedApiKey = localStorage.getItem('groqApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Check for saved model in localStorage
    const savedModel = localStorage.getItem('groqSelectedModel');
    if (savedModel) {
        selectedModel = savedModel;
    }

    // Add event listeners
    fetchModelsBtn.addEventListener('click', fetchAvailableModels);
    modelSelect.addEventListener('change', handleModelSelection);
    generateBtn.addEventListener('click', generateAffirmations);
    startTimerBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', togglePause);
    nextBtn.addEventListener('click', showNextAffirmation);
    stopBtn.addEventListener('click', stopTimer);
    affirmationCountInput.addEventListener('input', validateAffirmationCount);
    styleInfoIcon.addEventListener('click', toggleStyleInfo);
    
    // Add event listeners for block management
    createBlockBtn.addEventListener('click', openCreateBlockModal);
    saveBlocksBtn.addEventListener('click', saveBlocksConfiguration);
    closeModalBtn.addEventListener('click', closeBlockModal);
    saveBlockBtn.addEventListener('click', saveBlock);
    cancelBlockBtn.addEventListener('click', closeBlockModal);
    addAllAffirmationsBtn.addEventListener('click', addAllAffirmationsToBlock);
    clearBlockAffirmationsBtn.addEventListener('click', clearBlockAffirmations);
    
    // Add event listeners for time slots
    addTimeSlotBtn.addEventListener('click', openTimeSlotModal);
    closeTimeModalBtn.addEventListener('click', closeTimeSlotModal);
    saveTimeSlotBtn.addEventListener('click', saveTimeSlot);
    cancelTimeSlotBtn.addEventListener('click', closeTimeSlotModal);
    
    // Add event listeners for weekday buttons
    weekdayButtons.forEach(button => {
        button.addEventListener('click', toggleWeekday);
    });
    
    // Add event listener for display mode change
    displayModeRadios.forEach(radio => {
        radio.addEventListener('change', toggleIntervalSettings);
    });
    
    // Set the initial progress ring state
    progressRingCircle.style.strokeDasharray = circumference;
    progressRingCircle.style.strokeDashoffset = 0;
    
    // Load saved configurations
    loadSavedConfigurations();
}

// Toggle style info panel
function toggleStyleInfo() {
    styleInfoContent.classList.toggle('hidden');
    
    // Close the panel when clicking outside of it
    if (!styleInfoContent.classList.contains('hidden')) {
        document.addEventListener('click', closeStyleInfoOnClickOutside);
    } else {
        document.removeEventListener('click', closeStyleInfoOnClickOutside);
    }
}

// Close style info panel when clicking outside
function closeStyleInfoOnClickOutside(event) {
    if (!styleInfoIcon.contains(event.target) && !styleInfoContent.contains(event.target)) {
        styleInfoContent.classList.add('hidden');
        document.removeEventListener('click', closeStyleInfoOnClickOutside);
    }
}

// Validate affirmation count
function validateAffirmationCount() {
    const count = parseInt(affirmationCountInput.value);
    
    if (isNaN(count) || count < 5) {
        affirmationCountInput.value = 5;
    } else if (count > 100) {
        affirmationCountInput.value = 100;
    }
}

// Show notification
function showNotification(message, type = 'default') {
    notification.className = 'notification';
    notification.classList.add(type);
    notificationMessage.textContent = message;
    
    // Remove hidden class to show notification
    notification.classList.remove('hidden');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Fetch available models from Groq API
async function fetchAvailableModels() {
    const apiKey = apiKeyInput.value.trim();
    
    // Validate API key
    if (!apiKey) {
        showNotification('Por favor, insira sua chave API Groq.', 'error');
        return;
    }
    
    // Save API key to localStorage
    localStorage.setItem('groqApiKey', apiKey);
    
    // Show loading state
    const originalBtnText = fetchModelsBtn.textContent;
    fetchModelsBtn.disabled = true;
    fetchModelsBtn.innerHTML = '<span class="loading-spinner"></span>Buscando...';
    
    try {
        // Call the Groq API to get available models
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Erro ao buscar modelos da API Groq');
        }
        
        const data = await response.json();
        
        // Process and store available models
        availableModels = data.data || [];
        
        // Sort models by ID
        availableModels.sort((a, b) => a.id.localeCompare(b.id));
        
        // Populate the model select dropdown
        populateModelSelect();
        
        // Show the model selection container
        modelSelectionContainer.classList.remove('hidden');
        
        // Show success notification
        showNotification('Modelos carregados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    } finally {
        // Reset button state
        fetchModelsBtn.disabled = false;
        fetchModelsBtn.innerHTML = originalBtnText;
    }
}

// Populate the model select dropdown
function populateModelSelect() {
    // Clear existing options except the default one
    while (modelSelect.options.length > 1) {
        modelSelect.remove(1);
    }
    
    // Add models to the dropdown
    availableModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        
        // If this model was previously selected, select it again
        if (model.id === selectedModel) {
            option.selected = true;
        }
        
        modelSelect.appendChild(option);
    });
    
    // Enable the generate button if a model is selected
    if (selectedModel) {
        generateBtn.disabled = false;
        updateModelInfo(selectedModel);
    }
}

// Handle model selection
function handleModelSelection() {
    const selectedModelId = modelSelect.value;
    
    if (selectedModelId) {
        selectedModel = selectedModelId;
        localStorage.setItem('groqSelectedModel', selectedModel);
        
        // Update model info
        updateModelInfo(selectedModelId);
        
        // Enable the generate button
        generateBtn.disabled = false;
    } else {
        generateBtn.disabled = true;
    }
}

// Update model info display
function updateModelInfo(modelId) {
    const model = availableModels.find(m => m.id === modelId);
    
    if (model) {
        let infoText = `<strong>${model.id}</strong>`;
        
        if (model.owned_by) {
            infoText += ` - Desenvolvido por: ${model.owned_by}`;
        }
        
        modelInfoText.innerHTML = infoText;
    } else {
        modelInfoText.textContent = 'Informações do modelo não disponíveis';
    }
}

// Get affirmation style instructions based on selected style
function getAffirmationStyleInstructions() {
    const selectedStyle = affirmationStyleSelect.value;
    
    switch (selectedStyle) {
        case 'short':
            return {
                description: "Frases Curtas",
                instructions: "Use frases curtas e diretas com até 10 palavras. Elas devem ser concisas, impactantes e fáceis de memorizar."
            };
        case 'medium':
            return {
                description: "Frases Médias",
                instructions: "Use frases médias com 11 a 20 palavras. Elas devem balancear detalhes e concisão, fornecendo contexto adicional sem serem muito longas."
            };
        case 'long':
            return {
                description: "Frases Longas",
                instructions: "Use frases longas com mais de 20 palavras. Elas devem ser elaboradas, detalhadas e proporcionar uma visualização mais profunda e contextualizada."
            };
        case 'mixed':
        default:
            return {
                description: "Estilo Misto",
                instructions: "Use uma combinação de frases curtas (até 10 palavras), médias (11-20 palavras) e longas (mais de 20 palavras) para criar variedade e manter o interesse."
            };
    }
}

// Generate affirmations using Groq API
async function generateAffirmations() {
    const userGoal = userGoalTextarea.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const affirmationCount = parseInt(affirmationCountInput.value) || 40;
    const styleInfo = getAffirmationStyleInstructions();
    
    // Validate inputs
    if (!userGoal) {
        showNotification('Por favor, descreva seu objetivo.', 'error');
        return;
    }
    
    if (!apiKey) {
        showNotification('Por favor, insira sua chave API Groq.', 'error');
        return;
    }
    
    if (!selectedModel) {
        showNotification('Por favor, selecione um modelo.', 'error');
        return;
    }
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading-spinner"></span>Gerando...';
    
    try {
        // Prepare the prompt for the API
        const prompt = `
        Atue como um especialista em desenvolvimento pessoal, combinando técnicas de Programação Neurolinguística (PNL), Psicologia Positiva e Terapia Cognitivo-Comportamental (TCC).
        
        Com base no seguinte objetivo do usuário: "${userGoal}", 
        crie exatamente ${affirmationCount} afirmações positivas poderosas que ajudarão a pessoa a alcançar esse objetivo.
        
        ESTILO DAS AFIRMAÇÕES: ${styleInfo.description}
        ${styleInfo.instructions}
        
        IMPORTANTE: Primeiro, explique detalhadamente o raciocínio que você usará para criar as afirmações, incluindo:
        1. Uma análise do objetivo do usuário e os principais desafios implícitos
        2. Como você aplicará técnicas de PNL (como ancoragem, reframing e visualização)
        3. Como você incorporará princípios da Psicologia Positiva (como foco em forças e emoções positivas)
        4. Como você utilizará estratégias da TCC (como reestruturação cognitiva e desafio de crenças limitantes)
        5. Como você aplicará o estilo de frase solicitado (${styleInfo.description}) e por que esse estilo é eficaz para o objetivo
        
        Em seguida, forneça as ${affirmationCount} afirmações, que devem:
        1. Ser escritas na primeira pessoa e no tempo presente (como ordens positivas para o cérebro)
        2. Ser específicas para o objetivo mencionado
        3. Incorporar técnicas de PNL, Psicologia Positiva e TCC
        4. Ser variadas e abordar diferentes aspectos do objetivo
        5. Seguir estritamente o estilo de frase solicitado: ${styleInfo.description}
        
        NÃO INCLUA EXEMPLOS GENÉRICOS DE FRASES. Todas as afirmações devem ser personalizadas para o objetivo do usuário.
        
        Formate sua resposta em JSON com a seguinte estrutura:
        {
          "reasoning": "Seu raciocínio detalhado aqui...",
          "affirmations": ["Afirmação 1", "Afirmação 2", ... "Afirmação ${affirmationCount}"]
        }
        `;
        
        // Call the Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Erro ao chamar a API Groq');
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse the JSON response
        try {
            // Try to parse the response as JSON directly
            const parsedResponse = JSON.parse(content);
            affirmations = parsedResponse.affirmations || [];
            affirmationReasoning = parsedResponse.reasoning || '';
        } catch (e) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedResponse = JSON.parse(jsonMatch[0]);
                affirmations = parsedResponse.affirmations || [];
                affirmationReasoning = parsedResponse.reasoning || '';
            } else {
                throw new Error('Não foi possível extrair as afirmações da resposta');
            }
        }
        
        // Validate that we have the correct number of affirmations
        if (!Array.isArray(affirmations) || affirmations.length !== affirmationCount) {
            throw new Error(`A resposta não contém ${affirmationCount} afirmações`);
        }
        
        // Display the affirmations and reasoning
        displayAffirmations(affirmationCount, styleInfo.description);
        
        // Show success notification
        showNotification('Afirmações geradas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    } finally {
        // Reset button state
        generateBtn.disabled = false;
        generateBtn.textContent = 'Gerar Afirmações';
    }
}

// Display affirmations in the grid
function displayAffirmations(count, styleDescription) {
    // Update the title
    affirmationsTitle.textContent = `Suas ${count} Afirmações Personalizadas (${styleDescription})`;
    
    // Display the reasoning
    reasoningContent.innerHTML = formatReasoning(affirmationReasoning);
    
    // Clear previous affirmations
    affirmationsContainer.innerHTML = '';
    
    // Create and append affirmation cards
    affirmations.forEach((affirmation, index) => {
        const card = document.createElement('div');
        card.className = 'affirmation-card';
        
        const numberElement = document.createElement('div');
        numberElement.className = 'affirmation-number';
        numberElement.textContent = `Afirmação ${index + 1}`;
        
        const textElement = document.createElement('div');
        textElement.className = 'affirmation-text';
        textElement.textContent = affirmation;
        
        // Add a class based on the word count to style differently
        const wordCount = affirmation.split(' ').length;
        if (wordCount <= 10) {
            card.classList.add('short-affirmation');
        } else if (wordCount <= 20) {
            card.classList.add('medium-affirmation');
        } else {
            card.classList.add('long-affirmation');
        }
        
        card.appendChild(numberElement);
        card.appendChild(textElement);
        affirmationsContainer.appendChild(card);
    });
    
    // Show the affirmations section
    affirmationsSection.classList.remove('hidden');
}

// Format the reasoning text with HTML
function formatReasoning(reasoning) {
    if (!reasoning) return '<p>Nenhum raciocínio fornecido.</p>';
    
    // Replace line breaks with paragraph tags
    let formatted = reasoning
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already
    if (!formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('</p>')) {
        formatted = formatted + '</p>';
    }
    
    // Highlight key terms
    formatted = formatted
        .replace(/PNL|Programação Neurolinguística/g, '<strong>$&</strong>')
        .replace(/Psicologia Positiva/g, '<strong>$&</strong>')
        .replace(/TCC|Terapia Cognitivo-Comportamental/g, '<strong>$&</strong>')
        .replace(/Frases Curtas|Frases Médias|Frases Longas|Estilo Misto/g, '<strong>$&</strong>');
    
    return formatted;
}

// Start the affirmation timer
function startTimer() {
    // Get timer settings
    currentInterval = parseInt(intervalInput.value, 10) || 30;
    const startTime = startTimeInput.value;
    const repeatDaily = repeatDailyCheckbox.checked;
    
    // Validate settings
    if (currentInterval < 5) {
        showNotification('O intervalo mínimo é de 5 segundos.', 'error');
        intervalInput.value = 5;
        return;
    }
    
    if (!startTime) {
        showNotification('Por favor, defina um horário de início.', 'error');
        return;
    }
    
    // Parse start time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date();
    startDateTime.setHours(hours, minutes, 0, 0);
    
    // If start time is in the past, schedule for tomorrow
    if (startDateTime < new Date() && repeatDaily) {
        startDateTime.setDate(startDateTime.getDate() + 1);
    }
    
    // Calculate time until start
    const timeUntilStart = startDateTime - new Date();
    
    if (timeUntilStart <= 0) {
        // Start immediately
        startAffirmationDisplay();
    } else {
        // Schedule for later
        showNotification(`Temporizador programado para iniciar em ${formatTimeRemaining(timeUntilStart)}.`, 'success');
        
        timerSchedule = setTimeout(() => {
            startAffirmationDisplay();
        }, timeUntilStart);
    }
    
    // If repeat daily is checked, schedule for tomorrow as well
    if (repeatDaily) {
        // This will be handled when the timer completes a full cycle
    }
}

// Format time remaining in a human-readable format
function formatTimeRemaining(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Start displaying affirmations with timer
function startAffirmationDisplay() {
    // Hide affirmations section and show active affirmation section
    affirmationsSection.classList.add('hidden');
    activeAffirmationSection.classList.remove('hidden');
    
    // Reset index if needed
    if (currentAffirmationIndex >= affirmations.length) {
        currentAffirmationIndex = 0;
    }
    
    // Display the first affirmation
    displayCurrentAffirmation();
    
    // Start the countdown
    startCountdown();
}

// Display the current affirmation
function displayCurrentAffirmation() {
    currentAffirmationElement.textContent = affirmations[currentAffirmationIndex];
}

// Start the countdown timer
function startCountdown() {
    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    let timeLeft = currentInterval;
    countdownElement.textContent = timeLeft;
    
    // Reset progress ring
    updateProgressRing(1);
    
    countdownInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            countdownElement.textContent = timeLeft;
            
            // Update progress ring
            const progress = timeLeft / currentInterval;
            updateProgressRing(progress);
            
            if (timeLeft <= 0) {
                // Move to next affirmation
                currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmations.length;
                
                // If we've completed a full cycle and repeat daily is checked
                if (currentAffirmationIndex === 0 && repeatDailyCheckbox.checked) {
                    // Schedule for tomorrow
                    stopTimer();
                    
                    const [hours, minutes] = startTimeInput.value.split(':').map(Number);
                    const tomorrowStartTime = new Date();
                    tomorrowStartTime.setDate(tomorrowStartTime.getDate() + 1);
                    tomorrowStartTime.setHours(hours, minutes, 0, 0);
                    
                    const timeUntilTomorrow = tomorrowStartTime - new Date();
                    
                    showNotification(`Ciclo completo! Próxima sessão programada para amanhã às ${startTimeInput.value}.`, 'success');
                    
                    timerSchedule = setTimeout(() => {
                        startAffirmationDisplay();
                    }, timeUntilTomorrow);
                    
                    return;
                }
                
                // Display the next affirmation
                displayCurrentAffirmation();
                
                // Reset the timer
                timeLeft = currentInterval;
                countdownElement.textContent = timeLeft;
                updateProgressRing(1);
            }
        }
    }, 1000);
}

// Update the progress ring
function updateProgressRing(progress) {
    const offset = circumference * (1 - progress);
    progressRingCircle.style.strokeDashoffset = offset;
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        showNotification('Temporizador pausado.', 'default');
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        showNotification('Temporizador retomado.', 'default');
    }
}

// Show the next affirmation
function showNextAffirmation() {
    currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmations.length;
    displayCurrentAffirmation();
    
    // Reset the timer
    clearInterval(countdownInterval);
    startCountdown();
}

// Stop the timer
function stopTimer() {
    // Clear intervals and timeouts
    clearInterval(countdownInterval);
    if (timerSchedule) {
        clearTimeout(timerSchedule);
    }
    
    // Reset state
    isPaused = false;
    
    // Show affirmations section and hide active affirmation section
    affirmationsSection.classList.remove('hidden');
    activeAffirmationSection.classList.add('hidden');
    
    showNotification('Temporizador interrompido.', 'default');
}

// Block Management Functions
function openCreateBlockModal() {
    editingBlockIndex = -1;
    blockModal.classList.remove('hidden');
    blockNameInput.value = '';
    blockDescriptionInput.value = '';
    updateBlockAffirmationsList();
}

function openEditBlockModal(index) {
    editingBlockIndex = index;
    const block = blocks[index];
    blockModal.classList.remove('hidden');
    blockNameInput.value = block.name;
    blockDescriptionInput.value = block.description || '';
    updateBlockAffirmationsList(block.affirmations);
}

function closeBlockModal() {
    blockModal.classList.add('hidden');
    editingBlockIndex = -1;
    blockNameInput.value = '';
    blockDescriptionInput.value = '';
}

function updateBlockAffirmationsList(selectedAffirmations = []) {
    blockAffirmationsList.innerHTML = '';
    
    affirmations.forEach((affirmation, index) => {
        const item = document.createElement('div');
        item.className = 'affirmation-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `affirmation-${index}`;
        checkbox.checked = selectedAffirmations.includes(affirmation);
        
        const label = document.createElement('label');
        label.htmlFor = `affirmation-${index}`;
        label.className = 'affirmation-checkbox-text';
        label.textContent = affirmation;
        
        item.appendChild(checkbox);
        item.appendChild(label);
        blockAffirmationsList.appendChild(item);
    });
}

function addAllAffirmationsToBlock() {
    const checkboxes = blockAffirmationsList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function clearBlockAffirmations() {
    const checkboxes = blockAffirmationsList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function saveBlock() {
    const name = blockNameInput.value.trim();
    if (!name) {
        showNotification('Por favor, insira um nome para o bloco.', 'error');
        return;
    }
    
    const selectedAffirmations = Array.from(blockAffirmationsList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => affirmations[parseInt(checkbox.id.split('-')[1])]);
    
    if (selectedAffirmations.length === 0) {
        showNotification('Por favor, selecione pelo menos uma afirmação.', 'error');
        return;
    }
    
    const block = {
        name,
        description: blockDescriptionInput.value.trim(),
        affirmations: selectedAffirmations
    };
    
    if (editingBlockIndex === -1) {
        blocks.push(block);
    } else {
        blocks[editingBlockIndex] = block;
    }
    
    updateBlocksDisplay();
    closeBlockModal();
    saveBlocksConfiguration();
    showNotification('Bloco salvo com sucesso!', 'success');
}

function updateBlocksDisplay() {
    blocksContainer.innerHTML = '';
    
    if (blocks.length === 0) {
        blocksContainer.innerHTML = `
            <div class="empty-blocks-message">
                <i class="fas fa-layer-group"></i>
                <p>Você ainda não criou nenhum bloco. Clique em "Criar Novo Bloco" para começar.</p>
            </div>
        `;
        return;
    }
    
    blocks.forEach((block, index) => {
        const blockElement = document.createElement('div');
        blockElement.className = 'block-item';
        blockElement.draggable = true;
        
        blockElement.innerHTML = `
            <div class="block-info">
                <div class="block-name">${block.name}</div>
                ${block.description ? `<div class="block-description">${block.description}</div>` : ''}
                <div class="block-count">${block.affirmations.length} afirmações</div>
            </div>
            <div class="block-actions-menu">
                <button class="block-action-btn edit-btn" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="block-action-btn delete-btn" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        blockElement.querySelector('.edit-btn').addEventListener('click', () => openEditBlockModal(index));
        blockElement.querySelector('.delete-btn').addEventListener('click', () => deleteBlock(index));
        
        // Add drag and drop functionality
        blockElement.addEventListener('dragstart', handleDragStart);
        blockElement.addEventListener('dragover', handleDragOver);
        blockElement.addEventListener('drop', handleDrop);
        blockElement.addEventListener('dragend', handleDragEnd);
        
        blocksContainer.appendChild(blockElement);
    });
    
    // Update time slot block options
    updateTimeSlotBlockOptions();
}

function deleteBlock(index) {
    if (confirm('Tem certeza que deseja excluir este bloco?')) {
        blocks.splice(index, 1);
        updateBlocksDisplay();
        saveBlocksConfiguration();
        showNotification('Bloco excluído com sucesso!', 'success');
    }
}

// Time Slot Management Functions
function openTimeSlotModal() {
    timeSlotModal.classList.remove('hidden');
    timeSlotTimeInput.value = '';
    timeSlotBlockSelect.value = '';
}

function closeTimeSlotModal() {
    timeSlotModal.classList.add('hidden');
}

function updateTimeSlotBlockOptions() {
    timeSlotBlockSelect.innerHTML = '<option value="" disabled selected>Selecione um bloco</option>';
    
    blocks.forEach((block, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = block.name;
        timeSlotBlockSelect.appendChild(option);
    });
}

function saveTimeSlot() {
    const time = timeSlotTimeInput.value;
    const blockIndex = timeSlotBlockSelect.value;
    
    if (!time || blockIndex === '') {
        showNotification('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    const timeSlot = {
        time,
        blockIndex: parseInt(blockIndex)
    };
    
    timeSlots.push(timeSlot);
    updateTimeSlotsDisplay();
    closeTimeSlotModal();
    saveBlocksConfiguration();
    showNotification('Horário adicionado com sucesso!', 'success');
}

function updateTimeSlotsDisplay() {
    timeSlotsContainer.innerHTML = '';
    
    if (timeSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<p class="empty-message">Nenhum horário configurado.</p>';
        return;
    }
    
    timeSlots.sort((a, b) => a.time.localeCompare(b.time)).forEach((slot, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot-item';
        
        const block = blocks[slot.blockIndex];
        slotElement.innerHTML = `
            <div class="time-slot-info">
                <span class="time-slot-time">${slot.time}</span>
                <span class="time-slot-block">${block ? block.name : 'Bloco não encontrado'}</span>
            </div>
            <div class="time-slot-actions">
                <button class="block-action-btn delete-btn" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        slotElement.querySelector('.delete-btn').addEventListener('click', () => deleteTimeSlot(index));
        timeSlotsContainer.appendChild(slotElement);
    });
}

function deleteTimeSlot(index) {
    if (confirm('Tem certeza que deseja excluir este horário?')) {
        timeSlots.splice(index, 1);
        updateTimeSlotsDisplay();
        saveBlocksConfiguration();
        showNotification('Horário excluído com sucesso!', 'success');
    }
}

// Weekday Selection Functions
function toggleWeekday(event) {
    const button = event.target;
    const day = parseInt(button.dataset.day);
    
    button.classList.toggle('active');
    if (button.classList.contains('active')) {
        selectedDays.add(day);
    } else {
        selectedDays.delete(day);
    }
    
    saveBlocksConfiguration();
}

// Display Mode Functions
function toggleIntervalSettings() {
    const intervalMode = document.getElementById('interval-mode').checked;
    intervalSettings.classList.toggle('hidden', !intervalMode);
}

// Save and Load Configuration Functions
function saveBlocksConfiguration() {
    const configuration = {
        blocks,
        timeSlots,
        selectedDays: Array.from(selectedDays),
        displayMode: document.querySelector('input[name="display-mode"]:checked').value,
        intervalTime: document.getElementById('interval-time').value
    };
    
    localStorage.setItem('mindsetMorningConfig', JSON.stringify(configuration));
}

function loadSavedConfigurations() {
    const savedConfig = localStorage.getItem('mindsetMorningConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        blocks = config.blocks || [];
        timeSlots = config.timeSlots || [];
        selectedDays = new Set(config.selectedDays || []);
        
        // Update display mode
        const displayMode = config.displayMode || 'continuous';
        document.getElementById(`${displayMode}-mode`).checked = true;
        toggleIntervalSettings();
        
        if (config.intervalTime) {
            document.getElementById('interval-time').value = config.intervalTime;
        }
        
        // Update UI
        updateBlocksDisplay();
        updateTimeSlotsDisplay();
        
        // Update weekday buttons
        weekdayButtons.forEach(button => {
            const day = parseInt(button.dataset.day);
            if (selectedDays.has(day)) {
                button.classList.add('active');
            }
        });
    }
}

// Drag and Drop Functions
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        const items = Array.from(blocksContainer.children);
        const draggedIndex = items.indexOf(draggedItem);
        const droppedIndex = items.indexOf(this);
        
        // Reorder blocks array
        const [movedBlock] = blocks.splice(draggedIndex, 1);
        blocks.splice(droppedIndex, 0, movedBlock);
        
        // Update UI
        updateBlocksDisplay();
        saveBlocksConfiguration();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 