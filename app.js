/**
 * A11yText Enhancer
 * Accessibility-focused text enhancement tool
 */

// DOM Elements
const elements = {
    input: document.getElementById('text-input'),
    output: document.getElementById('text-output'),
    fontSelect: document.getElementById('font-select'),
    fontSize: document.getElementById('font-size'),
    fontSizeVal: document.getElementById('font-size-val'),
    lineHeight: document.getElementById('line-height'),
    lineHeightVal: document.getElementById('line-height-val'),
    letterSpacing: document.getElementById('letter-spacing'),
    letterSpacingVal: document.getElementById('letter-spacing-val'),
    wordSpacing: document.getElementById('word-spacing'),
    wordSpacingVal: document.getElementById('word-spacing-val'),
    contrastSelect: document.getElementById('contrast-select'),
    customColors: document.getElementById('custom-colors'),
    textColor: document.getElementById('text-color'),
    bgColor: document.getElementById('bg-color'),
    bionicToggle: document.getElementById('bionic-toggle'),
    bionicIntensity: document.getElementById('bionic-intensity'),
    bionicIntensityVal: document.getElementById('bionic-intensity-val'),
    bionicControl: document.getElementById('bionic-intensity-control'),
    highlightToggle: document.getElementById('highlight-toggle'),
    ttsToggle: document.getElementById('tts-toggle'),
    ttsControls: document.getElementById('tts-controls'),
    ttsPlay: document.getElementById('tts-play'),
    ttsPause: document.getElementById('tts-pause'),
    ttsStop: document.getElementById('tts-stop'),
    ttsSpeed: document.getElementById('tts-speed'),
    ttsSpeedVal: document.getElementById('tts-speed-val'),
    wordCount: document.getElementById('word-count'),
    readTime: document.getElementById('read-time'),
    gradeLevel: document.getElementById('grade-level'),
    alignBtns: document.querySelectorAll('.align-btn'),
    btnSample: document.getElementById('btn-sample'),
    btnClear: document.getElementById('btn-clear'),
    btnReset: document.getElementById('btn-reset'),
    btnSavePreset: document.getElementById('btn-save-preset'),
    btnExportHtml: document.getElementById('btn-export-html'),
    btnExportTxt: document.getElementById('btn-export-txt'),
    btnPrint: document.getElementById('btn-print'),
    fileInput: document.getElementById('file-input'),
    aboutLink: document.getElementById('about-link'),
    aboutModal: document.getElementById('about-modal'),
    modalClose: document.querySelector('.modal-close')
};

// State
let currentText = '';
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let savedPresets = JSON.parse(localStorage.getItem('a11y-presets') || '[]');

// Sample text
const sampleText = `The Accessibility Text Enhancer helps make reading easier for everyone. Whether you have dyslexia, ADHD, low vision, or simply prefer cleaner text, this tool puts you in control.

You can adjust the font, size, spacing, and colors to match your needs. Try the Bionic Reading mode to see if guiding your eyes with bold text helps you focus better.

Reading is a fundamental right. Technology should adapt to people, not the other way around.`;

// Initialize
function init() {
    loadSettings();
    attachEventListeners();
    updateOutput();
}

// Event Listeners
function attachEventListeners() {
    // Input
    elements.input.addEventListener('input', handleInput);
    elements.btnSample.addEventListener('click', () => {
        elements.input.value = sampleText;
        handleInput();
    });
    elements.btnClear.addEventListener('click', () => {
        elements.input.value = '';
        handleInput();
    });
    elements.fileInput.addEventListener('change', handleFileUpload);

    // Typography controls
    elements.fontSelect.addEventListener('change', updateOutput);
    elements.fontSize.addEventListener('input', (e) => {
        elements.fontSizeVal.textContent = e.target.value;
        updateOutput();
    });
    elements.lineHeight.addEventListener('input', (e) => {
        elements.lineHeightVal.textContent = e.target.value;
        updateOutput();
    });
    elements.letterSpacing.addEventListener('input', (e) => {
        elements.letterSpacingVal.textContent = e.target.value;
        updateOutput();
    });
    elements.wordSpacing.addEventListener('input', (e) => {
        elements.wordSpacingVal.textContent = e.target.value;
        updateOutput();
    });

    // Alignment
    elements.alignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.alignBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            updateOutput();
        });
    });

    // Contrast
    elements.contrastSelect.addEventListener('change', handleContrastChange);
    elements.textColor.addEventListener('input', updateOutput);
    elements.bgColor.addEventListener('input', updateOutput);

    // Toggles
    elements.bionicToggle.addEventListener('change', (e) => {
        elements.bionicControl.style.display = e.target.checked ? 'block' : 'none';
        updateOutput();
    });
    elements.bionicIntensity.addEventListener('input', (e) => {
        elements.bionicIntensityVal.textContent = e.target.value;
        updateOutput();
    });
    elements.highlightToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('line-focus', e.target.checked);
    });
    elements.ttsToggle.addEventListener('change', (e) => {
        elements.ttsControls.style.display = e.target.checked ? 'flex' : 'none';
        if (!e.target.checked) stopSpeech();
    });

    // TTS controls
    elements.ttsPlay.addEventListener('click', playSpeech);
    elements.ttsPause.addEventListener('click', pauseSpeech);
    elements.ttsStop.addEventListener('click', stopSpeech);
    elements.ttsSpeed.addEventListener('input', (e) => {
        elements.ttsSpeedVal.textContent = e.target.value + 'x';
    });

    // Actions
    elements.btnReset.addEventListener('click', resetDefaults);
    elements.btnSavePreset.addEventListener('click', savePreset);
    elements.btnExportHtml.addEventListener('click', exportHtml);
    elements.btnExportTxt.addEventListener('click', exportTxt);
    elements.btnPrint.addEventListener('click', () => window.print());

    // Modal
    elements.aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.aboutModal.classList.add('active');
        elements.aboutModal.setAttribute('aria-hidden', 'false');
    });
    elements.modalClose.addEventListener('click', closeModal);
    elements.aboutModal.addEventListener('click', (e) => {
        if (e.target === elements.aboutModal) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        }
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    elements.aboutModal.classList.remove('active');
    elements.aboutModal.setAttribute('aria-hidden', 'true');
}

