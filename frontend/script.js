let currentTab = 'upload';
let uploadedImage = null;

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    currentTab = tabName;

    const reportContent = document.getElementById('reportContent').innerText.trim();
    if (tabName === 'report' && reportContent && reportContent !== '📋 No analysis completed yet') {
        document.getElementById('printBtn').style.display = 'block';
    } else {
        document.getElementById('printBtn').style.display = 'none';
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadedImage = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('uploadContent').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';

            document.getElementById('analyzeBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

function clearImage() {
    uploadedImage = null;
    document.getElementById('imageInput').value = '';
    document.getElementById('uploadContent').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = true;
}

document.addEventListener('DOMContentLoaded', function () {
    const uploadZone = document.querySelector('.upload-zone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, unhighlight, false);
    });
    uploadZone.addEventListener('drop', handleDrop, false);

    document.getElementById('studyDate').value = new Date().toISOString().split('T')[0];
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}
function highlight(e) {
    e.target.closest('.upload-zone').classList.add('dragover');
}
function unhighlight(e) {
    e.target.closest('.upload-zone').classList.remove('dragover');
}
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        document.getElementById('imageInput').files = files;
        handleImageUpload({ target: { files: files } });
    }
}

function startAnalysis() {
    if (!uploadedImage) {
        alert('Please upload an ultrasound image first.');
        return;
    }

    document.getElementById('analysisProgress').style.display = 'block';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('analyzeBtn').style.display = 'none';

    uploadImage(uploadedImage);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            displayReport(result);
        } else {
            throw new Error(result.detail || 'Unknown error');
        }
    } catch (error) {
        alert('Analysis failed: ' + error.message);
        document.getElementById('analysisProgress').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = false;
        document.getElementById('analyzeBtn').style.display = 'inline-flex';
    }
}

function displayReport(result) {
    document.getElementById('analysisProgress').style.display = 'none';
    document.getElementById('analyzeBtn').style.display = 'inline-flex';

    const analysisText = result.analysis || "No analysis returned.";
    const htmlContent = marked.parse(analysisText);

    const reportHtml = `
        <div class="report-section">
            <div class="markdown-body" style="font-family: var(--font-family-base); line-height: 1.6;">
                ${htmlContent}
            </div>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = reportHtml;

    switchTab('report');
    window.scrollTo(0, 0);
}

function editReport() {
    alert('Report editing functionality not yet implemented.');
}

function exportReport() {
    window.print();
}
