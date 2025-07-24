// Travel Stories App - Configuration
// TODO: Add configuration options

const CONFIG = {
    // API Configuration
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    NOMINATIM_API_URL: 'https://nominatim.openstreetmap.org/reverse',
    
    // Geolocation Settings
    GEOLOCATION_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds
        maximumAge: 300000 // 5 minutes
    },
    
    // Story Generation Settings
    MIN_DISTANCE_FOR_NEW_STORY: 5000, // 5km in meters
    STORY_CHECK_INTERVAL: 30000, // 30 seconds
    
    // API Retry Settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second base delay
    
    // Nominatim Rate Limiting
    NOMINATIM_REQUEST_DELAY: 1000, // 1 second between requests
    
    // Speech Settings
    DEFAULT_SPEECH_RATE: 1.0,
    DEFAULT_SPEECH_PITCH: 1.0,
    DEFAULT_SPEECH_VOLUME: 1.0,
    
    // Cache Settings
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Local Storage Keys
    STORAGE_KEYS: {
        API_KEY: 'travel_stories_api_key',
        LAST_POSITION: 'travel_stories_last_position',
        SETTINGS: 'travel_stories_settings',
        DARK_MODE: 'travel_stories_dark_mode',
        STORY_CACHE: 'travel_stories_cache',
        CUSTOM_PROMPT: 'travel_stories_custom_prompt'
    },
    
    // Error Messages
    ERRORS: {
        NO_GEOLOCATION: 'Geolocation wird von diesem Browser nicht unterstützt',
        LOCATION_DENIED: 'GPS-Zugriff wurde verweigert',
        LOCATION_UNAVAILABLE: 'Position konnte nicht ermittelt werden',
        LOCATION_TIMEOUT: 'GPS-Anfrage ist zeitüberschritten',
        NO_API_KEY: 'Kein API-Schlüssel konfiguriert',
        API_ERROR: 'Fehler beim Laden der Geschichte',
        SPEECH_ERROR: 'Text-to-Speech nicht verfügbar',
        GEOCODING_ERROR: 'Fehler beim Abrufen der Ortsinformationen',
        NETWORK_ERROR: 'Netzwerkfehler - Überprüfe deine Internetverbindung',
        RATE_LIMITED: 'API-Rate-Limit erreicht - Bitte warten',
        GEMINI_AUTH_ERROR: 'Ungültiger API-Schlüssel - Überprüfe deine Gemini-Konfiguration',
        GEMINI_QUOTA_ERROR: 'Gemini API-Limit erreicht - Versuche es später erneut',
        STORY_GENERATION_ERROR: 'Fehler beim Generieren der Geschichte'
    },
    
    // Fallback Stories for common German regions
    FALLBACK_STORIES: {
        'Bayern': 'Bayern, das Land der Schlösser und Berge! Wusstest du, dass König Ludwig II. mehr als 200 Millionen Mark für seine Traumschlösser ausgab? Das wären heute über eine Milliarde Euro! Neuschwanstein inspirierte sogar Walt Disney zu seinem Dornröschenschloss. Die Bayern haben übrigens das Reinheitsgebot von 1516 erfunden - das älteste Lebensmittelgesetz der Welt. Nur Hopfen, Malz, Hefe und Wasser dürfen ins Bier. Prost!',
        
        'Baden-Württemberg': 'Baden-Württemberg - das Ländle der Erfinder! Hier wurde das Auto geboren: Karl Benz fuhr 1885 das erste Mal mit seinem Motorwagen durch Mannheim. Seine Frau Bertha unternahm heimlich die erste Fernfahrt der Geschichte - 180 Kilometer nach Pforzheim! Heute sitzen hier Mercedes, Porsche und Bosch. Auch der Teddy-Bär kommt von hier: Margarete Steiff aus Giengen nähte 1902 den ersten Bären der Welt.',
        
        'Nordrhein-Westfalen': 'Das Ruhrgebiet - einst das Herz der deutschen Industrie! Die Zeche Zollverein war die schönste Zeche der Welt und ist heute UNESCO-Welterbe. Hier arbeiteten Menschen aus über 100 Nationen zusammen. Fun Fact: Das Ruhrgebiet hat mehr Theater als jede andere Region Deutschlands. Und Currywurst? Die wurde 1949 in Berlin erfunden, aber im Ruhrpott perfektioniert. 800 Millionen Portionen werden hier jährlich gegessen!',
        
        'Niedersachsen': 'Niedersachsen, das Land der Märchen und Entdecker! Die Brüder Grimm sammelten hier viele ihrer berühmtesten Märchen. Göttingen war jahrhundertelang eine der wichtigsten Universitätsstädte Europas - 45 Nobelpreisträger studierten oder lehrten hier! Und in Wolfsburg läuft seit 1974 ununterbrochen der VW Golf vom Band. Der meistverkaufte deutsche Pkw aller Zeiten kommt aus der Stadt, die nach einem Schloss benannt wurde.',
        
        'Berlin': 'Berlin - eine Stadt, die niemals schläft! Wusstest du, dass Berlin neun Mal größer ist als Paris? Die Stadt hat mehr Museen als Regentage im Jahr. Der Fernsehturm war ein Versehen der DDR-Propaganda: Bei Sonnenschein entsteht ein Kreuz auf der Kugel - sehr ärgerlich für die atheistische Regierung! Heute ist Berlin die einzige Hauptstadt der Welt, die ärmer ist als ihr Land, aber trotzdem unbezahlbar lebenswert.',
        
        'Hamburg': 'Hamburg - das Tor zur Welt! Die Speicherstadt ist der größte Lagerkomplex der Welt und UNESCO-Welterbe. Hier lagern ein Drittel aller deutschen Kaffeevorräte! St. Pauli ist übrigens kein Stadtteil des Lasters, sondern wurde nach einer Kirche benannt. Die Reeperbahn heißt so, weil hier früher Seile für Schiffe gedreht wurden. Und Hamburg hat mehr Brücken als Venedig und Amsterdam zusammen - über 2.300 Stück!',
        
        'Basel-Stadt': 'Basel - die Kulturhauptstadt der Schweiz! Wusstest du, dass Basel mehr Museen pro Kopf hat als jede andere Stadt der Welt? Das berühmte Basler Münster wurde nach einem Erdbeben im Jahr 1356 wieder aufgebaut. Der Rhein macht hier eine spektakuläre Kurve - deshalb heißt es "Rheinknie". Und Basel ist die einzige Stadt der Welt, wo drei Länder aufeinandertreffen: Deutschland, Frankreich und die Schweiz. Die Basler Fasnacht ist sogar UNESCO-Weltkulturerbe!',
        
        'Schweiz': 'Die Schweiz - ein Land der Superlative! Mit 26 Kantonen und 4 Amtssprachen ist sie einzigartig vielfältig. Der Gotthardpass war schon zur Römerzeit eine wichtige Handelsroute. Fun Fact: Die Schweiz hat pro Kopf die meisten Patente der Welt angemeldet! Klettverschluss, Zellophan und sogar das Internet - alles Schweizer Erfindungen oder Weiterentwicklungen. Und die berühmte Schweizer Pünktlichkeit? Die Züge fahren tatsächlich auf die Sekunde genau!'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}