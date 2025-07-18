         tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            DEFAULT: '#3B82F6',
                            light: '#93C5FD',
                            dark: '#1D4ED8'
                        },
                        secondary: {
                            DEFAULT: '#10B981',
                            light: '#6EE7B7',
                            dark: '#047857'
                        },
                        accent: {
                            DEFAULT: '#F59E0B',
                            light: '#FCD34D',
                            dark: '#D97706'
                        },
                        danger: {
                            DEFAULT: '#EF4444',
                            light: '#FCA5A5',
                            dark: '#B91C1C'
                        },
                        background: {
                            light: '#F9FAFB',
                            dark: '#111827'
                        },
                        surface: {
                            light: '#FFFFFF',
                            dark: '#1F2937'
                        },
                        text: {
                            primary: {
                                light: '#111827',
                                dark: '#F9FAFB'
                            },
                            secondary: {
                                light: '#6B7280',
                                dark: '#D1D5DB'
                            }
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                        mono: ['Roboto Mono', 'ui-monospace']
                    }
                }
            }
        }
        
        // Calculator functionality
        let currentInput = '0';
        let memoryValue = 0;
        let history = [];
        let isScientific = false;
        
        // Settings
        let passcode = localStorage.getItem('quantumcalc_passcode') || '';
        let theme = localStorage.getItem('quantumcalc_theme') || 'light';
        let fontSize = localStorage.getItem('quantumcalc_fontSize') || 'medium';
        let buttonLayout = localStorage.getItem('quantumcalc_buttonLayout') || 'spacious';
        let enableCompression = localStorage.getItem('quantumcalc_enableCompression') !== 'false';
        let useIndexedDB = localStorage.getItem('quantumcalc_useIndexedDB') !== 'false';
        let enableBiometric = localStorage.getItem('quantumcalc_enableBiometric') !== 'false';
        let autoLock = localStorage.getItem('quantumcalc_autoLock') || '-1';
        
        // Private Storage System
        class PrivateStorage {
            constructor() {
                this.db = null;
                this.initPromise = this.init();
            }
            
            async init() {
                try {
                    if (useIndexedDB) {
                        await this.initIndexedDB();
                    }
                    return true;
                } catch (error) {
                    console.error("Storage initialization failed:", error);
                    return false;
                }
            }
            
            async initIndexedDB() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('QuantumCalcPrivateDB', 1);
                    
                    request.onerror = (event) => reject(event.target.error);
                    
                    request.onsuccess = (event) => {
                        this.db = event.target.result;
                        resolve();
                    };
                    
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        
                        if (!db.objectStoreNames.contains('files')) {
                            db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                        }
                        if (!db.objectStoreNames.contains('photos')) {
                            db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
                        }
                        if (!db.objectStoreNames.contains('videos')) {
                            db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
                        }
                    };
                });
            }
            
            async addFile(type, fileData) {
                try {
                    await this.initPromise;
                    
                    if (this.db && useIndexedDB) {
                        return this.addToIndexedDB(type, fileData);
                    } else {
                        return this.addToLocalStorage(type, fileData);
                    }
                } catch (error) {
                    console.error("Error adding file:", error);
                    throw error;
                }
            }
            
            async addToIndexedDB(storeName, item) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    const request = store.add(item);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target.error);
                });
            }
            
            addToLocalStorage(type, item) {
                const key = `quantumcalc_private_${type}`;
                let items = JSON.parse(localStorage.getItem(key) || '[]');
                items.push(item);
                localStorage.setItem(key, JSON.stringify(items));
                return Promise.resolve();
            }
            
            async getAllFiles(type) {
                try {
                    await this.initPromise;
                    
                    if (this.db && useIndexedDB) {
                        return this.getAllFromIndexedDB(type);
                    } else {
                        return this.getAllFromLocalStorage(type);
                    }
                } catch (error) {
                    console.error("Error getting files:", error);
                    return [];
                }
            }
            
            async getAllFromIndexedDB(storeName) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    const request = store.getAll();
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target.error);
                });
            }
            
            getAllFromLocalStorage(type) {
                const key = `quantumcalc_private_${type}`;
                return Promise.resolve(JSON.parse(localStorage.getItem(key) || '[]'));
            }
            
            async deleteFile(type, id) {
                try {
                    await this.initPromise;
                    
                    if (this.db && useIndexedDB) {
                        return this.deleteFromIndexedDB(type, id);
                    } else {
                        return this.deleteFromLocalStorage(type, id);
                    }
                } catch (error) {
                    console.error("Error deleting file:", error);
                    throw error;
                }
            }
            
            async deleteFromIndexedDB(storeName, id) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    const request = store.delete(id);
                    
                    request.onsuccess = () => resolve();
                    request.onerror = (event) => reject(event.target.error);
                });
            }
            
            deleteFromLocalStorage(type, index) {
                const key = `quantumcalc_private_${type}`;
                let items = JSON.parse(localStorage.getItem(key) || '[]');
                items.splice(index, 1);
                localStorage.setItem(key, JSON.stringify(items));
                return Promise.resolve();
            }
            
            async clearAllData() {
                try {
                    if (this.db && useIndexedDB) {
                        await this.clearIndexedDB();
                    }
                    this.clearLocalStorage();
                    return true;
                } catch (error) {
                    console.error("Error clearing data:", error);
                    return false;
                }
            }
            
            async clearIndexedDB() {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['files', 'photos', 'videos'], 'readwrite');
                    
                    transaction.objectStore('files').clear();
                    transaction.objectStore('photos').clear();
                    transaction.objectStore('videos').clear();
                    
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = (event) => reject(event.target.error);
                });
            }
            
            clearLocalStorage() {
                localStorage.removeItem('quantumcalc_private_files');
                localStorage.removeItem('quantumcalc_private_photos');
                localStorage.removeItem('quantumcalc_private_videos');
            }
            
            async getStorageUsage() {
                try {
                    if (this.db && useIndexedDB) {
                        return this.getIndexedDBUsage();
                    } else {
                        return this.getLocalStorageUsage();
                    }
                } catch (error) {
                    console.error("Error getting storage usage:", error);
                    return { used: 0, total: 5 * 1024 * 1024 };
                }
            }
            
            async getIndexedDBUsage() {
                const files = await this.getAllFromIndexedDB('files');
                const photos = await this.getAllFromIndexedDB('photos');
                const videos = await this.getAllFromIndexedDB('videos');
                
                let totalBytes = 0;
                
                files.forEach(file => {
                    totalBytes += file.size || (file.data ? file.data.length * 0.75 : 0);
                });
                
                photos.forEach(photo => {
                    totalBytes += photo.size || (photo.data ? photo.data.length * 0.75 : 0);
                });
                
                videos.forEach(video => {
                    totalBytes += video.size || (video.data ? video.data.length * 0.75 : 0);
                });
                
                const totalSpace = navigator.storage?.estimate ? 
                    (await navigator.storage.estimate()).quota || 50 * 1024 * 1024 : 
                    50 * 1024 * 1024;
                
                return { used: totalBytes, total: totalSpace };
            }
            
            getLocalStorageUsage() {
                let totalBytes = 0;
                
                ['quantumcalc_private_files', 'quantumcalc_private_photos', 'quantumcalc_private_videos'].forEach(key => {
                    const data = localStorage.getItem(key);
                    if (data) {
                        totalBytes += new Blob([data]).size;
                    }
                });
                
                return { used: totalBytes, total: 5 * 1024 * 1024 };
            }
        }
        
        // Initialize storage system
        const privateStorage = new PrivateStorage();
        
        // DOM elements
        const display = document.getElementById('display');
        const historyElement = document.getElementById('history');
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const privateSpaceModal = document.getElementById('privateSpaceModal');
        const passcodeScreen = document.getElementById('passcodeScreen');
        const privateContent = document.getElementById('privateContent');
        const enterPasscode = document.getElementById('enterPasscode');
        const passcodeInput = document.getElementById('passcodeInput');
        const fileList = document.getElementById('fileList');
        const photoList = document.getElementById('photoList');
        const videoList = document.getElementById('videoList');
        const privateFileInput = document.getElementById('privateFileInput');
        const privatePhotoInput = document.getElementById('privatePhotoInput');
        const privateVideoInput = document.getElementById('privateVideoInput');
        const fileDropArea = document.getElementById('fileDropArea');
        const storageWarning = document.getElementById('storageWarning');
        const storageProgress = document.getElementById('storageProgress');
        const storageInfo = document.getElementById('storageInfo');
        const modalStorageProgress = document.getElementById('modalStorageProgress');
        const modalStorageInfo = document.getElementById('modalStorageInfo');
        const enableCompressionCheckbox = document.getElementById('enableCompression');
        const useIndexedDBCheckbox = document.getElementById('useIndexedDB');
        const enableBiometricCheckbox = document.getElementById('enableBiometric');
        const autoLockSelect = document.getElementById('autoLockSelect');
        const themeSelect = document.getElementById('themeSelect');
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        const buttonLayoutSelect = document.getElementById('buttonLayoutSelect');
        const themeToggle = document.getElementById('themeToggle');
        const filePreviewModal = document.getElementById('filePreviewModal');
        const imagePreview = document.getElementById('imagePreview');
        const videoPreview = document.getElementById('videoPreview');
        const filePreviewInfo = document.getElementById('filePreviewInfo');
        const previewTitle = document.getElementById('previewTitle');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const downloadFileBtn = document.getElementById('downloadFileBtn');
        const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
        
        // Initialize calculator
        function initCalculator() {
            updateDisplay();
            loadSettings();
            renderFileLists();
            updateStorageInfo();
            
            // Event listeners
            settingsBtn.addEventListener('click', openSettingsModal);
            themeToggle.addEventListener('click', toggleTheme);
            
            // Tab switching
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab');
                    switchTab(tabName);
                });
            });
            
            // Private space tab switching
            document.querySelectorAll('[data-private-tab]').forEach(button => {
                button.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-private-tab');
                    switchPrivateTab(tabName);
                });
            });
            
            // File upload handling
            privateFileInput.addEventListener('change', handleFileUpload);
            privatePhotoInput.addEventListener('change', handlePhotoUpload);
            privateVideoInput.addEventListener('change', handleVideoUpload);
            
            // Drag and drop
            fileDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileDropArea.classList.add('file-drop-active');
            });
            
            fileDropArea.addEventListener('dragleave', () => {
                fileDropArea.classList.remove('file-drop-active');
            });
            
            fileDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileDropArea.classList.remove('file-drop-active');
                if (e.dataTransfer.files.length > 0) {
                    handleFileUpload({ target: { files: e.dataTransfer.files } });
                }
            });
            
            // Settings change handlers
            enableCompressionCheckbox.addEventListener('change', function() {
                enableCompression = this.checked;
                localStorage.setItem('quantumcalc_enableCompression', enableCompression);
            });
            
            useIndexedDBCheckbox.addEventListener('change', function() {
                useIndexedDB = this.checked;
                localStorage.setItem('quantumcalc_useIndexedDB', useIndexedDB);
                privateStorage.init();
            });
            
            enableBiometricCheckbox.addEventListener('change', function() {
                enableBiometric = this.checked;
                localStorage.setItem('quantumcalc_enableBiometric', enableBiometric);
            });
            
            autoLockSelect.addEventListener('change', function() {
                autoLock = this.value;
                localStorage.setItem('quantumcalc_autoLock', autoLock);
            });
            
            // Check for system theme preference
            if (theme === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
            }
        }
        
        // Calculator functions
        function appendToDisplay(value) {
            if (currentInput === '0' && value !== '.') {
                currentInput = value;
            } else {
                currentInput += value;
            }
            updateDisplay();
        }
        
        function clearDisplay() {
            currentInput = '0';
            updateDisplay();
        }
        
        function backspace() {
            if (currentInput.length === 1) {
                currentInput = '0';
            } else {
                currentInput = currentInput.slice(0, -1);
            }
            updateDisplay();
        }
        
        function calculate() {
            try {
                // Replace special constants and functions
                let expression = currentInput
                    .replace(/pi/g, 'Math.PI')
                    .replace(/e/g, 'Math.E')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/asin\(/g, 'Math.asin(')
                    .replace(/acos\(/g, 'Math.acos(')
                    .replace(/atan\(/g, 'Math.atan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/abs\(/g, 'Math.abs(')
                    .replace(/exp\(/g, 'Math.exp(')
                    .replace(/floor\(/g, 'Math.floor(')
                    .replace(/ceil\(/g, 'Math.ceil(')
                    .replace(/round\(/g, 'Math.round(')
                    .replace(/\^/g, '**')
                    .replace(/factorial\((\d+)\)/g, function(match, num) {
                        let result = 1;
                        for (let i = 2; i <= num; i++) {
                            result *= i;
                        }
                        return result;
                    });
                
                const result = eval(expression);
                history.push(`${currentInput} = ${result}`);
                if (history.length > 5) history.shift();
                updateHistory();
                currentInput = result.toString();
                updateDisplay();
            } catch (error) {
                currentInput = 'Error';
                updateDisplay();
                setTimeout(() => {
                    currentInput = '0';
                    updateDisplay();
                }, 1500);
            }
        }
        
        function updateDisplay() {
            display.textContent = currentInput;
        }
        
        function updateHistory() {
            historyElement.innerHTML = history.join('<br>');
        }
        
        // Memory functions
        function memoryRecall() {
            currentInput = memoryValue.toString();
            updateDisplay();
        }
        
        function memoryClear() {
            memoryValue = 0;
        }
        
        function memoryAdd() {
            memoryValue += parseFloat(currentInput) || 0;
        }
        
        function memorySubtract() {
            memoryValue -= parseFloat(currentInput) || 0;
        }
        
        // Scientific calculator toggle
        function toggleScientific() {
            const scientificButtons = document.getElementById('scientificButtons');
            scientificButtons.classList.toggle('hidden');
            isScientific = !isScientific;
        }
        
        // Settings functions
        function openSettingsModal() {
            settingsModal.classList.remove('hidden');
            
            // Set current settings in the panel
            themeSelect.value = theme;
            fontSizeSelect.value = fontSize;
            buttonLayoutSelect.value = buttonLayout;
            enableCompressionCheckbox.checked = enableCompression;
            useIndexedDBCheckbox.checked = useIndexedDB;
            enableBiometricCheckbox.checked = enableBiometric;
            autoLockSelect.value = autoLock;
            
            // Update storage info
            updateStorageInfo();
        }
        
        function closeSettingsModal() {
            settingsModal.classList.add('hidden');
        }
        
        function closePrivateSpaceModal() {
            privateSpaceModal.classList.add('hidden');
        }
        
        function loadSettings() {
            // Apply theme
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            // Apply font size
            document.body.style.fontSize = fontSize === 'small' ? '14px' : 
                                         fontSize === 'large' ? '18px' : '16px';
            
            // Apply button layout
            const buttons = document.querySelectorAll('.buttons button');
            buttons.forEach(button => {
                button.style.padding = buttonLayout === 'compact' ? '0.5rem' : '0.75rem';
            });
        }
        
        function toggleTheme() {
            if (theme === 'system') {
                theme = 'light';
            } else if (theme === 'light') {
                theme = 'dark';
            } else {
                theme = 'system';
            }
            
            localStorage.setItem('quantumcalc_theme', theme);
            loadSettings();
            
            // Update toggle button icon
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
        
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Deactivate all buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('border-primary-light', 'dark:border-primary-dark', 'text-primary-dark', 'dark:text-primary-light');
                button.classList.add('border-transparent');
            });
            
            // Activate selected tab
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
            
            // Activate selected button
            const activeButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
            activeButton.classList.add('border-primary-light', 'dark:border-primary-dark', 'text-primary-dark', 'dark:text-primary-light');
            activeButton.classList.remove('border-transparent');
        }
        
        function switchPrivateTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('#privateContent .tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Deactivate all buttons
            document.querySelectorAll('[data-private-tab]').forEach(button => {
                button.classList.remove('border-primary-light', 'dark:border-primary-dark', 'text-primary-dark', 'dark:text-primary-light');
                button.classList.add('border-transparent');
            });
            
            // Activate selected tab
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
            
            // Activate selected button
            const activeButton = document.querySelector(`[data-private-tab="${tabName}"]`);
            activeButton.classList.add('border-primary-light', 'dark:border-primary-dark', 'text-primary-dark', 'dark:text-primary-light');
            activeButton.classList.remove('border-transparent');
        }
        
        // Save settings when changed
        themeSelect.addEventListener('change', function() {
            theme = this.value;
            localStorage.setItem('quantumcalc_theme', theme);
            loadSettings();
        });
        
        fontSizeSelect.addEventListener('change', function() {
            fontSize = this.value;
            localStorage.setItem('quantumcalc_fontSize', fontSize);
            loadSettings();
        });
        
        buttonLayoutSelect.addEventListener('change', function() {
            buttonLayout = this.value;
            localStorage.setItem('quantumcalc_buttonLayout', buttonLayout);
            loadSettings();
        });
        
        // Private space functions
        function openPrivateSpace() {
            privateSpaceModal.classList.remove('hidden');
            
            if (passcode) {
                passcodeScreen.classList.remove('hidden');
                privateContent.classList.add('hidden');
                enterPasscode.value = '';
            } else {
                passcodeScreen.classList.add('hidden');
                privateContent.classList.remove('hidden');
            }
            
            // Update storage warning
            checkStorageSpace();
        }
        
        function setPasscode() {
            const newPasscode = passcodeInput.value;
            if (newPasscode.length >= 4) {
                passcode = newPasscode;
                localStorage.setItem('quantumcalc_passcode', passcode);
                showToast('Passcode set successfully!', 'success');
                passcodeInput.value = '';
            } else {
                showToast('Passcode must be at least 4 characters long', 'error');
            }
        }
        
        function verifyPasscode() {
            if (enterPasscode.value === passcode) {
                passcodeScreen.classList.add('hidden');
                privateContent.classList.remove('hidden');
                enterPasscode.value = '';
            } else {
                showToast('Incorrect passcode!', 'error');
            }
        }
        
        // File handling functions
        async function renderFileLists() {
            try {
                // Render files
                const files = await privateStorage.getAllFiles('files');
                fileList.innerHTML = files.length > 0 ? '' : `
                    <div class="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        <i class="fas fa-folder-open text-4xl mb-3"></i>
                        <p>No files stored yet</p>
                    </div>
                `;
                
                files.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg';
                    fileItem.innerHTML = `
                        <div class="flex items-center gap-3 truncate">
                            <i class="fas fa-file text-text-secondary-light dark:text-text-secondary-dark"></i>
                            <div class="truncate">
                                <p class="truncate font-medium">${file.name}</p>
                                <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark">${formatFileSize(file.size)} • ${new Date(file.uploaded).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="downloadFile(${file.id || index}, 'files', ${file.id ? true : false})" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button onclick="deleteFile(${file.id || index}, 'files', ${file.id ? true : false})" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-danger-light dark:text-danger-dark" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    fileList.appendChild(fileItem);
                });
                
                // Render photos
                const photos = await privateStorage.getAllFiles('photos');
                photoList.innerHTML = photos.length > 0 ? '' : `
                    <div class="col-span-full text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        <i class="fas fa-image text-4xl mb-3"></i>
                        <p>No photos stored yet</p>
                    </div>
                `;
                
                photos.forEach((photo, index) => {
                    const photoItem = document.createElement('div');
                    photoItem.className = 'relative group overflow-hidden rounded-lg aspect-square';
                    photoItem.innerHTML = `
                        <img src="data:${photo.type};base64,${photo.data}" alt="${photo.name}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button onclick="viewPhoto(${photo.id || index}, ${photo.id ? true : false})" class="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors" title="View">
                                <i class="fas fa-eye text-white"></i>
                            </button>
                            <button onclick="deleteFile(${photo.id || index}, 'photos', ${photo.id ? true : false})" class="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    photoList.appendChild(photoItem);
                });
                
                // Render videos
                const videos = await privateStorage.getAllFiles('videos');
                videoList.innerHTML = videos.length > 0 ? '' : `
                    <div class="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        <i class="fas fa-video text-4xl mb-3"></i>
                        <p>No videos stored yet</p>
                    </div>
                `;
                
                videos.forEach((video, index) => {
                    const videoItem = document.createElement('div');
                    videoItem.className = 'flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg';
                    videoItem.innerHTML = `
                        <div class="flex items-center gap-3 truncate">
                            <i class="fas fa-video text-text-secondary-light dark:text-text-secondary-dark"></i>
                            <div class="truncate">
                                <p class="truncate font-medium">${video.name}</p>
                                <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark">${formatFileSize(video.size)} • ${new Date(video.uploaded).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="playVideo(${video.id || index}, ${video.id ? true : false})" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Play">
                                <i class="fas fa-play"></i>
                            </button>
                            <button onclick="deleteFile(${video.id || index}, 'videos', ${video.id ? true : false})" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-danger-light dark:text-danger-dark" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    videoList.appendChild(videoItem);
                });
                
                // Check storage space
                checkStorageSpace();
            } catch (error) {
                console.error("Error rendering file lists:", error);
                showToast('Error loading files', 'error');
            }
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        async function handleFileUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;
            
            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const reader = new FileReader();
                    
                    reader.onload = async function(e) {
                        try {
                            await privateStorage.addFile('files', {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: e.target.result.split(',')[1],
                                uploaded: new Date().toISOString()
                            });
                            
                            renderFileLists();
                            updateStorageInfo();
                            showToast(`${file.name} uploaded successfully`, 'success');
                        } catch (error) {
                            console.error("Error processing file:", error);
                            showToast(`Error uploading ${file.name}`, 'error');
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error("Error handling file upload:", error);
                showToast('Error uploading files', 'error');
            } finally {
                event.target.value = '';
            }
        }
        
        async function handlePhotoUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;
            
            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (!file.type.startsWith('image/')) continue;
                    
                    let fileToStore = file;
                    
                    // Compress image if enabled
                    if (enableCompression) {
                        fileToStore = await compressImage(file);
                    }
                    
                    const reader = new FileReader();
                    
                    reader.onload = async function(e) {
                        try {
                            await privateStorage.addFile('photos', {
                                name: file.name,
                                type: fileToStore.type,
                                size: fileToStore.size,
                                data: e.target.result.split(',')[1],
                                compressed: enableCompression,
                                originalSize: enableCompression ? file.size : null,
                                uploaded: new Date().toISOString()
                            });
                            
                            renderFileLists();
                            updateStorageInfo();
                            showToast(`${file.name} uploaded successfully`, 'success');
                        } catch (error) {
                            console.error("Error processing photo:", error);
                            showToast(`Error uploading ${file.name}`, 'error');
                        }
                    };
                    
                    reader.readAsDataURL(fileToStore);
                }
            } catch (error) {
                console.error("Error handling photo upload:", error);
                showToast('Error uploading photos', 'error');
            } finally {
                event.target.value = '';
            }
        }
        
        async function handleVideoUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;
            
            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (!file.type.startsWith('video/')) continue;
                    
                    const reader = new FileReader();
                    
                    reader.onload = async function(e) {
                        try {
                            await privateStorage.addFile('videos', {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: e.target.result.split(',')[1],
                                uploaded: new Date().toISOString()
                            });
                            
                            renderFileLists();
                            updateStorageInfo();
                            showToast(`${file.name} uploaded successfully`, 'success');
                        } catch (error) {
                            console.error("Error processing video:", error);
                            showToast(`Error uploading ${file.name}`, 'error');
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error("Error handling video upload:", error);
                showToast('Error uploading videos', 'error');
            } finally {
                event.target.value = '';
            }
        }
        
        async function compressImage(file, quality = 0.7) {
            return new Promise((resolve) => {
                if (!file.type.startsWith('image/')) {
                    resolve(file);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.src = event.target.result;
                    
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate new dimensions
                        let width = img.width;
                        let height = img.height;
                        const maxDimension = 2000; // Max width/height
                        
                        if (width > height && width > maxDimension) {
                            height *= maxDimension / width;
                            width = maxDimension;
                        } else if (height > maxDimension) {
                            width *= maxDimension / height;
                            height = maxDimension;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw image with new dimensions
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to compressed format
                        canvas.toBlob(
                            (blob) => {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            },
                            'image/jpeg',
                            quality
                        );
                    };
                };
                
                reader.readAsDataURL(file);
            });
        }
        
        async function downloadFile(id, type, isIndexedDB) {
            try {
                let file;
                const files = await privateStorage.getAllFiles(type);
                
                if (isIndexedDB) {
                    file = files.find(f => f.id === id);
                } else {
                    file = files[id];
                }
                
                if (!file) {
                    throw new Error("File not found");
                }
                
                const link = document.createElement('a');
                link.href = `data:${file.type};base64,${file.data}`;
                link.download = file.name;
                link.click();
                
                showToast(`${file.name} downloaded`, 'success');
            } catch (error) {
                console.error("Error downloading file:", error);
                showToast('Error downloading file', 'error');
            }
        }
        
        async function viewPhoto(id, isIndexedDB) {
            try {
                let photo;
                const photos = await privateStorage.getAllFiles('photos');
                
                if (isIndexedDB) {
                    photo = photos.find(p => p.id === id);
                } else {
                    photo = photos[id];
                }
                
                if (!photo) {
                    throw new Error("Photo not found");
                }
                
                const imageUrl = `data:${photo.type};base64,${photo.data}`;
                
                // Show in preview modal
                imagePreview.src = imageUrl;
                imagePreview.classList.remove('hidden');
                videoPreview.classList.add('hidden');
                filePreviewInfo.classList.add('hidden');
                previewTitle.textContent = photo.name;
                downloadPreviewBtn.onclick = () => downloadFile(id, 'photos', isIndexedDB);
                
                filePreviewModal.classList.remove('hidden');
            } catch (error) {
                console.error("Error viewing photo:", error);
                showToast('Error viewing photo', 'error');
            }
        }
        
        async function playVideo(id, isIndexedDB) {
            try {
                let video;
                const videos = await privateStorage.getAllFiles('videos');
                
                if (isIndexedDB) {
                    video = videos.find(v => v.id === id);
                } else {
                    video = videos[id];
                }
                
                if (!video) {
                    throw new Error("Video not found");
                }
                
                const videoUrl = `data:${video.type};base64,${video.data}`;
                
                // Show in preview modal
                videoPreview.src = videoUrl;
                videoPreview.classList.remove('hidden');
                imagePreview.classList.add('hidden');
                filePreviewInfo.classList.add('hidden');
                previewTitle.textContent = video.name;
                downloadPreviewBtn.onclick = () => downloadFile(id, 'videos', isIndexedDB);
                
                filePreviewModal.classList.remove('hidden');
            } catch (error) {
                console.error("Error playing video:", error);
                showToast('Error playing video', 'error');
            }
        }
        
        function closePreviewModal() {
            filePreviewModal.classList.add('hidden');
            videoPreview.pause();
            videoPreview.currentTime = 0;
        }
        
        async function deleteFile(id, type, isIndexedDB) {
            try {
                if (confirm('Are you sure you want to delete this file?')) {
                    await privateStorage.deleteFile(type, id);
                    renderFileLists();
                    updateStorageInfo();
                    showToast('File deleted', 'success');
                }
            } catch (error) {
                console.error("Error deleting file:", error);
                showToast('Error deleting file', 'error');
            }
        }
        
        async function clearAllPrivateData() {
            try {
                if (confirm('Are you sure you want to delete ALL private data? This cannot be undone.')) {
                    await privateStorage.clearAllData();
                    renderFileLists();
                    updateStorageInfo();
                    showToast('All private data deleted', 'success');
                }
            } catch (error) {
                console.error("Error clearing private data:", error);
                showToast('Error clearing data', 'error');
            }
        }
        
        // Storage management functions
        async function checkStorageSpace() {
            try {
                const { used, total } = await privateStorage.getStorageUsage();
                const percentageUsed = (used / total) * 100;
                
                if (percentageUsed > 80) {
                    storageWarning.classList.remove('hidden');
                } else {
                    storageWarning.classList.add('hidden');
                }
            } catch (error) {
                console.error("Error checking storage space:", error);
            }
        }
        
        async function updateStorageInfo() {
            try {
                const { used, total } = await privateStorage.getStorageUsage();
                const percentageUsed = (used / total) * 100;
                
                storageProgress.style.width = `${Math.min(100, percentageUsed)}%`;
                modalStorageProgress.style.width = `${Math.min(100, percentageUsed)}%`;
                
                const usedMB = (used / (1024 * 1024)).toFixed(2);
                const totalMB = (total / (1024 * 1024)).toFixed(2);
                
                storageInfo.textContent = `Using ${usedMB} MB of ${totalMB} MB (${Math.round(percentageUsed)}%)`;
                modalStorageInfo.textContent = `Using ${usedMB} MB of ${totalMB} MB (${Math.round(percentageUsed)}%)`;
                
                // Change color based on usage
                if (percentageUsed > 90) {
                    storageProgress.style.backgroundColor = 'rgb(239, 68, 68)';
                    modalStorageProgress.style.backgroundColor = 'rgb(239, 68, 68)';
                } else if (percentageUsed > 70) {
                    storageProgress.style.backgroundColor = 'rgb(245, 158, 11)';
                    modalStorageProgress.style.backgroundColor = 'rgb(245, 158, 11)';
                } else {
                    storageProgress.style.backgroundColor = 'rgb(59, 130, 246)';
                    modalStorageProgress.style.backgroundColor = 'rgb(59, 130, 246)';
                }
            } catch (error) {
                console.error("Error updating storage info:", error);
                storageInfo.textContent = "Unable to calculate storage usage";
                modalStorageInfo.textContent = "Unable to calculate storage usage";
            }
        }
        
        // Toast notification
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
                type === 'success' ? 'bg-secondary-light/90 dark:bg-secondary-dark/90 text-white' :
                type === 'error' ? 'bg-danger-light/90 dark:bg-danger-dark/90 text-white' :
                'bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700'
            }`;
            
            toast.innerHTML = `
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
                }"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
        
        // Initialize the calculator when the page loads
        window.onload = initCalculator;
   
