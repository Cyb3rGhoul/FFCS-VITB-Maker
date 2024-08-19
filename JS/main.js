let selectedColor = '';
let selectedSlots = new Set();
let subjectData = [];

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
    const r = Math.floor((Math.random() * 127) + 127); // Range: 127-254 (lighter shades)
    const g = Math.floor((Math.random() * 127) + 127);
    const b = Math.floor((Math.random() * 127) + 127);

    return `rgb(${r}, ${g}, ${b})`;
}

function selectColor(color) {
    if (selectedSlots.size > 0) {
        alert("Please add the selected slots to the table before changing the color.");
        return;
    }
    selectedColor = color;
}

document.getElementById('timetable').addEventListener('click', (e) => {
    if (e.target.tagName === 'TD') {
        const currentColor = e.target.style.backgroundColor;

        if (selectedColor) {
            if (currentColor === selectedColor) {
                // If the selected color is already applied, unselect it
                e.target.style.backgroundColor = '';
                selectedSlots.delete(e.target.id);
            } else if (!currentColor) {
                // If no color is applied, apply the selected color
                e.target.style.backgroundColor = selectedColor;
                selectedSlots.add(e.target.id);
            } else {
                alert('No overlapping of slots allowed');
            }
        } else {
            alert('Please select a color first');
        }
    }
});

document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subjectName').value;
    const faculty = document.getElementById('facultyName').value;
    if (selectedSlots.size > 0) {
        addSubjectData(subject, faculty);
        updateSubjectTable();
        resetForm();
    } else {
        alert('Please select at least one slot');
    }
});

function addSubjectData(subject, faculty) {
    subjectData.push({
        id: subjectData.length + 1,
        slots: Array.from(selectedSlots).sort(),
        faculty,
        subject,
        color: selectedColor
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
        const colorCell = row.insertCell(4);
        colorCell.style.backgroundColor = data.color;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => deleteSubject(index);
        row.insertCell(5).appendChild(deleteButton);
    });
}

function deleteSubject(index) {
    // Get the slots of the subject being deleted
    const slotsToClear = subjectData[index].slots;

    // Remove the subject from the subjectData array
    subjectData.splice(index, 1);

    // Clear only the slots related to the deleted subject
    slotsToClear.forEach(slotId => {
        document.getElementById(slotId).style.backgroundColor = '';
    });

    // Reapply the colors for the remaining subjects
    reapplySubjectColors();

    updateSubjectTable();
}

function reapplySubjectColors() {
    subjectData.forEach(data => {
        data.slots.forEach(slot => {
            document.getElementById(slot).style.backgroundColor = data.color;
        });
    });
}

function resetForm() {
    document.getElementById('subjectName').value = '';
    document.getElementById('facultyName').value = '';
    selectedSlots.clear();
    selectedColor = '';
}

// Initialize color pickers
generateColorPickers();