function handleInput() {
    currentText = elements.input.value;
    updateStats();
    updateOutput();
    saveSettings();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        elements.input.value = event.target.result;
        handleInput();
    };
    reader.readAsText(file);
}

function handleContrastChange() {
    const mode = elements.contrastSelect.value;
    document.body.className = document.body.className.replace(/mode-\S+/g, '');
    
    if (mode !== 'default' && mode !== 'custom') {
        document.body.classList.add(`mode-${mode}`);
    }
    
    elements.customColors.style.display = mode === 'custom' ? 'flex' : 'none';
    updateOutput();
}

function updateOutput() {
    const text = currentText || '';
    
    if (!text.trim()) {
        elements.output.innerHTML = '<p class="placeholder-text">Your enhanced text will appear here...</p>';
        return;
    }

    let html = escapeHtml(text);
    
    // Convert paragraphs
    html = html.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    
    // Apply bionic reading
    if (elements.bionicToggle.checked) {
        html = applyBionicReading(html, parseInt(elements.bionicIntensity.value));
    }

    elements.output.innerHTML = html;
    
    // Apply styles
    const output = elements.output;
    const activeAlign = document.querySelector('.align-btn.active');
    
    output.style.fontFamily = elements.fontSelect.value === 'system' ? 'system-ui, sans-serif' : elements.fontSelect.value;
    output.style.fontSize = elements.fontSize.value + 'px';
    output.style.lineHeight = elements.lineHeight.value;
    output.style.letterSpacing = elements.letterSpacing.value + 'px';
    output.style.wordSpacing = elements.wordSpacing.value + 'px';
    output.style.textAlign = activeAlign ? activeAlign.dataset.align : 'left';
    
    if (elements.contrastSelect.value === 'custom') {
        output.style.color = elements.textColor.value;
        output.style.backgroundColor = elements.bgColor.value;
    } else {
        output.style.color = '';
        output.style.backgroundColor = '';
    }
}

function applyBionicReading(html, intensity) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const words = text.split(/(\s+|[.,!?;:]+)/);
            const processed = words.map(word => {
                if (!word.trim() || /^[.,!?;:\s]+$/.test(word)) return word;
                const boldLen = Math.max(1, Math.ceil(word.length * (intensity / 100)));
                return `<span class="bionic-bold">${word.slice(0, boldLen)}</span>${word.slice(boldLen)}`;
            });
            const span = document.createElement('span');
            span.innerHTML = processed.join('');
            node.replaceWith(span);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(walk);
        }
    };
    
    Array.from(tempDiv.childNodes).forEach(walk);
    return tempDiv.innerHTML;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    const text = currentText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readTime = Math.ceil(wordCount / 200); // avg reading speed
    
    elements.wordCount.textContent = wordCount;
    elements.readTime.textContent = readTime + (readTime === 1 ? ' min' : ' mins');
    elements.gradeLevel.textContent = calculateGradeLevel(text);
}

function calculateGradeLevel(text) {
    if (!text.trim()) return '-';
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return '-';
    
    // Flesch-Kincaid Grade Level
    const grade = (0.39 * (words.length / sentences.length)) + 
                  (11.8 * (syllables / words.length)) - 15.59;
    
    return Math.max(1, Math.round(grade * 10) / 10);
}

function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    const matches = word.match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
}

