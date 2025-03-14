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
    
    // Set the initial progress ring state
    progressRingCircle.style.strokeDasharray = circumference;
    progressRingCircle.style.strokeDashoffset = 0;
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

// Generate affirmations using Groq API
async function generateAffirmations() {
    const userGoal = userGoalTextarea.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const affirmationCount = parseInt(affirmationCountInput.value) || 40;
    
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
        
        IMPORTANTE: Primeiro, explique detalhadamente o raciocínio que você usará para criar as afirmações, incluindo:
        1. Uma análise do objetivo do usuário e os principais desafios implícitos
        2. Como você aplicará técnicas de PNL (como ancoragem, reframing e visualização)
        3. Como você incorporará princípios da Psicologia Positiva (como foco em forças e emoções positivas)
        4. Como você utilizará estratégias da TCC (como reestruturação cognitiva e desafio de crenças limitantes)
        
        Em seguida, forneça as ${affirmationCount} afirmações, que devem:
        1. Ser escritas na primeira pessoa e no tempo presente (como ordens positivas para o cérebro)
        2. Ser específicas para o objetivo mencionado
        3. Incorporar técnicas de PNL, Psicologia Positiva e TCC
        4. Ser variadas e abordar diferentes aspectos do objetivo
        5. Ser concisas, diretas e poderosas
        
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
        displayAffirmations(affirmationCount);
        
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
function displayAffirmations(count) {
    // Update the title
    affirmationsTitle.textContent = `Suas ${count} Afirmações Personalizadas`;
    
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
        .replace(/TCC|Terapia Cognitivo-Comportamental/g, '<strong>$&</strong>');
    
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 