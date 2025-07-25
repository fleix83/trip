// Travel Stories App - Main Logic
// TODO: Implement all functionality

class TravelStoriesApp {
    constructor() {
        this.isRunning = false;
        this.currentPosition = null;
        this.lastStoryLocation = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.speechQueue = [];
        this.selectedVoice = null;
        this.speechPaused = false;
        this.currentAudio = null; // For HTML5 Audio (Google TTS)
        this.audioBlobs = []; // Track blob URLs for cleanup
        this.locationWatchId = null;
        this.storyCheckInterval = null;
        this.debugMode = false;
        this.simulationMode = false;
        this.bypassCache = false;
        this.apiCallCount = 0;
        this.lastNominatimRequest = 0;
        this.simulationPositions = [
            { latitude: 47.5704, longitude: 7.5961, name: 'Basel' },
            { latitude: 46.9480, longitude: 7.4474, name: 'Bern' },
            { latitude: 47.3769, longitude: 8.5417, name: 'Zürich' },
            { latitude: 46.5197, longitude: 6.6323, name: 'Lausanne' },
            { latitude: 46.2044, longitude: 6.1432, name: 'Genf' }
        ];
        this.currentSimulationIndex = 0;
        
        this.init();
    }

    init() {
        // Initialize app components
        this.bindEvents();
        this.loadSettings();
        this.initializeSpeech();
        this.checkGeolocationSupport();
        console.log('Travel Stories App initialized');
    }