// Text-to-Speech
function playSpeech() {
    if (!currentText.trim()) return;
    
    stopSpeech();
    
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.rate = parseFloat(elements.ttsSpeed.value);
    utterance.pitch = 1;
    
    // Try to select a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                          voices.find(v => v.lang.startsWith('en')) ||
                          voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => {
        currentUtterance = null;
    };
    
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function pauseSpeech() {
    speechSynthesis.pause();
}

function stopSpeech() {
    speechSynthesis.cancel();
    currentUtterance = null;
}

// Export
function exportHtml() {
    const text = currentText || '';
    if (!text.trim()) return;
    
    const activeAlign = document.querySelector('.align-btn.active');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Enhanced Text</title>
<style>
body {
    font-family: ${elements.fontSelect.value === 'system' ? 'system-ui, sans-serif' : elements.fontSelect.value};
    font-size: ${elements.fontSize.value}px;
    line-height: ${elements.lineHeight.value};
    letter-spacing: ${elements.letterSpacing.value}px;
    word-spacing: ${elements.wordSpacing.value}px;
    text-align: ${activeAlign ? activeAlign.dataset.align : 'left'};
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    ${elements.contrastSelect.value === 'custom' ? `color: ${elements.textColor.value}; background: ${elements.bgColor.value};` : ''}
}
.bionic-bold { font-weight: 700; }
</style>
</head>
<body>
${elements.output.innerHTML}
</body>
</html>`;
    
    downloadFile(html, 'enhanced-text.html', 'text/html');
}

function exportTxt() {
    const text = currentText || '';
    if (!text.trim()) return;
    downloadFile(text, 'enhanced-text.txt', 'text/plain');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Settings
function saveSettings() {
    const settings = {
        font: elements.fontSelect.value,
        fontSize: elements.fontSize.value,
        lineHeight: elements.lineHeight.value,
        letterSpacing: elements.letterSpacing.value,
        wordSpacing: elements.wordSpacing.value,
        contrast: elements.contrastSelect.value,
        textColor: elements.textColor.value,
        bgColor: elements.bgColor.value,
        bionic: elements.bionicToggle.checked,
        bionicIntensity: elements.bionicIntensity.value,
        highlight: elements.highlightToggle.checked,
        align: document.querySelector('.align-btn.active')?.dataset.align || 'left'
    };
    localStorage.setItem('a11y-settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('a11y-settings');
    if (!saved) return;
    
    try {
        const settings = JSON.parse(saved);
        elements.fontSelect.value = settings.font || 'Lexend';
        elements.fontSize.value = settings.fontSize || 18;
        elements.fontSizeVal.textContent = elements.fontSize.value;
        elements.lineHeight.value = settings.lineHeight || 1.6;
        elements.lineHeightVal.textContent = elements.lineHeight.value;
        elements.letterSpacing.value = settings.letterSpacing || 0.5;
        elements.letterSpacingVal.textContent = elements.letterSpacing.value;
        elements.wordSpacing.value = settings.wordSpacing || 2;
        elements.wordSpacingVal.textContent = elements.wordSpacing.value;
        elements.contrastSelect.value = settings.contrast || 'default';
        elements.textColor.value = settings.textColor || '#1a1a1a';
        elements.bgColor.value = settings.bgColor || '#fafafa';
        elements.bionicToggle.checked = settings.bionic || false;
        elements.bionicIntensity.value = settings.bionicIntensity || 50;
        elements.bionicIntensityVal.textContent = elements.bionicIntensity.value;
        elements.bionicControl.style.display = elements.bionicToggle.checked ? 'block' : 'none';
        elements.highlightToggle.checked = settings.highlight || false;
        
        if (settings.highlight) document.body.classList.add('line-focus');
        
        // Set alignment
        elements.alignBtns.forEach(btn => {
            const isActive = btn.dataset.align === (settings.align || 'left');
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
        
        handleContrastChange();
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

function resetDefaults() {
    elements.fontSelect.value = 'Lexend';
    elements.fontSize.value = 18;
    elements.fontSizeVal.textContent = '18';
    elements.lineHeight.value = 1.6;
    elements.lineHeightVal.textContent = '1.6';
    elements.letterSpacing.value = 0.5;
    elements.letterSpacingVal.textContent = '0.5';
    elements.wordSpacing.value = 2;
    elements.wordSpacingVal.textContent = '2';
    elements.contrastSelect.value = 'default';
    elements.bionicToggle.checked = false;
    elements.bionicControl.style.display = 'none';
    elements.highlightToggle.checked = false;
    document.body.classList.remove('line-focus');
    
    elements.alignBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
        btn.setAttribute('aria-pressed', i === 0);
    });
    
    handleContrastChange();
    updateOutput();
    saveSettings();
}

function savePreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;
    
    const preset = {
        name,
        settings: JSON.parse(localStorage.getItem('a11y-settings') || '{}')
    };
    
    savedPresets.push(preset);
    localStorage.setItem('a11y-presets', JSON.stringify(savedPresets));
    alert('Preset saved!');
}

// Initialize voices for TTS
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {};
}

// Start
document.addEventListener('DOMContentLoaded', init);