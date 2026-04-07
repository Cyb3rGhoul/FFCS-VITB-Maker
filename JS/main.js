let selectedColor = '';
let selectedSlots = new Set();
let subjectData = [];

// ===================== DARK MODE =====================

function toggleDarkMode() {
    const checkbox = document.getElementById('darkModeCheckbox');
    const label = document.getElementById('toggleLabel');
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        label.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        label.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

// Apply saved theme on page load
(function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const checkbox = document.getElementById('darkModeCheckbox');
        const label = document.getElementById('toggleLabel');
        if (checkbox) checkbox.checked = true;
        if (label) label.textContent = 'Light Mode';
    }
})();

// ===================== COLOR PICKERS =====================

function generateColorPickers() {
    const count = document.getElementById('subjectCount').value;
    const container = document.getElementById('colorPickers');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const color = getRandomPastelColorRGB();
        const picker = document.createElement('div');
        picker.className = 'color-option';
        picker.style.backgroundColor = color;
        picker.onclick = () => selectColor(color);
        container.appendChild(picker);
    }
}

function getRandomPastelColorRGB() {
    const r = Math.floor((Math.random() * 127) + 127);
    const g = Math.floor((Math.random() * 127) + 127);
    const b = Math.floor((Math.random() * 127) + 127);
    return `rgb(${r}, ${g}, ${b})`;
}

function isColorUsed(color) {
    return subjectData.some(data => data.color === color);
}

function selectColor(color) {
    if (selectedSlots.size > 0) {
        alert("Please add the selected slots to the table before changing the color.");
        return;
    }
    if (isColorUsed(color)) {
        alert("⚠️ This color is already used for another subject!\n\nPlease select a different color to avoid confusion.");
        return;
    }
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(picker => {
        picker.classList.remove('selected-picker');
        if (picker.style.backgroundColor === color) {
            picker.classList.add('selected-picker');
        }
    });
}

// ===================== TIMETABLE CLICK =====================

document.getElementById('timetable').addEventListener('click', (e) => {
    let targetCell = e.target;
    if (targetCell.tagName !== 'TD') {
        targetCell = targetCell.closest('td');
    }
    if (!targetCell) return;

    const currentColor = targetCell.style.backgroundColor;

    if (selectedColor) {
        if (currentColor === selectedColor) {
            targetCell.style.backgroundColor = '';
            targetCell.innerHTML = targetCell.id;
            selectedSlots.delete(targetCell.id);
        } else if (!currentColor) {
            targetCell.style.backgroundColor = selectedColor;
            selectedSlots.add(targetCell.id);
        } else {
            alert('No overlapping of slots allowed');
        }
    } else {
        alert('Please select a color first');
    }
});

// ===================== FORM SUBMISSION =====================

document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subjectName').value;
    const faculty = document.getElementById('facultyName').value;
    const venue = document.getElementById('venueName').value || '';

    if (!selectedColor) {
        alert('Please select a color first');
        return;
    }
    if (isColorUsed(selectedColor)) {
        alert("⚠️ This color is already used for another subject!\n\nPlease select a different color.");
        return;
    }
    if (selectedSlots.size > 0) {
        addSubjectData(subject, faculty, venue);
        updateTimetableWithSubjectInfo();
        updateSubjectTable();
        markUsedColors();
        resetForm();
        enableDownloadButton();
    } else {
        alert('Please select at least one slot');
    }
});

function markUsedColors() {
    document.querySelectorAll('.color-option').forEach(picker => {
        const color = picker.style.backgroundColor;
        if (isColorUsed(color)) {
            picker.classList.add('used-color');
        } else {
            picker.classList.remove('used-color');
        }
    });
}

function addSubjectData(subject, faculty, venue) {
    subjectData.push({
        id: subjectData.length + 1,
        slots: Array.from(selectedSlots).sort(),
        faculty,
        subject,
        venue,
        color: selectedColor
    });
}

