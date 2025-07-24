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
        this.locationWatchId = null;
        this.storyCheckInterval = null;
        this.debugMode = false;
        this.lastNominatimRequest = 0;
        
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
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
                    this.showMessage('API-Schlüssel gespeichert!');
                    apiKeyInput.value = ''; // Clear input for security
                } else {
                    this.showError('Bitte gib einen gültigen API-Schlüssel ein');
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
        
        // Check if API key exists (but don't load it for security)
        const hasApiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        if (hasApiKey) {
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.innerHTML = '🟡 API-Schlüssel konfiguriert';
            }
        }
        
        console.log('Settings loaded');
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
            // Check if we should fetch a new story
            const shouldFetch = this.shouldFetchNewStory(position, manual);
            console.log('🤔 Should fetch new story?', shouldFetch);
            
            if (!shouldFetch) {
                console.log('⏭️ No new story needed - distance too small or conditions not met');
                return;
            }

            // Show loading state
            this.showLoading(true);
            console.log('⏳ Loading state activated');

            // Get location information via reverse geocoding
            console.log('🗺️ Starting reverse geocoding...');
            const locationInfo = await this.reverseGeocode(position.latitude, position.longitude);
            console.log('✅ Location info received:', locationInfo);

            // Generate and display story
            console.log('📝 Generating story...');
            const story = await this.generateStory(locationInfo);
            console.log('✅ Story generated:', story.substring(0, 100) + '...');
            
            // Update UI with story
            const storyElement = document.getElementById('story-content');
            if (storyElement) {
                storyElement.textContent = story;
                console.log('✅ Story displayed in UI');
            }

            // Speak the story
            console.log('🔊 Starting text-to-speech...');
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

    async getCurrentLocation() {
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
            const cacheKey = this.createCacheKey(locationInfo);
            
            // Check cache first
            const cachedStory = this.getCachedStory(cacheKey);
            if (cachedStory) {
                if (this.debugMode) {
                    console.log('Using cached story for:', locationInfo.city);
                }
                return cachedStory;
            }
            
            // Check API key
            const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
            if (!apiKey) {
                // Use fallback story if available
                const fallbackStory = this.getFallbackStory(locationInfo);
                if (fallbackStory) {
                    return fallbackStory;
                }
                throw new Error(CONFIG.ERRORS.NO_API_KEY);
            }
            
            // Generate prompt
            const prompt = this.buildPrompt(locationInfo);
            
            // Call Gemini API
            const story = await this.callGeminiAPI(prompt, apiKey);
            
            // Cache the result
            this.cacheStory(cacheKey, story);
            
            if (this.debugMode) {
                console.log('Generated new story for:', locationInfo.city);
            }
            
            return story;
            
        } catch (error) {
            console.error('Story generation error:', error);
            
            // Try fallback story on error
            const fallbackStory = this.getFallbackStory(locationInfo);
            if (fallbackStory) {
                this.showError(`${error.message} - Verwende Offline-Geschichte`);
                return fallbackStory;
            }
            
            throw error;
        }
    }

    // Build prompt for Gemini API
    buildPrompt(locationInfo) {
        const city = locationInfo.city || 'diesem Ort';
        const region = locationInfo.state || 'der Region';
        const country = locationInfo.country || 'Deutschland';
        
        return `Du bist ein charismatischer Reiseführer. Erzähle eine fesselnde, 90-120 Wörter lange Geschichte über ${city}, ${region}, ${country}.

Fokus auf: Historische Anekdoten, Legenden, interessante Fakten, lokale Besonderheiten.
Stil: Spannend, unterhaltsam, für Autofahrer geeignet.
Vermeide: Lange Listen, komplizierte Namen, langweilige Fakten.

Beginne direkt mit der Geschichte, ohne Einleitung.`;
    }

    // Call Gemini API
    async callGeminiAPI(prompt, apiKey) {
        const url = `${CONFIG.GEMINI_API_URL}?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 200
            }
        };
        
        try {
            const response = await this.fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.status === 401) {
                throw new Error(CONFIG.ERRORS.GEMINI_AUTH_ERROR);
            }
            
            if (response.status === 429) {
                throw new Error(CONFIG.ERRORS.GEMINI_QUOTA_ERROR);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return this.parseGeminiResponse(data);
            
        } catch (error) {
            if (error.message.includes('GEMINI_')) {
                throw error;
            }
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

    speakStory(text) {
        if (!text) {
            console.warn('No text to speak');
            return;
        }

        try {
            // Cancel any current speech
            this.stopSpeech();

            // Check if speech synthesis is supported
            if (!this.speechSynthesis) {
                console.warn('Speech synthesis not supported, using fallback');
                this.showOfflineTextFallback(text);
                return;
            }

            // Create new utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Set speech parameters optimized for driving
            this.currentUtterance.rate = this.speechRate || 0.9; // Slower for clarity
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
                console.log('🔊 Speech started');
                this.updateSpeechUI(true);
            };

            this.currentUtterance.onend = () => {
                console.log('🔇 Speech ended');
                this.currentUtterance = null;
                this.speechPaused = false;
                this.updateSpeechUI(false);
                this.onSpeechEnd();
            };

            this.currentUtterance.onerror = (event) => {
                console.error('❌ Speech error:', event.error);
                this.currentUtterance = null;
                this.speechPaused = false;
                this.updateSpeechUI(false);
                
                // Fallback to visual display
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

            console.log('🎤 Speaking story:', text.substring(0, 50) + '...');

        } catch (error) {
            console.error('Speech synthesis error:', error);
            this.showError(`${CONFIG.ERRORS.SPEECH_ERROR}: ${error.message}`);
            this.showOfflineTextFallback(text);
        }
    }

    // Pause/Resume speech
    pauseSpeech() {
        if (!this.currentUtterance) return;
        
        if (this.speechPaused) {
            this.speechSynthesis.resume();
            console.log('▶️ Speech resumed');
        } else {
            this.speechSynthesis.pause();
            console.log('⏸️ Speech paused');
        }
    }

    // Stop speech and clear queue
    stopSpeech() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        this.currentUtterance = null;
        this.speechPaused = false;
        this.speechQueue = [];
        this.updateSpeechUI(false);
        console.log('⏹️ Speech stopped');
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
                <div id="debug-api-calls">API-Aufrufe: 0</div>
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
    new TravelStoriesApp();
});