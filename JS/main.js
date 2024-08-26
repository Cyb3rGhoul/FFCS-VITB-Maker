//dark and light mode feature

let mode = document.getElementById('mode')

mode.onclick = () => {
        document.body.classList.toggle("dark-theme");

        if (document.body.classList.contains('dark-theme')) {
            mode.src = 'assets/moon.png'
        } else {
            mode.src = 'assets/sun.png'
        }
    }
    //dark and light mode feature

let selectedColor = '';
let selectedSlots = new Set();
let subjectData = [];

// Function to generate color pickers (unchanged)
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

// Function to get random pastel color (unchanged)
function getRandomPastelColorRGB() {
    const r = Math.floor((Math.random() * 127) + 127); // Range: 127-254 (lighter shades)
    const g = Math.floor((Math.random() * 127) + 127);
    const b = Math.floor((Math.random() * 127) + 127);

    return `rgb(${r}, ${g}, ${b})`;
}

// Function to select color (unchanged)
function selectColor(color) {
    if (selectedSlots.size > 0) {
        alert("Please add the selected slots to the table before changing the color.");
        return;
    }
    selectedColor = color;
}

// Function to handle timetable cell click (unchanged)
document.getElementById('timetable').addEventListener('click', (e) => {
    if (e.target.tagName === 'TD') {
        const currentColor = e.target.style.backgroundColor;

        if (selectedColor) {
            if (currentColor === selectedColor) {
                e.target.style.backgroundColor = '';
                selectedSlots.delete(e.target.id);
            } else if (!currentColor) {
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

// Function to handle form submission (unchanged)
document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subjectName').value;
    const faculty = document.getElementById('facultyName').value;
    if (selectedSlots.size > 0) {
        addSubjectData(subject, faculty);
        updateSubjectTable();
        resetForm();
        enableDownloadButton();
    } else {
        alert('Please select at least one slot');
    }
});

// Function to add subject data (unchanged)
function addSubjectData(subject, faculty) {
    subjectData.push({
        id: subjectData.length + 1,
        slots: Array.from(selectedSlots).sort(),
        faculty,
        subject,
        color: selectedColor
    });
}

// Function to update subject table (unchanged)
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

// Function to delete a subject (unchanged)
function deleteSubject(index) {
    const slotsToClear = subjectData[index].slots;
    subjectData.splice(index, 1);
    slotsToClear.forEach(slotId => {
        document.getElementById(slotId).style.backgroundColor = '';
    });
    reapplySubjectColors();
    updateSubjectTable();
    if (subjectData.length === 0) {
        disableDownloadButton();
    }
}

// Function to reapply subject colors (unchanged)
function reapplySubjectColors() {
    subjectData.forEach(data => {
        data.slots.forEach(slot => {
            document.getElementById(slot).style.backgroundColor = data.color;
        });
    });
}

// Function to reset form (unchanged)
function resetForm() {
    document.getElementById('subjectName').value = '';
    document.getElementById('facultyName').value = '';
    selectedSlots.clear();
    selectedColor = '';
}

// Function to enable download button
function enableDownloadButton() {
    document.getElementById('downloadBtn').disabled = false;
}

// Function to disable download button
function disableDownloadButton() {
    document.getElementById('downloadBtn').disabled = true;
}

// Handle download button click
document.getElementById('downloadBtn').addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default behavior
    const format = document.querySelector('input[name="downloadFormat"]:checked').value;
    if (format === 'pdf') {
        downloadAsPDF();
    } else if (format === 'jpg') {
        downloadAsJPEG();
    }
});

// --------------Function to download timetable and subject table as PDF

function downloadAsPDF() {
    const { jsPDF } = window.jspdf; // jsPDF library
    const doc = new jsPDF(); // create a new jsPDF object, storing it under the variable, doc.

    // Add timetable to PDF
    doc.text('Timetable', 10, 10); // a headline of Timetable
    doc.autoTable({ // autoTable is a method from the jsPDF library used to create a table in the PDF
        html: '#timetable', // get the timetable id from the html
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function(data) { // didParseCell is a callback function that is excuted in each cell that checks the raw html element to see its content and passes style to the pdf if the html contains a style attribute
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

    // Add a page break before the subject table
    doc.addPage();

    // Add subject table to PDF
    doc.text('Subject Table', 10, 10);
    doc.autoTable({
        html: '#subjectTable',
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function(data) {
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

    // Save the PDF
    doc.save('timetable_and_subjects.pdf');
}


//------------------- Function to download timetable and subject table as JPEG

function downloadAsJPEG() {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px'; // Hide it from view
    document.body.appendChild(tempContainer);

    // create a clone of both the timetable and subject table

    const timetable = document.getElementById('timetable').cloneNode(true);
    const subjectTable = document.getElementById('subjectTable').cloneNode(true);
    tempContainer.appendChild(timetable);
    tempContainer.appendChild(subjectTable);


    //convert the cloned html to canvas using the html2canvas library, and making sure the backgroundcolor is null (transparent)

    html2canvas(tempContainer, { backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'timetable_and_subjects.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();

        document.body.removeChild(tempContainer);
    });
}

// Initialize color pickers
generateColorPickers();