function updateTimetableWithSubjectInfo() {
    const latestSubject = subjectData[subjectData.length - 1];
    latestSubject.slots.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${latestSubject.subject}</span>
                    <span class="faculty-name">${latestSubject.faculty}</span>
                    ${latestSubject.venue ? `<span class="venue-info">${latestSubject.venue}</span>` : ''}
                </div>
            `;
        }
    });
}

function updateSubjectTable() {
    const tbody = document.querySelector('#subjectTable tbody');
    tbody.innerHTML = '';
    subjectData.forEach((data, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = data.slots.join('-');
        row.insertCell(2).textContent = data.faculty;
        row.insertCell(3).textContent = data.subject;
        row.insertCell(4).textContent = data.venue || '-';
        const colorCell = row.insertCell(5);
        colorCell.style.backgroundColor = data.color;

        const actionCell = row.insertCell(6);
        actionCell.className = 'action-cell';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-btn';
        editButton.onclick = () => openEditModal(index);
        actionCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => deleteSubject(index);
        actionCell.appendChild(deleteButton);
    });
}

function deleteSubject(index) {
    const slotsToClear = subjectData[index].slots;
    subjectData.splice(index, 1);
    slotsToClear.forEach(slotId => {
        const cell = document.getElementById(slotId);
        cell.style.backgroundColor = '';
        cell.innerHTML = slotId;
    });
    reapplySubjectColors();
    updateSubjectTable();
    markUsedColors();
    if (subjectData.length === 0) {
        disableDownloadButton();
    }
}

function reapplySubjectColors() {
    subjectData.forEach(data => {
        data.slots.forEach(slotId => {
            const cell = document.getElementById(slotId);
            cell.style.backgroundColor = data.color;
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${data.subject}</span>
                    <span class="faculty-name">${data.faculty}</span>
                    ${data.venue ? `<span class="venue-info">${data.venue}</span>` : ''}
                </div>
            `;
        });
    });
}

function resetForm() {
    document.getElementById('subjectName').value = '';
    document.getElementById('facultyName').value = '';
    document.getElementById('venueName').value = '';
    selectedSlots.clear();
    selectedColor = '';
}

function enableDownloadButton() {
    document.getElementById('downloadBtn').disabled = false;
}

function disableDownloadButton() {
    document.getElementById('downloadBtn').disabled = true;
}

// ===================== DOWNLOAD =====================

document.getElementById('downloadBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const format = document.querySelector('input[name="downloadFormat"]:checked').value;
    if (format === 'pdf') {
        downloadAsPDF();
    } else if (format === 'jpg') {
        downloadAsJPEG();
    }
});

function downloadAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Timetable', 10, 10);
    doc.autoTable({
        html: '#timetable',
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function (data) {
            const td = data.cell.raw;
            if (td.hasAttribute('style')) {
                const backgroundColor = td.style.backgroundColor;
                if (backgroundColor) {
                    const rgb = backgroundColor.match(/\d+/g).map(Number);
                    data.cell.styles.fillColor = rgb;
                }
            }
        }
    });

    doc.addPage();
    doc.text('Subject Table', 10, 10);
    doc.autoTable({
        html: '#subjectTable',
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function (data) {
            const td = data.cell.raw;
            if (td.hasAttribute('style')) {
                const backgroundColor = td.style.backgroundColor;
                if (backgroundColor) {
                    const rgb = backgroundColor.match(/\d+/g).map(Number);
                    data.cell.styles.fillColor = rgb;
                }
            }
        }
    });

    doc.save('timetable_and_subjects.pdf');
}

function downloadAsJPEG() {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    const timetable = document.getElementById('timetable').cloneNode(true);
    const subjectTable = document.getElementById('subjectTable').cloneNode(true);
    tempContainer.appendChild(timetable);
    tempContainer.appendChild(subjectTable);

    html2canvas(tempContainer, { backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'timetable_and_subjects.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();
        document.body.removeChild(tempContainer);
    });
}

// ===================== INITIALIZE =====================

generateColorPickers();

// ===================== EDIT MODAL =====================

const allSlots = [
    'A11', 'B11', 'C11', 'A21', 'A14', 'B21', 'C21',
    'D11', 'E11', 'F11', 'D21', 'E14', 'E21', 'F21',
    'A12', 'B12', 'C12', 'A22', 'B14', 'B22', 'A24',
    'D12', 'E12', 'F12', 'D22', 'F14', 'E22', 'F22',
    'A13', 'B13', 'C13', 'A23', 'C14', 'B23', 'B24',
    'D13', 'E13', 'F13', 'D23', 'D14', 'D24', 'E23'
];