    bindEvents() {
        // Settings toggle
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsContent = document.getElementById('settings-content');
        
        if (settingsToggle && settingsContent) {
            settingsToggle.addEventListener('click', () => {
                const isHidden = settingsContent.style.display === 'none';
                settingsContent.style.display = isHidden ? 'block' : 'none';
                settingsToggle.textContent = isHidden ? '⚙️ Einstellungen schließen' : '⚙️ Einstellungen';
            });
        }
        
        // API key save
        const saveApiKeyBtn = document.getElementById('save-api-key');
        const apiKeyInput = document.getElementById('api-key');
        
        if (saveApiKeyBtn && apiKeyInput) {
            saveApiKeyBtn.addEventListener('click', () => {
                let apiKey = apiKeyInput.value.trim();
                
                // If input is empty but we have a saved key, use the saved key
                if (!apiKey && apiKeyInput.dataset.savedKey) {
                    apiKey = apiKeyInput.dataset.savedKey;
                    console.log('💾 Using existing saved API key...');
                } else {
                    console.log('💾 Attempting to save new API key...');
                    console.log('  Input value length:', apiKey.length);
                }
                
                console.log('  Storage key:', CONFIG.STORAGE_KEYS.API_KEY);
                
                if (apiKey) {
                    try {
                        console.log('🧪 Testing localStorage availability...');
                        // Test localStorage availability
                        localStorage.setItem('test', 'test');
                        localStorage.removeItem('test');
                        console.log('✅ localStorage test passed');
                        
                        // Save API key
                        console.log('💾 Saving API key to localStorage...');
                        localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
                        console.log('✅ API key saved to localStorage');
                        
                        // Verify it was saved
                        const savedKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
                        console.log('🔍 Verification - saved key:', savedKey ? `Found (${savedKey.length} chars)` : 'Not found');
                        console.log('🔍 Keys match:', savedKey === apiKey);
                        
                        if (savedKey === apiKey) {
                            this.showMessage('✅ API-Schlüssel erfolgreich gespeichert!');
                            console.log('✅ API key saved and verified successfully');
                            
                            // Update connection status
                            const connectionStatus = document.getElementById('connection-status');
                            if (connectionStatus) {
                                connectionStatus.innerHTML = '🟢 API-Schlüssel konfiguriert';
                            }
                            
                            // Update the placeholder to show the saved key
                            const maskedKey = apiKey.length > 12 ? 
                                apiKey.substring(0, 8) + '...' + apiKey.slice(-4) :
                                apiKey;
                            apiKeyInput.placeholder = `Gespeichert: ${maskedKey}`;
                            apiKeyInput.dataset.savedKey = apiKey;
                        } else {
                            throw new Error('Speicherung fehlgeschlagen - Saved key does not match input');
                        }
                        
                        apiKeyInput.value = ''; // Clear input for security but keep placeholder
                        console.log('🧹 Input field cleared, placeholder updated');
                        
                    } catch (error) {
                        console.error('❌ localStorage error:', error);
                        this.showError('⚠️ Speichern fehlgeschlagen - Browser-Einstellungen prüfen');
                        
                        // Try sessionStorage as fallback
                        try {
                            console.log('🔄 Trying sessionStorage fallback...');
                            sessionStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
                            const sessionSaved = sessionStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
                            console.log('🔍 SessionStorage saved:', sessionSaved ? `Found (${sessionSaved.length} chars)` : 'Not found');
                            this.showMessage('⚠️ API-Key temporär gespeichert (nur für diese Sitzung)');
                        } catch (sessionError) {
                            console.error('❌ sessionStorage error:', sessionError);
                            this.showError('❌ Speichern nicht möglich - Inkognito-Modus?');
                        }
                    }
                } else {
                    console.log('❌ Empty API key input');
                    this.showError('Bitte gib einen gültigen API-Schlüssel ein');
                }
            });
        }
        
        // Google TTS API key save
        const saveGoogleTTSKeyBtn = document.getElementById('save-google-tts-key');
        const googleTTSKeyInput = document.getElementById('google-tts-api-key');
        
        if (saveGoogleTTSKeyBtn && googleTTSKeyInput) {
            saveGoogleTTSKeyBtn.addEventListener('click', () => {
                let ttsApiKey = googleTTSKeyInput.value.trim();
                
                // If input is empty but we have a saved key, use the saved key
                if (!ttsApiKey && googleTTSKeyInput.dataset.savedKey) {
                    ttsApiKey = googleTTSKeyInput.dataset.savedKey;
                    console.log('💾 Using existing saved Google TTS key...');
                } else {
                    console.log('💾 Attempting to save new Google TTS key...');
                    console.log('  Input value length:', ttsApiKey.length);
                }
                
                if (ttsApiKey) {
                    try {
                        localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY, ttsApiKey);
                        const savedKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY);
                        
                        if (savedKey === ttsApiKey) {
                            this.showMessage('✅ Google TTS API-Schlüssel erfolgreich gespeichert!');
                            console.log('✅ Google TTS API key saved and verified successfully');
                            
                            // Update the placeholder to show the saved key
                            const maskedKey = ttsApiKey.length > 12 ? 
                                ttsApiKey.substring(0, 8) + '...' + ttsApiKey.slice(-4) :
                                ttsApiKey;
                            googleTTSKeyInput.placeholder = `Gespeichert: ${maskedKey}`;
                            googleTTSKeyInput.dataset.savedKey = ttsApiKey;
                        } else {
                            throw new Error('Speicherung fehlgeschlagen');
                        }
                        
                        googleTTSKeyInput.value = ''; // Clear input for security
                        
                    } catch (error) {
                        console.error('❌ Google TTS localStorage error:', error);
                        this.showError('⚠️ Google TTS Speichern fehlgeschlagen');
                        
                        try {
                            sessionStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY, ttsApiKey);
                            this.showMessage('⚠️ Google TTS API-Key temporär gespeichert');
                        } catch (sessionError) {
                            this.showError('❌ Google TTS Speichern nicht möglich');
                        }
                    }
                } else {
                    // Empty input - remove the key
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY);
                    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY);
                    googleTTSKeyInput.placeholder = 'Google TTS API-Schlüssel eingeben (optional)';
                    googleTTSKeyInput.dataset.savedKey = '';
                    this.showMessage('🗑️ Google TTS API-Schlüssel entfernt');
                }
            });
        }
        
        // Debug mode toggle
        const debugModeCheckbox = document.getElementById('debug-mode');
        if (debugModeCheckbox) {
            debugModeCheckbox.addEventListener('change', () => {
                this.toggleDebugMode();
            });
        }

        // Simulation mode toggle
        const simulationModeCheckbox = document.getElementById('simulation-mode');
        if (simulationModeCheckbox) {
            simulationModeCheckbox.addEventListener('change', () => {
                this.simulationMode = simulationModeCheckbox.checked;
                console.log(`🎭 Simulation mode: ${this.simulationMode ? 'ON' : 'OFF'}`);
                if (this.simulationMode) {
                    this.updateStatus('🎭 Simulationsmodus aktiv');
                }
            });
        }
        
        // Dark mode toggle
        const darkModeCheckbox = document.getElementById('dark-mode');
        if (darkModeCheckbox) {
            darkModeCheckbox.addEventListener('change', () => {
                this.toggleDarkMode();
            });
        }
        
        // Voice speed control
        const voiceSpeedSlider = document.getElementById('voice-speed');
        const speedValue = document.getElementById('speed-value');
        
        if (voiceSpeedSlider && speedValue) {
            voiceSpeedSlider.addEventListener('input', () => {
                const speed = parseFloat(voiceSpeedSlider.value);
                speedValue.textContent = `${speed}x`;
                this.speechRate = speed;
            });
        }
        
        // Main control buttons
        const mainButton = document.getElementById('main-button');
        const stopButton = document.getElementById('stop-button');
        
        if (mainButton) {
            mainButton.addEventListener('click', () => {
                this.startStories();
            });
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.stopStories();
            });
        }
        
        // Story control buttons
        const repeatButton = document.getElementById('repeat-button');
        const skipButton = document.getElementById('skip-button');
        
        if (repeatButton) {
            repeatButton.addEventListener('click', () => {
                this.repeatCurrentStory();
            });
        }
        
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                this.skipToNextStory();
            });
        }
        
        // Story prompt save and reset
        const savePromptBtn = document.getElementById('save-prompt');
        const resetPromptBtn = document.getElementById('reset-prompt');
        const promptTextarea = document.getElementById('story-prompt');
        
        if (savePromptBtn && promptTextarea) {
            savePromptBtn.addEventListener('click', () => {
                const customPrompt = promptTextarea.value.trim();
                if (customPrompt) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT, customPrompt);
                    this.showMessage('✅ Story-Prompt erfolgreich gespeichert!');
                    console.log('💾 Custom prompt saved:', customPrompt.substring(0, 50) + '...');
                } else {
                    this.showError('Prompt darf nicht leer sein');
                }
            });
        }
        
        if (resetPromptBtn && promptTextarea) {
            resetPromptBtn.addEventListener('click', () => {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT);
                this.loadDefaultPrompt();
                this.showMessage('🔄 Standard-Prompt wiederhergestellt!');
                console.log('🔄 Custom prompt reset to default');
            });
        }
        
        // TTS Voice selection
        const voiceSelect = document.getElementById('tts-voice-select');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', () => {
                const selectedVoice = voiceSelect.value;
                localStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_VOICE, selectedVoice);
                console.log('🎤 TTS voice changed to:', CONFIG.GOOGLE_TTS_VOICES[selectedVoice]?.name || selectedVoice);
                this.showMessage(`✅ Stimme geändert zu: ${CONFIG.GOOGLE_TTS_VOICES[selectedVoice]?.name || selectedVoice}`);
            });
        }
        
        console.log('Events bound successfully');
    }

    loadSettings() {
        // Load dark mode setting
        const darkMode = localStorage.getItem(CONFIG.STORAGE_KEYS.DARK_MODE);
        if (darkMode === 'false') {
            document.body.classList.add('light-mode');
            const darkModeCheckbox = document.getElementById('dark-mode');
            if (darkModeCheckbox) {
                darkModeCheckbox.checked = false;
            }
        }
        
        // Load last position
        const lastPosition = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_POSITION);
        if (lastPosition) {
            try {
                this.currentPosition = JSON.parse(lastPosition);
                this.updateLocationDisplay(this.currentPosition);
            } catch (error) {
                console.error('Error loading last position:', error);
            }
        }
        
        // Load API key back into input field (but only show first few chars for security)
        const savedApiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || 
                           sessionStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        
        if (savedApiKey) {
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                // Show only first 8 and last 4 characters for security
                const maskedKey = savedApiKey.length > 12 ? 
                    savedApiKey.substring(0, 8) + '...' + savedApiKey.slice(-4) :
                    savedApiKey;
                apiKeyInput.placeholder = `Gespeichert: ${maskedKey}`;
                // Store the full key in a data attribute for later use
                apiKeyInput.dataset.savedKey = savedApiKey;
            }
            
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                const storageType = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) ? 'permanent' : 'temporär';
                connectionStatus.innerHTML = `🟢 API-Schlüssel konfiguriert (${storageType})`;
            }
        }
        
        // Load Google TTS API key
        const savedGoogleTTSKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY) || 
                                  sessionStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY);
        
        if (savedGoogleTTSKey) {
            const googleTTSKeyInput = document.getElementById('google-tts-api-key');
            if (googleTTSKeyInput) {
                const maskedKey = savedGoogleTTSKey.length > 12 ? 
                    savedGoogleTTSKey.substring(0, 8) + '...' + savedGoogleTTSKey.slice(-4) :
                    savedGoogleTTSKey;
                googleTTSKeyInput.placeholder = `Gespeichert: ${maskedKey}`;
                googleTTSKeyInput.dataset.savedKey = savedGoogleTTSKey;
            }
        }
        
        // Load selected TTS voice
        const savedVoice = localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_VOICE);
        const voiceSelect = document.getElementById('tts-voice-select');
        if (voiceSelect) {
            if (savedVoice && CONFIG.GOOGLE_TTS_VOICES[savedVoice]) {
                voiceSelect.value = savedVoice;
            } else {
                voiceSelect.value = CONFIG.DEFAULT_GOOGLE_TTS_VOICE;
            }
        }
        
        // Load custom prompt
        this.loadDefaultPrompt();
        
        console.log('Settings loaded');
    }

    // Load default or custom prompt into textarea
    loadDefaultPrompt() {
        const promptTextarea = document.getElementById('story-prompt');
        if (!promptTextarea) return;
        
        const customPrompt = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT);
        const defaultPrompt = `Du bist ein charismatischer Reiseführer. Erzähle eine fesselnde, 90-120 Wörter lange Geschichte über {city}, {region}, {country}.

Fokus auf: Historische Anekdoten, Legenden, interessante Fakten, lokale Besonderheiten.
Stil: Spannend, unterhaltsam, für Autofahrer geeignet.
Vermeide: Lange Listen, komplizierte Namen, langweilige Fakten.

Beginne direkt mit der Geschichte, ohne Einleitung.`;
        
        promptTextarea.value = customPrompt || defaultPrompt;
        console.log('📝 Prompt loaded:', customPrompt ? 'Custom' : 'Default');
    }

    // Initialize speech synthesis
    initializeSpeech() {
        if (!this.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Wait for voices to load
        const loadVoices = () => {
            const voices = this.speechSynthesis.getVoices();
            
            // Prefer German voices
            const germanVoices = voices.filter(voice => 
                voice.lang.startsWith('de') || 
                voice.name.toLowerCase().includes('german') ||
                voice.name.toLowerCase().includes('deutsch')
            );
            
            if (germanVoices.length > 0) {
                this.selectedVoice = germanVoices[0];
                console.log('Selected German voice:', this.selectedVoice.name);
            } else {
                // Fallback to first available voice
                this.selectedVoice = voices[0] || null;
                console.log('Using fallback voice:', this.selectedVoice?.name || 'default');
            }
        };

        // Voices might load asynchronously
        if (this.speechSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            this.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    checkGeolocationSupport() {
        if (!navigator.geolocation) {
            this.showError(CONFIG.ERRORS.NO_GEOLOCATION);
            return false;
        }
        
        // Update UI to show geolocation is supported
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.innerHTML = '🟡 GPS wird initialisiert...';
        }
        
        // Enable the main button since GPS is supported
        const mainButton = document.getElementById('main-button');
        if (mainButton) {
            mainButton.disabled = false;
        }
        
        return true;
    }

    async startStories() {
        if (this.isRunning) {
            console.log('Stories already running');
            return;
        }

        console.log('🚀 Starting stories...');

        try {
            // Check geolocation support first
            if (!this.checkGeolocationSupport()) {
                console.log('❌ Geolocation not supported');
                return;
            }

            this.isRunning = true;
            this.updateUI();
            console.log('✅ UI updated, getting GPS position...');

            // Get initial GPS position
            const position = await this.getCurrentLocation();
            console.log('✅ GPS position obtained:', position);
            
            // Start the story generation process
            console.log('🔄 Processing location for story...');
            await this.processLocationForStory(position);
            console.log('✅ Initial story processed');
            
            // Set up interval for checking position every 30 seconds
            this.storyCheckInterval = setInterval(async () => {
                if (!this.isRunning) return;
                
                try {
                    const newPosition = await this.getCurrentLocation();
                    await this.processLocationForStory(newPosition);
                } catch (error) {
                    console.error('Position check error:', error);
                }
            }, CONFIG.STORY_CHECK_INTERVAL);

            console.log('🎉 Stories started successfully');

        } catch (error) {
            console.error('❌ Failed to start stories:', error);
            
            // If GPS failed, try to use a fallback story for common locations
            if (error.message.includes('GPS') || error.message.includes('Position')) {
                console.log('🔄 GPS failed, trying fallback story...');
                try {
                    // Use a generic location info for Switzerland/Basel area
                    const fallbackLocationInfo = {
                        city: 'Basel',
                        state: 'Basel-Stadt', 
                        country: 'Schweiz',
                        displayName: 'Basel, Schweiz'
                    };
                    
                    const story = await this.generateStory(fallbackLocationInfo);
                    
                    const storyElement = document.getElementById('story-content');
                    if (storyElement) {
                        storyElement.innerHTML = `
                            <div style="color: var(--warning); font-size: 0.9em; margin-bottom: 10px;">
                                📍 GPS nicht verfügbar - Beispiel-Geschichte für Basel
                            </div>
                            <div>${story}</div>
                        `;
                    }
                    
                    this.speakStory(story);
                    console.log('✅ Fallback story displayed');
                    
                } catch (fallbackError) {
                    console.error('❌ Fallback story also failed:', fallbackError);
                    this.showError(error.message);
                }
            } else {
                this.showError(error.message);
            }
            
            this.isRunning = false;
            this.updateUI();
        }
    }

    stopStories() {
        this.isRunning = false;
        
        // Clear intervals
        if (this.storyCheckInterval) {
            clearInterval(this.storyCheckInterval);
            this.storyCheckInterval = null;
        }
        
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }

        // Stop any current speech
        if (this.currentUtterance) {
            this.speechSynthesis.cancel();
            this.currentUtterance = null;
        }

        this.updateUI();
        console.log('Stories stopped');
    }

    // Process location and generate story if needed
    async processLocationForStory(position, manual = false) {
        console.log('📍 Processing location for story...', { manual, position });
        
        try {
            // Update status
            this.updateStatus('🤔 Prüfe ob neue Geschichte nötig...');
            
            // Check if we should fetch a new story
            const shouldFetch = this.shouldFetchNewStory(position, manual);
            console.log('🤔 Should fetch new story?', shouldFetch);
            
            if (!shouldFetch) {
                console.log('⏭️ No new story needed - distance too small or conditions not met');
                this.updateStatus('✅ Position aktuell - keine neue Geschichte nötig');
                return;
            }

            // Show loading state
            this.showLoading(true);
            this.updateStatus('🗺️ Suche Ortsinformationen...');
            console.log('⏳ Loading state activated');

            // Get location information via reverse geocoding
            console.log('🗺️ Starting reverse geocoding...');
            const locationInfo = await this.reverseGeocode(position.latitude, position.longitude);
            console.log('✅ Location info received:', locationInfo);
            
            this.updateStatus(`📍 Ort gefunden: ${locationInfo.city || 'Unbekannt'}`);

            // Generate and display story
            console.log('📝 Generating story...');
            this.updateStatus('🤖 Generiere Geschichte...');
            const story = await this.generateStory(locationInfo);
            console.log('✅ Story generated:', story.substring(0, 100) + '...');
            
            this.updateStatus('📖 Geschichte bereit!');
            
            // Update UI with story
            const storyElement = document.getElementById('story-content');
            if (storyElement) {
                storyElement.textContent = story;
                console.log('✅ Story displayed in UI');
            }

            // Speak the story
            console.log('🔊 Starting text-to-speech...');
            this.updateStatus('🔊 Spreche Geschichte...');
            this.speakStory(story);

            // Update last story location
            this.lastStoryLocation = position;
            console.log('📍 Last story location updated');
            
            if (this.debugMode) {
                this.updateDebugInfo();
            }

        } catch (error) {
            console.error('❌ Story processing error:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
            console.log('✅ Loading state deactivated');
        }
    }

    // Update UI based on running state
    updateUI() {
        const mainButton = document.getElementById('main-button');
        const stopButton = document.getElementById('stop-button');
        const repeatButton = document.getElementById('repeat-button');
        const skipButton = document.getElementById('skip-button');

        if (mainButton && stopButton) {
            if (this.isRunning) {
                mainButton.style.display = 'none';
                stopButton.style.display = 'block';
            } else {
                mainButton.style.display = 'block';
                stopButton.style.display = 'none';
            }
        }

        if (repeatButton && skipButton) {
            repeatButton.disabled = !this.isRunning;
            skipButton.disabled = !this.isRunning;
        }
    }

    // Show/hide loading indicator
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // Update status display
    updateStatus(message) {
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.innerHTML = message;
        }
        console.log('📢 Status:', message);
    }

    async getCurrentLocation() {
        // Use simulation mode if enabled
        if (this.simulationMode) {
            return this.getSimulatedLocation();
        }

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error(CONFIG.ERRORS.NO_GEOLOCATION));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };
                    
                    this.currentPosition = location;
                    this.updateLocationDisplay(location);
                    
                    if (this.debugMode) {
                        console.log('GPS Position updated:', location);
                    }
                    
                    resolve(location);
                },
                (error) => {
                    let errorMessage;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = CONFIG.ERRORS.LOCATION_DENIED;
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = CONFIG.ERRORS.LOCATION_UNAVAILABLE;
                            break;
                        case error.TIMEOUT:
                            errorMessage = CONFIG.ERRORS.LOCATION_TIMEOUT;
                            break;
                        default:
                            errorMessage = 'Unbekannter GPS-Fehler';
                    }
                    
                    this.showError(errorMessage);
                    reject(new Error(errorMessage));
                },
                CONFIG.GEOLOCATION_OPTIONS
            );
        });
    }

    async reverseGeocode(lat, lon) {
        // Rate limiting: wait at least 1 second between Nominatim requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastNominatimRequest;
        if (timeSinceLastRequest < CONFIG.NOMINATIM_REQUEST_DELAY) {
            await this.sleep(CONFIG.NOMINATIM_REQUEST_DELAY - timeSinceLastRequest);
        }
        
        const url = `${CONFIG.NOMINATIM_API_URL}?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=de`;
        
        try {
            this.lastNominatimRequest = Date.now();
            const response = await this.fetchWithRetry(url, {
                headers: {
                    'User-Agent': 'TravelStories/1.0'
                }
            });
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(CONFIG.ERRORS.RATE_LIMITED);
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !data.address) {
                throw new Error('Keine Ortsinformationen gefunden');
            }
            
            const locationInfo = {
                city: data.address.city || data.address.town || data.address.village || data.address.hamlet,
                state: data.address.state,
                country: data.address.country,
                displayName: data.display_name,
                coordinates: { lat, lon }
            };
            
            if (this.debugMode) {
                console.log('Reverse geocoding result:', locationInfo);
            }
            
            return locationInfo;
            
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw new Error(`${CONFIG.ERRORS.GEOCODING_ERROR}: ${error.message}`);
        }
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in meters
        
        if (this.debugMode) {
            console.log(`Distance calculated: ${Math.round(distance)}m`);
        }
        
        return distance;
    }

    // Check if we should fetch a new story based on distance or manual request
    shouldFetchNewStory(currentLocation, manual = false) {
        if (manual) {
            if (this.debugMode) {
                console.log('Manual story request');
            }
            return true;
        }
        
        if (!this.lastStoryLocation) {
            if (this.debugMode) {
                console.log('No previous story location - fetching first story');
            }
            return true;
        }
        
        const distance = this.calculateDistance(
            this.lastStoryLocation.latitude,
            this.lastStoryLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );
        
        const shouldFetch = distance >= CONFIG.MIN_DISTANCE_FOR_NEW_STORY;
        
        if (this.debugMode) {
            console.log(`Distance: ${Math.round(distance)}m, Min required: ${CONFIG.MIN_DISTANCE_FOR_NEW_STORY}m, Should fetch: ${shouldFetch}`);
        }
        
        return shouldFetch;
    }

    // Utility function for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fetch with retry logic for API calls
    async fetchWithRetry(url, options = {}, maxRetries = CONFIG.MAX_RETRIES) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                return response;
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
                    if (this.debugMode) {
                        console.log(`Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                    }
                    await this.sleep(delay);
                } else {
                    if (this.debugMode) {
                        console.log(`All ${maxRetries + 1} fetch attempts failed`);
                    }
                }
            }
        }
        
        throw new Error(`${CONFIG.ERRORS.NETWORK_ERROR}: ${lastError.message}`);
    }

    // Update location display in UI
    updateLocationDisplay(location) {
        const locationElement = document.getElementById('current-location');
        const connectionStatus = document.getElementById('connection-status');
        
        if (locationElement) {
            const accuracy = Math.round(location.accuracy);
            locationElement.innerHTML = `📍 GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (±${accuracy}m)`;
        }
        
        if (connectionStatus) {
            connectionStatus.innerHTML = '🟢 GPS verbunden';
        }
        
        // Save to localStorage
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_POSITION, JSON.stringify(location));
    }

    async generateStory(locationInfo) {
        try {
            console.log('🤖 Generating fresh story via API (no caching)');
            
            // Check API key (try localStorage first, then sessionStorage)
            console.log('🔍 Checking for API key...');
            console.log('  localStorage keys:', Object.keys(localStorage));
            console.log('  CONFIG.STORAGE_KEYS.API_KEY:', CONFIG.STORAGE_KEYS.API_KEY);
            
            let apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
            console.log('  localStorage API key:', apiKey ? `Found (${apiKey.length} chars)` : 'Not found');
            
            if (!apiKey) {
                apiKey = sessionStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
                console.log('  sessionStorage API key:', apiKey ? `Found (${apiKey.length} chars)` : 'Not found');
            }
            
            if (!apiKey) {
                console.log('❌ No API key found anywhere, using fallback story');
                // Use fallback story if available
                const fallbackStory = this.getFallbackStory(locationInfo);
                if (fallbackStory) {
                    return fallbackStory;
                }
                throw new Error(CONFIG.ERRORS.NO_API_KEY);
            }
            
            console.log('🔑 API key found, attempting to generate story via Gemini');
            console.log('🔍 API key details:', {
                length: apiKey.length,
                startsWithAIza: apiKey.startsWith('AIza'),
                preview: apiKey.substring(0, 8) + '...'
            });
            console.log('🔍 Debug info:', {
                apiKeyLength: apiKey.length,
                apiKeyStart: apiKey.substring(0, 6) + '...',
                locationInfo,
                userAgent: navigator.userAgent.substring(0, 50)
            });
            
            // Generate prompt
            const prompt = this.buildPrompt(locationInfo);
            
            // Call Gemini API
            const story = await this.callGeminiAPI(prompt, apiKey);
            
            console.log('✅ Fresh story generated via API for:', locationInfo.city);
            
            return story;
            
        } catch (error) {
            console.error('Story generation error:', error);
            
            // Always try fallback story on mobile errors
            const fallbackStory = this.getFallbackStory(locationInfo);
            if (fallbackStory) {
                console.log('📱 Using fallback story due to API error on mobile');
                this.showError(`API-Fehler auf Mobile - Verwende Offline-Geschichte`);
                return fallbackStory;
            }
            
            // If no fallback available, throw original error
            throw error;
        }
    }

    // Build prompt for Gemini API
    buildPrompt(locationInfo) {
        const city = locationInfo.city || 'diesem Ort';
        const region = locationInfo.state || 'der Region';  
        const country = locationInfo.country || 'Deutschland';
        
        // Get custom prompt or use default
        const customPrompt = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT);
        const defaultPrompt = `Du bist ein charismatischer Reiseführer. Erzähle eine fesselnde, 90-120 Wörter lange Geschichte über {city}, {region}, {country}.

Fokus auf: Historische Anekdoten, Legenden, interessante Fakten, lokale Besonderheiten.
Stil: Spannend, unterhaltsam, für Autofahrer geeignet.
Vermeide: Lange Listen, komplizierte Namen, langweilige Fakten.

Beginne direkt mit der Geschichte, ohne Einleitung.`;
        
        const promptTemplate = customPrompt || defaultPrompt;
        
        // Replace placeholders with actual location info
        return promptTemplate
            .replace(/{city}/g, city)
            .replace(/{region}/g, region)
            .replace(/{country}/g, country);
    }

    // Call Gemini API
    async callGeminiAPI(prompt, apiKey) {
        // Validate API key format
        if (!apiKey || !apiKey.startsWith('AIza')) {
            throw new Error(CONFIG.ERRORS.GEMINI_AUTH_ERROR);
        }
        
        const url = `${CONFIG.GEMINI_API_URL}?key=${apiKey}`;
        
        // Simplified request body for better mobile compatibility
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt.trim()
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 150,
                topP: 0.8,
                topK: 40
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH", 
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        console.log('📤 Sending Gemini API request...', { url: url.replace(apiKey, 'API_KEY_HIDDEN') });
        
        // Increment API call counter
        this.apiCallCount++;
        console.log(`📊 API Call #${this.apiCallCount}`);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📥 Gemini API response status:', response.status);
            
            // Get response text for better error debugging
            const responseText = await response.text();
            console.log('📥 Gemini API response:', responseText.substring(0, 200));
            
            if (response.status === 400) {
                console.error('❌ Gemini API 400 Error - Request body:', JSON.stringify(requestBody, null, 2));
                throw new Error('Ungültige API-Anfrage - Möglicherweise ist der API-Schlüssel falsch konfiguriert');
            }
            
            if (response.status === 401) {
                throw new Error(CONFIG.ERRORS.GEMINI_AUTH_ERROR);
            }
            
            if (response.status === 429) {
                throw new Error(CONFIG.ERRORS.GEMINI_QUOTA_ERROR);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', parseError);
                throw new Error('Ungültige API-Antwort erhalten');
            }
            
            return this.parseGeminiResponse(data);
            
        } catch (error) {
            console.error('❌ Gemini API call failed:', error);
            
            if (error.message.includes('GEMINI_') || error.message.includes('Ungültige')) {
                throw error;
            }
            
            // Network or other errors
            throw new Error(`${CONFIG.ERRORS.STORY_GENERATION_ERROR}: ${error.message}`);
        }
    }

    // Parse Gemini API response
    parseGeminiResponse(response) {
        try {
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('Keine Geschichte generiert');
            }
            
            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('Leere Antwort erhalten');
            }
            
            const story = candidate.content.parts[0].text.trim();
            
            if (story.length < 50) {
                throw new Error('Geschichte zu kurz');
            }
            
            return story;
            
        } catch (error) {
            throw new Error(`Fehler beim Verarbeiten der API-Antwort: ${error.message}`);
        }
    }

    // Call Google Text-to-Speech API
    async callGoogleTTS(text, apiKey) {
        if (!apiKey || !apiKey.startsWith('AIza')) {
            throw new Error(CONFIG.ERRORS.GOOGLE_TTS_AUTH_ERROR);
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Kein Text für TTS angegeben');
        }

        const selectedVoice = localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_VOICE) || CONFIG.DEFAULT_GOOGLE_TTS_VOICE;
        const voiceConfig = CONFIG.GOOGLE_TTS_VOICES[selectedVoice];

        const requestBody = {
            input: { text: text.trim() },
            voice: {
                languageCode: selectedVoice.substring(0, 5), // e.g., 'de-DE'
                name: selectedVoice,
                ssmlGender: voiceConfig?.gender || 'MALE'
            },
            audioConfig: {
                ...CONFIG.DEFAULT_GOOGLE_TTS_AUDIO_CONFIG,
                speakingRate: this.speechRate || CONFIG.DEFAULT_SPEECH_RATE
            }
        };

        try {
            console.log('🎤 Calling Google TTS API...');
            console.log(`  Voice: ${voiceConfig?.name || selectedVoice}`);
            console.log(`  Text length: ${text.length} characters`);

            const response = await this.fetchWithRetry(
                `${CONFIG.GOOGLE_TTS_API_URL}?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 400) {
                    throw new Error(CONFIG.ERRORS.GOOGLE_TTS_AUTH_ERROR);
                } else if (response.status === 429) {
                    throw new Error(CONFIG.ERRORS.GOOGLE_TTS_QUOTA_ERROR);
                } else {
                    throw new Error(`Google TTS API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
            }

            const data = await response.json();
            
            if (!data.audioContent) {
                throw new Error('Keine Audio-Daten erhalten');
            }

            console.log('✅ Google TTS API call successful');
            return data.audioContent; // Base64 encoded MP3
            
        } catch (error) {
            console.error('❌ Google TTS API call failed:', error);
            
            if (error.message.includes('GOOGLE_TTS_') || error.message.includes('Ungültige')) {
                throw error;
            }
            
            throw new Error(`${CONFIG.ERRORS.GOOGLE_TTS_ERROR}: ${error.message}`);
        }
    }

    // Convert base64 audio to playable blob URL
    createAudioFromBase64(base64Audio) {
        try {
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            return URL.createObjectURL(blob);
            
        } catch (error) {
            throw new Error(`Fehler beim Erstellen der Audio-Datei: ${error.message}`);
        }
    }

    async speakStory(text) {
        if (!text) {
            console.warn('No text to speak');
            return;
        }

        try {
            // Cancel any current speech/audio
            this.stopSpeech();

            // Try Google TTS first if API key is available
            const googleTTSKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY) || 
                                sessionStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_TTS_API_KEY);

            if (googleTTSKey) {
                try {
                    console.log('🎯 Attempting Google TTS...');
                    const base64Audio = await this.callGoogleTTS(text, googleTTSKey);
                    const audioUrl = this.createAudioFromBase64(base64Audio);
                    
                    // Clean up previous audio blobs
                    this.audioBlobs.forEach(url => URL.revokeObjectURL(url));
                    this.audioBlobs = [audioUrl];
                    
                    // Create and configure HTML5 Audio
                    this.currentAudio = new Audio(audioUrl);
                    this.currentAudio.preload = 'auto';
                    
                    // Set up event handlers
                    this.currentAudio.addEventListener('loadstart', () => {
                        console.log('🔊 Google TTS audio loading...');
                    });
                    
                    this.currentAudio.addEventListener('canplay', () => {
                        console.log('🎵 Google TTS audio ready to play');
                    });
                    
                    this.currentAudio.addEventListener('play', () => {
                        console.log('🔊 Google TTS playback started');
                        this.speechPaused = false;
                        this.updateSpeechUI(true);
                    });

                    this.currentAudio.addEventListener('ended', () => {
                        console.log('🔇 Google TTS playback ended');
                        this.currentAudio = null;
                        this.speechPaused = false;
                        this.updateSpeechUI(false);
                        this.onSpeechEnd();
                    });

                    this.currentAudio.addEventListener('error', (event) => {
                        console.error('❌ Google TTS audio error:', event.error);
                        this.fallbackToWebSpeech(text);
                    });

                    this.currentAudio.addEventListener('pause', () => {
                        this.speechPaused = true;
                        this.updateSpeechUI(true, true);
                    });

                    // Start playback
                    await this.currentAudio.play();
                    console.log('✅ Google TTS playback started successfully');
                    return;
                    
                } catch (googleTTSError) {
                    console.warn('⚠️ Google TTS failed, falling back to Web Speech:', googleTTSError.message);
                    this.fallbackToWebSpeech(text);
                    return;
                }
            }

            // Fallback to Web Speech API
            console.log('🎯 Using Web Speech API fallback...');
            this.fallbackToWebSpeech(text);

        } catch (error) {
            console.error('Speech error:', error);
            this.showError(`${CONFIG.ERRORS.SPEECH_ERROR}: ${error.message}`);
            this.showOfflineTextFallback(text);
        }
    }

    // Fallback to Web Speech API
    fallbackToWebSpeech(text) {
        try {
            // Check if speech synthesis is supported
            if (!this.speechSynthesis) {
                console.warn('Speech synthesis not supported, using text fallback');
                this.showOfflineTextFallback(text);
                return;
            }

            // Create new utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Set speech parameters optimized for driving
            this.currentUtterance.rate = this.speechRate || 0.9;
            this.currentUtterance.pitch = CONFIG.DEFAULT_SPEECH_PITCH;
            this.currentUtterance.volume = CONFIG.DEFAULT_SPEECH_VOLUME;
            this.currentUtterance.lang = 'de-DE';
            
            // Use selected German voice if available
            if (this.selectedVoice) {
                this.currentUtterance.voice = this.selectedVoice;
            }

            // Event handlers
            this.currentUtterance.onstart = () => {
                this.speechPaused = false;
                console.log('🔊 Web Speech started');
                this.updateSpeechUI(true);
            };

            this.currentUtterance.onend = () => {
                console.log('🔇 Web Speech ended');
                this.currentUtterance = null;
                this.speechPaused = false;
                this.updateSpeechUI(false);
                this.onSpeechEnd();
            };

            this.currentUtterance.onerror = (event) => {
                console.error('❌ Web Speech error:', event.error);
                this.currentUtterance = null;
                this.speechPaused = false;
                this.updateSpeechUI(false);
                this.showOfflineTextFallback(text);
            };

            this.currentUtterance.onpause = () => {
                this.speechPaused = true;
                this.updateSpeechUI(true, true);
            };

            this.currentUtterance.onresume = () => {
                this.speechPaused = false;
                this.updateSpeechUI(true, false);
            };

            // Start speaking
            this.speechSynthesis.speak(this.currentUtterance);
            console.log('🎤 Web Speech started:', text.substring(0, 50) + '...');

        } catch (error) {
            console.error('Web Speech synthesis error:', error);
            this.showOfflineTextFallback(text);
        }
    }

    // Pause/Resume speech (handles both Google TTS and Web Speech)
    pauseSpeech() {
        if (this.currentAudio) {
            // Google TTS Audio
            if (this.speechPaused) {
                this.currentAudio.play();
                console.log('▶️ Google TTS resumed');
            } else {
                this.currentAudio.pause();
                console.log('⏸️ Google TTS paused');
            }
        } else if (this.currentUtterance) {
            // Web Speech API
            if (this.speechPaused) {
                this.speechSynthesis.resume();
                console.log('▶️ Web Speech resumed');
            } else {
                this.speechSynthesis.pause();
                console.log('⏸️ Web Speech paused');
            }
        }
    }

    // Stop speech and clear queue (handles both Google TTS and Web Speech)
    stopSpeech() {
        // Stop Google TTS Audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            console.log('⏹️ Google TTS stopped');
        }
        
        // Stop Web Speech API
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        // Clean up
        this.currentUtterance = null;
        this.speechPaused = false;
        this.speechQueue = [];
        
        // Clean up audio blobs
        this.audioBlobs.forEach(url => URL.revokeObjectURL(url));
        this.audioBlobs = [];
        
        this.updateSpeechUI(false);
        console.log('⏹️ All speech stopped and cleaned up');
    }

    // Set voice settings
    setVoiceSettings(rate, pitch, volume) {
        this.speechRate = rate || CONFIG.DEFAULT_SPEECH_RATE;
        console.log(`🎚️ Voice settings updated - Rate: ${this.speechRate}, Pitch: ${pitch}, Volume: ${volume}`);
    }

    // Callback after speech ends
    onSpeechEnd() {
        // Could trigger next story or other actions
        console.log('📝 Speech ended - ready for next story');
    }

    // Update speech-related UI elements
    updateSpeechUI(isSpeaking, isPaused = false) {
        // This could update play/pause buttons, visual indicators, etc.
        // For now, just log the state
        const state = isPaused ? 'paused' : (isSpeaking ? 'speaking' : 'stopped');
        console.log(`🎭 Speech UI state: ${state}`);
    }

    // Offline fallback - show text visually with enhanced formatting
    showOfflineTextFallback(text) {
        console.log('📋 Using offline text fallback');
        
        const storyElement = document.getElementById('story-content');
        if (storyElement) {
            // Add visual indicator that this is fallback mode
            storyElement.innerHTML = `
                <div style="color: var(--warning); font-size: 0.9em; margin-bottom: 10px;">
                    🔇 Audio nicht verfügbar - Text wird angezeigt
                </div>
                <div style="font-size: 1.1em; line-height: 1.6;">${text}</div>
            `;
        }
    }

    showError(message) {
        console.error('Error:', message);
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.hideError();
            }, 10000);
        }
        
        // Update connection status if it's a GPS-related error
        if (message.includes('GPS') || message.includes('Position')) {
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.innerHTML = '🔴 GPS-Fehler';
            }
        }
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Toggle debug mode
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        
        if (this.debugMode) {
            // Add debug info to UI
            this.addDebugInfo();
        } else {
            this.removeDebugInfo();
        }
    }

    // Add debug information to UI
    addDebugInfo() {
        let debugPanel = document.getElementById('debug-panel');
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'debug-panel';
            debugPanel.className = 'debug-panel';
            debugPanel.innerHTML = `
                <h3>🔧 Debug Modus</h3>
                <div id="debug-position">Position: Warte auf GPS...</div>
                <div id="debug-distance">Distanz: N/A</div>
                <div id="debug-last-story">Letzte Story: N/A</div>
                <div id="debug-api-calls">API-Aufrufe: ${this.apiCallCount}</div>
            `;
            document.querySelector('.container').appendChild(debugPanel);
        }
        
        this.updateDebugInfo();
    }

    // Remove debug information from UI
    removeDebugInfo() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
    }

    // Update debug information
    updateDebugInfo() {
        if (!this.debugMode) return;
        
        const debugPosition = document.getElementById('debug-position');
        const debugDistance = document.getElementById('debug-distance');
        const debugLastStory = document.getElementById('debug-last-story');
        
        if (debugPosition && this.currentPosition) {
            debugPosition.textContent = `Position: ${this.currentPosition.latitude.toFixed(6)}, ${this.currentPosition.longitude.toFixed(6)} (±${Math.round(this.currentPosition.accuracy)}m)`;
        }
        
        if (debugDistance && this.currentPosition && this.lastStoryLocation) {
            const distance = this.calculateDistance(
                this.lastStoryLocation.latitude,
                this.lastStoryLocation.longitude,
                this.currentPosition.latitude,
                this.currentPosition.longitude
            );
            debugDistance.textContent = `Distanz zur letzten Story: ${Math.round(distance)}m / ${CONFIG.MIN_DISTANCE_FOR_NEW_STORY}m`;
        }
        
        if (debugLastStory && this.lastStoryLocation) {
            debugLastStory.textContent = `Letzte Story: ${this.lastStoryLocation.latitude.toFixed(6)}, ${this.lastStoryLocation.longitude.toFixed(6)}`;
        }
        
        const debugApiCalls = document.getElementById('debug-api-calls');
        if (debugApiCalls) {
            debugApiCalls.textContent = `API-Aufrufe: ${this.apiCallCount}`;
        }
    }

    // Cache management functions
    createCacheKey(locationInfo) {
        const city = locationInfo.city || 'unknown';
        const region = locationInfo.state || 'unknown';
        const country = locationInfo.country || 'unknown';
        return `${city}-${region}-${country}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    getCachedStory(cacheKey) {
        try {
            const cacheData = localStorage.getItem(CONFIG.STORAGE_KEYS.STORY_CACHE);
            if (!cacheData) return null;
            
            const cache = JSON.parse(cacheData);
            const entry = cache[cacheKey];
            
            if (!entry) return null;
            
            // Check if cache entry is expired (24 hours)
            const now = Date.now();
            if (now - entry.timestamp > CONFIG.CACHE_DURATION) {
                // Remove expired entry
                delete cache[cacheKey];
                localStorage.setItem(CONFIG.STORAGE_KEYS.STORY_CACHE, JSON.stringify(cache));
                return null;
            }
            
            return entry.story;
            
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    cacheStory(cacheKey, story) {
        try {
            let cache = {};
            const existingCache = localStorage.getItem(CONFIG.STORAGE_KEYS.STORY_CACHE);
            if (existingCache) {
                cache = JSON.parse(existingCache);
            }
            
            cache[cacheKey] = {
                story: story,
                timestamp: Date.now()
            };
            
            // Clean up old entries (keep max 50 entries)
            const entries = Object.entries(cache);
            if (entries.length > 50) {
                // Sort by timestamp and keep only the 50 newest
                entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                cache = Object.fromEntries(entries.slice(0, 50));
            }
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.STORY_CACHE, JSON.stringify(cache));
            
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    getFallbackStory(locationInfo) {
        const region = locationInfo.state;
        
        // Direct match
        if (region && CONFIG.FALLBACK_STORIES[region]) {
            return CONFIG.FALLBACK_STORIES[region];
        }
        
        // Partial matches for common region names
        if (region) {
            const regionLower = region.toLowerCase();
            
            if (regionLower.includes('bayern') || regionLower.includes('bavaria')) {
                return CONFIG.FALLBACK_STORIES['Bayern'];
            }
            if (regionLower.includes('baden') || regionLower.includes('württemberg')) {
                return CONFIG.FALLBACK_STORIES['Baden-Württemberg'];
            }
            if (regionLower.includes('nordrhein') || regionLower.includes('westfalen') || regionLower.includes('ruhr')) {
                return CONFIG.FALLBACK_STORIES['Nordrhein-Westfalen'];
            }
            if (regionLower.includes('niedersachsen') || regionLower.includes('hannover')) {
                return CONFIG.FALLBACK_STORIES['Niedersachsen'];
            }
            if (regionLower.includes('berlin')) {
                return CONFIG.FALLBACK_STORIES['Berlin'];
            }
            if (regionLower.includes('hamburg')) {
                return CONFIG.FALLBACK_STORIES['Hamburg'];
            }
        }
        
        // City-based fallbacks
        const city = locationInfo.city;
        if (city) {
            const cityLower = city.toLowerCase();
            
            if (cityLower.includes('münchen') || cityLower.includes('munich')) {
                return CONFIG.FALLBACK_STORIES['Bayern'];
            }
            if (cityLower.includes('stuttgart') || cityLower.includes('karlsruhe')) {
                return CONFIG.FALLBACK_STORIES['Baden-Württemberg'];
            }
            if (cityLower.includes('köln') || cityLower.includes('düsseldorf') || cityLower.includes('dortmund')) {
                return CONFIG.FALLBACK_STORIES['Nordrhein-Westfalen'];
            }
        }
        
        return null;
    }

    // Get simulated location for testing
    getSimulatedLocation() {
        const position = this.simulationPositions[this.currentSimulationIndex];
        
        // Move to next position for next call
        this.currentSimulationIndex = (this.currentSimulationIndex + 1) % this.simulationPositions.length;
        
        const simulatedLocation = {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: 10, // High accuracy for simulation
            timestamp: Date.now()
        };
        
        console.log(`🎭 Simulated location: ${position.name}`, simulatedLocation);
        this.updateStatus(`🎭 Simulation: ${position.name}`);
        
        // Update display
        this.currentPosition = simulatedLocation;
        this.updateLocationDisplay(simulatedLocation);
        
        return Promise.resolve(simulatedLocation);
    }

    // Diagnostic function for debugging (call from browser console)
    diagnose() {
        console.log('🔍 TRAVEL STORIES DIAGNOSTIC REPORT');
        console.log('=====================================');
        
        // Check CONFIG object
        console.log('⚙️ Configuration:');
        console.log('  CONFIG.STORAGE_KEYS:', CONFIG.STORAGE_KEYS);
        console.log('  API_KEY storage key:', CONFIG.STORAGE_KEYS.API_KEY);
        console.log('  CONFIG defined:', typeof CONFIG !== 'undefined');
        
        // Check API key storage
        console.log('🔑 Storage Inspection:');
        console.log('  All localStorage keys:', Object.keys(localStorage));
        console.log('  All sessionStorage keys:', Object.keys(sessionStorage));
        
        const localStorageKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        const sessionStorageKey = sessionStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        
        console.log('🔑 API Key Status:');
        console.log('  localStorage key lookup:', CONFIG.STORAGE_KEYS.API_KEY, '→', localStorageKey ? `Found (${localStorageKey.length} chars)` : 'Not found');
        console.log('  sessionStorage key lookup:', CONFIG.STORAGE_KEYS.API_KEY, '→', sessionStorageKey ? `Found (${sessionStorageKey.length} chars)` : 'Not found');
        
        // Manual storage check
        console.log('🔍 Manual Storage Check:');
        console.log('  localStorage["travel_stories_api_key"]:', localStorage.getItem('travel_stories_api_key'));
        console.log('  sessionStorage["travel_stories_api_key"]:', sessionStorage.getItem('travel_stories_api_key'));
        
        // Check current position
        console.log('📍 Position Status:');
        console.log('  currentPosition:', this.currentPosition);
        console.log('  lastStoryLocation:', this.lastStoryLocation);
        
        // Check app state
        console.log('🚀 App Status:');
        console.log('  isRunning:', this.isRunning);
        console.log('  debugMode:', this.debugMode);
        console.log('  simulationMode:', this.simulationMode);
        console.log('  selectedVoice:', this.selectedVoice?.name || 'None');
        console.log('  apiCallCount:', this.apiCallCount);
        
        // Check browser capabilities
        console.log('🌐 Browser Capabilities:');
        console.log('  Geolocation:', !!navigator.geolocation);
        console.log('  Speech Synthesis:', !!window.speechSynthesis);
        console.log('  localStorage:', typeof Storage !== "undefined");
        
        // Test API key format
        const apiKey = localStorageKey || sessionStorageKey;
        if (apiKey) {
            console.log('🔍 API Key Analysis:');
            console.log('  Starts with AIza:', apiKey.startsWith('AIza'));
            console.log('  Length:', apiKey.length, '(should be 39)');
            console.log('  Format looks valid:', /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey));
        }
        
        console.log('=====================================');
        return 'Diagnostic complete - check console output above';
    }

    // Test function to manually save API key (call from browser console)
    testApiKeySave(testKey = 'test-key-12345') {
        console.log('🧪 TESTING API KEY SAVE/RETRIEVE');
        console.log('=================================');
        
        try {
            console.log('1. Saving test key:', testKey);
            localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, testKey);
            
            console.log('2. Retrieving saved key...');
            const retrieved = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
            console.log('3. Retrieved key:', retrieved);
            
            console.log('4. Keys match:', retrieved === testKey);
            
            console.log('5. Cleaning up...');
            localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
            
            return retrieved === testKey ? 'SUCCESS' : 'FAILED';
        } catch (error) {
            console.error('ERROR:', error);
            return 'ERROR: ' + error.message;
        }
    }

    // Force trigger story generation for testing (call from browser console)
    async testStoryGeneration() {
        console.log('🧪 TESTING STORY GENERATION');
        console.log('============================');
        
        const testLocation = {
            city: 'Basel',
            state: 'Basel-Stadt',
            country: 'Schweiz',
            displayName: 'Basel, Basel-Stadt, Schweiz'
        };
        
        try {
            console.log('🔄 Attempting to generate story for:', testLocation);
            const story = await this.generateStory(testLocation);
            console.log('✅ Story generated successfully!');
            console.log('📖 Story:', story.substring(0, 100) + '...');
            
            return 'SUCCESS: Story generated';
        } catch (error) {
            console.error('❌ Story generation failed:', error);
            return 'FAILED: ' + error.message;
        }
    }

    // Clear story cache (call from browser console)
    clearCache() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.STORY_CACHE);
            console.log('✅ Story cache cleared');
            return 'SUCCESS: Cache cleared';
        } catch (error) {
            console.error('❌ Failed to clear cache:', error);
            return 'FAILED: ' + error.message;
        }
    }

    // Toggle cache bypass (call from browser console)
    toggleCacheBypass() {
        this.bypassCache = !this.bypassCache;
        console.log(`🔄 Cache bypass: ${this.bypassCache ? 'ON (will force API calls)' : 'OFF (will use cache)'}`);
        
        if (this.debugMode) {
            this.updateDebugInfo();
        }
        
        return `Cache bypass ${this.bypassCache ? 'ENABLED' : 'DISABLED'}`;
    }

    // Helper function to show success messages
    showMessage(message) {
        console.log('Success:', message);
        
        // You could create a success message element similar to error handling
        // For now, we'll use a temporary approach
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.style.background = 'var(--accent)';
            
            setTimeout(() => {
                this.hideError();
                errorElement.style.background = 'var(--error)';
            }, 3000);
        }
    }

    // Dark mode toggle
    toggleDarkMode() {
        const isDark = document.body.classList.toggle('light-mode');
        localStorage.setItem(CONFIG.STORAGE_KEYS.DARK_MODE, !isDark);
    }

    // Story control functions
    repeatCurrentStory() {
        const storyElement = document.getElementById('story-content');
        if (storyElement && storyElement.textContent) {
            const currentStory = storyElement.textContent;
            if (currentStory !== 'Willkommen bei Travel Stories! Aktiviere GPS und starte deine Reise.') {
                this.speakStory(currentStory);
                console.log('Repeating current story');
            } else {
                this.showError('Keine Geschichte zum Wiederholen verfügbar');
            }
        } else {
            this.showError('Keine Geschichte zum Wiederholen verfügbar');
        }
    }

    async skipToNextStory() {
        if (!this.isRunning) {
            this.showError('Stories sind nicht gestartet');
            return;
        }

        if (!this.currentPosition) {
            this.showError('Keine GPS-Position verfügbar');
            return;
        }

        console.log('Skipping to next story (manual request)');
        
        try {
            // Force a new story by treating this as a manual request
            await this.processLocationForStory(this.currentPosition, true);
        } catch (error) {
            console.error('Skip story error:', error);
            this.showError(error.message);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.travelApp = new TravelStoriesApp();
    
    // Make diagnostic functions globally accessible
    window.diagnose = () => window.travelApp.diagnose();
    window.testApiKeySave = (key) => window.travelApp.testApiKeySave(key);
    window.testStoryGeneration = () => window.travelApp.testStoryGeneration();
    
    console.log('💡 Debug functions available:');
    console.log('  - diagnose() - Full system diagnostic');
    console.log('  - testApiKeySave("your-key") - Test API key storage');
    console.log('  - testStoryGeneration() - Test story generation with your API key');
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }
});