let editSelectedSlots = new Set();
let currentEditIndex = -1;

function openEditModal(index) {
    const data = subjectData[index];
    currentEditIndex = index;
    editSelectedSlots = new Set(data.slots);

    document.getElementById('editIndex').value = index;
    document.getElementById('editSubjectName').value = data.subject;
    document.getElementById('editFacultyName').value = data.faculty;
    document.getElementById('editVenueName').value = data.venue || '';

    buildEditSlotGrid(index, data.color);
    updateSelectedSlotsDisplay();

    document.getElementById('editModal').style.display = 'flex';
}

function buildEditSlotGrid(editIndex, subjectColor) {
    const grid = document.getElementById('editSlotsGrid');
    grid.innerHTML = '';

    const occupiedSlots = new Map();
    subjectData.forEach((data, idx) => {
        if (idx !== editIndex) {
            data.slots.forEach(slot => {
                occupiedSlots.set(slot, data.color);
            });
        }
    });

    allSlots.forEach(slotId => {
        const slotBtn = document.createElement('div');
        slotBtn.className = 'edit-slot-btn';
        slotBtn.textContent = slotId;
        slotBtn.dataset.slot = slotId;

        if (occupiedSlots.has(slotId)) {
            slotBtn.classList.add('occupied');
            slotBtn.style.backgroundColor = occupiedSlots.get(slotId);
            slotBtn.title = 'Occupied by another subject';
        } else if (editSelectedSlots.has(slotId)) {
            slotBtn.classList.add('selected');
            slotBtn.style.backgroundColor = subjectColor;
        }

        slotBtn.onclick = () => toggleEditSlot(slotId, subjectColor, occupiedSlots);
        grid.appendChild(slotBtn);
    });
}

function toggleEditSlot(slotId, subjectColor, occupiedSlots) {
    if (occupiedSlots.has(slotId)) {
        alert('This slot is already occupied by another subject!');
        return;
    }

    const slotBtn = document.querySelector(`.edit-slot-btn[data-slot="${slotId}"]`);

    if (editSelectedSlots.has(slotId)) {
        editSelectedSlots.delete(slotId);
        slotBtn.classList.remove('selected');
        slotBtn.style.backgroundColor = '';
    } else {
        editSelectedSlots.add(slotId);
        slotBtn.classList.add('selected');
        slotBtn.style.backgroundColor = subjectColor;
    }

    updateSelectedSlotsDisplay();
}

function updateSelectedSlotsDisplay() {
    const sortedSlots = Array.from(editSelectedSlots).sort();
    document.getElementById('selectedSlotsCount').textContent = sortedSlots.length;
    document.getElementById('selectedSlotsList').textContent = sortedSlots.join(', ') || 'None';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditIndex = -1;
    editSelectedSlots.clear();
}

function saveEdit() {
    const index = parseInt(document.getElementById('editIndex').value);
    const newSubject = document.getElementById('editSubjectName').value.trim();
    const newFaculty = document.getElementById('editFacultyName').value.trim();
    const newVenue = document.getElementById('editVenueName').value.trim();
    const newSlots = Array.from(editSelectedSlots).sort();

    if (!newSubject || !newFaculty) {
        alert('Subject Name and Faculty Name are required!');
        return;
    }
    if (newSlots.length === 0) {
        alert('Please select at least one slot!');
        return;
    }

    const oldSlots = subjectData[index].slots;
    const color = subjectData[index].color;

    const slotsToRemove = oldSlots.filter(s => !editSelectedSlots.has(s));

    slotsToRemove.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.style.backgroundColor = '';
            cell.innerHTML = slotId;
        }
    });

    subjectData[index].subject = newSubject;
    subjectData[index].faculty = newFaculty;
    subjectData[index].venue = newVenue;
    subjectData[index].slots = newSlots;

    newSlots.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.style.backgroundColor = color;
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${newSubject}</span>
                    <span class="faculty-name">${newFaculty}</span>
                    ${newVenue ? `<span class="venue-info">${newVenue}</span>` : ''}
                </div>
            `;
        }
    });

    updateSubjectTable();
    closeEditModal();
}

document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
